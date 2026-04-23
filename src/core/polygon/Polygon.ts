"use strict";

import Map from "ol/Map";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Image as ImageLayer } from "ol/layer";
import Feature from "ol/Feature";
import {
  PolygonOptions,
  MapJSONData,
  PointData,
  HeatMapOptions,
  ImageLayerData,
  MaskLayerOptions,
  FeatureColorUpdateOptions
} from '../../types'
import { ErrorHandler } from '../../utils/ErrorHandler';
import ProjectionUtils from '../../utils/ProjectionUtils';
import ValidationUtils from '../../utils/ValidationUtils';
import { ConfigManager, MapTools } from "../map";
import PolygonHeatmapLayer from './PolygonHeatmapLayer';
import PolygonImageLayer from './PolygonImageLayer';
import PolygonMaskLayer from './PolygonMaskLayer';
import PolygonStyleFactory from './PolygonStyleFactory';

/**
 * Polygon 类用于处理地图上的面要素操作
 * 包括添加多边形、边框、图片图层、热力图等功能
 */
export default class Polygon {
  private map: Map;

  [key: string]: any;

  /**
   * 构造函数
   * @param map OpenLayers 地图实例
   */
  constructor(map: Map) {
    if (!map) {
      throw new Error('Map instance is required');
    }
    this.map = map;
  }



  /**
   * 添加地图边框图层
   * @param data 图层数据，必须是有效的 GeoJSON 格式
   * @param options 图层配置选项
   * @returns 创建的图层实例
   * @throws 当数据格式无效时抛出错误
   */
  addBorderPolygon(data: MapJSONData, options?: PolygonOptions): VectorLayer<VectorSource> {
    ValidationUtils.validateGeoJSONData(data);

    const mergedOptions: PolygonOptions = {
      fillColor: 'rgba(255, 255, 255, 0)',
      ...options
    };

    const layer = this.addPolygon(data, mergedOptions);

    if (mergedOptions.mask) {
      this.setOutLayer(data);
    }

    return layer;
  }

  /**
   * 从URL添加地图边框图层
   * @param url 数据URL
   * @param options 图层配置选项
   * @returns 创建的图层实例
   * @throws 当数据格式无效时抛出错误
   */
  addBorderPolygonByUrl(url: string, options?: PolygonOptions): VectorLayer<VectorSource> {
    const mergedOptions: PolygonOptions = {
      layerName: 'border',
      fillColor: 'rgba(255, 255, 255, 0)',
      ...options
    };

    const layer = this.addPolygonByUrl(url, mergedOptions);

    return layer;
  }


  /**
   * 添加多边形图层
   * @param dataJSON GeoJSON 数据
   * @param options 图层配置选项
   * @returns 创建的矢量图层
   * @throws 当数据格式无效时抛出错误
   */
  addPolygon(dataJSON: MapJSONData, options?: PolygonOptions): VectorLayer<VectorSource> {
    ValidationUtils.validateGeoJSONData(dataJSON);

    const mergedOptions: PolygonOptions = {
      ...ConfigManager.DEFAULT_POLYGON_OPTIONS,
      ...options
    };

    // 如果指定了图层名称，先移除同名图层
    if (mergedOptions.layerName) {
      new MapTools(this.map).removeLayer(mergedOptions.layerName);
    }

    const format = new GeoJSON();

    // 优化：在解析 Feature 时直接注入 layerName，利用解析过程的遍历，避免解析后的二次循环
    if (mergedOptions.layerName) {
      const originalReadFeatureFromObject = (format as any).readFeatureFromObject;
      (format as any).readFeatureFromObject = function (object: any, options: any) {
        const feature = originalReadFeatureFromObject.call(this, object, options);
        feature.set('layerName', mergedOptions.layerName, true); // true 表示静默设置，不触发事件
        return feature;
      };
    }

    let features: Feature[];
    try {
      features = format.readFeatures(dataJSON, ProjectionUtils.getGeoJSONReadOptions(mergedOptions));
    } catch (error) {
      throw new Error(`Failed to parse GeoJSON data: ${error}`);
    }

    const layer = new VectorLayer({
      properties: {
        name: mergedOptions.layerName,
        layerName: mergedOptions.layerName
      },
      source: new VectorSource({ features }),
      style: PolygonStyleFactory.createStyle(mergedOptions),
      zIndex: mergedOptions.zIndex
    });

    layer.setVisible(mergedOptions.visible!);
    this.map.addLayer(layer);

    // 如果需要适应视图
    if (mergedOptions.fitView) {
      this.fitViewToLayer(layer);
    }

    return layer;
  }

