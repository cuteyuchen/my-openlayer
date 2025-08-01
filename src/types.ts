import BaseLayer from "ol/layer/Base";
import TileLayer from "ol/layer/Tile";
import { WMTS } from "ol/source";

export interface Feature {
  type: string;
  properties: any;
  geometry: {
    type: "Polygon" | "MultiPolygon" | "Point" | "LineString" | "MultiLineString" | "MultiPoint" | "GeometryCollection";
    coordinates: any[];
  }
}

export interface MapJSONData {
  type: string,
  name?: string,
  features: Feature[]
}
type LayerItem = BaseLayer | TileLayer<WMTS>
export interface MapInitType {
  layers?: LayerItem[] | { [key: string]: LayerItem[] },
  zoom?: number,
  center?: number[],
  view?: any,
  minZoom?: number,
  maxZoom?: number,
  extent?: number[],
  mapClipData?: MapJSONData,
  token?: string,
  annotation?: boolean //注记
}

export type AnnotationType = 'cva_c' | 'cia_c' | 'cta_c'
export type TiandituType = 'vec_c' | 'img_c' | 'ter_c' | string

export interface MapLayers {
  vec_c?: BaseLayer[];
  img_c?: BaseLayer[];
  ter_c?: BaseLayer[];

  [key: string]: BaseLayer[] | undefined;
}

export interface MapLayersOptions {
  layers?: BaseLayer[] | MapLayers;
  zIndex?: number;
  mapClip?: boolean;
  mapClipData?: MapJSONData;
  token?: string;
  annotation?: boolean;
}

export interface AnnotationLayerOptions {
  type: AnnotationType,
  token: string,
  zIndex?: number,
  visible?: boolean
}

export interface HeatMapOptions {
  layerName?: string,
  radius?: number,
  blur?: number,
  gradient?: string[],
  opacity?: number,
  visible?: boolean,
  zIndex?: number,
  valueKey?: string,
}

/**
 * 基础选项接口 - 所有图层的公共配置
 */
export interface BaseOptions {
  /** 图层名称 */
  layerName?: string;
  /** 图层层级 */
  zIndex?: number;
  /** 图层可见性 */
  visible?: boolean;
  /** 图层透明度 */
  opacity?: number;
  /** 是否适应视图 */
  fitView?: boolean;
  /** 地图裁剪 */
  mapClip?: boolean;
  /** 地图裁剪数据 */
  mapClipData?: MapJSONData;
  /** 投影选项 */
  projectionOptOptions?: any;
  /** 扩展属性 */
  [propName: string]: any;
}

/**
 * 样式选项接口 - 图形样式相关配置
 */
export interface StyleOptions {
  /** 描边颜色 */
  strokeColor?: string | number[];
  /** 描边宽度 */
  strokeWidth?: number;
  /** 线条虚线样式 */
  lineDash?: number[];
  /** 线条虚线偏移 */
  lineDashOffset?: number;
  /** 填充颜色 */
  fillColor?: string;
  /** 填充颜色回调函数 */
  fillColorCallBack?: (feature: any) => string;
}

/**
 * 文本选项接口 - 文本标注相关配置
 */
export interface TextOptions {
  /** 文本可见性 */
  textVisible?: boolean;
  /** 文本内容回调函数 */
  textCallBack?: (feature: any) => string;
  /** 文本字体 */
  textFont?: string;
  /** 文本填充颜色 */
  textFillColor?: string;
  /** 文本描边颜色 */
  textStrokeColor?: string;
  /** 文本描边宽度 */
  textStrokeWidth?: number;
  /** 文本Y轴偏移 */
  textOffsetY?: number;
}

/**
 * 点位选项接口 - 点位图层专用配置
 */
export interface PointOptions extends BaseOptions, StyleOptions, TextOptions {
  /** 文本字段键 */
  textKey?: string;
  /** 图标图片 */
  img?: string;
  /** 图标缩放比例 */
  scale?: number;
  /** 图标颜色 */
  iconColor?: string;
}

/**
 * 线条选项接口 - 线条图层专用配置
 */
export interface LineOptions extends BaseOptions, StyleOptions, TextOptions {
  /** 线条类型 */
  type?: string;
}

