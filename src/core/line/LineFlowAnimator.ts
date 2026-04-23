import Feature from 'ol/Feature';
import Map from 'ol/Map';
import { LineString, Point as OlPoint } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { getVectorContext } from 'ol/render';
import { unByKey } from 'ol/Observable';
import type { FlowLineLayerHandle, FlowLineOptions, MapJSONData } from '../../types';
import { ConfigManager } from '../map';
import LineFeatureFactory from './LineFeatureFactory';
import LineStyleFactory from './LineStyleFactory';

type AnimationState = 'running' | 'paused' | 'stopped' | 'removed';

interface NormalizedFlowLineOptions extends FlowLineOptions {
  layerName: string;
  duration: number;
  loop: boolean;
  autoStart: boolean;
  showBaseLine: boolean;
  animationMode: 'icon' | 'dash' | 'icon+dash';
  trailEnabled: boolean;
  trailLength: number;
  speed: number;
  zIndex: number;
  flowSymbol: {
    src?: string;
    scale: number;
    color?: string;
    rotateWithView: boolean;
    count: number;
    spacing: number;
  };
}

/**
 * 流动线动画器
 * 负责动画生命周期、postrender 与 RAF 驱动。
 */
export default class LineFlowAnimator {
  private readonly map: Map;
  private readonly onRemove?: (layerName: string) => void;
  private readonly maxSymbolCount = 12;
  private readonly styleFactory = new LineStyleFactory();
  private readonly animationPointGeometry = new OlPoint([0, 0]);
  private readonly animationPointFeature = new Feature(this.animationPointGeometry);

  private options: NormalizedFlowLineOptions;
  private normalizedFeatures: Feature<LineString>[] = [];
  private baseSource = new VectorSource<Feature<LineString>>();
  private animationSource = new VectorSource<Feature<LineString>>();
  private baseLayer: VectorLayer<VectorSource<Feature<LineString>>>;
  private animationLayer: VectorLayer<VectorSource<Feature<LineString>>>;
  private dashStyle = this.styleFactory.createDashStyle(ConfigManager.DEFAULT_FLOW_LINE_OPTIONS);
  private state: AnimationState = 'stopped';
  private startTime = 0;
  private pausedAt = 0;
  private pausedDuration = 0;
  private frozenProgress = 0;
  private rafId: number | null = null;
  private postrenderKey: any = null;

  constructor(
    map: Map,
    data: unknown,
    options: FlowLineOptions = {},
    onRemove?: (layerName: string) => void
  ) {
    this.map = map;
    this.onRemove = onRemove;
    this.options = this.normalizeOptions(options);
    this.normalizedFeatures = LineFeatureFactory.normalizeLineFeatures(data, this.options);
    this.dashStyle = this.styleFactory.createDashStyle(this.options);
    this.baseLayer = this.createBaseLayer();
    this.animationLayer = this.createAnimationLayer();
    this.updateSources(this.normalizedFeatures);
  }

  createHandle(): FlowLineLayerHandle | null {
    if (this.normalizedFeatures.length === 0) {
      return null;
    }

    this.map.addLayer(this.baseLayer);
    this.map.addLayer(this.animationLayer);

    if (this.options.autoStart) {
      this.start();
    }

    return {
      layer: this.baseLayer,
      animationLayer: this.animationLayer,
      start: () => this.start(),
      pause: () => this.pause(),
      resume: () => this.resume(),
      stop: () => this.stop(),
      setVisible: (visible: boolean) => this.setVisible(visible),
      updateData: (data: MapJSONData) => this.updateData(data),
      remove: () => this.remove()
    };
  }

  getProgressByTime(now: number, startTime: number, duration: number, speed: number, loop: boolean): number {
    const safeDuration = duration > 0 ? duration : ConfigManager.DEFAULT_FLOW_LINE_OPTIONS.duration;
    const safeSpeed = speed > 0 ? speed : 1;
    const elapsed = Math.max(0, now - startTime) * safeSpeed;
    const progress = elapsed / safeDuration;

    if (loop) {
      return progress % 1;
    }

    return Math.min(progress, 1);
  }

  getCoordinateAndRotation(line: LineString, progress: number): { coordinate: number[]; rotation: number } {
    const safeProgress = Math.max(0, Math.min(progress, 1));
    const epsilon = 0.0001;
    const coordinate = line.getCoordinateAt(safeProgress);
    const nextCoordinate = line.getCoordinateAt(Math.min(safeProgress + epsilon, 1));
    const dx = nextCoordinate[0] - coordinate[0];
    const dy = nextCoordinate[1] - coordinate[1];

    return {
      coordinate,
      rotation: Math.atan2(dy, dx)
    };
  }

