import Map from "ol/Map";
import GeoJSON from "ol/format/GeoJSON";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import type { FlowLineLayerHandle, FlowLineOptions, LineOptions, MapJSONData, LayerHandle } from "../../types";
import { ErrorHandler } from "../../utils/ErrorHandler";
import ProjectionUtils from "../../utils/ProjectionUtils";
import ValidationUtils from "../../utils/ValidationUtils";
import { ConfigManager, MapTools } from "../map";
import LineFlowAnimator from "./LineFlowAnimator";
import LineStyleFactory from "./LineStyleFactory";

/**
 * 线要素管理类
 * 用于在地图上添加和管理静态线与流动线要素。
 */
export default class Line {
  private readonly map: Map;
  private readonly flowLineRegistry = new globalThis.Map<string, FlowLineLayerHandle>();
  private readonly styleFactory = new LineStyleFactory();

  constructor(map: Map) {
    ValidationUtils.validateMapInstance(map);
    this.map = map;
  }

  /**
   * 合并静态线默认配置。
   */
  private mergeDefaultOptions(options?: LineOptions): LineOptions & { layerName: string } {
    const layerName = options?.layerName || ConfigManager.DEFAULT_LINE_OPTIONS.layerName;
    return {
      ...ConfigManager.DEFAULT_LINE_OPTIONS,
      ...options,
      layerName
    };
  }

  /**
   * 合并流动线默认配置。
   */
  private mergeFlowLineOptions(options?: FlowLineOptions): FlowLineOptions & { layerName: string } {
    const layerName = options?.layerName || ConfigManager.DEFAULT_LINE_OPTIONS.layerName;
    return {
      ...ConfigManager.DEFAULT_FLOW_LINE_OPTIONS,
      ...options,
      flowSymbol: {
        ...ConfigManager.DEFAULT_FLOW_LINE_OPTIONS.flowSymbol,
        ...options?.flowSymbol
      },
      layerName
    };
  }

  /**
   * 创建静态线图层。
   */
  private createStaticLayer(source: VectorSource, options: LineOptions & { layerName: string }): VectorLayer<VectorSource> {
    const layer = new VectorLayer({
      properties: {
        name: options.layerName,
        layerName: options.layerName
      },
      source,
      style: this.styleFactory.createBaseLineStyleResolver(options),
      zIndex: options.zIndex
    });

    layer.setVisible(options.visible ?? true);
    this.map.addLayer(layer);
    return layer;
  }

  /**
   * 注册流动线句柄。
   */
  private registerFlowLineHandle(layerName: string, handle: FlowLineLayerHandle): void {
    this.flowLineRegistry.set(layerName, handle);
  }

  /**
   * 注销流动线句柄。
   */
  private unregisterFlowLineHandle(layerName: string): void {
    this.flowLineRegistry.delete(layerName);
  }

  addLine(data: MapJSONData, options: LineOptions & { layerName: string }): VectorLayer<VectorSource> {
    ValidationUtils.validateRequired(data, 'GeoJSON data is required');
    const mergedOptions = this.mergeDefaultOptions(options);
    const features = new GeoJSON().readFeatures(data, ProjectionUtils.getGeoJSONReadOptions(mergedOptions));
    return this.createStaticLayer(new VectorSource({ features }), mergedOptions);
  }

  /**
   * 从 URL 加载 GeoJSON 数据并添加为静态线图层。
   *
   * @deprecated 推荐使用 {@link addLineByUrlAsync}，它返回 Promise，在 features 加载完成后才 resolve。
   * 3.x 末尾会删除此方法。
   */
  addLineByUrl(url: string, options: LineOptions & { layerName: string }): VectorLayer<VectorSource> {
    ValidationUtils.validateNonEmptyString(url, 'Line url is required');
    const mergedOptions = this.mergeDefaultOptions(options);
    const source = new VectorSource({
      url,
      format: new GeoJSON(ProjectionUtils.getGeoJSONReadOptions(mergedOptions))
    });
    return this.createStaticLayer(source, mergedOptions);
  }

