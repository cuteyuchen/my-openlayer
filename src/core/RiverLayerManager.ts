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
import { EventManager } from "./EventManager";
import { ErrorHandler } from "../utils/ErrorHandler";
import { ConfigManager } from "./ConfigManager";

/**
 * 河流图层管理类
 * 用于创建与管理河流相关矢量图层（分级显示、按级别线宽、显示控制与清理）
 *
 * 注意：
 * - 分级显示依赖地图缩放级别（zoom），通过 zoomOffset 控制显示阈值偏移
 * - removeExisting 为 true 时，会清理本管理器创建的分级河流图层
 */
export interface RiverLevelWidthMap {
  [level: number]: number;
}

/**
 * 河流图层配置选项
 */
export interface RiverLayerOptions extends LineOptions {
  /** 河流级别数量，默认为 5 */
  levelCount?: number;
  /** 缩放级别偏移量，默认为 8 */
  zoomOffset?: number;
  /** 河流级别线宽映射，key 为 level，value 为线宽 */
  levelWidthMap?: RiverLevelWidthMap;
  /** 是否删除已有分级河流图层（本管理器创建的） */
  removeExisting?: boolean;
}

export default class RiverLayerManager {
  //************* 核心依赖：地图与事件 *************
  private readonly map: Map;
  private readonly eventManager: EventManager;

  //************* 状态：分级河流图层列表与显示控制 *************
  private riverLayerList: VectorLayer<VectorSource>[] = [];
  private riverLayerShow: boolean = false;
  private riverZoomOffset: number = 8;

  //************* 默认配置：按 level 映射线宽 *************
  private readonly defaultLevelWidthMap: RiverLevelWidthMap = ConfigManager.DEFAULT_RIVER_LEVEL_WIDTH_MAP;

  /**
   * 构造函数
   * @param map OpenLayers 地图实例
   * @param eventManager 可选事件管理器，未传入则内部创建
   */
  constructor(map: Map, eventManager?: EventManager) {
    ValidationUtils.validateMapInstance(map);
    this.map = map;
    this.eventManager = eventManager ?? new EventManager(map);
  }

  //************* 分级河流：按缩放级别显示（数据直传） *************
  /**
   * 添加分级河流图层：根据缩放级别显示不同 level 的河流
   * @param fyRiverJson 河流 GeoJSON 数据
   * @param options 河流图层配置选项
   */
  addRiverLayersByZoom(fyRiverJson: MapJSONData, options?: RiverLayerOptions): void;
  addRiverLayersByZoom(fyRiverJson: MapJSONData, options: RiverLayerOptions = {}): void {
    ValidationUtils.validateGeoJSONData(fyRiverJson);

    const defaultOptions = {
      ...ConfigManager.DEFAULT_RIVER_LAYERS_BY_ZOOM_OPTIONS,
      removeExisting: options.removeExisting ?? false,
      levelWidthMap: this.defaultLevelWidthMap
    };

    const mergedOptions = { ...defaultOptions, ...options };
    this.riverZoomOffset = mergedOptions.zoomOffset;

    if (mergedOptions.removeExisting) {
      this.clearRiverLayers();
    }

    this.riverLayerShow = mergedOptions.visible;
    this.riverLayerList = [];

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
                ErrorHandler.getInstance().warn(`Failed to load river feature at level ${level}:`, error);
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
            feature.set("type", mergedOptions.layerName);
            feature.set("layerName", mergedOptions.layerName);
          }

          if (mergedOptions.style) {
            if (typeof mergedOptions.style === "function") {
              return mergedOptions.style(feature);
            } else {
              return mergedOptions.style;
            }
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

    this.eventManager.on("moveend", () => {
      this.showRiverLayerByZoom();
    });

    this.showRiverLayerByZoom();
  }

