import type { BaseOptions, StyleOptions, TextOptions } from "./base";

export interface PolygonOptions extends BaseOptions, StyleOptions, TextOptions {
  textKey?: string;
  mask?: boolean;
}

export interface FeatureColorUpdateOptions extends BaseOptions, StyleOptions, TextOptions {
  textKey?: string;
}
