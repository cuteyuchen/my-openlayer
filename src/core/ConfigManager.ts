/**
 * 配置管理类
 * 用于统一管理默认配置和验证
 */
export class ConfigManager {
  /**
   * 默认点位配置
   */
  static readonly DEFAULT_POINT_OPTIONS = {
    strokeColor: '#409EFF',
    strokeWidth: 2,
    fillColor: 'rgba(64, 158, 255, 0.3)',
    opacity: 1,
    visible: true,
    layerName: 'pointLayer',
    zIndex: 10
  };

  /**
   * 默认线配置
   */
  static readonly DEFAULT_LINE_OPTIONS = {
    strokeColor: '#409EFF',
    strokeWidth: 2,
    opacity: 1,
    visible: true,
    layerName: 'lineLayer',
    zIndex: 10
  };

  /**
   * 默认面配置
   */
  static readonly DEFAULT_POLYGON_OPTIONS = {
    strokeColor: '#EBEEF5',
    strokeWidth: 2,
    fillColor: 'rgba(255, 255, 255, 0.3)',
    opacity: 1,
    visible: true,
    layerName: 'polygonLayer',
    zIndex: 10
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
    layerName: 'maskLayer',
    zIndex: 12
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

  /**
   * 验证坐标是否有效
   * @param longitude 经度
   * @param latitude 纬度
   * @returns 是否有效
   */
  static isValidCoordinate(longitude: number, latitude: number): boolean {
    return (
      typeof longitude === 'number' &&
      typeof latitude === 'number' &&
      !isNaN(longitude) &&
      !isNaN(latitude) &&
      longitude >= -180 &&
      longitude <= 180 &&
      latitude >= -90 &&
      latitude <= 90
    );
  }

  /**
   * 验证颜色字符串是否有效
   * @param color 颜色字符串
   * @returns 是否有效
   */
  static isValidColor(color: string): boolean {
    if (!color || typeof color !== 'string') {
      return false;
    }
    
    // 简单的颜色格式验证
    const colorRegex = /^(#[0-9A-Fa-f]{3,8}|rgba?\([^)]+\)|[a-zA-Z]+)$/;
    return colorRegex.test(color);
  }

  /**
   * 验证图层名称是否有效
   * @param layerName 图层名称
   * @returns 是否有效
   */
  static isValidLayerName(layerName: string): boolean {
    return (
      typeof layerName === 'string' &&
      layerName.length > 0 &&
      layerName.trim().length > 0
    );
  }

  /**
   * 验证范围是否有效
   * @param extent 范围数组 [minX, minY, maxX, maxY]
   * @returns 是否有效
   */
  static isValidExtent(extent: number[]): boolean {
    return (
      Array.isArray(extent) &&
      extent.length === 4 &&
      extent.every(coord => typeof coord === 'number' && !isNaN(coord)) &&
      extent[0] < extent[2] && // minX < maxX
      extent[1] < extent[3]    // minY < maxY
    );
  }

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