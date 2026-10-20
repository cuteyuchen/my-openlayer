import type { BaseOptions, StyleOptions, TextOptions } from "./base";

export interface PolygonOptions extends BaseOptions, StyleOptions, TextOptions {
  textKey?: string;
  mask?: boolean;
  /** 同一图层内面与文字的样式层级，不影响图层 zIndex。 */
  styleZIndex?: number;
}

export interface FeatureColorUpdateOptions extends BaseOptions, StyleOptions, TextOptions {
  textKey?: string;
  /** 更新后的样式层级；未指定时沿用要素当前样式层级。 */
  styleZIndex?: number;
}
