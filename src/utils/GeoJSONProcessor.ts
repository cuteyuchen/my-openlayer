/**
 * GeoJSON 数据标准化工具。
 *
 * 本模块借鉴 mapshaper 对地理数据输入的统一处理思路，
 * 但仅提供轻量的点数据标准化能力，不包含拓扑简化、dissolve、clip/erase 等 GIS 编辑功能。
 * 参见 https://github.com/mbloch/mapshaper (MPL-2.0, Node >=20.11)。
 */

import type { PointData, PointJSONInput } from '../types';
import type { FeatureData, MapJSONData } from '../types';
import type { AddGeoJSONInput, GeoJSONGeometryType, GeoJSONGroupBy } from '../types';

/** *********************类型定义*********************/

/**
 * 点 API 统一输入类型。
 * 支持 PointData 数组、GeoJSON FeatureCollection、单个 Feature、
 * 以及裸 GeoJSON Point / MultiPoint geometry 对象。
 */
export type { PointJSONInput };

/** *********************内部工具函数*********************/

/**
 * 判断输入是否为合法的 GeoJSON Feature（type 为 'Feature' 且包含 geometry）。
 */
function isFeature(obj: unknown): obj is FeatureData {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    (obj as FeatureData).type === 'Feature' &&
    typeof (obj as FeatureData).geometry === 'object'
  );
}

/**
 * 判断输入是否为 GeoJSON FeatureCollection。
 */
function isFeatureCollection(obj: unknown): obj is MapJSONData {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    (obj as MapJSONData).type === 'FeatureCollection' &&
    Array.isArray((obj as MapJSONData).features)
  );
}

/**
 * 判断输入是否为裸 GeoJSON Point geometry。
 */
function isPointGeometry(obj: unknown): obj is { type: 'Point'; coordinates: number[] } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    (obj as { type: string }).type === 'Point' &&
    Array.isArray((obj as { coordinates: number[] }).coordinates)
  );
}

/**
 * 判断输入是否为裸 GeoJSON MultiPoint geometry。
 */
function isMultiPointGeometry(obj: unknown): obj is { type: 'MultiPoint'; coordinates: number[][] } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    (obj as { type: string }).type === 'MultiPoint' &&
    Array.isArray((obj as { coordinates: number[][] }).coordinates)
  );
}

/**
 * 验证单个坐标对 [lng, lat] 是否合法。
 * 要求两个分量均为有限数。
 */
function isValidCoordinate(coord: unknown): coord is [number, number] {
  return (
    Array.isArray(coord) &&
    coord.length >= 2 &&
    Number.isFinite(coord[0]) &&
    Number.isFinite(coord[1])
  );
}

/**
 * 从 GeoJSON Feature 提取单个点。
 * 仅处理 geometry.type === 'Point' 的 Feature，其他类型返回 undefined。
 */
function extractPointFromFeature(feature: FeatureData): PointData | undefined {
  if (feature.geometry?.type !== 'Point') return undefined;
  const coords = feature.geometry.coordinates as number[];
  if (!isValidCoordinate(coords)) return undefined;
  return {
    ...feature.properties,
    lgtd: coords[0],
    lttd: coords[1],
  };
}

/**
 * 从 GeoJSON MultiPoint Feature 提取多个点。
 */
function extractPointsFromMultiPointFeature(feature: FeatureData): PointData[] {
  if (feature.geometry?.type !== 'MultiPoint') return [];
  const coords = feature.geometry.coordinates as number[][];
  const results: PointData[] = [];
  for (const pair of coords) {
    if (!isValidCoordinate(pair)) continue;
    results.push({
      ...feature.properties,
      lgtd: pair[0],
      lttd: pair[1],
    });
  }
  return results;
}

/** *********************公开 API*********************/