  /**
   * Promise 版本：features 加载完成后 resolve。
   */
  addLineByUrlAsync(url: string, options: LineOptions & { layerName: string }): Promise<VectorLayer<VectorSource>> {
    return new Promise((resolve, reject) => {
      const layer = this.addLineByUrl(url, options);
      const source = layer.getSource();
      if (!source) {
        resolve(layer);
        return;
      }
      const onEnd = () => {
        source.un('featuresloaderror' as any, onErr);
        resolve(layer);
      };
      const onErr = () => {
        source.un('featuresloadend' as any, onEnd);
        reject(new Error(`Failed to load line GeoJSON: ${url}`));
      };
      source.once('featuresloadend' as any, onEnd);
      source.once('featuresloaderror' as any, onErr);
    });
  }

  removeLineLayer(layerName: string): void {
    ValidationUtils.validateLayerName(layerName);
    MapTools.removeLayer(this.map, layerName);
  }

  addFlowLine(data: MapJSONData, options: FlowLineOptions & { layerName: string }): FlowLineLayerHandle | null {
    const mergedOptions = this.mergeFlowLineOptions(options);
    const layerName = mergedOptions.layerName;

    try {
      ValidationUtils.validateLayerName(layerName);
      this.flowLineRegistry.get(layerName)?.remove();

      const animator = new LineFlowAnimator(this.map, data, mergedOptions, name => {
        this.unregisterFlowLineHandle(name);
      });
      const handle = animator.createHandle();
      if (!handle) {
        return null;
      }

      this.registerFlowLineHandle(layerName, handle);
      return handle;
    } catch (error) {
      ErrorHandler.getInstance().error('[Line] 添加流动线失败:', error);
      return null;
    }
  }

  async addFlowLineByUrl(url: string, options: FlowLineOptions & { layerName: string }): Promise<FlowLineLayerHandle | null> {
    const mergedOptions = this.mergeFlowLineOptions(options);

    try {
      ValidationUtils.validateNonEmptyString(url, 'Flow line url is required');
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch flow line data: ${response.status}`);
      }

      const jsonData = await response.json();
      if (!jsonData || typeof jsonData !== 'object') {
        throw new Error('Flow line JSON data is invalid');
      }

      return this.addFlowLine(jsonData as MapJSONData, mergedOptions);
    } catch (error) {
      ErrorHandler.getInstance().error('[Line] 从 URL 添加流动线失败:', error);
      return null;
    }
  }

  removeFlowLineLayer(layerName: string): void {
    ValidationUtils.validateLayerName(layerName);
    const handle = this.flowLineRegistry.get(layerName);
    if (handle) {
      handle.remove();
      return;
    }
    MapTools.removeLayer(this.map, [layerName, `${layerName}__flow-animation`]);
  }

  /**
   * 销毁本实例创建的所有流动线动画。供 MyOl.destroy 调用，
   * 确保地图销毁后所有 requestAnimationFrame / postrender 监听被回收。
   */
  destroyAllFlowLines(): void {
    Array.from(this.flowLineRegistry.values()).forEach(handle => {
      try { handle.remove(); } catch { /* ignore */ }
    });
    this.flowLineRegistry.clear();
  }

  /**
   * P1-1：把 addLine 返回的 VectorLayer 包成统一 LayerHandle。
   */
  attachLine(data: MapJSONData, options: LineOptions & { layerName: string }): LayerHandle<VectorLayer<VectorSource>> {
    const layer = this.addLine(data, options);
    const map = this.map;
    return {
      layer,
      setVisible(visible: boolean) { layer.setVisible(visible); },
      remove() { map.removeLayer(layer); }
    };
  }

  /**
   * P1-1：addFlowLine 已经是 AnimatedLayerHandle，attach 版本只是别名。
   */
  attachFlowLine(data: MapJSONData, options: FlowLineOptions & { layerName: string }): FlowLineLayerHandle | null {
    return this.addFlowLine(data, options);
  }
}
