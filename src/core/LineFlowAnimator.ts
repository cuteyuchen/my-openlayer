import Feature from 'ol/Feature';
import Map from 'ol/Map';
import GeoJSON from 'ol/format/GeoJSON';
import { LineString, MultiLineString, Point as OlPoint } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { getVectorContext } from 'ol/render';
import { unByKey } from 'ol/Observable';
import { Fill, Icon, RegularShape, Stroke, Style } from 'ol/style';
import { ConfigManager } from './ConfigManager';
import { ErrorHandler } from '../utils/ErrorHandler';
import { ProjectionUtils } from '../utils/ProjectionUtils';
import type { FlowLineLayerHandle, FlowLineOptions, MapJSONData } from '../types';

type AnimationState = 'running' | 'paused' | 'stopped' | 'removed';

interface NormalizedFlowLineOptions extends FlowLineOptions {
  layerName: string;
  duration: number;
  loop: boolean;
  autoStart: boolean;
  showBaseLine: boolean;
  animationMode: 'icon' | 'dash' | 'icon+dash';
  arrowScale: number;
  arrowRotateWithView: boolean;
  arrowCount: number;
  arrowSpacing: number;
  trailEnabled: boolean;
  trailLength: number;
  speed: number;
  zIndex: number;
}

/**
 * 线动画渲染器，负责流动线标准化、图层管理与动画生命周期。
 */
export default class LineFlowAnimator {
  private readonly map: Map;
  private readonly errorHandler = ErrorHandler.getInstance();
  private readonly onRemove?: (layerName: string) => void;
  private readonly dashFallback = [12, 12];
  private readonly maxArrowCount = 12;
  private readonly arrowStyleCache = new globalThis.Map<string, Style>();
  private readonly baseLineStyle = new Style();
  private readonly emptyStyle = new Style();
  private readonly animationPointGeometry = new OlPoint([0, 0]);
  private readonly animationPointFeature = new Feature(this.animationPointGeometry);

