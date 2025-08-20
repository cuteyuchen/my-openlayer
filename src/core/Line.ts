import Map from "ol/Map";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import VectorLayer from "ol/layer/Vector";
import { Fill, Stroke, Style, Text } from "ol/style";
import { Feature } from "ol";
import { FeatureLike } from "ol/Feature";
import { LineOptions, MapJSONData } from "../types";
import MapTools from "./MapTools";
import { ValidationUtils } from "../utils/ValidationUtils";
import { EventManager } from "./EventManager";


/**
 * 河流级别宽度映射配置
 */
interface RiverLevelWidthMap {
  [level: number]: number;
}

/**
 * 河流图层配置选项
 */
interface RiverLayerOptions extends LineOptions {
  /** 河流级别数量，默认为5 */
  levelCount?: number;
  /** 缩放级别偏移量，默认为8 */
  zoomOffset?: number;
  /** 河流级别宽度映射 */
  levelWidthMap?: RiverLevelWidthMap;
  /** 是否删除同名图层 */
  removeExisting?: boolean;
}

/**
 * 线要素管理类
 * 用于在地图上添加和管理线要素，包括普通线要素、河流图层等
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
  
  /** 事件管理器实例 */
  private readonly eventManager: EventManager;
  
  /** 河流图层列表 */
  private riverLayerList: VectorLayer<VectorSource>[] = [];
  
  /** 河流图层显示状态 */
  private riverLayerShow: boolean = false;
  
  /** 默认河流级别宽度映射 */
  private readonly defaultLevelWidthMap: RiverLevelWidthMap = {
    1: 2,
    2: 1,
    3: 0.5,
    4: 0.5,
    5: 0.5
  };

  /**
   * 构造函数
   * @param map OpenLayers地图实例
   */
  constructor(map: Map) {
    ValidationUtils.validateMapInstance(map);
    this.map = map;
    this.eventManager = new EventManager(map);
  }

  /**
   * 添加线要素
   * @param data GeoJSON格式的线数据
   * @param options 配置项
   * @returns 创建的矢量图层
   */
  addLine(data: MapJSONData, options: LineOptions = {}): VectorLayer<VectorSource> {
    ValidationUtils.validateGeoJSONData(data);

    const defaultOptions = {
      type: 'line',
      strokeColor: 'rgba(3, 122, 255, 1)',
      strokeWidth: 2,
      visible: true,
      zIndex: 15,
      layerName: options.layerName || 'lineLayer'
    };

    const mergedOptions = { ...defaultOptions, ...options };

    const features = new GeoJSON().readFeatures(data, options.projectionOptOptions);
    
    const layer = new VectorLayer({
      properties: {
        name: mergedOptions.layerName,
        layerName: mergedOptions.layerName
      },
      source: new VectorSource({ features }),
      style: (feature: FeatureLike) => {
        if (feature instanceof Feature) {
          feature.set('type', mergedOptions.type);
          feature.set('layerName', mergedOptions.type);
        }
        return new Style({
          stroke: new Stroke({
            color: mergedOptions.strokeColor,
            width: mergedOptions.strokeWidth,
            lineDash: mergedOptions.lineDash,
            lineDashOffset: mergedOptions.lineDashOffset
          })
        });
      },
      zIndex: mergedOptions.zIndex
    });

    layer.setVisible(mergedOptions.visible);
    this.map.addLayer(layer);
    
    return layer;
  }



  /**
   * 添加分级河流图层，根据缩放级别显示不同级别的河流
   * @param fyRiverJson 河流 GeoJSON 数据
   * @param options 河流图层配置选项
   * @throws {Error} 当数据格式无效时抛出错误
   */
  addRiverLayersByZoom(fyRiverJson: MapJSONData, options: RiverLayerOptions = {}): void {
    ValidationUtils.validateGeoJSONData(fyRiverJson);

    const defaultOptions = {
      type: 'river',
      levelCount: 5,
      zoomOffset: 8,
      strokeColor: 'rgb(0,113,255)',
      strokeWidth: 3,
      visible: true,
      zIndex: 15,
      layerName: 'riverLayer',
      removeExisting: options.removeExisting ?? false,
      levelWidthMap: this.defaultLevelWidthMap
    };

    const mergedOptions = { ...defaultOptions, ...options };

    // 清除现有河流图层
    if (mergedOptions.removeExisting) {
      this.clearRiverLayers();
    }

    this.riverLayerShow = mergedOptions.visible;
    this.riverLayerList = [];

    // 创建分级河流图层
    for (let level = 1; level <= mergedOptions.levelCount; level++) {
      const vectorSource = new VectorSource({
        format: new GeoJSON(),
        loader: () => {
          const geojson = new GeoJSON();
          fyRiverJson.features.forEach((feature: any) => {
            if (feature.properties && feature.properties.level === level) {
              try {
                const olFeature = geojson.readFeature(feature);
                if (Array.isArray(olFeature)) {
                  vectorSource.addFeatures(olFeature);
                } else {
                  vectorSource.addFeature(olFeature);
                }
              } catch (error) {
                console.warn(`Failed to load river feature at level ${level}:`, error);
              }
            }
          });
        }
      });

      const riverLayer = new VectorLayer({
        properties: {
          name: mergedOptions.layerName,
          layerName: mergedOptions.layerName,
          riverLevel: level
        },
        source: vectorSource,
        style: (feature: FeatureLike) => {
          if (feature instanceof Feature) {
            feature.set('type', mergedOptions.layerName);
            feature.set('layerName', mergedOptions.layerName);
          }
          return new Style({
            stroke: new Stroke({
              color: mergedOptions.strokeColor,
              width: mergedOptions.strokeWidth
            })
          });
        },
        zIndex: mergedOptions.zIndex
      });

      riverLayer.setVisible(false);
      this.riverLayerList.push(riverLayer);
      this.map.addLayer(riverLayer);
    }

    // 设置缩放事件监听
    this.eventManager.on('moveend', () => {
      this.showRiverLayerByZoom();
    });

    // 初始显示
    this.showRiverLayerByZoom();
  }



  /**
   * 显示或隐藏河流图层
   * @param show 是否显示河流图层
   */
  showRiverLayer(show: boolean): void {
    this.riverLayerShow = show;
    this.showRiverLayerByZoom();
  }

  /**
   * 根据缩放级别显示对应的河流图层
   * 缩放级别越高，显示的河流级别越详细
   */
  showRiverLayerByZoom(): void {
    const zoom = this.map.getView().getZoom();
    
    if (!zoom) {
      return;
    }

    this.riverLayerList.forEach((layer: VectorLayer<VectorSource>, index: number) => {
      // 计算显示阈值：级别索引 + 1（因为level从1开始）+ 缩放偏移量（默认8）
      const displayThreshold = index + 1 + 8;
      
      if (zoom > displayThreshold) {
        layer.setVisible(this.riverLayerShow);
      } else {
        layer.setVisible(false);
      }
    });
  }

  /**
   * 添加按级别显示不同宽度的河流图层
   * @param data 河流 GeoJSON 数据
   * @param options 河流图层配置选项
   * @returns 创建的河流图层
   */
  addRiverWidthByLevel(data: MapJSONData, options: RiverLayerOptions = {}): VectorLayer<VectorSource> {
    ValidationUtils.validateGeoJSONData(data);
    
    // 合并默认配置
    const mergedOptions = {
      type: 'river',
      layerName: 'river',
      strokeColor: 'rgba(3, 122, 255, 1)',
      strokeWidth: 2,
      visible: true,
      zIndex: 15,
      levelWidthMap: this.defaultLevelWidthMap,
      removeExisting: options.removeExisting ?? false,
      ...options
    };

    // 移除同名图层（如果存在）
    if (mergedOptions.removeExisting && mergedOptions.layerName) {
      MapTools.removeLayer(this.map, mergedOptions.layerName);
    }

    // 解析 GeoJSON 数据
    const features = new GeoJSON().readFeatures(data, options.projectionOptOptions);

    // 创建河流图层
    const riverLayer = new VectorLayer({
      properties: {
        name: mergedOptions.layerName,
        layerName: mergedOptions.layerName
      },
      source: new VectorSource({ features }),
      style: (feature: FeatureLike) => {
        const level = feature.get('level');
        const levelWidth = mergedOptions.levelWidthMap[Number(level)] || 1;
        return new Style({
          stroke: new Stroke({
            color: mergedOptions.strokeColor,
            width: levelWidth
          })
        });
      },
      zIndex: mergedOptions.zIndex
    });

    riverLayer.setVisible(mergedOptions.visible);
    this.map.addLayer(riverLayer);
    
    return riverLayer;
  }



  /**
   * 移除线图层
   * @param layerName 图层名称
   */
  removeLineLayer(layerName: string): void {
    ValidationUtils.validateLayerName(layerName);
    MapTools.removeLayer(this.map, layerName);
  }

  /**
   * 清除所有河流图层
   */
  clearRiverLayers(): void {
    this.riverLayerList.forEach(layer => {
      this.map.removeLayer(layer);
    });
    
    this.riverLayerList = [];
    this.riverLayerShow = false;
  }

  /**
   * 获取河流图层显示状态
   * @returns 河流图层是否显示
   */
  getRiverLayerVisibility(): boolean {
    return this.riverLayerShow;
  }

  /**
   * 获取河流图层列表
   * @returns 河流图层数组的副本
   */
  getRiverLayers(): VectorLayer<VectorSource>[] {
    return [...this.riverLayerList];
  }

  /**
   * 销毁线管理器，清理所有资源
   */
  destroy(): void {
    // 清除所有河流图层
    this.clearRiverLayers();
  }
}
