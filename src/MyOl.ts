"use strict";

// OpenLayers 核心导入
import { register as olProj4Register } from 'ol/proj/proj4'
import {
  Projection as olProjProjection,
  addProjection as olProjAddProjection,
  fromLonLat as olProjFromLonLat
} from 'ol/proj'
import View from "ol/View";
import Map from "ol/Map";
import { defaults as defaultControls } from 'ol/control'
import BaseLayer from "ol/layer/Base";
import proj4 from "proj4";

// 内部模块导入
import Polygon from "./core/Polygon";
import Point from "./core/Point";
import Line from "./core/Line";
import MapBaseLayers from "./core/MapBaseLayers";
import MapTools from "./core/MapTools";
import { ErrorHandler, MyOpenLayersError, ErrorType } from './utils/ErrorHandler';
import { EventManager } from './core/EventManager';
import { ConfigManager } from './core/ConfigManager';

// 类型定义导入
import { MapInitType, MapLayersOptions } from './types'

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
  
  // 管理器实例
  private readonly errorHandler: ErrorHandler;
  private _eventManager?: EventManager;
  private readonly configManager: ConfigManager;
  
  // 配置选项
  private readonly options: MapInitType;
  
  // 默认配置
  static readonly DefaultOptions: MapInitType = {
    layers: undefined,
    zoom: 10,
    center: [119.81, 29.969],
    minZoom: 8,
    maxZoom: 20,
    extent: undefined
  };
  
  // 坐标系配置
  private static readonly PROJECTIONS = {
    CGCS2000: "EPSG:4490",
    CGCS2000_3_DEGREE: "EPSG:4549"
  } as const;

  /**
   * 构造函数
   * @param id 地图容器 DOM 元素 ID
   * @param options 地图初始化配置
   */
  constructor(id: string, options?: Partial<MapInitType>) {
    // 初始化错误处理器（必须最先初始化）
    this.errorHandler = ErrorHandler.getInstance();
    
    try {
      // 初始化配置管理器
      this.configManager = new ConfigManager();
      
      // 合并配置（处理 undefined 情况）
      this.options = ConfigManager.mergeOptions(MyOl.DefaultOptions, options || {});
      
      // 参数验证
      this.validateConstructorParams(id, this.options);
      
      // 初始化坐标系
      MyOl.initializeProjections();
      
      // 准备图层
      const layers: BaseLayer[] = Array.isArray(this.options.layers) ? this.options.layers : [];
      
      // 创建地图实例
      this.map = new Map({
        target: id,
        view: MyOl.createView(this.options),
        layers: layers,
        controls: this.createControls()
      });

      if(layers.length === 0||this.options.annotation) {
        this.getMapBaseLayers()
      }
      
      // 初始化基础事件监听（地图错误等）
      this.initializeEventListeners();
      
    } catch (error) {
      this.errorHandler.handleError(
        new MyOpenLayersError(
          `地图初始化失败: ${error instanceof Error ? error.message : '未知错误'}`,
          ErrorType.MAP_ERROR,
          { id, options }
        )
      );
      throw error;
    }
  }

  /**
   * 验证构造函数参数
   * @private
   */
  private validateConstructorParams(id: string, options: MapInitType): void {
    if (!id || typeof id !== 'string') {
      throw new Error('地图容器 ID 必须是非空字符串');
    }
    
    if (!options || typeof options !== 'object') {
      throw new Error('地图配置选项不能为空');
    }
    
    // 检查 DOM 元素是否存在
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`找不到 ID 为 '${id}' 的 DOM 元素`);
    }
  }
  
  /**
   * 初始化坐标系
   * @private
   */
  private static initializeProjections(): void {
    // 定义 CGCS2000 坐标系
    proj4.defs(MyOl.PROJECTIONS.CGCS2000, "+proj=longlat +ellps=GRS80 +no_defs");
    proj4.defs(MyOl.PROJECTIONS.CGCS2000_3_DEGREE, "+proj=tmerc +lat_0=0 +lon_0=120 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs");
    
    // 注册到 OpenLayers
    olProj4Register(proj4);
    
    // 添加 CGCS2000 投影
    const cgsc2000 = new olProjProjection({
      code: MyOl.PROJECTIONS.CGCS2000,
      extent: [-180, -90, 180, 90],
      worldExtent: [-180, -90, 180, 90],
      units: "degrees"
    });
    olProjAddProjection(cgsc2000);
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
      console.debug('地图初始化完成', { map: this.map });
    }, { once: true });
    
    // 地图错误事件
    eventManager.on('error', (eventData) => {
      this.errorHandler.handleError(
        new MyOpenLayersError('地图渲染错误', ErrorType.MAP_ERROR, { error: eventData.error })
      );
    });
  }
  
  /**
   * 创建地图视图
   * @param options 视图配置
   * @returns View 地图视图实例
   */
  static createView(options: MapInitType = MyOl.DefaultOptions): View {
    try {
      const projection = new olProjProjection({
        code: MyOl.PROJECTIONS.CGCS2000,
        extent: [-180, -90, 180, 90],
        worldExtent: [-180, -90, 180, 90],
        units: "degrees"
      });
      
      const viewOptions = {
        projection,
        center: olProjFromLonLat(options.center as number[], projection),
        zoom: options.zoom ?? MyOl.DefaultOptions.zoom!,
        minZoom: options.minZoom ?? MyOl.DefaultOptions.minZoom!,
        maxZoom: options.maxZoom ?? MyOl.DefaultOptions.maxZoom!,
        ...(options.extent && { extent: options.extent })
      };
      
      return new View(viewOptions);
    } catch (error) {
      throw new MyOpenLayersError(
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
    console.warn('getView 方法已废弃，请使用 createView 方法');
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
        console.debug('面要素模块已加载');
      }
      return this._polygon;
    } catch (error) {
      this.errorHandler.handleError(
        new MyOpenLayersError(  '面要素模块初始化失败',  ErrorType.COMPONENT_ERROR,  { error })
     );
      throw error;
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
          console.warn('已设置默认底图，MapBaseLayers 中的 switchBaseLayer 方法将失效');
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
        console.debug('基础图层模块已加载');
      }
      return this._baseLayers;
    } catch (error) {
      this.errorHandler.handleError(
        new MyOpenLayersError(
          '基础图层模块初始化失败',
          ErrorType.COMPONENT_ERROR,
          { error }
        )
      );
      throw error;
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
        console.debug('点要素模块已加载');
      }
      return this._point;
    } catch (error) {
      this.errorHandler.handleError(
        new MyOpenLayersError( '点要素模块初始化失败', ErrorType.COMPONENT_ERROR, { error })
      );
      throw error;
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
        console.debug('线要素模块已加载');
      }
      return this._line;
    } catch (error) {
      this.errorHandler.handleError(
        new MyOpenLayersError('线要素模块初始化失败',  ErrorType.COMPONENT_ERROR,  { error })
      );
      throw error;
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
        console.debug('工具模块已加载');
      }
      return this._mapTools;
    } catch (error) {
      this.errorHandler.handleError(new MyOpenLayersError(  '工具模块初始化失败',  ErrorType.COMPONENT_ERROR,  { error }  ) );
      throw error;
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
        throw new Error('未设置中心点，无法重置位置');
      }
      
      const [longitude, latitude] = this.options.center;
      this.locationAction(longitude, latitude, this.options.zoom, duration);
      
    } catch (error) {
      this.errorHandler.handleError(
        new MyOpenLayersError(
          `重置地图位置失败: ${error instanceof Error ? error.message : '未知错误'}`,
          ErrorType.MAP_ERROR,
          { center: this.options.center, duration }
        )
      );
    }
  }

  /**
   * 地图定位到指定坐标
   * @param longitude 经度
   * @param latitude 纬度
   * @param zoom 缩放级别
   * @param duration 动画持续时间（毫秒）
   */
  locationAction(longitude: number, latitude: number, zoom: number = 20, duration: number = 3000): void {
    try {
      // 参数验证
      if (typeof longitude !== 'number' || typeof latitude !== 'number') {
        throw new Error('经纬度必须是数字类型');
      }
      
      if (longitude < -180 || longitude > 180) {
        throw new Error('经度值必须在 -180 到 180 之间');
      }
      
      if (latitude < -90 || latitude > 90) {
        throw new Error('纬度值必须在 -90 到 90 之间');
      }
      
      this.getPoint().locationAction(longitude, latitude, zoom, duration);
      
      // 记录定位操作
      console.debug('地图定位完成', {
        longitude,
        latitude,
        zoom,
        duration
      });
      
    } catch (error) {
      this.errorHandler.handleError(
        new MyOpenLayersError(
          `地图定位失败: ${error instanceof Error ? error.message : '未知错误'}`,
          ErrorType.MAP_ERROR,
          { longitude, latitude, zoom, duration }
        )
      );
      throw error;
    }
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
      // 清理事件监听（仅在已初始化时）
      if (this._eventManager) {
        this._eventManager.clear();
      }
      
      // 销毁功能模块
      this._point = undefined;
      this._line = undefined;
      this._polygon = undefined;
      this._mapTools = undefined;
      this._baseLayers = undefined;
      
      // 销毁地图
      this.map.setTarget(undefined);
      
      console.debug('地图实例已销毁', { map: this.map });
      
    } catch (error) {
      this.errorHandler.handleError(
        new MyOpenLayersError(
          `销毁地图失败: ${error instanceof Error ? error.message : '未知错误'}`,
          ErrorType.MAP_ERROR
        )
      );
    }
  }
}
