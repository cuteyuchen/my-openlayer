/**
 * addGeoJSON 综合方法相关类型定义。
 */

import type { FeatureData, MapJSONData } from './common';
import type { PointOptions } from './point';
import type { LineOptions } from './line';
import type { PolygonOptions } from './polygon';
import type { LayerHandle } from './handle';

/** *********************输入类型*********************/

/**
 * 裸 GeoJSON geometry 对象（非 Feature、非 FeatureCollection）。
 */
type GeometryLike = { type: string; coordinates: unknown };

/**
 * addGeoJSON 统一输入类型。
 * 支持单个 GeoJSON、数组、或 `{ key: json }` 对象。
 */
export type AddGeoJSONInput =
  | MapJSONData
  | FeatureData
  | GeometryLike
  | Array<MapJSONData | FeatureData | GeometryLike>
  | Record<string, MapJSONData | FeatureData | GeometryLike>;

/** *********************分组与命名类型*********************/

/**
 * GeoJSON 几何分类（简化为三大类）。
 */
export type GeoJSONGeometryType = 'point' | 'line' | 'polygon';

/**
 * 分组依据：属性名字符串或回调函数。
 */
export type GeoJSONGroupBy =
  | string
  | ((
      properties: Record<string, unknown>,
      context: {
        datasetKey: string;
        geometryType: GeoJSONGeometryType;
        feature: FeatureData;
        index: number;
      }
    ) => string | number | undefined | null);

/**
 * 图层命名：字符串、字符串数组、对象映射、或回调函数。
 */
export type GeoJSONLayerName =
  | string
  | string[]
  | Record<string, string>
  | ((context: {
      datasetKey: string;
      groupKey: string;
      geometryType: GeoJSONGeometryType;
      index: number;
    }) => string);

/** *********************选项类型*********************/

/**
 * addGeoJSON 点图层专用选项，扩展了 styleByProperties 回调。
 */
export interface AddGeoJSONPointOptions extends PointOptions {
  /**
   * 按 feature properties 返回不同样式选项。
   * properties 为原始 GeoJSON Feature.properties，不包含点坐标转换产生的 lgtd/lttd。
   * context.feature 为真实 GeoJSON Feature，context.index 为当前点分组内索引。
   * 回调结果与 base options 合并，回调结果优先（style 字段除外）。
   */
  styleByProperties?: (
    properties: Record<string, unknown>,
    context: {
      datasetKey: string;
      groupKey: string;
      feature: FeatureData;
      index: number;
    }
  ) => Partial<PointOptions> | undefined | null;
}

/**
 * addGeoJSON 方法配置选项。
 */
export interface AddGeoJSONOptions {
  /** 图层命名规则。 */
  layerName: GeoJSONLayerName;
  /** 分组依据：属性名或回调函数。 */
  groupBy?: GeoJSONGroupBy;
  /** 数据坐标系。 */
  dataProjection?: string;
  /** 地图坐标系。 */
  featureProjection?: string;
  /** 是否自动缩放到数据范围。 */
  fitView?: boolean;
  /** 点图层选项。 */
  point?: AddGeoJSONPointOptions;
  /** 线图层选项。 */
  line?: LineOptions;
  /** 面图层选项。 */
  polygon?: PolygonOptions;
}

/** *********************句柄类型*********************/

/**
 * 单个分组的图层句柄集合。
 */
export interface GeoJSONGroupHandle {
  point: LayerHandle | null;
  line: LayerHandle | null;
  polygon: LayerHandle | null;
  handles: LayerHandle[];
  setVisible(visible: boolean): void;
  remove(): void;
}

/**
 * addGeoJSON 返回的总句柄，支持整体和按组控制。
 */
export interface GeoJSONRenderHandle {
  groups: Record<string, GeoJSONGroupHandle>;
  handles: LayerHandle[];
  /** 按 groupKey 索引的点图层句柄，方便 handle.point[groupKey] 访问。 */
  point: Record<string, LayerHandle | null>;
  /** 按 groupKey 索引的线图层句柄，方便 handle.line[groupKey] 访问。 */
  line: Record<string, LayerHandle | null>;
  /** 按 groupKey 索引的面图层句柄，方便 handle.polygon[groupKey] 访问。 */
  polygon: Record<string, LayerHandle | null>;
  setVisible(visible: boolean): void;
  setGroupVisible(groupKey: string, visible: boolean): void;
  removeGroup(groupKey: string): void;
  remove(): void;
}