  start(): void {
    if (this.state === 'removed' || this.state === 'running' || this.normalizedFeatures.length === 0) {
      return;
    }

    this.bindPostrender();
    this.state = 'running';
    this.startTime = this.getNow();
    this.pausedAt = 0;
    this.pausedDuration = 0;
    this.frozenProgress = 0;
    this.startRafLoop();
  }

  pause(): void {
    if (this.state !== 'running') {
      return;
    }

    this.frozenProgress = this.getCurrentProgress();
    this.pausedAt = this.getNow();
    this.state = 'paused';
    this.stopRafLoop();
    this.animationLayer.changed();
  }

  resume(): void {
    if (this.state !== 'paused') {
      return;
    }

    const now = this.getNow();
    this.pausedDuration += now - this.pausedAt;
    this.pausedAt = 0;
    this.state = 'running';
    this.bindPostrender();
    this.startRafLoop();
  }

  stop(): void {
    if (this.state === 'removed') {
      return;
    }

    this.state = 'stopped';
    this.frozenProgress = 0;
    this.pausedAt = 0;
    this.pausedDuration = 0;
    this.startTime = 0;
    this.stopRafLoop();
    this.animationLayer.changed();
  }

  setVisible(visible: boolean): void {
    this.baseLayer.setVisible(visible);
    this.animationLayer.setVisible(visible);
  }

  updateData(data: unknown): void {
    if (this.state === 'removed') {
      return;
    }

    const nextFeatures = LineFeatureFactory.normalizeLineFeatures(data, this.options);
    this.normalizedFeatures = nextFeatures;
    this.updateSources(nextFeatures);
    this.animationLayer.changed();

    if (this.state === 'running') {
      this.startRafLoop();
    }
  }

  remove(): void {
    if (this.state === 'removed') {
      return;
    }

    this.stopRafLoop();
    this.unbindPostrender();
    this.normalizedFeatures = [];
    this.baseSource.clear();
    this.animationSource.clear();
    this.styleFactory.clearCaches();
    this.onRemove?.(this.options.layerName);
    this.map.removeLayer(this.baseLayer);
    this.map.removeLayer(this.animationLayer);
    this.state = 'removed';
  }

  private createBaseLayer(): VectorLayer<VectorSource<Feature<LineString>>> {
    return new VectorLayer({
      properties: {
        name: this.options.layerName,
        layerName: this.options.layerName
      },
      source: this.baseSource,
      style: feature => this.styleFactory.getFlowBaseLineStyle(feature as Feature<LineString>, this.options),
      zIndex: this.options.zIndex
    });
  }

  private createAnimationLayer(): VectorLayer<VectorSource<Feature<LineString>>> {
    return new VectorLayer({
      properties: {
        name: `${this.options.layerName}__flow-animation`,
        layerName: `${this.options.layerName}__flow-animation`
      },
      source: this.animationSource,
      style: () => this.styleFactory.getAnimationLayerStyle(this.options, this.dashStyle),
      zIndex: this.options.zIndex + 1
    });
  }

  private normalizeOptions(options: FlowLineOptions): NormalizedFlowLineOptions {
    const mergedOptions = {
      ...ConfigManager.DEFAULT_FLOW_LINE_OPTIONS,
      ...options
    };
    const flowSymbolOptions = {
      ...ConfigManager.DEFAULT_FLOW_LINE_OPTIONS.flowSymbol,
      ...options.flowSymbol
    };

    return {
      ...mergedOptions,
      layerName: options.layerName || ConfigManager.DEFAULT_LINE_OPTIONS.layerName,
      duration: mergedOptions.duration > 0 ? mergedOptions.duration : ConfigManager.DEFAULT_FLOW_LINE_OPTIONS.duration,
      loop: mergedOptions.loop ?? ConfigManager.DEFAULT_FLOW_LINE_OPTIONS.loop,
      autoStart: mergedOptions.autoStart ?? ConfigManager.DEFAULT_FLOW_LINE_OPTIONS.autoStart,
      showBaseLine: mergedOptions.showBaseLine ?? ConfigManager.DEFAULT_FLOW_LINE_OPTIONS.showBaseLine,
      animationMode: mergedOptions.animationMode ?? ConfigManager.DEFAULT_FLOW_LINE_OPTIONS.animationMode,
      trailEnabled: mergedOptions.trailEnabled ?? ConfigManager.DEFAULT_FLOW_LINE_OPTIONS.trailEnabled,
      trailLength: mergedOptions.trailLength ?? ConfigManager.DEFAULT_FLOW_LINE_OPTIONS.trailLength,
      speed: mergedOptions.speed && mergedOptions.speed > 0 ? mergedOptions.speed : 1,
      zIndex: mergedOptions.zIndex ?? ConfigManager.DEFAULT_FLOW_LINE_OPTIONS.zIndex,
      flowSymbol: {
        src: flowSymbolOptions.src,
        scale: flowSymbolOptions.scale,
        color: flowSymbolOptions.color,
        rotateWithView: flowSymbolOptions.rotateWithView,
        count: Math.min(this.maxSymbolCount, Math.max(1, Math.round(flowSymbolOptions.count))),
        spacing: Math.max(0.01, Math.min(0.5, flowSymbolOptions.spacing))
      }
    };
  }

