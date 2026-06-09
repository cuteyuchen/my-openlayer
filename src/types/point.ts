import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import type { BaseOptions, StyleOptions, TextOptions } from "./base";
import type { AnimatedLayerHandle } from "./handle";
import type { FeatureData, MapJSONData } from "./common";

export interface PointOptions extends BaseOptions, StyleOptions, TextOptions {
  textKey?: string;
  img?: string;
  scale?: number;
  iconColor?: string;
  /** 圆点填充颜色。未设置 img 时生效，与 circleRadius 搭配绘制纯色圆点。 */
  circleColor?: string;
  /** 圆点半径（像素），默认 6。仅在未设置 img 时生效。 */
  circleRadius?: number;
}

export interface PointData {
  lgtd: number;
  lttd: number;
  [key: string]: unknown;
}

/** *********************点 JSON 统一输入类型*********************/
export type PointJSONInput =
  | PointData[]
  | MapJSONData
  | FeatureData
  | { type: 'Point'; coordinates: number[] }
  | { type: 'MultiPoint'; coordinates: number[][] };

export interface ClusterOptions extends PointOptions {
  distance?: number;
  minDistance?: number;
}

export interface PulsePointIconOptions {
  /**
   * 图标资源 URL。
   */
  img?: string;
  /**
   * @deprecated 请使用 `img` 字段，3.x 末尾会移除。
   */
  src?: string;
  scale?: number;
  color?: string;
  radius?: number;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

export interface PulsePointOptions extends PointOptions {
  levelKey?: string;
  icon?: PulsePointIconOptions;
  pulse?: {
    enabled?: boolean;
    duration?: number;
    radius?: [number, number];
    colorMap?: Record<string | number, string>;
    strokeColorMap?: Record<string | number, string>;
    strokeWidth?: number;
    frameCount?: number;
  };
}

export interface PulsePointLayerHandle extends AnimatedLayerHandle<VectorLayer<VectorSource>> {
  layer: VectorLayer<VectorSource>;
  source: VectorSource;
  start: () => void;
  stop: () => void;
  setVisible: (visible: boolean) => void;
  updateData: (data: PointData[]) => void;
  remove: () => void;
}

export interface TwinkleItem extends PointData {
  className?: string;
  element?: HTMLElement | ((item: TwinkleItem) => HTMLElement);
  [key: string]: unknown;
}
