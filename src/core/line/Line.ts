import Map from "ol/Map";
import GeoJSON from "ol/format/GeoJSON";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import type { FlowLineLayerHandle, FlowLineOptions, LineOptions, MapJSONData } from "../../types";
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

  addLine(data: MapJSONData, options?: LineOptions): VectorLayer<VectorSource> {
    ValidationUtils.validateRequired(data, 'GeoJSON data is required');
    const mergedOptions = this.mergeDefaultOptions(options);
    const features = new GeoJSON().readFeatures(data, ProjectionUtils.getGeoJSONReadOptions(mergedOptions));
    return this.createStaticLayer(new VectorSource({ features }), mergedOptions);
  }

  addLineByUrl(url: string, options: LineOptions = {}): VectorLayer<VectorSource> {
    ValidationUtils.validateNonEmptyString(url, 'Line url is required');
    const mergedOptions = this.mergeDefaultOptions(options);
    const source = new VectorSource({
      url,
      format: new GeoJSON(ProjectionUtils.getGeoJSONReadOptions(mergedOptions))
    });
    return this.createStaticLayer(source, mergedOptions);
  }

  removeLineLayer(layerName: string): void {
    ValidationUtils.validateLayerName(layerName);
    MapTools.removeLayer(this.map, layerName);
  }

  addFlowLine(data: MapJSONData, options: FlowLineOptions = {}): FlowLineLayerHandle | null {
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

  async addFlowLineByUrl(url: string, options: FlowLineOptions = {}): Promise<FlowLineLayerHandle | null> {
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
}