  //************* 分级河流：按缩放级别显示（URL 加载） *************
  /**
   * 从 URL 添加分级河流图层：根据缩放级别显示不同 level 的河流
   * @param url 河流数据 URL（GeoJSON）
   * @param options 河流图层配置选项
   */
  addRiverLayersByZoomByUrl(url: string, options: RiverLayerOptions = {}): void {
    const defaultOptions = {
      ...ConfigManager.DEFAULT_RIVER_LAYERS_BY_ZOOM_OPTIONS,
      removeExisting: options.removeExisting ?? false,
      levelWidthMap: this.defaultLevelWidthMap
    };

    const mergedOptions = { ...defaultOptions, ...options };
    this.riverZoomOffset = mergedOptions.zoomOffset;

    if (mergedOptions.removeExisting) {
      this.clearRiverLayers();
    }

    this.riverLayerShow = mergedOptions.visible;
    this.riverLayerList = [];

    for (let level = 1; level <= mergedOptions.levelCount; level++) {
      const vectorSource = new VectorSource({
        url,
        format: new GeoJSON(),
        loader: function(extent, resolution, projection, success, failure) {
          fetch(url)
            .then(response => response.json())
            .then(data => {
              const geojson = new GeoJSON();
              data.features.forEach((feature: any) => {
                if (feature.properties && feature.properties.level === level) {
                  try {
                    const olFeature = geojson.readFeature(feature);
                    if (Array.isArray(olFeature)) {
                      vectorSource.addFeatures(olFeature);
                    } else {
                      vectorSource.addFeature(olFeature);
                    }
                  } catch (error) {
                    ErrorHandler.getInstance().warn(`Failed to load river feature at level ${level}:`, error);
                  }
                }
              });
              success?.(vectorSource.getFeatures());
            })
            .catch(error => {
              ErrorHandler.getInstance().error("Error loading river data:", error);
              failure?.();
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
            feature.set("type", mergedOptions.layerName);
            feature.set("layerName", mergedOptions.layerName);
          }

          if (mergedOptions.style) {
            if (typeof mergedOptions.style === "function") {
              return mergedOptions.style(feature);
            } else {
              return mergedOptions.style;
            }
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

    this.eventManager.on("moveend", () => {
      this.showRiverLayerByZoom();
    });

    this.showRiverLayerByZoom();
  }

  //************* 分级河流：显示控制 *************
  /**
   * 设置分级河流图层是否显示
   * @param show 是否显示
   */
  showRiverLayer(show: boolean): void {
    this.riverLayerShow = show;
    this.showRiverLayerByZoom();
  }

  /**
   * 根据当前 zoom 显示对应分级河流图层
   * 缩放越大，显示的 riverLevel 越多
   */
  showRiverLayerByZoom(): void {
    const zoom = this.map.getView().getZoom();

    if (!zoom) {
      return;
    }

    this.riverLayerList.forEach((layer: VectorLayer<VectorSource>, index: number) => {
      const displayThreshold = index + 1 + this.riverZoomOffset;

      if (zoom > displayThreshold) {
        layer.setVisible(this.riverLayerShow);
      } else {
        layer.setVisible(false);
      }
    });
  }

  //************* 河流线宽：按 level 设置不同宽度（数据直传） *************
  /**
   * 添加按级别显示不同宽度的河流图层
   * @param data 河流 GeoJSON 数据
   * @param options 河流图层配置选项
   */
  addRiverWidthByLevel(data: MapJSONData, options?: RiverLayerOptions): VectorLayer<VectorSource>;
  addRiverWidthByLevel(data: MapJSONData, options: RiverLayerOptions = {}): VectorLayer<VectorSource> {
    ValidationUtils.validateGeoJSONData(data);

    const mergedOptions = {
      ...ConfigManager.DEFAULT_RIVER_WIDTH_BY_LEVEL_OPTIONS,
      ...options,
      removeExisting: options.removeExisting ?? ConfigManager.DEFAULT_RIVER_WIDTH_BY_LEVEL_OPTIONS.removeExisting,
      levelWidthMap: options.levelWidthMap ?? this.defaultLevelWidthMap,
    };

    if (mergedOptions.removeExisting && mergedOptions.layerName) {
      MapTools.removeLayer(this.map, mergedOptions.layerName);
    }

    const features = new GeoJSON().readFeatures(data, mergedOptions.projectionOptOptions);

    const riverLayer = new VectorLayer({
      properties: {
        name: mergedOptions.layerName,
        layerName: mergedOptions.layerName
      },
      source: new VectorSource({ features }),
      style: (feature: FeatureLike) => {
        if (mergedOptions.style) {
          if (typeof mergedOptions.style === "function") {
            return mergedOptions.style(feature);
          } else {
            return mergedOptions.style;
          }
        }

        const level = feature.get("level");
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

  //************* 河流线宽：按 level 设置不同宽度（URL 加载） *************
  /**
   * 从 URL 添加按级别显示不同宽度的河流图层
   * @param url 河流数据 URL（GeoJSON）
   * @param options 河流图层配置选项
   */
  addRiverWidthByLevelByUrl(url: string, options: RiverLayerOptions = {}): VectorLayer<VectorSource> {
    const mergedOptions = {
      ...ConfigManager.DEFAULT_RIVER_WIDTH_BY_LEVEL_OPTIONS,
      ...options,
      removeExisting: options.removeExisting ?? ConfigManager.DEFAULT_RIVER_WIDTH_BY_LEVEL_OPTIONS.removeExisting,
      levelWidthMap: options.levelWidthMap ?? this.defaultLevelWidthMap,
    };

    if (mergedOptions.removeExisting && mergedOptions.layerName) {
      MapTools.removeLayer(this.map, mergedOptions.layerName);
    }

    const source = new VectorSource({
      url,
      format: new GeoJSON(options.projectionOptOptions)
    });

    const riverLayer = new VectorLayer({
      properties: {
        name: mergedOptions.layerName,
        layerName: mergedOptions.layerName
      },
      source,
      style: (feature: FeatureLike) => {
        if (mergedOptions.style) {
          if (typeof mergedOptions.style === "function") {
            return mergedOptions.style(feature);
          } else {
            return mergedOptions.style;
          }
        }

        const level = feature.get("level");
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

  //************* 清理与状态查询 *************
  /**
   * 清除本管理器创建的分级河流图层
   */
  clearRiverLayers(): void {
    this.riverLayerList.forEach(layer => {
      this.map.removeLayer(layer);
    });

    this.riverLayerList = [];
    this.riverLayerShow = false;
  }

  /**
   * 获取分级河流图层显示状态
   */
  getRiverLayerVisibility(): boolean {
    return this.riverLayerShow;
  }

  /**
   * 获取分级河流图层列表副本
   */
  getRiverLayers(): VectorLayer<VectorSource>[] {
    return [...this.riverLayerList];
  }

  /**
   * 销毁管理器，释放资源
   */
  destroy(): void {
    this.clearRiverLayers();
  }
}
