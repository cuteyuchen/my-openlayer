/**
 * 通用 GeoJSON 数据结构定义。
 */
export interface FeatureData {
  type: string;
  properties: any;
  geometry: {
    type: "Polygon" | "MultiPolygon" | "Point" | "LineString" | "MultiLineString" | "MultiPoint" | "GeometryCollection";
    coordinates: any[];
  }
}

/**
 * 通用 GeoJSON 集合结构。
 */
export interface MapJSONData {
  type: string;
  name?: string;
  features: FeatureData[];
}

export type MeasureHandlerType = 'LineString' | 'Polygon';

export type EventType = 'click' | 'hover' | 'moveend';

/**
 * 兼容性类型别名 - 保持向后兼容。
 * @deprecated 请使用具体的选项接口：PointOptions, LineOptions, PolygonOptions
 */
export type OptionsType = {
  layerName?: string;
  zIndex?: number;
  visible?: boolean;
  opacity?: number;
  fitView?: boolean;
  mapClip?: boolean;
  mapClipData?: MapJSONData;
  dataProjection?: string;
  featureProjection?: string;
  projectionOptOptions?: any;
  style?: any;
  strokeColor?: string | number[];
  strokeWidth?: number;
  lineDash?: number[];
  lineDashOffset?: number;
  fillColor?: string;
  fillColorCallBack?: (feature: any) => string;
  withDefaultStroke?: boolean;
  withDefaultFill?: boolean;
  textVisible?: boolean;
  textCallBack?: (feature: any) => string;
  textFont?: string;
  textFillColor?: string;
  textStrokeColor?: string;
  textStrokeWidth?: number;
  textOffsetY?: number;
  textKey?: string;
  img?: string;
  scale?: number;
  iconColor?: string;
  type?: string;
  mask?: boolean;
};
