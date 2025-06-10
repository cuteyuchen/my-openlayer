import BaseLayer from "ol/layer/Base";

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

export interface MapInitType {
  layers?: BaseLayer[] | { [key: string]: BaseLayer[] },
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
  radius?: number,
  blur?: number,
  gradient?: string[],
  opacity?: number,
  visible?: boolean,
  zIndex?: number,
  valueKey: string,
}

export interface OptionsType {
  layerName?: string,
  nameKey?: string,
  img?: string,
  scale?: number,
  hasImg?: boolean,
  zIndex?: number,
  visible?: boolean,
  projectionOptOptions?: any,
  strokeColor?: string | number[],
  strokeWidth?: number,
  lineDash?: number[],
  lineDashOffset?: number,
  fillColor?: string,
  textVisible?: boolean,
  textValue?: string,
  textFont?: string,
  textFillColor?: string,
  textStrokeColor?: string,
  textStrokeWidth?: number,
  textOffsetY?: number,
  fitView?: boolean,
  opacity?: number,
  mapClip?: boolean,
  mapClipData?: MapJSONData,
  mask?: boolean,
  iconColor?: string

  [propName: string]: any
}

export interface PointData {
  lgtd: number,
  lttd: number,

  [propName: string]: any
}

export type MeasureHandlerType = 'Polygon' | 'LineString'

export type EventType = 'click' | 'moveend' | 'hover'
