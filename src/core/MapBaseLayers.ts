/**
 * 地图底图图层管理类
 * 提供天地图底图、注记图层、GeoServer图层等功能
 * 支持图层切换、裁剪等高级功能
 */

import Map from "ol/Map";
import { Tile as TileLayer } from "ol/layer";
import { get as getProjection, Projection } from "ol/proj";
import { getTopLeft, getWidth } from "ol/extent";
import { TileWMS } from "ol/source";
import WMTSTileGrid from "ol/tilegrid/WMTS";
import XYZ from "ol/source/XYZ";
import BaseLayer from "ol/layer/Base";
import MapTools from "./MapTools";
import { ErrorHandler, ErrorType } from "../utils/ErrorHandler";
import { MapLayersOptions, TiandituType, AnnotationLayerOptions, MapLayers, AnnotationType } from "../types";
import { ValidationUtils } from "../utils/ValidationUtils";

/**
 * 天地图服务器配置
 */
const TIANDITU_CONFIG = {
  BASE_URL: '//t{0-7}.tianditu.gov.cn/DataServer',
  PROJECTION: 'EPSG:4326',
  DEFAULT_ZINDEX: 9,
  ANNOTATION_ZINDEX_OFFSET: 10
} as const;

const TIANDITU_TYPES = ['vec_c', 'img_c', 'ter_c']

/**
 * GeoServer图层选项接口
 */
interface GeoServerLayerOptions {
  /** 图层层级 */
  zIndex?: number;
  /** 图层可见性 */
  visible?: boolean;
  /** WMS版本 */
  version?: '1.1.1' | '1.3.0';
  /** 服务器类型 */
  serverType?: string;
  /** 跨域设置 */
  crossOrigin?: string;
  /** WMS参数 */
  params?: Record<string, any>;
}

/**
 * 天地图图层选项接口
 */
interface TiandituLayerOptions {
  /** 图层类型 */
  type: TiandituType | string;
  /** 天地图token */
  token: string;
  /** 图层层级 */
  zIndex: number;
  /** 图层可见性 */
  visible: boolean;
}


/**
 * 地图底图图层管理类
 */
export default class MapBaseLayers {
  private readonly map: Map;
  private readonly options: MapLayersOptions;
  private layers: MapLayers = {};
  private readonly errorHandler: ErrorHandler;
  private currentBaseLayerType: string | null = null;
  private currentAnnotationLayer: TileLayer<XYZ> | null = null;
  private currentAnnotationType: string | null = null;

  /**
   * 构造函数
   * @param map OpenLayers地图实例
   * @param options 图层配置选项
   */
  constructor(map: Map, options: MapLayersOptions) {
    this.errorHandler = ErrorHandler.getInstance();

    try {
      // 参数验证
      this.validateConstructorParams(map, options);

      this.map = map;
      this.options = this.mergeDefaultOptions(options);

      // 初始化图层
      this.initializeLayers();

      if (this.layers && Object.keys(this.layers).length > 0) {
        this.addMapLayer();
        const firstLayerType = Object.keys(this.layers)[0];
        this.switchBaseLayer(firstLayerType);
      }

    } catch (error) {
      this.errorHandler.createAndHandleError(
        `Failed to initialize MapBaseLayers: ${ error }`,
        ErrorType.MAP_ERROR,
        { map, options, error }
      );
      throw error;
    }
  }

  /**
   * 验证构造函数参数
   * @param map 地图实例
   * @param options 配置选项
   * @private
   */
  private validateConstructorParams(map: Map, options: MapLayersOptions): void {
    ValidationUtils.validateMap(map);
    ValidationUtils.validateOptions(options);
  }

  /**
   * 合并默认配置选项
   * @param options 用户配置选项
   * @returns 合并后的配置选项
   * @private
   */
  private mergeDefaultOptions(options: MapLayersOptions): MapLayersOptions {
    const defaultOptions: MapLayersOptions = {
      zIndex: TIANDITU_CONFIG.DEFAULT_ZINDEX,
      annotation: false,
      mapClip: false,
      mapClipData: undefined,
    };

    return { ...defaultOptions, ...options };
  }

