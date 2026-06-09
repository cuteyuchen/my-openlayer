/**
 * 验证工具类
 * 统一管理参数校验逻辑，错误记录由调用方或 ErrorHandler 负责。
 */
import { ErrorHandler, ErrorType } from './ErrorHandler';

export default class ValidationUtils {
  /**
   * 判断值是否为有效数字。
   */
  private static isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
  }

  /**
   * 验证坐标是否有效。
   */
  static isValidCoordinate(longitude: number, latitude: number): boolean {
    return (
      ValidationUtils.isFiniteNumber(longitude) &&
      ValidationUtils.isFiniteNumber(latitude) &&
      longitude >= -180 &&
      longitude <= 180 &&
      latitude >= -90 &&
      latitude <= 90
    );
  }

  /**
   * 验证经纬度坐标，保留布尔返回以兼容旧调用。
   */
  static validateLngLat(lgtd: number, lttd: number): boolean {
    return ValidationUtils.isValidCoordinate(lgtd, lttd);
  }

  /**
   * 验证点数据数组，保留布尔返回以兼容旧调用。
   */
  static validatePointData(pointData: any[]): boolean {
    return Array.isArray(pointData) && pointData.length > 0;
  }

  /**
   * 验证单个点的坐标，保留布尔返回以兼容旧调用。
   */
  static validateCoordinates(item: any): boolean {
    if (!item || item.lgtd === undefined || item.lgtd === null || item.lttd === undefined || item.lttd === null) {
      return false;
    }
    return ValidationUtils.isValidCoordinate(Number(item.lgtd), Number(item.lttd));
  }

  /**
   * 验证颜色字符串是否有效。
   */
  static isValidColor(color: string): boolean {
    if (!color || typeof color !== 'string') {
      return false;
    }

    const colorRegex = /^(#[0-9A-Fa-f]{3,8}|rgba?\([^)]+\)|[a-zA-Z]+)$/;
    return colorRegex.test(color);
  }

  /**
   * 验证图层名称是否有效。
   */
  static isValidLayerName(layerName: string): boolean {
    return typeof layerName === 'string' && layerName.trim().length > 0;
  }

  /**
   * 验证范围是否有效。
   */
  static isValidExtent(extent: number[]): boolean {
    return (
      Array.isArray(extent) &&
      extent.length === 4 &&
      extent.every(coord => ValidationUtils.isFiniteNumber(coord)) &&
      extent[0] < extent[2] &&
      extent[1] < extent[3]
    );
  }

  /**
   * 验证 GeoJSON 数据，保留布尔返回以兼容旧调用。
   */
  static validateGeoJSONData(data: any): boolean {
    return !!data && Array.isArray(data.features);
  }

  /**
   * 验证配置选项，保留布尔返回以兼容旧调用。
   */
  static validateOptions(options: any): boolean {
    return !!options && typeof options === 'object';
  }

  /**
   * 验证数值范围。
   */
  static validateNumberRange(value: number, min: number, max: number): boolean {
    return ValidationUtils.isFiniteNumber(value) && value >= min && value <= max;
  }

  /**
   * 验证 DOM 元素 ID，保留布尔返回以兼容旧调用。
   */
  static validateElementId(id: string): boolean {
    return typeof id === 'string' && id.trim().length > 0;
  }

  /**
   * 验证 Vue 相关参数，保留布尔返回以兼容旧调用。
   */
  static validateVueParams(pointInfoList: any[], template: any, Vue: any): boolean {
    return Array.isArray(pointInfoList) && pointInfoList.length > 0 && !!template && !!Vue;
  }

  /**
   * 验证图层名称（抛出异常版本）。
   */
  static validateLayerName(layerName: string): void {
    if (!ValidationUtils.isValidLayerName(layerName)) {
      throw ErrorHandler.getInstance().createAndHandleError('Layer name is required', ErrorType.VALIDATION_ERROR);
    }
  }

  /**
   * 验证图像数据。
   */
  static validateImageData(imageData: any, allowEmptyImg: boolean = false): void {
    if (!imageData) {
      throw ErrorHandler.getInstance().createAndHandleError('Invalid image data: imageData is required', ErrorType.VALIDATION_ERROR);
    }
    if (!allowEmptyImg && !imageData.img) {
      throw ErrorHandler.getInstance().createAndHandleError('Invalid image data: img is required', ErrorType.VALIDATION_ERROR);
    }
    if (imageData.extent && !ValidationUtils.isValidExtent(imageData.extent)) {
      throw ErrorHandler.getInstance().createAndHandleError('Invalid extent: must be an array of 4 numbers [minX, minY, maxX, maxY]', ErrorType.VALIDATION_ERROR);
    }
  }

  /**
   * 验证遮罩数据。
   */
  static validateMaskData(data: any): void {
    if (data === undefined || data === null) {
      throw ErrorHandler.getInstance().createAndHandleError('Mask data is required', ErrorType.VALIDATION_ERROR);
    }
  }

  /**
   * 验证地图实例。
   */
  static validateMapInstance(map: any): void {
    ValidationUtils.validateMap(map);
  }

  /**
   * 验证必需参数。
   */
  static validateRequired(value: any, message: string): void {
    if (value === undefined || value === null || value === '') {
      throw ErrorHandler.getInstance().createAndHandleError(message, ErrorType.VALIDATION_ERROR);
    }
  }

  /**
   * 验证坐标（抛出异常版本）。
   */
  static validateCoordinate(longitude: number, latitude: number): void {
    if (!ValidationUtils.isFiniteNumber(longitude) || !ValidationUtils.isFiniteNumber(latitude)) {
      throw ErrorHandler.getInstance().createAndHandleError('Longitude and latitude must be valid numbers', ErrorType.VALIDATION_ERROR);
    }

    if (longitude < -180 || longitude > 180) {
      throw ErrorHandler.getInstance().createAndHandleError('Longitude must be between -180 and 180', ErrorType.VALIDATION_ERROR);
    }

    if (latitude < -90 || latitude > 90) {
      throw ErrorHandler.getInstance().createAndHandleError('Latitude must be between -90 and 90', ErrorType.VALIDATION_ERROR);
    }
  }

  /**
   * 验证类型。
   */
  static validateType(value: any, expectedType: string, message: string): void {
    if (typeof value !== expectedType) {
      throw ErrorHandler.getInstance().createAndHandleError(message, ErrorType.VALIDATION_ERROR);
    }
  }

  /**
   * 验证非空字符串。
   */
  static validateNonEmptyString(str: string, message: string): void {
    if (!ValidationUtils.isValidLayerName(str)) {
      throw ErrorHandler.getInstance().createAndHandleError(message, ErrorType.VALIDATION_ERROR);
    }
  }

  /**
   * 验证地图实例（通用版本）。
   */
  static validateMap(map: any): void {
    if (!map) {
      throw ErrorHandler.getInstance().createAndHandleError('Map instance is required', ErrorType.VALIDATION_ERROR);
    }
  }

  /**
   * 验证测量类型。
   */
  static validateMeasureType(type: string): void {
    if (type !== 'LineString' && type !== 'Polygon') {
      throw ErrorHandler.getInstance().createAndHandleError('Invalid measure type. Must be "LineString" or "Polygon"', ErrorType.VALIDATION_ERROR);
    }
  }

  /**
   * 验证正数。
   */
  static validatePositiveNumber(value: number, message: string): void {
    if (!ValidationUtils.isFiniteNumber(value) || value <= 0) {
      throw ErrorHandler.getInstance().createAndHandleError(message, ErrorType.VALIDATION_ERROR);
    }
  }

  /**
   * 验证图层名称参数。
   */
  static validateLayerNameParam(layerName: string | string[]): void {
    const isValidString = typeof layerName === 'string' && layerName.trim().length > 0;
    const isValidArray = Array.isArray(layerName) && layerName.length > 0 && layerName.every(ValidationUtils.isValidLayerName);
    if (!isValidString && !isValidArray) {
      throw ErrorHandler.getInstance().createAndHandleError('Valid layer name is required', ErrorType.VALIDATION_ERROR);
    }
  }
}
