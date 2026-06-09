"use strict";

// OpenLayers 核心导入
import View from "ol/View";
import Map from "ol/Map";
import { defaults as defaultControls } from 'ol/control'
import BaseLayer from "ol/layer/Base";
import { fromLonLat as olProjFromLonLat } from 'ol/proj';

// 内部模块导入
import { Polygon } from "./core/polygon";
import { Point } from "./core/point";
import { Line } from "./core/line";
import { MapBaseLayers, MapTools, EventManager, ConfigManager } from "./core/map";
import { SelectHandler } from "./core/select";
import { ProjectionManager } from "./core/projection";
import { ErrorHandler, ErrorType, MyOpenLayersError } from './utils/ErrorHandler';

// 类型定义导入
import { MapInitType, MapLayersOptions } from './types'
import type {
  AddGeoJSONInput,
  AddGeoJSONOptions,
  GeoJSONRenderHandle,
} from './types'
import { renderGeoJSON } from './core/geojson'

/**
 * MyOl 地图核心类
 * 提供完整的地图操作功能，包括点、线、面要素管理，底图切换，工具操作等
 */
export default class MyOl {
  // 核心地图实例
  public readonly map: Map;

  // 功能模块实例（懒加载）
  private _baseLayers?: MapBaseLayers;
  private _polygon?: Polygon;
  private _mapTools?: MapTools;
  private _point?: Point;
  private _line?: Line;
  private _selectHandler?: SelectHandler;

  // 管理器实例
  private readonly errorHandler: ErrorHandler;
  private _eventManager?: EventManager;
  private readonly configManager: ConfigManager;

  // 配置选项
  private readonly options: MapInitType;

  // 默认配置
  static readonly DefaultOptions: MapInitType = ConfigManager.DEFAULT_MYOL_OPTIONS;

  /**
   * @deprecated 请使用 ProjectionManager.PROJECTIONS 代替
   */
  private static readonly PROJECTIONS = ProjectionManager.PROJECTIONS;

  /**
   * 构造函数
   * @param id 地图容器 DOM 元素 ID
   * @param options 地图初始化配置
   */
  constructor(id: string | HTMLElement, options?: Partial<MapInitType>) {
    // 初始化错误处理器（必须最先初始化）
    this.errorHandler = ErrorHandler.getInstance();

    try {
      // 初始化配置管理器
      this.configManager = new ConfigManager();

      // 合并配置（处理 undefined 情况）
      this.options = ConfigManager.mergeOptions(MyOl.DefaultOptions, options || {});

      // 初始化日志配置（默认关闭，级别为 error）
      this.errorHandler.setEnabled(this.options.enableLog ?? false);
      this.errorHandler.setLogLevel(this.options.logLevel ?? 'error');

      // 参数验证
      this.validateConstructorParams(id, this.options);

      // 初始化坐标系
      ProjectionManager.initialize(this.options);

      // 准备图层
      const layers: BaseLayer[] = Array.isArray(this.options.layers) ? this.options.layers : [];

      // 创建地图实例
      // 确保 view 选项不会传递给 OpenLayers Map 构造函数，避免 "then is not a function" 错误
      // 我们完全控制传递给 Map 的选项，不直接传递用户的 options
      const mapOptions = {
        target: id,
        view: this.options.view || MyOl.createView(this.options),
        layers: layers,
        controls: this.createControls()
      };

      this.map = new Map(mapOptions);

      if(this.options.token && (layers.length === 0||this.options.annotation)) {
        this.getMapBaseLayers()
      }

      // 初始化基础事件监听（地图错误等）
      this.initializeEventListeners();

    } catch (error) {
      // 已处理过的 MyOpenLayersError 直接抛出，避免二次包装和重复触发回调
      if (error instanceof MyOpenLayersError) {
        throw error;
      }
      throw this.errorHandler.createAndHandleError(
        `地图初始化失败: ${error instanceof Error ? error.message : '未知错误'}`,
        ErrorType.MAP_ERROR,
        { id, options }
      );
    }
  }