  /**
   * 初始化图层
   * @private
   */
  private initializeLayers(): void {
    // 如果没有配置底图，则默认使用天地图底图
    if (!Array.isArray(this.options.layers)) {
      this.layers = this.options.layers || {};
      if (this.options.token) {
        this.initTiandituLayers();
      }
    }
    // 添加注记图层
    if (this.options.annotation) {
      if (!this.options.token) {
        throw new Error('请配置token后才能使用天地图注记');
      }
      const { token, zIndex = TIANDITU_CONFIG.DEFAULT_ZINDEX } = this.options;
      this.loadDefaultAnnotationLayer(token, zIndex);
    }
  }

  /**
   * 初始化天地图图层
   * @private
   */
  private initTiandituLayers(): void {
    if (!this.options.token) {
      throw new Error('Token is required for Tianditu layers');
    }

    const { token, zIndex = TIANDITU_CONFIG.DEFAULT_ZINDEX } = this.options;

    try {
      // 创建基础图层
      this.layers.vec_c = [this.createTiandituLayer({ type: 'vec_c', token, zIndex, visible: false })];
      this.layers.img_c = [this.createTiandituLayer({ type: 'img_c', token, zIndex, visible: false })];
      this.layers.ter_c = [this.createTiandituLayer({ type: 'ter_c', token, zIndex, visible: false })];
    } catch (error) {
      this.errorHandler.createAndHandleError(
        `Failed to initialize Tianditu layers: ${ error }`,
        ErrorType.LAYER_ERROR,
        { token, zIndex, error }
      );
      throw error;
    }
  }

  /**
   * 加载默认注记图层（cia_c）
   * @param token 天地图token
   * @param baseZIndex 基础层级
   * @private
   */
  private loadDefaultAnnotationLayer(token: string, baseZIndex: number): void {
    this.setAnnotationLayer('cia_c', token, baseZIndex);
  }

  /**
   * 切换注记类别
   * @param annotationType 注记类型 ('cva_c' | 'cia_c' | 'cta_c')
   */
  switchAnnotationLayer(annotationType: AnnotationType): void {
    try {
      if (!this.options.token) {
        throw new Error('Token is required for annotation layer');
      }

      if (!this.options.annotation) {
        throw new Error('Annotation is not enabled in options');
      }

      const baseZIndex = this.options.zIndex ?? TIANDITU_CONFIG.DEFAULT_ZINDEX;
      this.setAnnotationLayer(annotationType, this.options.token, baseZIndex);

    } catch (error) {
      this.errorHandler.createAndHandleError(
        `Failed to switch annotation layer to '${ annotationType }': ${ error }`,
        ErrorType.LAYER_ERROR,
        { annotationType, error }
      );
    }
  }

  /**
   * 设置注记图层（私有方法，用于消除代码重复）
   * @param annotationType 注记类型
   * @param token 天地图token
   * @param baseZIndex 基础层级
   * @private
   */
  private setAnnotationLayer(annotationType: 'cva_c' | 'cia_c' | 'cta_c', token: string, baseZIndex: number): void {
    // 移除当前注记图层
    if (this.currentAnnotationLayer) {
      this.map.removeLayer(this.currentAnnotationLayer);
    }

    // 创建新的注记图层，确保层级在基本图层之上
    const annotationZIndex = baseZIndex + TIANDITU_CONFIG.ANNOTATION_ZINDEX_OFFSET;

    let annotationLayer = this.createAnnotationLayer({
      type: annotationType,
      token,
      zIndex: annotationZIndex,
      visible: true
    });

    // 应用剪切处理
    annotationLayer = this.processLayer(annotationLayer) as TileLayer<XYZ>;

    this.currentAnnotationLayer = annotationLayer;
    this.currentAnnotationType = annotationType;
    this.map.addLayer(this.currentAnnotationLayer);
  }

  /**
   * 获取当前注记类型
   * @returns 当前注记类型
   */
  getCurrentAnnotationType(): string | null {
    return this.currentAnnotationType;
  }

  /**
   * 显示/隐藏注记图层
   * @param visible 是否可见
   */
  setAnnotationVisible(visible: boolean): void {
    if (this.currentAnnotationLayer) {
      this.currentAnnotationLayer.setVisible(visible);
    }
  }

  /**
   * 检查注记图层是否可见
   * @returns 是否可见
   */
  isAnnotationVisible(): boolean {
    return this.currentAnnotationLayer ? this.currentAnnotationLayer.getVisible() : false;
  }