  private updateSources(features: Feature<LineString>[]): void {
    this.baseSource.clear();
    this.animationSource.clear();
    this.baseSource.addFeatures(LineFeatureFactory.cloneLineFeatures(features));
    this.animationSource.addFeatures(LineFeatureFactory.cloneLineFeatures(features));
  }

  private bindPostrender(): void {
    if (this.postrenderKey || (this.options.animationMode !== 'icon' && this.options.animationMode !== 'icon+dash')) {
      return;
    }

    this.postrenderKey = this.animationLayer.on('postrender', event => {
      if (this.state === 'removed' || !this.animationLayer.getVisible()) {
        return;
      }

      const vectorContext = getVectorContext(event);
      const baseProgress = this.getCurrentProgress();
      this.normalizedFeatures.forEach(feature => {
        const geometry = feature.getGeometry();
        if (!(geometry instanceof LineString)) {
          return;
        }

        for (let symbolIndex = 0; symbolIndex < this.options.flowSymbol.count; symbolIndex += 1) {
          const offsetProgress = baseProgress - (symbolIndex * this.options.flowSymbol.spacing);
          const normalizedProgress = this.options.loop
            ? ((offsetProgress % 1) + 1) % 1
            : Math.max(0, Math.min(offsetProgress, 1));

          if (!this.options.loop && (normalizedProgress <= 0 || normalizedProgress >= 1) && symbolIndex > 0) {
            continue;
          }

          const { coordinate, rotation } = this.getCoordinateAndRotation(geometry, normalizedProgress);
          this.animationPointGeometry.setCoordinates(coordinate);
          const style = this.styleFactory.getMovingSymbolStyle(rotation, this.options);
          vectorContext.setStyle(style);
          vectorContext.drawFeature(this.animationPointFeature, style);
        }
      });
    });
  }

  private unbindPostrender(): void {
    if (!this.postrenderKey) {
      return;
    }
    unByKey(this.postrenderKey);
    this.postrenderKey = null;
  }

  private startRafLoop(): void {
    if (this.rafId !== null) {
      return;
    }

    const dashFallback = this.styleFactory.getDashFallback();
    const renderFrame = () => {
      if (this.state !== 'running') {
        this.rafId = null;
        return;
      }

      if (this.options.animationMode === 'dash' || this.options.animationMode === 'icon+dash') {
        const dashOffset = -this.getCurrentProgress() * (
          this.options.lineDash?.reduce((sum: number, item: number) => sum + item, 0) ??
          dashFallback.reduce((sum: number, item: number) => sum + item, 0)
        );
        this.dashStyle.getStroke()?.setLineDashOffset(dashOffset);
        this.animationLayer.changed();
      }

      this.map.render();
      this.rafId = requestAnimationFrame(renderFrame);
    };

    this.rafId = requestAnimationFrame(renderFrame);
  }

  private stopRafLoop(): void {
    if (this.rafId === null) {
      return;
    }
    cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  private getCurrentProgress(): number {
    if (this.state === 'paused') {
      return this.frozenProgress;
    }

    if (this.state === 'stopped' || this.startTime === 0) {
      return 0;
    }

    return this.getProgressByTime(
      this.getNow() - this.pausedDuration,
      this.startTime,
      this.options.duration,
      this.options.speed,
      this.options.loop
    );
  }

  private getNow(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }
}
