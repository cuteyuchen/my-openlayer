"use strict";

import Map from "ol/Map";
import { EventType, MapJSONData } from "../types";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Fill, Style } from "ol/style";
import { getVectorContext } from "ol/render";
import { Pixel } from "ol/pixel";
import { FeatureLike } from "ol/Feature";
import { MapBrowserEvent } from "ol/index";
import BaseLayer from "ol/layer/Base";
import ImageLayer from "ol/layer/Image";
import ImageSource from "ol/source/Image";

/**
 * 地图工具类
 * 提供地图的基础操作功能
 */
export default class MapTools {
  private readonly map: Map;

  constructor(map: Map) {
    if (!map) {
      throw new Error('Map instance is required');
    }
    this.map = map;
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
    if (!map) {
      throw new Error('Map instance is required');
    }
    
    if (!layerName || (typeof layerName !== 'string' && !Array.isArray(layerName))) {
      throw new Error('Valid layer name is required');
    }
    
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
      console.error('Error getting layers:', error);
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
    MapTools.removeLayer(this.map, layerName);
  }

  /**
   * 移除图层
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
      console.error('Error removing layers:', error);
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
    MapTools.setLayerVisible(this.map, layerName, visible);
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
      console.error('Error setting layer visibility:', error);
      throw new Error('Failed to set layer visibility');
    }
  }

  /**
   * 地图监听事件
   * @param eventType 事件类型
   * @param callback 回调函数
   * @param clickType 点击类型
   * @throws 当参数无效时抛出错误
   */
  mapOnEvent(eventType: EventType, callback: (feature?: any, e?: any) => void, clickType?: 'point' | 'line' | 'polygon' | undefined): void {
    if (!this.map) {
      throw new Error('Map instance is not available');
    }
    MapTools.mapOnEvent(this.map, eventType, callback, clickType);
  }

  /**
   * 地图监听事件
   * @param map 地图实例
   * @param eventType 事件类型
   * @param callback 回调函数
   * @param clickType 点击类型
   * @throws 当参数无效时抛出错误
   */
  static mapOnEvent(map: Map, eventType: EventType, callback: (feature?: any, e?: any) => void, clickType?: 'point' | 'line' | 'polygon'): void {
    if (!map) {
      throw new Error('Map instance is required');
    }
    
    if (!eventType) {
      throw new Error('Event type is required');
    }
    
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    
    const clickTypeObj = {
      point: ['point'],
      line: ['line'],
      polygon: ['polygon', 'MultiPolygon']
    };

    try {
      if (eventType === "click") {
        map.on("click", (e) => {
          // 获取点位 feature
          const pixel: Pixel = map.getEventPixel(e.originalEvent);
          const features: FeatureLike[] = map.getFeaturesAtPixel(pixel);

          let feature: FeatureLike | undefined = undefined;
          if (features.length > 0) feature = features[0];

          callback(feature, { features, pixel });
        });
      } else if (eventType === 'moveend') {
        map.on('moveend', function () {
          const zoom = map.getView().getZoom();
          if (zoom !== undefined) {
            callback(zoom);
          }
        });
      } else if (eventType === 'hover') {
        map.on('pointermove', (e: MapBrowserEvent<any>) => {
          const pixel: Pixel = map.getEventPixel(e.originalEvent);
          const features: FeatureLike[] = map.getFeaturesAtPixel(pixel);
          callback({ features, pixel });
        });
      }
    } catch (error) {
      console.error('Error setting up map event:', error);
      throw new Error('Failed to set up map event listener');
    }
  }
}