  /**
   * 切换底图图层
   * @param type 图层类型
   */
  switchBaseLayer(type: TiandituType | string): void {
    try {
      if (Array.isArray(this.options.layers)) {
        this.errorHandler.createAndHandleError(
          '需要按照键值对的方式配置底图才可使用切换底图功能',
          ErrorType.LAYER_ERROR,
          { layersType: 'array', requestedType: type }
        );
        return;
      }

      if (TIANDITU_TYPES.includes(type) && !this.options.token) {
        this.errorHandler.createAndHandleError(
          '请配置token后才能使用天地图底图',
          ErrorType.LAYER_ERROR,
          { requestedType: type }
        );
        return;
      }

      if (!this.layers[type]) {
        this.errorHandler.createAndHandleError(
          `图层类型 '${ type }' 不存在`,
          ErrorType.LAYER_ERROR,
          { availableTypes: Object.keys(this.layers), requestedType: type }
        );
        return;
      }

      // 隐藏所有图层
      for (const key in this.layers) {
        this.layers[key]?.forEach((layer: BaseLayer) => {
          layer.setVisible(false);
        });
      }

      // 显示指定类型的图层
      this.layers[type]?.forEach((layer: BaseLayer) => {
        layer.setVisible(true);
      });

      this.currentBaseLayerType = type;

      // 如果存在注记图层，更新其层级确保在新的基本图层之上
      if (this.currentAnnotationLayer && this.currentAnnotationType) {
        const baseZIndex = this.options.zIndex ?? TIANDITU_CONFIG.DEFAULT_ZINDEX;
        const annotationZIndex = baseZIndex + TIANDITU_CONFIG.ANNOTATION_ZINDEX_OFFSET;
        this.currentAnnotationLayer.setZIndex(annotationZIndex);
      }

    } catch (error) {
      this.errorHandler.createAndHandleError(
        `Failed to switch base layer to '${ type }': ${ error }`,
        ErrorType.LAYER_ERROR,
        { type, error }
      );
    }
  }

  /**
   * 获取当前底图类型
   * @returns 当前底图类型
   */
  getCurrentBaseLayerType(): string | null {
    return this.currentBaseLayerType;
  }

  /**
   * 获取可用的图层类型列表
   * @returns 图层类型数组
   */
  getAvailableLayerTypes(): string[] {
    return Object.keys(this.layers);
  }

  /**
   * 检查指定图层类型是否存在
   * @param type 图层类型
   * @returns 是否存在
   */
  hasLayerType(type: string): boolean {
    return type in this.layers && this.layers[type] !== undefined;
  }

  /**
   * 添加注记图层（实例方法）
   * @param options 注记图层选项（不包含token）
   * @returns 创建的图层
   */
  addAnnotationLayer(options: Omit<AnnotationLayerOptions, 'token'>): TileLayer<XYZ> {
    try {
      if (!this.options.token) {
        throw new Error('Token is required for annotation layer');
      }

      return MapBaseLayers.addAnnotationLayer(this.map, {
        ...options,
        token: this.options.token
      });
    } catch (error) {
      this.errorHandler.createAndHandleError(
        `Failed to add annotation layer: ${ error }`,
        ErrorType.LAYER_ERROR,
        { options, error }
      );
      throw error;
    }
  }

  /**
   * 添加注记图层（静态方法）
   * @param map 地图实例
   * @param options 注记图层选项
   * @returns 创建的图层
   */
  static addAnnotationLayer(map: Map, options: AnnotationLayerOptions): TileLayer<XYZ> {
    try {
      ErrorHandler.validateMap(map);

      if (!options.token) {
        throw new Error('Token is required for annotation layer');
      }

      const layer = MapBaseLayers.createAnnotationLayer({
        type: options.type,
        token: options.token,
        zIndex: options.zIndex ?? TIANDITU_CONFIG.DEFAULT_ZINDEX,
        visible: options.visible ?? true
      });

      map.addLayer(layer);
      return layer;
    } catch (error) {
      const errorHandler = ErrorHandler.getInstance();
      errorHandler.createAndHandleError(
        `Failed to add annotation layer: ${ error }`,
        ErrorType.LAYER_ERROR,
        { options, error }
      );
      throw error;
    }
  }

  /**
   * 将所有图层添加到地图
   * @private
   */
  private addMapLayer(): void {
    try {
      if (!this.layers || Object.keys(this.layers).length === 0) {
        return;
      }

      for (const key in this.layers) {
        this.layers[key]?.forEach((layer: BaseLayer) => {
          const processedLayer = this.processLayer(layer);
          this.map.addLayer(processedLayer);
        });
      }
    } catch (error) {
      this.errorHandler.createAndHandleError(
        `Failed to add map layers: ${ error }`,
        ErrorType.LAYER_ERROR,
        { layersCount: Object.keys(this.layers).length, error }
      );
      throw error;
    }
  }