  /**
   * 验证构造函数参数
   * @private
   */
  private validateConstructorParams(id: string | HTMLElement, options: MapInitType): void {
    if (!id) {
      throw ErrorHandler.getInstance().createAndHandleError('地图容器 ID 或 HTMLElement 不能为空', ErrorType.VALIDATION_ERROR);
    }

    if (typeof id === 'string' && id.trim() === '') {
      throw ErrorHandler.getInstance().createAndHandleError('地图容器 ID 必须是非空字符串', ErrorType.VALIDATION_ERROR);
    }

    if (!options || typeof options !== 'object') {
      throw ErrorHandler.getInstance().createAndHandleError('地图配置选项不能为空', ErrorType.VALIDATION_ERROR);
    }

    // 检查 DOM 元素是否存在
    const element = typeof id === 'string' ? document.getElementById(id) : id;
    if (!element) {
      throw ErrorHandler.getInstance().createAndHandleError(typeof id === 'string' ? `找不到 ID 为 '${id}' 的 DOM 元素` : '提供的 DOM 元素无效', ErrorType.VALIDATION_ERROR);
    }
  }

  /**
   * 创建地图控件
   * @private
   */
  private createControls() {
    return defaultControls({
      zoom: false,
      rotate: false,
      attribution: false
    }).extend([]);
  }

  /**
   * 初始化事件监听
   * @private
   */
  private initializeEventListeners(): void {
    const eventManager = this.getEventManager();

    // 地图加载完成事件
    eventManager.on('rendercomplete', (eventData) => {
      this.errorHandler.debug('地图初始化完成', { map: this.map });
    }, { once: true });

    // 地图错误事件
    eventManager.on('error', (eventData) => {
      this.errorHandler.createAndHandleError('地图渲染错误', ErrorType.MAP_ERROR, { error: eventData.error });
    });
  }

  /**
   * 创建地图视图
   * @param options 视图配置
   * @returns View 地图视图实例
   */
  static createView(options: MapInitType = MyOl.DefaultOptions): View {
    try {
      /** *********************静态视图投影初始化*********************/
      ProjectionManager.initialize(options);

      const code = options.projection?.code ?? ProjectionManager.DEFAULT_PROJECTION;
      const projection = ProjectionManager.resolveViewProjection(options, code);

      const viewOptions = {
        projection,
        center: olProjFromLonLat(options.center as number[], projection),
        zoom: options.zoom ?? MyOl.DefaultOptions.zoom!,
        minZoom: options.minZoom,
        maxZoom: options.maxZoom,
        ...(options.extent && { extent: options.extent })
      };

      return new View(viewOptions);
    } catch (error) {
      // 已处理过的 MyOpenLayersError 直接抛出，避免二次包装和重复触发回调
      if (error instanceof MyOpenLayersError) {
        throw error;
      }
      throw ErrorHandler.getInstance().createAndHandleError(
        `视图创建失败: ${error instanceof Error ? error.message : '未知错误'}`,
        ErrorType.MAP_ERROR,
        { options }
      );
    }
  }

  /**
   * 获取视图（向后兼容）
   * @deprecated 请使用 createView 方法
   */
  static getView(options: MapInitType = MyOl.DefaultOptions): View {
    ErrorHandler.getInstance().warn('getView 方法已废弃，请使用 createView 方法');
    return MyOl.createView(options);
  }


  // ==========================================
  // 功能模块获取方法（懒加载模式）
  // ==========================================

  /**
   * 获取面要素操作模块
   * @returns Polygon 面要素操作实例
   */
  getPolygon(): Polygon {
    try {
      if (!this._polygon) {
        this._polygon = new Polygon(this.map);
        this.errorHandler.debug('面要素模块已加载');
      }
      return this._polygon;
    } catch (error) {
      if (error instanceof MyOpenLayersError) throw error;
      throw this.errorHandler.createAndHandleError('面要素模块初始化失败', ErrorType.COMPONENT_ERROR, { error });
    }
  }

  /**
   * 获取底图图层管理模块
   * @returns MapBaseLayers 底图管理实例
   */
  getMapBaseLayers(): MapBaseLayers {
    try {
      if (!this._baseLayers) {
        // 检查是否设置了自定义底图
        if (Array.isArray(this.options.layers)) {
          this.errorHandler.warn('已设置默认底图，MapBaseLayers 中的 switchBaseLayer 方法将失效');
        }

        const layerOptions: MapLayersOptions = {
          layers: this.options.layers,
          annotation: this.options.annotation,
          zIndex: 1,
          mapClip: !!this.options.mapClipData,
          mapClipData: this.options.mapClipData,
          token: this.options.token || ''
        };

        this._baseLayers = new MapBaseLayers(this.map, layerOptions);
        this.errorHandler.debug('基础图层模块已加载');
      }
      return this._baseLayers;
    } catch (error) {
      if (error instanceof MyOpenLayersError) throw error;
      throw this.errorHandler.createAndHandleError('基础图层模块初始化失败', ErrorType.COMPONENT_ERROR, { error });
    }
  }

