/**
 * 错误类型枚举
 */
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MAP_ERROR = 'MAP_ERROR',
  LAYER_ERROR = 'LAYER_ERROR',
  COORDINATE_ERROR = 'COORDINATE_ERROR',
  DATA_ERROR = 'DATA_ERROR',
  COMPONENT_ERROR = 'COMPONENT_ERROR'
}

/**
 * 自定义错误类
 */
export class MyOpenLayersError extends Error {
  public readonly type: ErrorType;
  public readonly timestamp: Date;
  public readonly context?: any;

  constructor(message: string, type: ErrorType, context?: any) {
    super(message);
    this.name = 'MyOpenLayersError';
    this.type = type;
    this.timestamp = new Date();
    this.context = context;

    // 确保错误堆栈正确显示（兼容Node.js和浏览器环境）
    if (typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, MyOpenLayersError);
    } else {
      // 在不支持captureStackTrace的环境中，手动设置stack
      this.stack = (new Error()).stack;
    }
  }
}

/**
 * 错误处理工具类
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorCallbacks: Array<(error: MyOpenLayersError) => void> = [];
  private logLevel: 'debug' | 'info' | 'warn' | 'error' = 'error';

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * 设置日志级别
   * @param level 日志级别
   */
  setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.logLevel = level;
  }

  /**
   * 添加错误回调
   * @param callback 错误回调函数
   */
  addErrorCallback(callback: (error: MyOpenLayersError) => void): void {
    this.errorCallbacks.push(callback);
  }

  /**
   * 移除错误回调
   * @param callback 要移除的回调函数
   */
  removeErrorCallback(callback: (error: MyOpenLayersError) => void): void {
    const index = this.errorCallbacks.indexOf(callback);
    if (index > -1) {
      this.errorCallbacks.splice(index, 1);
    }
  }

  /**
   * 处理错误
   * @param error 错误对象
   */
  handleError(error: MyOpenLayersError): void {
    // 记录错误日志
    this.logError(error);

    // 调用错误回调
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    });
  }

  /**
   * 创建并处理错误
   * @param message 错误消息
   * @param type 错误类型
   * @param context 错误上下文
   */
  createAndHandleError(message: string, type: ErrorType, context?: any): MyOpenLayersError {
    const error = new MyOpenLayersError(message, type, context);
    this.handleError(error);
    return error;
  }

  /**
   * 记录错误日志
   * @param error 错误对象
   */
  private logError(error: MyOpenLayersError): void {
    const logMessage = `[${error.type}] ${error.message}`;
    const logData = {
      message: error.message,
      type: error.type,
      timestamp: error.timestamp,
      context: error.context,
      stack: error.stack
    };

    switch (this.logLevel) {
      case 'debug':
        console.debug(logMessage, logData);
        break;
      case 'info':
        console.info(logMessage, logData);
        break;
      case 'warn':
        console.warn(logMessage, logData);
        break;
      case 'error':
      default:
        console.error(logMessage, logData);
        break;
    }
  }

  /**
   * 验证参数
   * @param condition 验证条件
   * @param message 错误消息
   * @param context 错误上下文
   */
  static validate(condition: boolean, message: string, context?: any): void {
    if (!condition) {
      throw ErrorHandler.getInstance().createAndHandleError(
        message,
        ErrorType.VALIDATION_ERROR,
        context
      );
    }
  }

  /**
   * 验证地图实例
   * @param map 地图实例
   */
  static validateMap(map: any): void {
    ErrorHandler.validate(
      map && typeof map === 'object',
      'Map instance is required',
      { map }
    );
  }

  /**
   * 验证坐标
   * @param longitude 经度
   * @param latitude 纬度
   */
  static validateCoordinates(longitude: number, latitude: number): void {
    ErrorHandler.validate(
      typeof longitude === 'number' && !isNaN(longitude),
      'Valid longitude is required',
      { longitude, latitude }
    );
    
    ErrorHandler.validate(
      typeof latitude === 'number' && !isNaN(latitude),
      'Valid latitude is required',
      { longitude, latitude }
    );
    
    ErrorHandler.validate(
      longitude >= -180 && longitude <= 180,
      'Longitude must be between -180 and 180',
      { longitude, latitude }
    );
    
    ErrorHandler.validate(
      latitude >= -90 && latitude <= 90,
      'Latitude must be between -90 and 90',
      { longitude, latitude }
    );
  }

  /**
   * 验证图层名称
   * @param layerName 图层名称
   */
  static validateLayerName(layerName: string): void {
    ErrorHandler.validate(
      typeof layerName === 'string' && layerName.trim().length > 0,
      'Valid layer name is required',
      { layerName }
    );
  }

  /**
   * 验证数据
   * @param data 数据
   * @param dataType 数据类型描述
   */
  static validateData(data: any, dataType: string): void {
    ErrorHandler.validate(
      data !== null && data !== undefined,
      `${dataType} is required`,
      { data, dataType }
    );
  }

  /**
   * 安全执行函数
   * @param fn 要执行的函数
   * @param errorMessage 错误消息
   * @param errorType 错误类型
   * @param context 错误上下文
   */
  static safeExecute<T>(fn: () => T, errorMessage: string, errorType: ErrorType = ErrorType.COMPONENT_ERROR, context?: any): T {
    try {
      return fn();
    } catch (error) {
      const myError = ErrorHandler.getInstance().createAndHandleError(
        `${errorMessage}: ${error}`,
        errorType,
        { originalError: error, context }
      );
      throw myError;
    }
  }
}