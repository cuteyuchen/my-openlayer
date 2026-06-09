import Map from "ol/Map";
import GeoJSON from "ol/format/GeoJSON";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import type { FlowLineLayerHandle, FlowLineOptions, LineOptions, MapJSONData, LayerHandle } from "../../types";
import { ErrorHandler, ErrorType } from "../../utils/ErrorHandler";
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

  /** *********************统一句柄：静态线图层*********************/
  private toLayerHandle<L extends VectorLayer<VectorSource>>(layer: L): LayerHandle<L> {
    const map = this.map;
    return {
      layer,
      setVisible(visible: boolean) { layer.setVisible(visible); },
      remove() { map.removeLayer(layer); }
    };
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

  /** *********************创建静态线图层*********************/
  private createLineLayer(data: MapJSONData, options: LineOptions & { layerName: string }): VectorLayer<VectorSource> {
    ValidationUtils.validateRequired(data, 'GeoJSON data is required');
    const mergedOptions = this.mergeDefaultOptions(options);
    const features = new GeoJSON().readFeatures(data, ProjectionUtils.getGeoJSONReadOptions(mergedOptions));
    return this.createStaticLayer(new VectorSource({ features }), mergedOptions);
  }

  /** *********************添加静态线图层*********************/
  addLine(data: MapJSONData, options: LineOptions & { layerName: string }): LayerHandle<VectorLayer<VectorSource>> {
    return this.toLayerHandle(this.createLineLayer(data, options));
  }

  /** *********************从 URL 添加静态线图层*********************/
  async addLineByUrl(url: string, options: LineOptions & { layerName: string }): Promise<LayerHandle<VectorLayer<VectorSource>>> {
    ValidationUtils.validateNonEmptyString(url, 'Line url is required');
    const response = await fetch(url);
    if (!response.ok) {
      throw ErrorHandler.getInstance().createAndHandleError(`Failed to fetch line GeoJSON: ${response.status}`, ErrorType.DATA_ERROR);
    }
    const json = await response.json();
    return this.addLine(json as MapJSONData, options);
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
        throw ErrorHandler.getInstance().createAndHandleError(`Failed to fetch flow line data: ${response.status}`, ErrorType.DATA_ERROR);
      }

      const jsonData = await response.json();
      if (!jsonData || typeof jsonData !== 'object') {
        throw ErrorHandler.getInstance().createAndHandleError('Flow line JSON data is invalid', ErrorType.DATA_ERROR);
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

}