  /**
   * 从URL添加多边形图层
   * @param url 数据URL
   * @param options 图层配置选项
   * @returns 创建的矢量图层
   * @throws 当数据格式无效时抛出错误
   */
  addPolygonByUrl(url: string, options?: PolygonOptions): VectorLayer<VectorSource> {
    const mergedOptions: PolygonOptions = {
      ...ConfigManager.DEFAULT_POLYGON_OPTIONS,
      ...options
    };

    // 如果指定了图层名称，先移除同名图层
    if (mergedOptions.layerName) {
      new MapTools(this.map).removeLayer(mergedOptions.layerName);
    }

    const format = new GeoJSON(ProjectionUtils.getGeoJSONReadOptions(mergedOptions));

    // 优化：在解析 Feature 时直接注入 layerName，利用解析过程的遍历，避免解析后的二次循环
    if (mergedOptions.layerName) {
      const originalReadFeatureFromObject = (format as any).readFeatureFromObject;
      (format as any).readFeatureFromObject = function (object: any, options: any) {
        const feature = originalReadFeatureFromObject.call(this, object, options);
        feature.set('layerName', mergedOptions.layerName, true); // true 表示静默设置，不触发事件
        return feature;
      };
    }

    const source = new VectorSource({
      url,
      format
    });

    const layer = new VectorLayer({
      properties: {
        name: mergedOptions.layerName,
        layerName: mergedOptions.layerName
      },
      source,
      style: PolygonStyleFactory.createStyle(mergedOptions),
      zIndex: mergedOptions.zIndex
    });

    layer.setVisible(mergedOptions.visible!);
    this.map.addLayer(layer);

    // 如果需要适应视图
    if (mergedOptions.fitView) {
      source.once('featuresloadend', () => {
        this.fitViewToLayer(layer);
      });
    }

    return layer;
  }

  /**
   * 适应图层视图
   * @param layer 图层对象
   */
  private fitViewToLayer(layer: VectorLayer<VectorSource>): void {
    const extent = layer.getSource()?.getExtent();
    if (extent) {
      this.map.getView().fit(extent, { duration: 500 });
    }
  }

  /**
   * 根据数据数组更新某个面颜色
   * @param layerName 图层名称
   * @param colorObj 颜色映射对象，键为要素属性值，值为颜色字符串
   * @param options 配置项
   * @throws 当图层不存在时抛出错误
   */
  updateFeatureColor(
    layerName: string,
    colorObj?: { [propName: string]: string },
    options?: FeatureColorUpdateOptions
  ): void {
    ValidationUtils.validateLayerName(layerName);

    const layers = MapTools.getLayerByLayerName(this.map, layerName);
    if (layers.length === 0) {
      throw new Error(`Layer with name '${layerName}' not found`);
    }

    const layer = layers[0];
    if (!(layer instanceof VectorLayer)) {
      throw new Error(`Layer '${layerName}' is not a vector layer`);
    }

    const mergedOptions: FeatureColorUpdateOptions = {
      textFont: '14px Calibri,sans-serif',
      textFillColor: '#FFF',
      textStrokeWidth: 2,
      ...options
    };

    const features = layer.getSource()?.getFeatures();
    if (!features) {
      ErrorHandler.getInstance().warn(`No features found in layer '${layerName}'`);
      return;
    }

    features.forEach((feature: Feature) => {
      PolygonStyleFactory.updateSingleFeatureColor(feature, colorObj, mergedOptions);
    });
  }


  /**
   * 设置外围蒙版图层
   *
   * 详细文档参考 https_blog.csdn.net/?url=https%3A%2F%2Fblog.csdn.net%2Fu012413551%2Farticle%2Fdetails%2F122739501
   *
   * @param data
   * @param options
   */
  setOutLayer(data: MapJSONData, options?: {
    layerName?: string,
    extent?: any,
    fillColor?: string,
    strokeWidth?: number,
    strokeColor?: string,
    zIndex?: number
  }) {
    return PolygonMaskLayer.setOutLayer(this.map, data, options);
  }

  /**
   * 添加图片图层
   * @param imageData 图片数据，包含url和extent
   * @param options 配置项
   * @returns 创建的图片图层
   * @throws 当数据格式无效时抛出错误
   */
  addImageLayer(imageData: ImageLayerData, options?: PolygonOptions): ImageLayer<any> {
    return PolygonImageLayer.addImageLayer(this.map, imageData, options);
  }

  /**
   * 添加热力图图层
   * @param pointData 点数据数组
   * @param options 热力图配置
   */
  addHeatmap(pointData: PointData[], options?: HeatMapOptions) {
    return PolygonHeatmapLayer.addHeatmap(this.map, pointData, options)
  }

  /**
   * 添加遮罩图层
   * @param data GeoJSON格式的遮罩数据
   * @param options 配置项
   * @returns 创建的遮罩图层
   * @throws 当数据格式无效时抛出错误
   */
  addMaskLayer(data: any, options?: MaskLayerOptions): VectorLayer<VectorSource> {
    return PolygonMaskLayer.addMaskLayer(this.map, data, options);
  }

  removePolygonLayer(layerName: string) {
    new MapTools(this.map).removeLayer(layerName)
    this[layerName] = null
  }
}