  /**
   * 处理图层（应用裁剪等）
   * @param layer 原始图层
   * @returns 处理后的图层
   * @private
   */
  private processLayer(layer: BaseLayer): BaseLayer {
    try {
      let processedLayer = layer;

      if (this.options.mapClip && this.options.mapClipData) {
        processedLayer = MapTools.setMapClip(layer, this.options.mapClipData);
      }

      return processedLayer;
    } catch (error) {
      this.errorHandler.createAndHandleError(
        `Failed to process layer: ${ error }`,
        ErrorType.LAYER_ERROR,
        { hasMapClip: !!this.options.mapClip, hasMapClipData: !!this.options.mapClipData, error }
      );
      throw error;
    }
  }

  /**
   * 添加GeoServer图层
   * @param url GeoServer服务URL
   * @param layerName 图层名称
   * @param options 图层选项
   * @returns 创建的WMS图层
   */
  addGeoServerLayer(url: string, layerName: string, options: GeoServerLayerOptions = {}): TileLayer<TileWMS> {
    try {
      ValidationUtils.validateNonEmptyString(url, 'Valid URL is required for GeoServer layer');
      ValidationUtils.validateNonEmptyString(layerName, 'Valid layer name is required for GeoServer layer');

      const wmsLayer = new TileLayer({
        source: new TileWMS({
          url: url,
          params: {
            'LAYERS': layerName,
            'TILED': true,
            'VERSION': options.version || '1.1.1',
            ...options.params
          },
          serverType: 'geoserver',
          crossOrigin: options.crossOrigin || 'anonymous',
        }),
        zIndex: options.zIndex ?? TIANDITU_CONFIG.DEFAULT_ZINDEX,
        visible: options.visible ?? true,
      });

      this.map.addLayer(wmsLayer);
      return wmsLayer;
    } catch (error) {
      this.errorHandler.createAndHandleError(
        `Failed to add GeoServer layer: ${ error }`,
        ErrorType.LAYER_ERROR,
        { url, layerName, options, error }
      );
      throw error;
    }
  }


  /**
   * 创建天地图图层（实例方法）
   * @param options 天地图图层选项
   * @returns 创建的图层
   * @private
   */
  private createTiandituLayer(options: TiandituLayerOptions): TileLayer<XYZ> {
    return MapBaseLayers.getTiandiTuLayer(options);
  }

  /**
   * 创建注记图层（实例方法）
   * @param options 注记图层选项
   * @returns 创建的图层
   * @private
   */
  private createAnnotationLayer(options: AnnotationLayerOptions): TileLayer<XYZ> {
    return MapBaseLayers.createAnnotationLayer(options);
  }

  /**
   * 创建天地图底图图层（静态方法）
   * @param options 天地图图层选项
   * @returns 创建的图层
   */
  static getTiandiTuLayer(options: TiandituLayerOptions): TileLayer<XYZ> {
    try {
      if (!options.token) {
        throw new Error('Token is required for Tianditu layer');
      }

      if (!options.type) {
        throw new Error('Layer type is required for Tianditu layer');
      }

      return new TileLayer({
        source: new XYZ({
          url: `//t{0-7}.tianditu.gov.cn/DataServer?T=${ options.type }&tk=${ options.token }&x={x}&y={y}&l={z}`,
          projection: 'EPSG:4326'
        }),
        zIndex: options.zIndex ?? TIANDITU_CONFIG.DEFAULT_ZINDEX,
        visible: options.visible ?? false
      });
    } catch (error) {
      const errorHandler = ErrorHandler.getInstance();
      errorHandler.createAndHandleError(
        `Failed to create Tianditu layer: ${ error }`,
        ErrorType.LAYER_ERROR,
        { options, error }
      );
      throw error;
    }
  }

