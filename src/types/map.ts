import BaseLayer from "ol/layer/Base";
import TileLayer from "ol/layer/Tile";
import { WMTS } from "ol/source";
import View from "ol/View";
import { Units } from "ol/proj/Units";
import type { MapJSONData } from "./common";

type LayerItem = BaseLayer | TileLayer<WMTS>;

export interface MapInitType {
  layers?: LayerItem[] | { [key: string]: LayerItem[] };
  zoom?: number;
  center?: number[];
  view?: View;
  minZoom?: number;
  maxZoom?: number;
  extent?: number[];
  mapClipData?: MapJSONData;
  token?: string;
  annotation?: boolean;
  enableLog?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  projection?: {
    code: string;
    def?: string;
    extent?: number[];
    worldExtent?: number[];
    units?: Units;
  };
}

export type AnnotationType = 'cva_c' | 'cia_c' | 'cta_c';
export type TiandituType = 'vec_c' | 'img_c' | 'ter_c';

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
  type: AnnotationType;
  token: string;
  zIndex?: number;
  visible?: boolean;
}

export interface HeatMapOptions {
  layerName?: string;
  radius?: number;
  blur?: number;
  gradient?: string[];
  opacity?: number;
  visible?: boolean;
  zIndex?: number;
  valueKey?: string;
}

export interface ImageLayerData {
  img?: string;
  extent?: number[];
}

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