/**
 * 多边形选项接口 - 多边形图层专用配置
 */
export interface PolygonOptions extends BaseOptions, StyleOptions, TextOptions {
  /** 文本字段键 */
  textKey?: string;
  /** 是否为蒙版 */
  mask?: boolean;
}

/**
 * 兼容性类型别名 - 保持向后兼容
 * @deprecated 请使用具体的选项接口：PointOptions, LineOptions, PolygonOptions
 */
export type OptionsType = BaseOptions & StyleOptions & TextOptions & {
  textKey?: string;
  img?: string;
  scale?: number;
  iconColor?: string;
  type?: string;
  mask?: boolean;
};

/**
 * 图片图层数据接口
 */
export interface ImageLayerData {
  img?: string;
  extent?: number[];
}

/**
 * 蒙版图层配置接口
 */
export interface MaskLayerOptions {
  extent?: any;
  fillColor?: string;
  strokeWidth?: number;
  strokeColor?: string;
  zIndex?: number;
  opacity?: number;
  visible?: boolean;
  layerName?: string;
}

/**
 * 颜色映射接口
 */
export interface ColorMap {
  [level: string]: string;
}

/**
 * 要素颜色更新选项接口
 */
export interface FeatureColorUpdateOptions extends BaseOptions, StyleOptions, TextOptions {
  /** 文本字段键 */
  textKey?: string;
}

/**
 * 点位数据接口
 */
export interface PointData {
  lgtd: number;
  lttd: number;
  [key: string]: any;
}

/**
 * 线数据接口
 */
export interface LineData {
  type: string;
  coordinates: number[][];
  [key: string]: any;
}

/**
 * 聚合选项接口
 */
export interface ClusterOptions extends PointOptions {
  /** 聚合距离 */
  distance?: number;
  /** 最小聚合距离 */
  minDistance?: number;
}

/**
 * 测量处理器类型
 */
export type MeasureHandlerType = 'LineString' | 'Polygon';

/**
 * 事件类型
 */
export type EventType = 'click' | 'hover' | 'moveend';

/**
 * Vue实例接口
 */
export interface VueInstance {
  mount(element: Element | string): VueInstance;
  unmount?(): void;
  $destroy?(): void;
  [key: string]: any;
}

/**
 * Vue应用接口
 */
export interface VueApp {
  mount(element: Element | string): VueInstance;
  unmount(): void;
  [key: string]: any;
}

/**
 * Vue 2.x 实例接口
 */
export interface VueLegacyInstance {
  $mount(element?: Element | string): VueLegacyInstance;
  $destroy(): void;
  [key: string]: any;
}

/**
 * DOM点位状态枚举
 */
export enum VueTemplatePointState {
  CREATED = 'created',
  MOUNTED = 'mounted',
  VISIBLE = 'visible',
  HIDDEN = 'hidden',
  DESTROYED = 'destroyed'
}

/**
 * Vue模板点位选项接口
 */
export interface VueTemplatePointOptions {
  Template: any;
  lgtd: number;
  lttd: number;
  props?: any;
  styleType?: 'default' | 'custom';
  positioning?: 'bottom-left' | 'bottom-center' | 'bottom-right' | 'center-left' | 'center-center' | 'center-right' | 'top-left' | 'top-center' | 'top-right';
  stopEvent?: boolean;
  visible?: boolean;
  className?: string;
  zIndex?: number;
}

/**
 * Vue模板点位实例接口
 */
export interface VueTemplatePointInstance {
  id: string;
  dom: HTMLElement;
  anchor: any;
  app: VueApp | VueLegacyInstance | null;
  state: VueTemplatePointState;
  position: number[];
  options: VueTemplatePointOptions;
  setVisible(visible: boolean): void;
  updatePosition(lgtd: number, lttd: number): void;
  updateProps(newProps: Record<string, any>): void;
  setStyle(styles: Partial<CSSStyleDeclaration>): void;
  addClass(className: string): void;
  removeClass(className: string): void;
  remove(): void;
  getState(): VueTemplatePointState;
  getOptions(): Readonly<VueTemplatePointOptions>;
  isDestroyed(): boolean;
}