/**
 * 将多种形态的点数据输入统一标准化为 `PointData[]`。
 *
 * 支持的输入形态：
 * - `PointData[]`：原样返回（深拷贝后过滤非法坐标）
 * - GeoJSON `FeatureCollection`：遍历 features，提取 Point / MultiPoint geometry
 * - 单个 GeoJSON `Feature`：提取其 Point 或 MultiPoint geometry
 * - 裸 `Point` geometry：转为单元素 PointData 数组
 * - 裸 `MultiPoint` geometry：拆成多个 PointData
 *
 * 过滤规则：
 * - 非 Point / MultiPoint geometry 的 Feature 会被跳过
 * - 坐标含 NaN / Infinity / 缺失的点会被跳过
 * - null / undefined 输入返回空数组
 *
 * @param input 任意兼容的点数据输入
 * @returns 标准化后的 PointData 数组
 */
export function normalizePointData(input: PointJSONInput | null | undefined): PointData[] {
  if (input == null) return [];

  // 数组 — 逐项处理，兼容 PointData[] 和 FeatureData[] 混合
  if (Array.isArray(input)) {
    const results: PointData[] = [];
    for (const item of input) {
      if (typeof item !== 'object' || item === null) continue;

      // PointData 形状（有 lgtd/lttd）
      if (Number.isFinite((item as PointData).lgtd) && Number.isFinite((item as PointData).lttd)) {
        results.push({ ...item } as PointData);
        continue;
      }

      // Feature 形状
      if (isFeature(item)) {
        const pt = extractPointFromFeature(item);
        if (pt) results.push(pt);
        continue;
      }

      // 裸 Point geometry
      if (isPointGeometry(item) && isValidCoordinate(item.coordinates)) {
        results.push({ lgtd: item.coordinates[0], lttd: item.coordinates[1] });
      }
    }
    return results;
  }

  // 非对象直接返回空
  if (typeof input !== 'object') return [];

  // GeoJSON FeatureCollection
  if (isFeatureCollection(input)) {
    const results: PointData[] = [];
    for (const feature of input.features) {
      if (feature.geometry?.type === 'Point') {
        const pt = extractPointFromFeature(feature);
        if (pt) results.push(pt);
      } else if (feature.geometry?.type === 'MultiPoint') {
        results.push(...extractPointsFromMultiPointFeature(feature));
      }
      // 其他 geometry 类型跳过
    }
    return results;
  }

  // 单个 GeoJSON Feature
  if (isFeature(input)) {
    if (input.geometry?.type === 'Point') {
      const pt = extractPointFromFeature(input);
      return pt ? [pt] : [];
    }
    if (input.geometry?.type === 'MultiPoint') {
      return extractPointsFromMultiPointFeature(input);
    }
    return [];
  }

  // 裸 Point geometry
  if (isPointGeometry(input)) {
    if (!isValidCoordinate(input.coordinates)) return [];
    return [{ lgtd: input.coordinates[0], lttd: input.coordinates[1] }];
  }

  // 裸 MultiPoint geometry
  if (isMultiPointGeometry(input)) {
    const results: PointData[] = [];
    for (const pair of input.coordinates) {
      if (!isValidCoordinate(pair)) continue;
      results.push({ lgtd: pair[0], lttd: pair[1] });
    }
    return results;
  }

  return [];
}

/** *********************GeoJSON 分组处理*********************/

/**
 * 将 GeoJSON geometry 类型归类为简化的三大类。
 * 无法识别的类型返回 null。
 */
export function classifyGeometryType(geometryType: string): GeoJSONGeometryType | null {
  switch (geometryType) {
    case 'Point':
    case 'MultiPoint':
      return 'point';
    case 'LineString':
    case 'MultiLineString':
      return 'line';
    case 'Polygon':
    case 'MultiPolygon':
      return 'polygon';
    default:
      return null;
  }
}

/**
 * 将单个 GeoJSON 输入项标准化为 FeatureData 数组。
 * @internal
 */
function normalizeOneGeoJSON(input: MapJSONData | FeatureData | { type: string; coordinates: unknown }): FeatureData[] {
  // FeatureCollection
  if (isFeatureCollection(input)) {
    return input.features;
  }
  // Feature
  if (isFeature(input)) {
    return [input];
  }
  // 裸 geometry → 包装为 Feature
  if (typeof input === 'object' && input !== null && 'type' in input && 'coordinates' in input) {
    const geom = input as { type: string; coordinates: unknown };
    return [{
      type: 'Feature',
      properties: {},
      geometry: {
        type: geom.type as FeatureData['geometry']['type'],
        coordinates: geom.coordinates as FeatureData['geometry']['coordinates'],
      },
    }];
  }
  return [];
}