  /**
   * 获取点要素操作模块
   * @returns Point 点要素操作实例
   */
  getPoint(): Point {
    try {
      if (!this._point) {
        this._point = new Point(this.map);
        this.errorHandler.debug('点要素模块已加载');
      }
      return this._point;
    } catch (error) {
      if (error instanceof MyOpenLayersError) throw error;
      throw this.errorHandler.createAndHandleError('点要素模块初始化失败', ErrorType.COMPONENT_ERROR, { error });
    }
  }

  /**
   * 获取线要素操作模块
   * @returns Line 线要素操作实例
   */
  getLine(): Line {
    try {
      if (!this._line) {
        this._line = new Line(this.map);
        this.errorHandler.debug('线要素模块已加载');
      }
      return this._line;
    } catch (error) {
      if (error instanceof MyOpenLayersError) throw error;
      throw this.errorHandler.createAndHandleError('线要素模块初始化失败', ErrorType.COMPONENT_ERROR, { error });
    }
  }

  /**
   * 获取要素选择处理器模块
   * @returns SelectHandler 要素选择处理器实例
   */
  getSelectHandler(): SelectHandler {
    try {
      if (!this._selectHandler) {
        this._selectHandler = new SelectHandler(this.map);
        this.errorHandler.debug('要素选择模块已加载');
      }
      return this._selectHandler;
    } catch (error) {
      if (error instanceof MyOpenLayersError) throw error;
      throw this.errorHandler.createAndHandleError('要素选择模块初始化失败', ErrorType.COMPONENT_ERROR, { error });
    }
  }

  /**
   * 获取地图工具模块
   * @returns MapTools 地图工具实例
   */
  getTools(): MapTools {
    try {
      if (!this._mapTools) {
        this._mapTools = new MapTools(this.map);
        this.errorHandler.debug('工具模块已加载');
      }
      return this._mapTools;
    } catch (error) {
      if (error instanceof MyOpenLayersError) throw error;
      throw this.errorHandler.createAndHandleError('工具模块初始化失败', ErrorType.COMPONENT_ERROR, { error });
    }
  }

  // ==========================================
  // 地图操作方法
  // ==========================================

  /**
   * 重置地图位置到初始中心点
   * @param duration 动画持续时间（毫秒）
   */
  resetPosition(duration: number = 3000): void {
    try {
      if (!this.options.center) {
        this.errorHandler.createAndHandleError('未设置中心点，无法重置位置', ErrorType.MAP_ERROR);
        return;
      }

      const [longitude, latitude] = this.options.center;
      this.locationAction(longitude, latitude, this.options.zoom, duration);

    } catch (error) {
      if (error instanceof MyOpenLayersError) {
        return;
      }

      this.errorHandler.createAndHandleError(
        `重置地图位置失败: ${error instanceof Error ? error.message : '未知错误'}`,
        ErrorType.MAP_ERROR,
        { center: this.options.center, duration }
      );
    }
  }

