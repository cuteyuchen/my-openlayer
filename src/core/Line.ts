import Map from "ol/Map";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import VectorLayer from "ol/layer/Vector";
import { Stroke, Style } from "ol/style";
import { Feature } from "ol";
import { FeatureLike } from "ol/Feature";
import { FlowLineLayerHandle, FlowLineOptions, LineOptions, MapJSONData } from "../types";
import MapTools from "./MapTools";
import { ValidationUtils } from "../utils/ValidationUtils";
import { ConfigManager } from "./ConfigManager";
import { ProjectionUtils } from "../utils/ProjectionUtils";
import { ErrorHandler } from "../utils/ErrorHandler";
import LineFlowAnimator from "./LineFlowAnimator";

/**
 * 线要素管理类
 * 用于在地图上添加和管理静态线与流动线要素。
 */
export default class Line {
  /** OpenLayers 地图实例 */
  private readonly map: Map;
  /** 流动线控制句柄注册表 */
  private readonly flowLineRegistry = new globalThis.Map<string, FlowLineLayerHandle>();

  constructor(map: Map) {
    ValidationUtils.validateMapInstance(map);
    this.map = map;
  }

  /**
   * 合并静态线默认配置。
   */
  private mergeDefaultOptions(options?: LineOptions) {
    const layerName = options?.layerName || ConfigManager.DEFAULT_LINE_OPTIONS.layerName;
    const defaultOptions = {
      ...ConfigManager.DEFAULT_LINE_OPTIONS,
      layerName
    };

    const mergedOptions = { ...defaultOptions, ...options };
    return { ...mergedOptions, layerName };
  }

  /**
   * 创建静态线样式函数。
   */
  private createStyleFunction(mergedOptions: ReturnType<Line['mergeDefaultOptions']>) {
    return (feature: FeatureLike) => {
      if (feature instanceof Feature) {
        feature.set('type', mergedOptions.type);
        feature.set('layerName', mergedOptions.layerName);
      }

      if (mergedOptions.style) {
        if (typeof mergedOptions.style === 'function') {
          return mergedOptions.style(feature);
        }
        return mergedOptions.style;
      }

      return new Style({
        stroke: new Stroke({
          color: mergedOptions.strokeColor,
          width: mergedOptions.strokeWidth,
          lineDash: mergedOptions.lineDash,
          lineDashOffset: mergedOptions.lineDashOffset
        })
      });
    };
  }

  /**
   * 创建静态线图层。
   */
  private createLayer(source: VectorSource, mergedOptions: ReturnType<Line['mergeDefaultOptions']>): VectorLayer<VectorSource> {
    const layer = new VectorLayer({
      properties: {
        name: mergedOptions.layerName,
        layerName: mergedOptions.layerName
      },
      source,
      style: this.createStyleFunction(mergedOptions),
      zIndex: mergedOptions.zIndex
    });

    layer.setVisible(mergedOptions.visible);
    this.map.addLayer(layer);
    return layer;
  }

  /**
   * 合并流动线默认配置。
   */
  private mergeFlowLineOptions(options?: FlowLineOptions): FlowLineOptions {
    const layerName = options?.layerName || ConfigManager.DEFAULT_LINE_OPTIONS.layerName;
    return {
      ...ConfigManager.DEFAULT_FLOW_LINE_OPTIONS,
      ...options,
      layerName
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

  /**
   * 添加静态线要素。
   */
  addLine(data: MapJSONData, options?: LineOptions): VectorLayer<VectorSource> {
    ValidationUtils.validateRequired(data, 'GeoJSON data is required');
    const mergedOptions = this.mergeDefaultOptions(options);
    const features = new GeoJSON().readFeatures(data, ProjectionUtils.getGeoJSONReadOptions(mergedOptions));
    const source = new VectorSource({ features });
    return this.createLayer(source, mergedOptions);
  }

  /**
   * 从 URL 添加静态线要素。
   */
  addLineByUrl(url: string, options: LineOptions = {}): VectorLayer<VectorSource> {
    ValidationUtils.validateNonEmptyString(url, 'Line url is required');
    const mergedOptions = this.mergeDefaultOptions(options);
    const source = new VectorSource({
      url,
      format: new GeoJSON(ProjectionUtils.getGeoJSONReadOptions(mergedOptions))
    });

    return this.createLayer(source, mergedOptions);
  }

  /**
   * 移除静态线图层。
   */
  removeLineLayer(layerName: string): void {
    ValidationUtils.validateLayerName(layerName);
    MapTools.removeLayer(this.map, layerName);
  }

  /**
   * 添加流动线图层，返回控制句柄。
   */
  addFlowLine(data: MapJSONData, options: FlowLineOptions = {}): FlowLineLayerHandle | null {
    const mergedOptions = this.mergeFlowLineOptions(options);
    const layerName = mergedOptions.layerName || ConfigManager.DEFAULT_LINE_OPTIONS.layerName;

    try {
      ValidationUtils.validateLayerName(layerName);
      const existingHandle = this.flowLineRegistry.get(layerName);
      existingHandle?.remove();

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

  /**
   * 从 URL 添加流动线图层。
   */
  async addFlowLineByUrl(url: string, options: FlowLineOptions = {}): Promise<FlowLineLayerHandle | null> {
    const mergedOptions = this.mergeFlowLineOptions(options);

    try {
      ValidationUtils.validateNonEmptyString(url, 'Flow line url is required');
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch flow line data: ${response.status}`);
      }

      const jsonData = await response.json();
      if (!jsonData || (typeof jsonData !== 'object')) {
        throw new Error('Flow line JSON data is invalid');
      }

      return this.addFlowLine(jsonData as MapJSONData, mergedOptions);
    } catch (error) {
      ErrorHandler.getInstance().error('[Line] 从 URL 添加流动线失败:', error);
      return null;
    }
  }

  /**
   * 移除流动线图层。
   */
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