/**
 * 将 addGeoJSON 的多种输入形态统一标准化为带 datasetKey 的 FeatureData 数组。
 *
 * - 单个 JSON → datasetKey 为 `'default'`
 * - 数组 → datasetKey 为字符串索引 `'0'`, `'1'`, ...
 * - `Record<string, json>` → datasetKey 为 key
 */
export function normalizeGeoJSONInputs(
  data: AddGeoJSONInput | null | undefined
): Array<{ datasetKey: string; features: FeatureData[] }> {
  if (data == null) return [];

  // 数组
  if (Array.isArray(data)) {
    return data.map((item, index) => ({
      datasetKey: String(index),
      features: normalizeOneGeoJSON(item as MapJSONData | FeatureData | { type: string; coordinates: unknown }),
    }));
  }

  // 非对象
  if (typeof data !== 'object') return [];

  // Record<string, json> — 有 type 字段的当作单个 GeoJSON，不是 Record
  const obj = data as Record<string, unknown>;
  if ('type' in obj && typeof obj.type === 'string') {
    // 单个 GeoJSON（FeatureCollection / Feature / Geometry）
    return [{ datasetKey: 'default', features: normalizeOneGeoJSON(data as MapJSONData | FeatureData | { type: string; coordinates: unknown }) }];
  }

  // Record<string, json>
  const results: Array<{ datasetKey: string; features: FeatureData[] }> = [];
  for (const key of Object.keys(obj)) {
    const item = obj[key] as MapJSONData | FeatureData | { type: string; coordinates: unknown };
    results.push({ datasetKey: key, features: normalizeOneGeoJSON(item) });
  }
  return results;
}

/**
 * 按 groupBy 和几何类型将 FeatureData 拆分到不同分组。
 *
 * - 未配置 groupBy 时，每个 datasetKey 成为一个组
 * - 配置 groupBy 字符串时，从 properties 中取该字段值作为 groupKey
 * - 配置 groupBy 回调时，调用回调获取 groupKey
 * - groupKey 取不到时回退到 datasetKey
 */
/**
 * 附加了 datasetKey 元数据的 FeatureData。
 * 用于在 splitByGroupAndGeometry 后保留每个 feature 来源信息。
 */
export type FeatureWithDatasetKey = FeatureData & { _datasetKey: string };

export function splitByGroupAndGeometry(
  normalized: Array<{ datasetKey: string; features: FeatureData[] }>,
  groupBy?: GeoJSONGroupBy
): Record<string, { point: FeatureWithDatasetKey[]; line: FeatureWithDatasetKey[]; polygon: FeatureWithDatasetKey[] }> {
  const result: Record<string, { point: FeatureWithDatasetKey[]; line: FeatureWithDatasetKey[]; polygon: FeatureWithDatasetKey[] }> = {};

  for (const { datasetKey, features } of normalized) {
    for (let index = 0; index < features.length; index++) {
      const feature = features[index];
      const geomType = feature.geometry?.type;
      if (!geomType) continue;

      const category = classifyGeometryType(geomType);
      if (!category) continue;

      // 确定 groupKey
      let groupKey: string;
      if (groupBy === undefined) {
        groupKey = datasetKey;
      } else if (typeof groupBy === 'string') {
        const val = feature.properties?.[groupBy];
        groupKey = val != null ? String(val) : datasetKey;
      } else {
        const val = groupBy(feature.properties ?? {}, { datasetKey, geometryType: category, feature, index });
        groupKey = val != null ? String(val) : datasetKey;
      }

      // 初始化分组
      if (!result[groupKey]) {
        result[groupKey] = { point: [], line: [], polygon: [] };
      }
      // 附加 datasetKey 元数据
      result[groupKey][category].push({ ...feature, _datasetKey: datasetKey });
    }
  }

  return result;
}