  /**
   * 地图定位到指定坐标
   * @param longitude 经度
   * @param latitude 纬度
   * @param zoom 缩放级别
   * @param duration 动画持续时间（毫秒）
   * @param projection
   */
  locationAction(longitude: number, latitude: number, zoom: number = 20, duration: number = 3000, projection?: {
    dataProjection?: string;
    featureProjection?: string;
  }): void {
    try {
      // 参数验证
      if (typeof longitude !== 'number' || typeof latitude !== 'number') {
        throw ErrorHandler.getInstance().createAndHandleError('经纬度必须是数字类型', ErrorType.VALIDATION_ERROR);
      }

      const hasProjection = !!projection?.dataProjection || !!projection?.featureProjection;
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
        throw ErrorHandler.getInstance().createAndHandleError('经纬度必须是有效数字', ErrorType.VALIDATION_ERROR);
      }

      if (!hasProjection) {
        if (longitude < -180 || longitude > 180) {
          throw ErrorHandler.getInstance().createAndHandleError('经度值必须在 -180 到 180 之间', ErrorType.COORDINATE_ERROR);
        }

        if (latitude < -90 || latitude > 90) {
          throw ErrorHandler.getInstance().createAndHandleError('纬度值必须在 -90 到 90 之间', ErrorType.COORDINATE_ERROR);
        }
      }
      this.getTools().locationAction(longitude, latitude, zoom, duration, projection);

      // 记录定位操作
      this.errorHandler.debug('地图定位完成', {
        longitude,
        latitude,
        zoom,
        duration
      });

    } catch (error) {
      // 已处理过的 MyOpenLayersError 直接抛出，避免二次包装和重复触发回调
      if (error instanceof MyOpenLayersError) {
        throw error;
      }
      throw this.errorHandler.createAndHandleError(
        `地图定位失败: ${error instanceof Error ? error.message : '未知错误'}`,
        ErrorType.MAP_ERROR,
        { longitude, latitude, zoom, duration }
      );
    }
  }

  // ==========================================
  // 综合 GeoJSON 渲染
  // ==========================================

  /**
   * 综合 GeoJSON 渲染方法。
   *
   * 自动识别点/线/面几何类型，按分组创建图层，返回统一句柄。
   * 支持单个 GeoJSON、GeoJSON 数组、或 `{ key: json }` 对象。
   *
   * @param data GeoJSON 输入数据
   * @param options 配置选项（含 layerName、groupBy、各类型样式）
   * @returns GeoJSONRenderHandle 统一句柄
   */
  addGeoJSON(data: AddGeoJSONInput, options: AddGeoJSONOptions): GeoJSONRenderHandle {
    return renderGeoJSON(data, options, {
      getPoint: () => this.getPoint(),
      getLine: () => this.getLine(),
      getPolygon: () => this.getPolygon(),
    });
  }

  // ==========================================
  // 管理器访问方法
  // ==========================================

  /**
   * 获取错误处理器实例
   * @returns ErrorHandler 错误处理器
   */
  getErrorHandler(): ErrorHandler {
    return this.errorHandler;
  }

  /**
   * 获取事件管理器实例
   * @returns EventManager 事件管理器
   */
  getEventManager(): EventManager {
    if (!this._eventManager) {
      this._eventManager = new EventManager(this.map);
    }
    return this._eventManager;
  }

  /**
   * 获取配置管理器实例
   * @returns ConfigManager 配置管理器
   */
  getConfigManager(): ConfigManager {
    return this.configManager;
  }

  /**
   * 获取当前地图配置
   * @returns MapInitType 地图配置
   */
  getMapOptions(): Readonly<MapInitType> {
    return Object.freeze({ ...this.options });
  }

  /**
   * 销毁地图实例和相关资源
   */
  destroy(): void {
    try {
      // 1. 先停掉所有动画 / 解绑事件 / 释放 Overlay，再销毁地图本身
      if (this._selectHandler) {
        try { this._selectHandler.destroy(); } catch (e) { this.errorHandler.warn('SelectHandler.destroy 失败:', e); }
      }
      if (this._line) {
        try { this._line.destroyAllFlowLines(); } catch (e) { this.errorHandler.warn('Line.destroyAllFlowLines 失败:', e); }
      }
      if (this._point) {
        try { this._point.destroyAll(); } catch (e) { this.errorHandler.warn('Point.destroyAll 失败:', e); }
      }
      if (this._polygon) {
        try { this._polygon.destroyAll(); } catch (e) { this.errorHandler.warn('Polygon.destroyAll 失败:', e); }
      }
      if (this._eventManager) {
        try { this._eventManager.clear(); } catch (e) { this.errorHandler.warn('EventManager.clear 失败:', e); }
      }

      // 2. 释放模块引用
      this._point = undefined;
      this._line = undefined;
      this._polygon = undefined;
      this._mapTools = undefined;
      this._baseLayers = undefined;
      this._selectHandler = undefined;
      this._eventManager = undefined;

      // 3. 解绑 DOM 目标，OL 内部会回收 layers / interactions
      this.map.setTarget(undefined);

      this.errorHandler.debug('地图实例已销毁', { map: this.map });

    } catch (error) {
      this.errorHandler.createAndHandleError(
        `销毁地图失败: ${error instanceof Error ? error.message : '未知错误'}`,
        ErrorType.MAP_ERROR
      );
    }
  }
}
