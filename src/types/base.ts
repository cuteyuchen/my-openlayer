import Feature, { FeatureLike } from "ol/Feature";
import { Style } from "ol/style";
import type { MapJSONData } from "./common";

/**
 * 基础选项接口 - 所有图层的公共配置。
 */
export interface BaseOptions {
  layerName?: string;
  zIndex?: number;
  visible?: boolean;
  opacity?: number;
  fitView?: boolean;
  mapClip?: boolean;
  mapClipData?: MapJSONData;
  dataProjection?: string;
  featureProjection?: string;
  /**
   * @deprecated 新项目请使用 dataProjection / featureProjection。
   */
  projectionOptOptions?: any;
  style?: Style | Style[] | ((feature: FeatureLike) => Style | Style[]);
}

/**
 * 图形样式相关配置。
 */
export interface StyleOptions {
  strokeColor?: string | number[];
  strokeWidth?: number;
  lineDash?: number[];
  lineDashOffset?: number;
  fillColor?: string;
  fillColorCallBack?: (feature: Feature) => string;
  withDefaultStroke?: boolean;
  withDefaultFill?: boolean;
}

/**
 * 文本标注相关配置。
 */
export interface TextOptions {
  textVisible?: boolean;
  textCallBack?: (feature: Feature) => string;
  textFont?: string;
  textFillColor?: string;
  textStrokeColor?: string;
  textStrokeWidth?: number;
  textOffsetY?: number;
}
