"use strict";

import Map from "ol/Map";
import { MapJSONData } from "../types";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
// import { Fill, Style } from "ol/style";
// import { getVectorContext } from "ol/render";
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
   * 使用 Canvas clip 实现裁剪，支持多个闭合区域
   * 注意：此方法会修改 baseLayer 的 prerender 和 postrender 事件
   */
  static setMapClip(baseLayer: any, data: MapJSONData) {
    const features = new GeoJSON().readFeatures(data);

    baseLayer.on("prerender", (event: any) => {
      const ctx = event.context;
      // 获取坐标转换矩阵 (pixel = coordinate * transform)
      // 注意：OpenLayers 的 transform 可能包含 pixelRatio，也可能不包含，取决于版本
      // 在现代版本中，event.frameState.coordinateToPixelTransform 通常用于将地理坐标转换为 Canvas 像素坐标
      const transform = event.frameState.coordinateToPixelTransform;
      
      ctx.save();
      ctx.beginPath();

      features.forEach((feature: any) => {
        const geometry = feature.getGeometry();
        if (!geometry) return;

        const type = geometry.getType();
        const coordinates = geometry.getCoordinates();

        // 辅助函数：绘制单个线性环
        const drawRing = (ringCoords: any[]) => {
          if (!ringCoords || ringCoords.length === 0) return;
          
          for (let i = 0; i < ringCoords.length; i++) {
            const coord = ringCoords[i];
            // 手动应用变换: pixelX = x * m0 + y * m1 + m4
            //               pixelY = x * m2 + y * m3 + m5
            // transform 数组结构: [m0, m1, m2, m3, m4, m5]
            const pixelX = coord[0] * transform[0] + coord[1] * transform[1] + transform[4];
            const pixelY = coord[0] * transform[2] + coord[1] * transform[3] + transform[5];
            
            if (i === 0) {
              ctx.moveTo(pixelX, pixelY);
            } else {
              ctx.lineTo(pixelX, pixelY);
            }
          }
          ctx.closePath();
        };

        if (type === 'MultiPolygon') {
          // MultiPolygon: [Polygon, Polygon] -> Polygon: [OuterRing, InnerRing, ...]
          coordinates.forEach((polygonCoords: any[]) => {
            polygonCoords.forEach((ringCoords: any[]) => {
              drawRing(ringCoords);
            });
          });
        } else if (type === 'Polygon') {
          // Polygon: [OuterRing, InnerRing, ...]
          coordinates.forEach((ringCoords: any[]) => {
            drawRing(ringCoords);
          });
        }
      });

      ctx.clip();
    });

    baseLayer.on("postrender", (event: any) => {
      const ctx = event.context;
      ctx.restore();
    });

    return baseLayer;
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