  /**
   * 创建天地图注记图层（静态方法）
   * @param options 注记图层选项
   * @returns 创建的图层
   */
  static createAnnotationLayer(options: AnnotationLayerOptions): TileLayer<XYZ> {
    try {
      if (!options.token) {
        throw new Error('Token is required for annotation layer');
      }

      if (!options.type) {
        throw new Error('Annotation type is required for annotation layer');
      }

      return new TileLayer({
        source: new XYZ({
          url: `//t{0-7}.tianditu.gov.cn/DataServer?T=${ options.type }&tk=${ options.token }&x={x}&y={y}&l={z}`,
          projection: 'EPSG:4326'
        }),
        zIndex: options.zIndex ?? TIANDITU_CONFIG.DEFAULT_ZINDEX,
        visible: options.visible ?? false
      });
    } catch (error) {
      const errorHandler = ErrorHandler.getInstance();
      errorHandler.createAndHandleError(
        `Failed to create annotation layer: ${ error }`,
        ErrorType.LAYER_ERROR,
        { options, error }
      );
      throw error;
    }
  }

  /**
   * 获取天地图注记图层（向后兼容的静态方法）
   * @param options 注记图层选项
   * @returns 创建的图层
   * @deprecated 使用 createAnnotationLayer 替代
   */
  static getAnnotationLayer(options: AnnotationLayerOptions): TileLayer<XYZ> {
    return MapBaseLayers.createAnnotationLayer(options);
  }

  /**
   * 创建WMTS瓦片网格
   * @param length 层级数量
   * @returns WMTS瓦片网格
   */
  static getTileGrid(length: number): WMTSTileGrid {
    try {
      ValidationUtils.validatePositiveNumber(length, 'Valid length is required for tile grid');

      const projection: Projection = getProjection('EPSG:4326') as Projection;
      if (!projection) {
        throw new Error('Failed to get EPSG:4326 projection');
      }

      const projectionExtent = projection.getExtent();
      const size = getWidth(projectionExtent) / 256;
      const resolutions = new Array(length);
      const matrixIds = new Array(length);

      for (let i = 0; i < length; i += 1) {
        const pow = Math.pow(2, i);
        resolutions[i] = size / pow;
        matrixIds[i] = i;
      }

      return new WMTSTileGrid({
        origin: getTopLeft(projectionExtent),
        resolutions,
        matrixIds
      });
    } catch (error) {
      const errorHandler = ErrorHandler.getInstance();
      errorHandler.createAndHandleError(
        `Failed to create tile grid: ${ error }`,
        ErrorType.MAP_ERROR,
        { length, error }
      );
      throw error;
    }
  }

  /**
   * 移除指定类型的图层
   * @param type 图层类型
   */
  removeLayersByType(type: string): void {
    try {
      if (!this.layers[type]) {
        return;
      }

      this.layers[type].forEach((layer: BaseLayer) => {
        this.map.removeLayer(layer);
      });

      delete this.layers[type];

      if (this.currentBaseLayerType === type) {
        this.currentBaseLayerType = null;
      }
    } catch (error) {
      this.errorHandler.createAndHandleError(
        `Failed to remove layers of type '${ type }': ${ error }`,
        ErrorType.LAYER_ERROR,
        { type, error }
      );
    }
  }

  /**
   * 清除所有图层
   */
  clearAllLayers(): void {
    try {
      for (const key in this.layers) {
        this.layers[key]?.forEach((layer: BaseLayer) => {
          this.map.removeLayer(layer);
        });
      }

      // 清除注记图层
      if (this.currentAnnotationLayer) {
        this.map.removeLayer(this.currentAnnotationLayer);
        this.currentAnnotationLayer = null;
        this.currentAnnotationType = null;
      }

      this.layers = {};
      this.currentBaseLayerType = null;
    } catch (error) {
      this.errorHandler.createAndHandleError(
        `Failed to clear all layers: ${ error }`,
        ErrorType.LAYER_ERROR,
        { error }
      );
    }
  }

  /**
   * 获取图层数量统计
   * @returns 图层统计信息
   */
  getLayerStats(): { totalTypes: number; totalLayers: number; layersByType: Record<string, number> } {
    const layersByType: Record<string, number> = {};
    let totalLayers = 0;

    for (const key in this.layers) {
      const count = this.layers[key]?.length || 0;
      layersByType[key] = count;
      totalLayers += count;
    }

    return {
      totalTypes: Object.keys(this.layers).length,
      totalLayers,
      layersByType
    };
  }

  /**
   * 销毁实例，清理资源
   */
  destroy(): void {
    try {
      this.clearAllLayers();
    } catch (error) {
      this.errorHandler.createAndHandleError(
        `Failed to destroy MapBaseLayers: ${ error }`,
        ErrorType.MAP_ERROR,
        { error }
      );
    }
  }
}
