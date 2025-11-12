"use strict";

import Map from "ol/Map";
import { MapJSONData } from "../types";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Fill, Style } from "ol/style";
import { getVectorContext } from "ol/render";
import BaseLayer from "ol/layer/Base";
import ImageLayer from "ol/layer/Image";
import ImageSource from "ol/source/Image";
import { ErrorHandler, ErrorType } from "../utils/ErrorHandler";
import { ValidationUtils } from "../utils/ValidationUtils";

/**
 * 地图工具类
 * 提供地图的基础操作功能
 */
export default class MapTools {
  private readonly map: Map;
  private errorHandler: ErrorHandler;

  constructor(map: Map) {
    this.errorHandler = ErrorHandler.getInstance();
    
    try {
      ValidationUtils.validateMap(map);
      this.map = map;
    } catch (error) {
      this.errorHandler.createAndHandleError(
        `MapTools initialization failed: ${error}`,
        ErrorType.COMPONENT_ERROR,
        { map, error }
      );
      throw error;
    }
  }



  /**
   * 根据名称获取图层
   * @param layerName 图层名称
   * @returns 图层数组
   * @throws 当参数无效时抛出错误
   */
  getLayerByLayerName(layerName: string | string[]): (VectorLayer<VectorSource> | BaseLayer | ImageLayer<ImageSource>)[] {
    if (!this.map) {
      throw new Error('Map instance is not available');
    }
    return MapTools.getLayerByLayerName(this.map, layerName);
  }

  /**
   * 根据图层名称获取图层
   * @param map 地图实例
   * @param layerName 图层名称
   * @returns 图层数组
   * @throws 当参数无效时抛出错误
   */
  static getLayerByLayerName(map: Map, layerName: string | string[]): (VectorLayer<VectorSource> | BaseLayer | ImageLayer<ImageSource>)[] {
    ValidationUtils.validateMap(map);
    ValidationUtils.validateLayerNameParam(layerName);
    
    const targetLayer: (VectorLayer<VectorSource> | BaseLayer | ImageLayer<ImageSource>)[] = [];
    
    try {
      const layers = map.getLayers().getArray();
      layers.forEach((layer: BaseLayer) => {
        const _layerName = layer.get('layerName');
        if (typeof layerName === "string") {
          if (_layerName && _layerName === layerName) {
            targetLayer.push(layer as VectorLayer<VectorSource> | BaseLayer | ImageLayer<ImageSource>);
          }
        } else {
          if (_layerName && layerName.includes(_layerName)) {
            targetLayer.push(layer as VectorLayer<VectorSource> | BaseLayer | ImageLayer<ImageSource>);
          }
        }
      });
    } catch (error) {
      ErrorHandler.getInstance().error('Error getting layers:', error);
      throw new Error('Failed to retrieve layers from map');
    }
    
    return targetLayer;
  }

  /**
   * 设置地图裁剪
   */
  static setMapClip(baseLayer: any, data: MapJSONData) {
    const clipLayer = new VectorLayer({
      style: null,
      source: new VectorSource({
        features: new GeoJSON().readFeatures(data)
      })
    });
    const style = new Style({
      fill: new Fill({
        color: 'transparent'
      })
    });
    baseLayer.on("prerender", (event: any) => {
      const vectorContext = getVectorContext(event);
      event.context.globalCompositeOperation = 'source-over';
      const ctx = event.context;
      ctx.save();
      clipLayer.getSource()?.forEachFeature(function (feature) {
        vectorContext.drawFeature(feature, style);
      });
      ctx.clip();
    })
    baseLayer.on("postrender", (event: any) => {
      const ctx = event.context;
      ctx.restore();
    })
    clipLayer.getSource()?.on('addfeature', function () {
      baseLayer.setExtent(clipLayer.getSource()?.getExtent());
    });
    return baseLayer
  }

  /**
   * 移除图层
   * @param layerName 图层名称
   * @throws 当参数无效时抛出错误
   */
  removeLayer(layerName: string | string[]): void {
    if (!this.map) {
      throw new Error('Map instance is not available');
    }
    
    try {
      const layers = this.getLayerByLayerName(layerName);
      layers.forEach(layer => {
        this.map.removeLayer(layer);
      });
    } catch (error) {
      ErrorHandler.getInstance().error('Error removing layers:', error);
      throw new Error('Failed to remove layers from map');
    }
  }

  /**
   * 移除图层（静态方法，兼容性保留）
   * @param map 地图对象
   * @param layerName 图层名称
   * @throws 当参数无效时抛出错误
   */
  static removeLayer(map: Map, layerName: string | string[]): void {
    if (!map) {
      throw new Error('Map instance is required');
    }
    
    try {
      const layers = MapTools.getLayerByLayerName(map, layerName);
      layers.forEach(layer => {
        map.removeLayer(layer);
      });
    } catch (error) {
      ErrorHandler.getInstance().error('Error removing layers:', error);
      throw new Error('Failed to remove layers from map');
    }
  }

  /**
   * 设置图层可见性
   * @param layerName 图层名称
   * @param visible 是否可见
   * @throws 当参数无效时抛出错误
   */
  setLayerVisible(layerName: string, visible: boolean): void {
    if (!this.map) {
      throw new Error('Map instance is not available');
    }
    
    try {
      const layers = this.getLayerByLayerName(layerName);
      layers.forEach(layer => {
        layer.setVisible(visible);
      });
    } catch (error) {
      ErrorHandler.getInstance().error('Error setting layer visibility:', error);
      throw new Error('Failed to set layer visibility');
    }
  }

  /**
   * 设置图层可见性
   * @param map 地图实例
   * @param layerName 图层名称
   * @param visible 是否可见
   * @throws 当参数无效时抛出错误
   */
  static setLayerVisible = (map: Map, layerName: string, visible: boolean): void => {
    if (!map) {
      throw new Error('Map instance is required');
    }
    
    if (typeof layerName !== 'string') {
      throw new Error('Layer name must be a string');
    }
    
    if (typeof visible !== 'boolean') {
      throw new Error('Visible parameter must be a boolean');
    }
    
    try {
      const layers = MapTools.getLayerByLayerName(map, layerName);
      layers.forEach(layer => {
        layer.setVisible(visible);
      });
    } catch (error) {
      ErrorHandler.getInstance().error('Error setting layer visibility:', error);
      throw new Error('Failed to set layer visibility');
    }
  }



  /**
   * 获取地图实例
   * @returns 地图实例
   */
  getMap(): Map {
    return this.map;
  }
}
