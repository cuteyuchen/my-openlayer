// 导出核心类 - 默认导出
export { default } from './MyOl'
export { default as MyOl } from './MyOl'
export { default as Point } from './core/Point'
export { default as Line } from './core/Line'
export { default as Polygon } from './core/Polygon'
export { default as MapBaseLayers } from './core/MapBaseLayers'
export { default as MapTools } from './core/MapTools'
export { default as MeasureHandler } from './core/MeasureHandler'
export { default as DomPoint } from './core/DomPoint'

// 新增工具类
export { ConfigManager } from './core/ConfigManager'
export { EventManager } from './core/EventManager'
export type { MapEventType, EventCallback, MapEventData } from './core/EventManager'

// 错误处理
export { ErrorHandler, MyOpenLayersError, ErrorType } from './utils/ErrorHandler'

// 类型定义
export {
  // 基础接口
  BaseOptions,
  StyleOptions,
  TextOptions,
  // 专用选项接口
  PointOptions,
  LineOptions,
  PolygonOptions,
  // 兼容性类型
  OptionsType,
  // 其他接口
  MapInitType,
  MapLayersOptions,
  HeatMapOptions,
  ImageLayerData,
  MaskLayerOptions,
  ColorMap,
  FeatureColorUpdateOptions,
  PointData,
  LineData,
  ClusterOptions,
  MeasureHandlerType,
  EventType,
  DomPointOptions,
  MapJSONData,
  Feature,
  AnnotationType,
  TiandituType,
  MapLayers,
  AnnotationLayerOptions
} from './types'