  private options: NormalizedFlowLineOptions;
  private normalizedFeatures: Feature<LineString>[] = [];
  private baseSource = new VectorSource<Feature<LineString>>();
  private animationSource = new VectorSource<Feature<LineString>>();
  private baseLayer: VectorLayer<VectorSource<Feature<LineString>>>;
  private animationLayer: VectorLayer<VectorSource<Feature<LineString>>>;
  private dashStyle: Style;
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
    this.normalizedFeatures = this.normalizeLineFeatures(data, this.options);
    this.dashStyle = this.createDashStyle();
    this.baseLayer = this.createBaseLayer();
    this.animationLayer = this.createAnimationLayer();
    this.updateSources(this.normalizedFeatures);
  }

  /**
   * 创建控制句柄。若数据无效则返回 null。
   */
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

  /**
   * 标准化输入线数据。
   */
  normalizeLineFeatures(data: unknown, options: FlowLineOptions): Feature<LineString>[] {
    if (!data) {
      this.errorHandler.error('[LineFlowAnimator] 流动线数据不能为空');
      return [];
    }

    try {
      const readOptions = ProjectionUtils.getGeoJSONReadOptions(options);
      const features = new GeoJSON().readFeatures(data as any, readOptions);
      const normalizedFeatures: Feature<LineString>[] = [];

      features.forEach(feature => {
        const geometry = feature.getGeometry();
        if (!geometry) {
          return;
        }

        const properties = { ...feature.getProperties() };
        delete properties.geometry;

        if (geometry instanceof LineString) {
          if (geometry.getCoordinates().length >= 2) {
            const normalizedFeature = new Feature({
              ...properties,
              geometry: geometry.clone()
            }) as Feature<LineString>;
            normalizedFeatures.push(normalizedFeature);
          }
          return;
        }

        if (geometry instanceof MultiLineString) {
          geometry.getLineStrings().forEach((lineString, index) => {
            if (lineString.getCoordinates().length < 2) {
              return;
            }
            const normalizedFeature = new Feature({
              ...properties,
              __segmentIndex: index,
              geometry: lineString.clone()
            }) as Feature<LineString>;
            normalizedFeatures.push(normalizedFeature);
          });
        }
      });

      if (normalizedFeatures.length === 0) {
        this.errorHandler.error('[LineFlowAnimator] 未找到可用于流动动画的 LineString / MultiLineString 要素');
      }

      return normalizedFeatures;
    } catch (error) {
      this.errorHandler.error('[LineFlowAnimator] 标准化流动线数据失败:', error);
      return [];
    }
  }

  /**
   * 基于时间计算动画进度。
   */
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

  /**
   * 获取当前进度下的坐标与朝向。
   */
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

  /**
   * 启动动画，重复调用不会重复绑定。
   */
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

  /**
   * 暂停动画。
   */
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

  /**
   * 继续播放动画。
   */
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

  /**
   * 停止动画并回到初始状态。
   */
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

  /**
   * 同步设置基础线和动画层可见性。
   */
  setVisible(visible: boolean): void {
    this.baseLayer.setVisible(visible);
    this.animationLayer.setVisible(visible);
  }

  /**
   * 更新流动线数据，并保持当前动画状态。
   */
  updateData(data: unknown): void {
    if (this.state === 'removed') {
      return;
    }

    const nextFeatures = this.normalizeLineFeatures(data, this.options);
    this.normalizedFeatures = nextFeatures;
    this.updateSources(nextFeatures);
    this.animationLayer.changed();

    if (this.state === 'running') {
      this.startRafLoop();
    }
  }

  /**
   * 释放动画资源。
   */
  remove(): void {
    if (this.state === 'removed') {
      return;
    }

    this.stopRafLoop();
    this.unbindPostrender();
    this.normalizedFeatures = [];
    this.baseSource.clear();
    this.animationSource.clear();
    this.arrowStyleCache.clear();
    this.onRemove?.(this.options.layerName);
    this.map.removeLayer(this.baseLayer);
    this.map.removeLayer(this.animationLayer);
    this.state = 'removed';
  }

  /**
   * 创建基础线图层。
   */
  private createBaseLayer(): VectorLayer<VectorSource<Feature<LineString>>> {
    return new VectorLayer({
      properties: {
        name: this.options.layerName,
        layerName: this.options.layerName
      },
      source: this.baseSource,
      style: feature => this.getBaseLineStyle(feature as Feature<LineString>),
      zIndex: this.options.zIndex
    });
  }

  /**
   * 创建动画线图层。
   */
  private createAnimationLayer(): VectorLayer<VectorSource<Feature<LineString>>> {
    return new VectorLayer({
      properties: {
        name: `${this.options.layerName}__flow-animation`,
        layerName: `${this.options.layerName}__flow-animation`
      },
      source: this.animationSource,
      style: () => this.getAnimationLayerStyle(),
      zIndex: this.options.zIndex + 1
    });
  }

  /**
   * 获取基础线样式。
   */
  private getBaseLineStyle(feature: Feature<LineString>): Style | Style[] | void {
    if (!this.options.showBaseLine) {
      this.baseLineStyle.setStroke(new Stroke({ color: 'rgba(0,0,0,0)', width: 0 }));
      return this.baseLineStyle;
    }

    if (this.options.style) {
      if (typeof this.options.style === 'function') {
        return this.options.style(feature);
      }
      return this.options.style;
    }

    this.baseLineStyle.setStroke(new Stroke({
      color: this.options.strokeColor ?? ConfigManager.DEFAULT_LINE_OPTIONS.strokeColor,
      width: this.options.strokeWidth ?? ConfigManager.DEFAULT_LINE_OPTIONS.strokeWidth,
      lineDash: this.options.lineDash,
      lineDashOffset: this.options.lineDashOffset
    }));
    return this.baseLineStyle;
  }

  /**
   * 获取动画图层样式。
   */
  private getAnimationLayerStyle(): Style {
    if (this.options.animationMode === 'icon') {
      return this.emptyStyle;
    }
    return this.dashStyle;
  }

  /**
   * 创建虚线流光样式。
   */
  private createDashStyle(): Style {
    const lineDash = this.options.lineDash && this.options.lineDash.length > 0 ? this.options.lineDash : this.dashFallback;
    return new Style({
      stroke: new Stroke({
        color: this.options.strokeColor ?? ConfigManager.DEFAULT_LINE_OPTIONS.strokeColor,
        width: this.options.strokeWidth ?? ConfigManager.DEFAULT_LINE_OPTIONS.strokeWidth,
        lineDash,
        lineDashOffset: this.options.lineDashOffset ?? 0
      })
    });
  }

  /**
   * 标准化动画配置。
   */
  private normalizeOptions(options: FlowLineOptions): NormalizedFlowLineOptions {
    const mergedOptions = {
      ...ConfigManager.DEFAULT_FLOW_LINE_OPTIONS,
      ...options
    };

    return {
      ...mergedOptions,
      layerName: options.layerName || ConfigManager.DEFAULT_LINE_OPTIONS.layerName,
      duration: mergedOptions.duration > 0 ? mergedOptions.duration : ConfigManager.DEFAULT_FLOW_LINE_OPTIONS.duration,
      loop: mergedOptions.loop ?? ConfigManager.DEFAULT_FLOW_LINE_OPTIONS.loop,
      autoStart: mergedOptions.autoStart ?? ConfigManager.DEFAULT_FLOW_LINE_OPTIONS.autoStart,
      showBaseLine: mergedOptions.showBaseLine ?? ConfigManager.DEFAULT_FLOW_LINE_OPTIONS.showBaseLine,
      animationMode: mergedOptions.animationMode ?? ConfigManager.DEFAULT_FLOW_LINE_OPTIONS.animationMode,
      arrowScale: mergedOptions.arrowScale ?? ConfigManager.DEFAULT_FLOW_LINE_OPTIONS.arrowScale,
      arrowRotateWithView: mergedOptions.arrowRotateWithView ?? ConfigManager.DEFAULT_FLOW_LINE_OPTIONS.arrowRotateWithView,
      arrowCount: Math.min(this.maxArrowCount, Math.max(1, Math.round(mergedOptions.arrowCount ?? ConfigManager.DEFAULT_FLOW_LINE_OPTIONS.arrowCount))),
      arrowSpacing: Math.max(0.01, Math.min(0.5, mergedOptions.arrowSpacing ?? ConfigManager.DEFAULT_FLOW_LINE_OPTIONS.arrowSpacing)),
      trailEnabled: mergedOptions.trailEnabled ?? ConfigManager.DEFAULT_FLOW_LINE_OPTIONS.trailEnabled,
      trailLength: mergedOptions.trailLength ?? ConfigManager.DEFAULT_FLOW_LINE_OPTIONS.trailLength,
      speed: mergedOptions.speed && mergedOptions.speed > 0 ? mergedOptions.speed : 1,
      zIndex: mergedOptions.zIndex ?? ConfigManager.DEFAULT_FLOW_LINE_OPTIONS.zIndex
    };
  }

  /**
   * 更新基础线和动画线的数据源。
   */
  private updateSources(features: Feature<LineString>[]): void {
    const createClone = (feature: Feature<LineString>) => {
      const properties = { ...feature.getProperties() };
      delete properties.geometry;
      return new Feature({
        ...properties,
        geometry: feature.getGeometry()?.clone()
      }) as Feature<LineString>;
    };

    this.baseSource.clear();
    this.animationSource.clear();
    this.baseSource.addFeatures(features.map(createClone));
    this.animationSource.addFeatures(features.map(createClone));
  }

  /**
   * 绑定 postrender 事件。
   */
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

        for (let arrowIndex = 0; arrowIndex < this.options.arrowCount; arrowIndex += 1) {
          const offsetProgress = baseProgress - (arrowIndex * this.options.arrowSpacing);
          const normalizedProgress = this.options.loop
            ? ((offsetProgress % 1) + 1) % 1
            : Math.max(0, Math.min(offsetProgress, 1));

          if (!this.options.loop && (normalizedProgress <= 0 || normalizedProgress >= 1) && arrowIndex > 0) {
            continue;
          }

          const { coordinate, rotation } = this.getCoordinateAndRotation(geometry, normalizedProgress);
          this.animationPointGeometry.setCoordinates(coordinate);
          const style = this.getArrowStyle(rotation);
          vectorContext.setStyle(style);
          vectorContext.drawFeature(this.animationPointFeature, style);
        }
      });
    });
  }

  /**
   * 解绑 postrender 事件。
   */
  private unbindPostrender(): void {
    if (!this.postrenderKey) {
      return;
    }
    unByKey(this.postrenderKey);
    this.postrenderKey = null;
  }

  /**
   * 获取箭头样式，按旋转角做缓存。
   */
  private getArrowStyle(rotation: number): Style {
    const rotationKey = rotation.toFixed(2);
    const cacheKey = [
      rotationKey,
      this.options.arrowScale,
      this.options.arrowIcon ?? 'builtin',
      String(this.options.arrowRotateWithView),
      String(this.options.strokeColor ?? ConfigManager.DEFAULT_LINE_OPTIONS.strokeColor)
    ].join('|');

    const cachedStyle = this.arrowStyleCache.get(cacheKey);
    if (cachedStyle) {
      return cachedStyle;
    }

    const image = this.options.arrowIcon
      ? new Icon({
          src: this.options.arrowIcon,
          scale: this.options.arrowScale,
          rotation,
          rotateWithView: this.options.arrowRotateWithView
        })
      : new RegularShape({
          points: 3,
          radius: 10 * this.options.arrowScale,
          rotation: rotation - Math.PI / 2,
          rotateWithView: this.options.arrowRotateWithView,
          fill: new Fill({
            color: this.options.strokeColor ?? ConfigManager.DEFAULT_LINE_OPTIONS.strokeColor
          }),
          stroke: new Stroke({
            color: this.options.strokeColor ?? ConfigManager.DEFAULT_LINE_OPTIONS.strokeColor,
            width: 1
          })
        });

    const style = new Style({ image });
    this.arrowStyleCache.set(cacheKey, style);
    return style;
  }

  /**
   * 启动 RAF 渲染循环。
   */
  private startRafLoop(): void {
    if (this.rafId !== null) {
      return;
    }

    const renderFrame = () => {
      if (this.state !== 'running') {
        this.rafId = null;
        return;
      }

      if (this.options.animationMode === 'dash' || this.options.animationMode === 'icon+dash') {
        const dashOffset = -this.getCurrentProgress() * (this.options.lineDash?.reduce((sum, item) => sum + item, 0) ?? this.dashFallback.reduce((sum, item) => sum + item, 0));
        this.dashStyle.getStroke()?.setLineDashOffset(dashOffset);
        this.animationLayer.changed();
      }

      this.map.render();
      this.rafId = requestAnimationFrame(renderFrame);
    };

    this.rafId = requestAnimationFrame(renderFrame);
  }

  /**
   * 停止 RAF 渲染循环。
   */
  private stopRafLoop(): void {
    if (this.rafId === null) {
      return;
    }
    cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  /**
   * 获取当前动画进度。
   */
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

  /**
   * 获取时间戳。
   */
  private getNow(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }
}
