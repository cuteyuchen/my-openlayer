import Map from "ol/Map";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import VectorLayer from "ol/layer/Vector";
import { Stroke, Style } from "ol/style";
import { Feature } from "ol";
import { FeatureLike } from "ol/Feature";
import { LineOptions, MapJSONData } from "../types";
import MapTools from "./MapTools";
import { ValidationUtils } from "../utils/ValidationUtils";
import { ConfigManager } from "./ConfigManager";

/**
 * 线要素管理类
 * 用于在地图上添加和管理线要素
 * 
 * @example
 * ```typescript
 * const lineManager = new Line(map);
 * const layer = lineManager.addLine(geoJsonData, {
 *   type: 'road',
 *   strokeColor: '#ff0000',
 *   strokeWidth: 3
 * });
 * ```
 */
export default class Line {
  /** OpenLayers 地图实例 */
  private readonly map: Map;
  
  private mergeDefaultOptions(options?: LineOptions) {
    const layerName = options?.layerName || ConfigManager.DEFAULT_LINE_OPTIONS.layerName;
    const defaultOptions = {
      ...ConfigManager.DEFAULT_LINE_OPTIONS,
      layerName
    };

    const mergedOptions = { ...defaultOptions, ...options };
    return { ...mergedOptions, layerName };
  }

  private createStyleFunction(mergedOptions: ReturnType<Line['mergeDefaultOptions']>) {
    return (feature: FeatureLike) => {
      if (feature instanceof Feature) {
        feature.set('type', mergedOptions.type);
        feature.set('layerName', mergedOptions.layerName);
      }

      if (mergedOptions.style) {
        if (typeof mergedOptions.style === 'function') {
          return mergedOptions.style(feature);
        } else {
          return mergedOptions.style;
        }
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
   * 构造函数
   * @param map OpenLayers地图实例
   */
  constructor(map: Map) {
    ValidationUtils.validateMapInstance(map);
    this.map = map;
  }

  /**
   * 添加线要素
   * @param data GeoJSON格式的线数据
   * @param options 配置项
   * @returns 创建的矢量图层
   */
  addLine(data: MapJSONData, options?: LineOptions): VectorLayer<VectorSource> {
    ValidationUtils.validateGeoJSONData(data);
    const mergedOptions = this.mergeDefaultOptions(options);
    const features = new GeoJSON().readFeatures(data, options?.projectionOptOptions);
    const source = new VectorSource({ features });
    return this.createLayer(source, mergedOptions);
  }

  /**
   * 从URL添加线要素
   * @param url 数据URL
   * @param options 配置项
   * @returns 创建的矢量图层
   */
  addLineByUrl(url: string, options: LineOptions = {}): VectorLayer<VectorSource> {
    const mergedOptions = this.mergeDefaultOptions(options);
    const source = new VectorSource({
      url,
      format: new GeoJSON(options.projectionOptOptions)
    });
    
    return this.createLayer(source, mergedOptions);
  }
  /**
   * 移除线图层
   * @param layerName 图层名称
   */
  removeLineLayer(layerName: string): void {
    ValidationUtils.validateLayerName(layerName);
    MapTools.removeLayer(this.map, layerName);
  }

}
