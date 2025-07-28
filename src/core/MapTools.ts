"use strict";

import Map from "ol/Map";
import { EventType, MapJSONData } from "../types";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Fill, Style } from "ol/style";
import { getVectorContext } from "ol/render";
import BaseLayer from "ol/layer/Base";
import ImageLayer from "ol/layer/Image";
import ImageSource from "ol/source/Image";
import { EventManager, MapEventType, EventCallback, MapEventData } from "./EventManager";
import { ErrorHandler, ErrorType } from "../utils/ErrorHandler";

/**
 * 地图工具类
 * 提供地图的基础操作功能
 */
export default class MapTools {
  private readonly map: Map;
  private eventManager: EventManager;
  private errorHandler: ErrorHandler;

  constructor(map: Map) {
    this.errorHandler = ErrorHandler.getInstance();
    
    try {
      ErrorHandler.validateMap(map);
      this.map = map;
      this.eventManager = new EventManager(map);
    } catch (error) {
      this.errorHandler.createAndHandleError(
        `Failed to initialize MapTools: ${error}`,
        ErrorType.MAP_ERROR,
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
   * @param options 事件选项
   * @returns 事件监听器ID
   * @throws 当参数无效时抛出错误
   */
  mapOnEvent(
    eventType: EventType, 
    callback: (feature?: any, e?: any) => void, 
    options?: {
      clickType?: 'point' | 'line' | 'polygon';
      once?: boolean;
      filter?: (event: MapEventData) => boolean;
    }
  ): string {
    try {
      ErrorHandler.validateMap(this.map);
      
      if (!eventType) {
        throw new Error('Event type is required');
      }
      
      if (typeof callback !== 'function') {
        throw new Error('Callback must be a function');
      }

      return this.registerEventWithManager(eventType, callback, options);
    } catch (error) {
      this.errorHandler.createAndHandleError(
        `Failed to register map event: ${error}`,
        ErrorType.COMPONENT_ERROR,
        { eventType, callback, options, error }
      );
      throw error;
    }
  }

  /**
   * 地图监听事件（静态方法，兼容性保留）
   * @param map 地图实例
   * @param eventType 事件类型
   * @param callback 回调函数
   * @param clickType 点击类型
   * @throws 当参数无效时抛出错误
   * @deprecated 推荐使用实例方法 mapOnEvent
   */
  static mapOnEvent(
    map: Map, 
    eventType: EventType, 
    callback: (feature?: any, e?: any) => void, 
    clickType?: 'point' | 'line' | 'polygon'
  ): void {
    const errorHandler = ErrorHandler.getInstance();
    
    try {
      ErrorHandler.validateMap(map);
      
      if (!eventType) {
        throw new Error('Event type is required');
      }
      
      if (typeof callback !== 'function') {
        throw new Error('Callback must be a function');
      }

      const eventManager = new EventManager(map);
      const mapTools = new MapTools(map);
      mapTools.registerEventWithManager(eventType, callback, { clickType });
    } catch (error) {
      errorHandler.createAndHandleError(
        `Failed to register static map event: ${error}`,
        ErrorType.COMPONENT_ERROR,
        { map, eventType, callback, clickType, error }
      );
      throw error;
    }
  }

  /**
   * 使用 EventManager 注册事件
   * @private
   */
  private registerEventWithManager(
    eventType: EventType,
    callback: (feature?: any, e?: any) => void,
    options?: {
      clickType?: 'point' | 'line' | 'polygon';
      once?: boolean;
      filter?: (event: MapEventData) => boolean;
    }
  ): string {
    const mapEventType = this.convertToMapEventType(eventType);
    
    const eventCallback: EventCallback = (event: MapEventData) => {
      try {
        if (eventType === 'click') {
          const feature = event.feature;
          const extraData = {
            features: event.features || [],
            pixel: event.pixel
          };
          
          // 应用点击类型过滤
          if (options?.clickType && feature) {
            const geometryType = feature.getGeometry()?.getType();
            const clickTypeMap = {
              point: ['Point', 'MultiPoint'],
              line: ['LineString', 'MultiLineString'],
              polygon: ['Polygon', 'MultiPolygon']
            };
            
            if (geometryType && !clickTypeMap[options.clickType].includes(geometryType)) {
              return; // 不符合点击类型过滤条件
            }
          }
          
          callback(feature, extraData);
        } else if (eventType === 'moveend') {
          callback(event.zoom);
        } else if (eventType === 'hover') {
          callback({
            features: event.features || [],
            pixel: event.pixel
          });
        }
      } catch (error) {
        this.errorHandler.createAndHandleError(
          `Error in event callback: ${error}`,
          ErrorType.COMPONENT_ERROR,
          { eventType, event, error }
        );
      }
    };

    return this.eventManager.on(mapEventType, eventCallback, {
      once: options?.once,
      filter: options?.filter
    });
  }

  /**
   * 转换事件类型
   * @private
   */
  private convertToMapEventType(eventType: EventType): MapEventType {
    const typeMap: Record<EventType, MapEventType> = {
      'click': 'click',
      'hover': 'hover',
      'moveend': 'moveend'
    };
    
    return typeMap[eventType] || 'click';
  }

  /**
   * 移除事件监听器
   * @param listenerId 监听器ID
   * @returns 是否成功移除
   */
  removeEventListener(listenerId: string): boolean {
    try {
      return this.eventManager.off(listenerId);
    } catch (error) {
      this.errorHandler.createAndHandleError(
        `Failed to remove event listener: ${error}`,
        ErrorType.COMPONENT_ERROR,
        { listenerId, error }
      );
      return false;
    }
  }

  /**
   * 移除指定类型的所有事件监听器
   * @param eventType 事件类型
   */
  removeAllEventListeners(eventType?: EventType): void {
    try {
      if (eventType) {
        const mapEventType = this.convertToMapEventType(eventType);
        this.eventManager.offAll(mapEventType);
      } else {
        this.eventManager.clear();
      }
    } catch (error) {
      this.errorHandler.createAndHandleError(
        `Failed to remove event listeners: ${error}`,
        ErrorType.COMPONENT_ERROR,
        { eventType, error }
      );
    }
  }

  /**
   * 获取事件监听器信息
   * @returns 监听器信息数组
   */
  getEventListenersInfo(): Array<{
    id: string;
    type: MapEventType;
    hasFilter: boolean;
    isOnce: boolean;
  }> {
    try {
      return this.eventManager.getListenersInfo();
    } catch (error) {
      this.errorHandler.createAndHandleError(
        `Failed to get event listeners info: ${error}`,
        ErrorType.COMPONENT_ERROR,
        { error }
      );
      return [];
    }
  }

  /**
   * 获取 EventManager 实例
   * @returns EventManager 实例
   */
  getEventManager(): EventManager {
    return this.eventManager;
  }

  /**
   * 销毁资源
   */
  destroy(): void {
    try {
      this.eventManager.clear();
      console.debug('MapTools destroyed successfully');
    } catch (error) {
      this.errorHandler.createAndHandleError(
        `Failed to destroy MapTools: ${error}`,
        ErrorType.COMPONENT_ERROR,
        { error }
      );
    }
  }
}
