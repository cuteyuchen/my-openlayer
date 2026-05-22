// 导出核心类 - 默认导出
export { default } from './MyOl'
export { default as MyOl } from './MyOl'
export { Point } from './core/point'
export { Line, RiverLayerManager } from './core/line'
export type { RiverLayerOptions, RiverLevelWidthMap } from './core/line'
export { Polygon } from './core/polygon'
export { MapBaseLayers, MapTools, MeasureHandler, ConfigManager, EventManager } from './core/map'
export { VueTemplatePoint } from './core/vue-template-point'
export { SelectHandler } from './core/select'
export { ProjectionManager, PROJECTIONS } from './core/projection'
export type { CustomProjectionRegistration } from './core/projection'

// 新增工具类
export type { MapEventType, EventCallback, MapEventData } from './core/map/EventManager'

// 错误处理
export { ErrorHandler, MyOpenLayersError, ErrorType, LayerNotFoundError, InvalidGeoJSONError, ProjectionError } from './utils/ErrorHandler'

// 验证工具
export { default as ValidationUtils } from './utils/ValidationUtils'

// 类型定义 - 基础接口
export type { BaseOptions, StyleOptions, TextOptions, LayerHandle, AnimatedLayerHandle } from './types'

// 类型定义 - 专用选项接口
export type { PointOptions, LineOptions, FlowLineOptions, FlowLineLayerHandle, PolygonOptions, PulsePointOptions, PulsePointLayerHandle } from './types'

// 类型定义 - 兼容性类型
export type { OptionsType } from './types'

// 类型定义 - 其他接口
export type {
  MapInitType,
  MapLayersOptions,
  HeatMapOptions,
  ImageLayerData,
  MaskLayerOptions,
  FeatureColorUpdateOptions,
  PointData,
  PulsePointIconOptions,
  LineData,
  ClusterOptions,
  MeasureHandlerType,
  VueTemplatePointOptions,
  VueTemplatePointInstance,
  TwinkleItem,
  MapJSONData,
  FeatureData,
  AnnotationType,
  TiandituType,
  MapLayers,
  AnnotationLayerOptions,
  SelectOptions,
  SelectMode,
  SelectCallbackEvent,
  ProgrammaticSelectOptions
} from './types'

// Vue 模板点位状态枚举（运行时值，需要单独导出）
export { VueTemplatePointState } from './types'
