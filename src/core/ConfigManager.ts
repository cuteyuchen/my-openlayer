/**
 * 配置管理类
 * 用于统一管理默认配置和验证
 */
export class ConfigManager {
  /**
   * 默认点位配置
   */
  static readonly DEFAULT_POINT_OPTIONS = {
    visible: true,
    zIndex: 21
  };

  static readonly DEFAULT_POINT_TEXT_OPTIONS = {
    textFont: '12px Calibri,sans-serif',
    textFillColor: '#FFF',
    textStrokeColor: '#000',
    textStrokeWidth: 3,
    textOffsetY: 20
  };

  static readonly DEFAULT_POINT_ICON_SCALE = 1;

  static readonly DEFAULT_CLUSTER_OPTIONS = {
    distance: 40,
    minDistance: 0,
    zIndex: 21
  };

  static readonly DEFAULT_DOM_POINT_OVERLAY_OPTIONS = {
    positioning: 'center-center',
    stopEvent: false
  } as const;

  /**
   * 默认线配置
   */
  static readonly DEFAULT_LINE_OPTIONS = {
    type: 'line',
    strokeColor: 'rgba(3, 122, 255, 1)',
    strokeWidth: 2,
    visible: true,
    layerName: 'lineLayer',
    zIndex: 15
  };

  /**
   * 默认面配置
   */
  static readonly DEFAULT_POLYGON_OPTIONS = {
    zIndex: 11,
    visible: true,
    strokeColor: '#EBEEF5',
    strokeWidth: 2,
    fillColor: 'rgba(255, 255, 255, 0)',
    textFont: '14px Calibri,sans-serif',
    textFillColor: '#FFF',
    textStrokeColor: '#409EFF',
    textStrokeWidth: 2
  };

  static readonly DEFAULT_POLYGON_COLOR_MAP = {
    '0': 'rgba(255, 0, 0, 0.6)',
    '1': 'rgba(245, 154, 35, 0.6)',
    '2': 'rgba(255, 238, 0, 0.6)',
    '3': 'rgba(1, 111, 255, 0.6)'
  };

  /**
   * 默认图片图层配置
   */
  static readonly DEFAULT_IMAGE_OPTIONS = {
    opacity: 1,
    visible: true,
    layerName: 'imageLayer',
    zIndex: 11
  };

  /**
   * 默认遮罩图层配置
   */
  static readonly DEFAULT_MASK_OPTIONS = {
    fillColor: 'rgba(0, 0, 0, 0.5)',
    opacity: 1,
    visible: true,
    layerName: 'maskLayer'
  };

  /**
   * 默认文本配置
   */
  static readonly DEFAULT_TEXT_OPTIONS = {
    textFont: '14px Calibri,sans-serif',
    textFillColor: '#FFF',
    textStrokeColor: '#409EFF',
    textStrokeWidth: 2
  };

  static readonly DEFAULT_HEATMAP_OPTIONS = {
    blur: 15,
    radius: 10,
    zIndex: 11,
    opacity: 1
  };

  static readonly DEFAULT_HEATMAP_VALUE_KEY = 'value';

  static readonly TIANDITU_CONFIG = {
    BASE_URL: '//t{0-7}.tianditu.gov.cn/DataServer',
    PROJECTION: 'EPSG:4326',
    DEFAULT_ZINDEX: 9,
    ANNOTATION_ZINDEX_OFFSET: 10
  } as const;

  static readonly DEFAULT_MAP_LAYERS_OPTIONS = {
    zIndex: ConfigManager.TIANDITU_CONFIG.DEFAULT_ZINDEX,
    annotation: false,
    mapClip: false,
    mapClipData: undefined
  };

  static readonly DEFAULT_MYOL_OPTIONS = {
    layers: undefined,
    zoom: 10,
    center: [119.81, 29.969],
    extent: undefined
  };

  static readonly DEFAULT_VUE_TEMPLATE_POINT_OPTIONS = {
    positioning: 'center-center',
    stopEvent: false,
    visible: true,
    zIndex: 1
  } as const;

  static readonly DEFAULT_RIVER_LEVEL_WIDTH_MAP = {
    1: 2,
    2: 1,
    3: 0.5,
    4: 0.5,
    5: 0.5
  };

  static readonly DEFAULT_RIVER_LAYERS_BY_ZOOM_OPTIONS = {
    type: 'river',
    levelCount: 5,
    zoomOffset: 8,
    strokeColor: 'rgb(0,113,255)',
    strokeWidth: 3,
    visible: true,
    zIndex: 15,
    layerName: 'riverLayer',
    removeExisting: false
  };

  static readonly DEFAULT_RIVER_WIDTH_BY_LEVEL_OPTIONS = {
    type: 'river',
    layerName: 'river',
    strokeColor: 'rgba(3, 122, 255, 1)',
    strokeWidth: 2,
    visible: true,
    zIndex: 15,
    removeExisting: false
  };


  /**
   * 合并配置选项
   * @param defaultOptions 默认配置
   * @param userOptions 用户配置
   * @returns 合并后的配置
   */
  static mergeOptions<T extends Record<string, any>>(
    defaultOptions: T,
    userOptions?: Partial<T>
  ): T {
    return {
      ...defaultOptions,
      ...userOptions
    };
  }

  /**
   * 生成唯一ID
   * @param prefix 前缀
   * @returns 唯一ID
   */
  static generateId(prefix: string = 'id'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 深度克隆对象
   * @param obj 要克隆的对象
   * @returns 克隆后的对象
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => ConfigManager.deepClone(item)) as unknown as T;
    }
    
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = ConfigManager.deepClone(obj[key]);
      }
    }
    
    return cloned;
  }
}
