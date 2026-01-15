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
import { ConfigManager } from "./ConfigManager";

const TIANDITU_TYPES = ['vec_c', 'img_c', 'ter_c'];
const CUSTOM_LAYER_KEY = '__custom__';

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

  //************* Constructor & Initialization *************

  /**
   * 构造函数
   * @param map OpenLayers地图实例
   * @param options 图层配置选项
   */
  constructor(map: Map, options: MapLayersOptions) {
    this.errorHandler = ErrorHandler.getInstance();

    try {
      // 1. 参数验证
      this.validateConstructorParams(map, options);

      this.map = map;
      this.options = this.mergeDefaultOptions(options);

      // 2. 初始化图层列表（准备数据）
      this.initializeLayers();

      // 3. 将图层添加到地图（执行操作）
      this.addMapLayer();

      // 4. 设置初始状态
      this.setupInitialState();

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
   * @private
   */
  private validateConstructorParams(map: Map, options: MapLayersOptions): void {
    ValidationUtils.validateMap(map);
    ValidationUtils.validateOptions(options);
  }

  /**
   * 合并默认配置选项
   * @private
   */
  private mergeDefaultOptions(options: MapLayersOptions): MapLayersOptions {
    return { ...ConfigManager.DEFAULT_MAP_LAYERS_OPTIONS, ...options };
  }

  /**
   * 初始化图层数据结构
   * @private
   */
  private initializeLayers(): this {
    const { layers, token, annotation } = this.options;

    // 初始化底图配置
    if (Array.isArray(layers)) {
      this.layers = { [CUSTOM_LAYER_KEY]: layers };
    } else if (layers && Object.keys(layers).length > 0) {
      this.layers = layers;
    } else if (token) {
      // 如果没有提供layers但提供了token，则初始化标准天地图
      this.initTiandituLayers();
    } else {
      this.layers = {};
    }

    // 初始化注记配置
    if (annotation) {
      this.initAnnotationLayer();
    }

    return this;
  }

  /**
   * 初始化天地图图层
   * @private
   */
  private initTiandituLayers(): this {
    if (!this.options.token) {
      throw new Error('Token is required for Tianditu layers');
    }

    const { token, zIndex = ConfigManager.TIANDITU_CONFIG.DEFAULT_ZINDEX } = this.options;

    try {
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
    return this;
  }

  /**
   * 初始化注记图层
   * @private
   */
  private initAnnotationLayer(): void {
    if (!this.options.token) {
      throw new Error('请配置token后才能使用天地图注记');
    }
    const { token, zIndex = ConfigManager.TIANDITU_CONFIG.DEFAULT_ZINDEX } = this.options;
    this.loadDefaultAnnotationLayer(token, zIndex);
  }

  /**
   * 设置初始图层状态（默认显示的底图）
   * @private
   */
  private setupInitialState(): void {
    if (this.layers && Object.keys(this.layers).length > 0) {
      // 如果是自定义数组图层，默认已经添加并显示了（取决于配置）
      // 如果是键值对配置的图层（包括天地图），需要选择一个默认显示
      if (!Array.isArray(this.options.layers)) {
        const defaultType = this.getDefaultBaseLayerType();
        if (defaultType) {
          this.switchBaseLayer(defaultType);
        }
      }
    }
  }

  //************* Base Layer Management *************

  /**
   * 切换底图图层
   * @param type 图层类型
   */
  switchBaseLayer(type: TiandituType | string): this {
    try {
      if (!this.validateSwitchBaseLayer(type)) {
        return this;
      }

      // 1. 隐藏所有底图
      this.setAllBaseLayersVisible(false);

      // 2. 显示目标底图
      this.setLayerTypeVisible(type, true);

      // 3. 更新当前状态
      this.currentBaseLayerType = type;

      // 4. 调整注记图层层级（保持在底图之上）
      this.updateAnnotationLayerZIndex();

    } catch (error) {
      this.errorHandler.createAndHandleError(
        `Failed to switch base layer to '${ type }': ${ error }`,
        ErrorType.LAYER_ERROR,
        { type, error }
      );
    }
    return this;
  }

  /**
   * 验证是否可以切换到底图
   * @private
   */
  private validateSwitchBaseLayer(type: string): boolean {
    if (Array.isArray(this.options.layers)) {
      this.errorHandler.createAndHandleError(
        '需要按照键值对的方式配置底图才可使用切换底图功能',
        ErrorType.LAYER_ERROR,
        { layersType: 'array', requestedType: type }
      );
      return false;
    }

    if (TIANDITU_TYPES.includes(type) && !this.options.token) {
      this.errorHandler.createAndHandleError(
        '请配置token后才能使用天地图底图',
        ErrorType.LAYER_ERROR,
        { requestedType: type }
      );
      return false;
    }

    if (!this.layers[type]) {
      this.errorHandler.createAndHandleError(
        `图层类型 '${ type }' 不存在`,
        ErrorType.LAYER_ERROR,
        { availableTypes: Object.keys(this.layers), requestedType: type }
      );
      return false;
    }

    return true;
  }

  /**
   * 获取当前底图类型
   */
  getCurrentBaseLayerType(): string | null {
    return this.currentBaseLayerType;
  }

  /**
   * 获取默认底图类型
   * @private
   */
  private getDefaultBaseLayerType(): string | null {
    const types = Object.keys(this.layers);
    if (types.length === 0) return null;
    return this.layers.vec_c ? 'vec_c' : types[0];
  }

  /**
   * 设置所有底图的可见性
   * @private
   */
  private setAllBaseLayersVisible(visible: boolean): void {
    for (const key in this.layers) {
      this.setLayerTypeVisible(key, visible);
    }
  }

  /**
   * 设置指定类型图层的可见性
   * @private
   */
  private setLayerTypeVisible(type: string, visible: boolean): void {
    this.layers[type]?.forEach((layer: BaseLayer) => {
      layer.setVisible(visible);
    });
  }

  //************* Annotation Layer Management *************

  /**
   * 切换注记类别
   * @param annotationType 注记类型 ('cva_c' | 'cia_c' | 'cta_c')
   */
  switchAnnotationLayer(annotationType: AnnotationType): this {
    try {
      if (!this.options.token) {
        throw new Error('Token is required for annotation layer');
      }
      if (!this.options.annotation) {
        throw new Error('Annotation is not enabled in options');
      }

      const baseZIndex = this.options.zIndex ?? ConfigManager.TIANDITU_CONFIG.DEFAULT_ZINDEX;
      this.setAnnotationLayer(annotationType, this.options.token, baseZIndex);

    } catch (error) {
      this.errorHandler.createAndHandleError(
        `Failed to switch annotation layer to '${ annotationType }': ${ error }`,
        ErrorType.LAYER_ERROR,
        { annotationType, error }
      );
    }
    return this;
  }

  /**
   * 设置注记图层（核心实现）
   * @private
   */
  private setAnnotationLayer(annotationType: 'cva_c' | 'cia_c' | 'cta_c', token: string, baseZIndex: number): this {
    // 1. 移除旧图层
    this.removeCurrentAnnotationLayer();

    // 2. 计算新层级
    const annotationZIndex = baseZIndex + ConfigManager.TIANDITU_CONFIG.ANNOTATION_ZINDEX_OFFSET;

    // 3. 创建新图层
    let annotationLayer = this.createAnnotationLayer({
      type: annotationType,
      token,
      zIndex: annotationZIndex,
      visible: true
    });

    // 4. 应用剪切
    annotationLayer = this.processLayer(annotationLayer) as TileLayer<XYZ>;

    // 5. 添加到地图并更新状态
    this.currentAnnotationLayer = annotationLayer;
    this.currentAnnotationType = annotationType;
    this.map.addLayer(this.currentAnnotationLayer);

    return this;
  }

  /**
   * 移除当前注记图层
   * @private
   */
  private removeCurrentAnnotationLayer(): void {
    if (this.currentAnnotationLayer) {
      this.map.removeLayer(this.currentAnnotationLayer);
      this.currentAnnotationLayer = null;
      // 注意：这里不清除 currentAnnotationType，因为可能只是临时移除
    }
  }

  /**
   * 更新注记图层层级
   * @private
   */
  private updateAnnotationLayerZIndex(): void {
    if (this.currentAnnotationLayer && this.currentAnnotationType) {
      const baseZIndex = this.options.zIndex ?? ConfigManager.TIANDITU_CONFIG.DEFAULT_ZINDEX;
      const annotationZIndex = baseZIndex + ConfigManager.TIANDITU_CONFIG.ANNOTATION_ZINDEX_OFFSET;
      this.currentAnnotationLayer.setZIndex(annotationZIndex);
    }
  }

  /**
   * 加载默认注记图层（cia_c）
   * @private
   */
  private loadDefaultAnnotationLayer(token: string, baseZIndex: number): this {
    this.setAnnotationLayer('cia_c', token, baseZIndex);
    return this;
  }

  /**
   * 获取当前注记类型
   */
  getCurrentAnnotationType(): string | null {
    return this.currentAnnotationType;
  }

  /**
   * 显示/隐藏注记图层
   */
  setAnnotationVisible(visible: boolean): this {
    if (this.currentAnnotationLayer) {
      this.currentAnnotationLayer.setVisible(visible);
    }
    return this;
  }

  /**
   * 检查注记图层是否可见
   */
  isAnnotationVisible(): boolean {
    return this.currentAnnotationLayer ? this.currentAnnotationLayer.getVisible() : false;
  }

  /**
   * 添加注记图层（实例方法）
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

  //************* Layer Operations *************

  /**
   * 添加GeoServer图层
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
        zIndex: options.zIndex ?? ConfigManager.TIANDITU_CONFIG.DEFAULT_ZINDEX,
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
   * 移除指定类型的图层
   */
  removeLayersByType(type: string): this {
    try {
      if (!this.layers[type]) {
        return this;
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
    return this;
  }

  /**
   * 清除所有图层
   */
  clearAllLayers(): this {
    try {
      // 1. 清除底图
      for (const key in this.layers) {
        this.layers[key]?.forEach((layer: BaseLayer) => {
          this.map.removeLayer(layer);
        });
      }
      this.layers = {};
      this.currentBaseLayerType = null;

      // 2. 清除注记
      this.removeCurrentAnnotationLayer();
      this.currentAnnotationType = null;

    } catch (error) {
      this.errorHandler.createAndHandleError(
        `Failed to clear all layers: ${ error }`,
        ErrorType.LAYER_ERROR,
        { error }
      );
    }
    return this;
  }

  /**
   * 获取图层数量统计
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
   * 获取可用的图层类型列表
   */
  getAvailableLayerTypes(): string[] {
    return Object.keys(this.layers);
  }

  /**
   * 检查指定图层类型是否存在
   */
  hasLayerType(type: string): boolean {
    return type in this.layers && this.layers[type] !== undefined;
  }

  /**
   * 销毁实例，清理资源
   */
  destroy(): this {
    try {
      this.clearAllLayers();
    } catch (error) {
      this.errorHandler.createAndHandleError(
        `Failed to destroy MapBaseLayers: ${ error }`,
        ErrorType.MAP_ERROR,
        { error }
      );
    }
    return this;
  }

  //************* Helper Methods *************

  /**
   * 将所有初始化好的图层添加到地图
   * @private
   */
  private addMapLayer(): this {
    try {
      if (!this.layers || Object.keys(this.layers).length === 0) {
        return this;
      }

      for (const key in this.layers) {
        const layerList = this.layers[key];
        if (!layerList || layerList.length === 0) continue;

        // 处理并更新图层列表
        const processedLayerList = layerList.map(layer => this.processLayer(layer));
        this.layers[key] = processedLayerList;

        // 添加到地图
        processedLayerList.forEach((layer: BaseLayer) => {
          this.map.addLayer(layer);
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
    return this;
  }

  /**
   * 处理图层（应用裁剪等）
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
   * 创建天地图图层（实例方法）
   * @private
   */
  private createTiandituLayer(options: TiandituLayerOptions): TileLayer<XYZ> {
    return MapBaseLayers.getTiandiTuLayer(options);
  }

  /**
   * 创建注记图层（实例方法）
   * @private
   */
  private createAnnotationLayer(options: AnnotationLayerOptions): TileLayer<XYZ> {
    return MapBaseLayers.createAnnotationLayer(options);
  }

  //************* Static Methods *************

  /**
   * 创建天地图底图图层
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
          url: `${ConfigManager.TIANDITU_CONFIG.BASE_URL}?T=${ options.type }&tk=${ options.token }&x={x}&y={y}&l={z}`,
          projection: 'EPSG:4326'
        }),
        zIndex: options.zIndex ?? ConfigManager.TIANDITU_CONFIG.DEFAULT_ZINDEX,
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
   * 创建天地图注记图层
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
          url: `${ConfigManager.TIANDITU_CONFIG.BASE_URL}?T=${ options.type }&tk=${ options.token }&x={x}&y={y}&l={z}`,
          projection: 'EPSG:4326'
        }),
        zIndex: options.zIndex ?? ConfigManager.TIANDITU_CONFIG.DEFAULT_ZINDEX,
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
   * 添加注记图层到地图（静态方法）
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
        zIndex: options.zIndex ?? ConfigManager.TIANDITU_CONFIG.DEFAULT_ZINDEX,
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
   * 获取天地图注记图层（向后兼容的静态方法）
   * @deprecated 使用 createAnnotationLayer 替代
   */
  static getAnnotationLayer(options: AnnotationLayerOptions): TileLayer<XYZ> {
    return MapBaseLayers.createAnnotationLayer(options);
  }

  /**
   * 创建WMTS瓦片网格
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
}
