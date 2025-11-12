/**
 * 验证工具类
 * 统一管理所有验证方法
 */
import { ErrorHandler } from './ErrorHandler';

export class ValidationUtils {
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
   * 验证经纬度坐标（简化版本）
   * @param lgtd 经度
   * @param lttd 纬度
   * @returns 是否有效
   */
  static validateLngLat(lgtd: number, lttd: number): boolean {
    if (!lgtd || !lttd || isNaN(lgtd) || isNaN(lttd)) {
      ErrorHandler.getInstance().error('Invalid longitude or latitude coordinates');
      return false;
    }
    return true;
  }

  /**
   * 验证点数据数组
   * @param pointData 点数据数组
   * @returns 是否有效
   */
  static validatePointData(pointData: any[]): boolean {
    if (!pointData || pointData.length === 0) {
      ErrorHandler.getInstance().warn('Point data is empty or undefined');
      return false;
    }
    return true;
  }

  /**
   * 验证单个点的坐标
   * @param item 包含坐标的数据项
   * @returns 是否有效
   */
  static validateCoordinates(item: any): boolean {
    if (!item.lgtd || !item.lttd) {
      ErrorHandler.getInstance().warn('Invalid coordinates for point:', item);
      return false;
    }
    return true;
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
   * 验证GeoJSON数据
   * @param data GeoJSON数据
   * @returns 是否有效
   */
  static validateGeoJSONData(data: any): boolean {
    if (!data) {
      ErrorHandler.getInstance().warn('GeoJSON data is required');
      return false;
    }
    if (!data.features || !Array.isArray(data.features)) {
      ErrorHandler.getInstance().warn('Invalid GeoJSON data: features array is required');
      return false;
    }
    return true;
  }

  /**
   * 验证配置选项
   * @param options 配置选项
   * @returns 是否有效
   */
  static validateOptions(options: any): boolean {
    if (!options || typeof options !== 'object') {
      ErrorHandler.getInstance().warn('Options are required and must be an object');
      return false;
    }
    return true;
  }

  /**
   * 验证数值范围
   * @param value 数值
   * @param min 最小值
   * @param max 最大值
   * @returns 是否有效
   */
  static validateNumberRange(value: number, min: number, max: number): boolean {
    return (
      typeof value === 'number' &&
      !isNaN(value) &&
      value >= min &&
      value <= max
    );
  }



  /**
   * 验证DOM元素ID
   * @param id 元素ID
   * @returns 是否有效
   */
  static validateElementId(id: string): boolean {
    if (!id) {
      ErrorHandler.getInstance().error('Element ID is required');
      return false;
    }
    return true;
  }

  /**
   * 验证Vue相关参数
   * @param pointInfoList 点位信息列表
   * @param template Vue组件模板
   * @param Vue Vue实例
   * @returns 是否有效
   */
  static validateVueParams(pointInfoList: any[], template: any, Vue: any): boolean {
    if (!pointInfoList || !Array.isArray(pointInfoList) || pointInfoList.length === 0) {
      ErrorHandler.getInstance().error('Valid point info list is required');
      return false;
    }
    
    if (!template) {
      ErrorHandler.getInstance().error('Vue template is required');
      return false;
    }
    
    if (!Vue) {
      ErrorHandler.getInstance().error('Vue instance is required');
      return false;
    }
    
    return true;
  }

  /**
   * 验证图层名称（抛出异常版本）
   * @param layerName 图层名称
   * @throws 如果图层名称无效则抛出异常
   */
  static validateLayerName(layerName: string): void {
    if (!layerName) {
      throw new Error('Layer name is required');
    }
  }

  /**
   * 验证图像数据
   * @param imageData 图像数据
   * @param allowEmptyImg 是否允许img为空
   * @throws 如果图像数据无效则抛出异常
   */
  static validateImageData(imageData: any, allowEmptyImg: boolean = false): void {
    if (!imageData) {
      throw new Error('Invalid image data: imageData is required');
    }
    if (!allowEmptyImg && !imageData.img) {
      throw new Error('Invalid image data: img is required');
    }
    if (imageData.extent && (!Array.isArray(imageData.extent) || imageData.extent.length !== 4)) {
      throw new Error('Invalid extent: must be an array of 4 numbers [minX, minY, maxX, maxY]');
    }
  }

  /**
   * 验证遮罩数据
   * @param data 遮罩数据
   * @throws 如果遮罩数据无效则抛出异常
   */
  static validateMaskData(data: any): void {
    if (!data) {
      throw new Error('Mask data is required');
    }
  }

  /**
   * 验证地图实例
   * @param map 地图实例
   * @throws 如果地图实例无效则抛出异常
   */
  static validateMapInstance(map: any): void {
    if (!map) {
      throw new Error('Map instance is required');
    }
  }

  /**
   * 验证必需参数
   * @param value 要验证的值
   * @param message 错误消息
   * @throws 如果值为空则抛出异常
   */
  static validateRequired(value: any, message: string): void {
    if (!value) {
      throw new Error(message);
    }
  }

  /**
   * 验证坐标（抛出异常版本）
   * @param longitude 经度
   * @param latitude 纬度
   * @throws 如果坐标无效则抛出异常
   */
  static validateCoordinate(longitude: number, latitude: number): void {
    if (typeof longitude !== 'number' || typeof latitude !== 'number') {
      throw new Error('Longitude and latitude must be numbers');
    }
    
    if (isNaN(longitude) || isNaN(latitude)) {
      throw new Error('Valid longitude and latitude are required');
    }
    
    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }
    
    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }
  }

  /**
   * 验证类型
   * @param value 要验证的值
   * @param expectedType 期望的类型
   * @param message 错误消息
   * @throws 如果类型不匹配则抛出异常
   */
  static validateType(value: any, expectedType: string, message: string): void {
    if (typeof value !== expectedType) {
      throw new Error(message);
    }
  }

  /**
   * 验证非空字符串（抛出异常版本）
   * @param str 字符串
   * @param message 错误消息
   * @throws 如果字符串为空则抛出异常
   */
  static validateNonEmptyString(str: string, message: string): void {
    if (!str || typeof str !== 'string') {
      throw new Error(message);
    }
  }

  /**
   * 验证地图实例（通用版本）
   * @param map 地图实例
   * @throws 如果地图实例无效则抛出异常
   */
  static validateMap(map: any): void {
    if (!map) {
      throw new Error('Map instance is required');
    }
  }

  /**
   * 验证测量类型
   * @param type 测量类型
   * @throws 如果测量类型无效则抛出异常
   */
  static validateMeasureType(type: string): void {
    if (!type || (type !== 'LineString' && type !== 'Polygon')) {
      throw new Error('Invalid measure type. Must be "LineString" or "Polygon"');
    }
  }

  /**
   * 验证正数
   * @param value 数值
   * @param message 错误消息
   * @throws 如果数值不是正数则抛出异常
   */
  static validatePositiveNumber(value: number, message: string): void {
    if (!value || value <= 0) {
      throw new Error(message);
    }
  }

  /**
   * 验证图层名称参数
   * @param layerName 图层名称（字符串或字符串数组）
   * @throws 如果图层名称参数无效则抛出异常
   */
  static validateLayerNameParam(layerName: string | string[]): void {
    if (!layerName || (typeof layerName !== 'string' && !Array.isArray(layerName))) {
      throw new Error('Valid layer name is required');
    }
  }
}
