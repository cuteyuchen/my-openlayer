/**
 * GeoJSON 渲染模块
 * 负责将混合几何类型的 GeoJSON 数据渲染为点/线/面图层，返回统一句柄。
 * 从 MyOl.addGeoJSON 提取，保持对外 API 不变。
 */

import type { Point } from '../point';
import type { Line } from '../line';
import type { Polygon } from '../polygon';
import type {
  AddGeoJSONInput,
  AddGeoJSONOptions,
  GeoJSONRenderHandle,
  GeoJSONGroupHandle,
  GeoJSONLayerName,
  FeatureData,
  MapJSONData,
  LayerHandle,
  PointData,
  PointJSONInput,
  PointOptions,
} from '../../types';
import {
  normalizeGeoJSONInputs,
  splitByGroupAndGeometry,
  type FeatureWithDatasetKey,
} from '../../utils/GeoJSONProcessor';

/**
 * renderGeoJSON 的依赖注入接口
 * 避免直接依赖 MyOl 实例，便于测试和解耦
 */
export interface GeoJSONRenderDeps {
  getPoint(): Point;
  getLine(): Line;
  getPolygon(): Polygon;
}

/**
 * 从 feature 中剥离 _datasetKey 元数据
 */
function stripDatasetMeta(f: FeatureWithDatasetKey): FeatureData {
  const { _datasetKey, ...rest } = f;
  return rest;
}

/**
 * 解析 GeoJSON 图层名称
 */
function resolveGeoJSONLayerName(
  layerName: GeoJSONLayerName,
  groupKey: string,
  geometryType: 'point' | 'line' | 'polygon',
  datasetKey: string,
  index: number,
  singleGroup: boolean,
): string {
  if (typeof layerName === 'function') {
    return layerName({ datasetKey, groupKey, geometryType, index });
  }
  if (typeof layerName === 'string') {
    return layerName;
  }

  // 确定 base 名称
  let base: string;
  if (Array.isArray(layerName)) {
    base = layerName[Number(datasetKey)] ?? `${layerName[0] ?? 'geojson'}_${datasetKey}`;
  } else {
    base = layerName[datasetKey] ?? datasetKey;
  }
  // 单 group 无 groupBy 时省略 groupKey
  if (singleGroup) {
    return `${base}__${geometryType}`;
  }
  return `${base}__${groupKey}__${geometryType}`;
}

/**
 * 创建点图层 handle（含 styleByProperties 分支）
 */
function createPointLayerHandle(
  pointFeatures: FeatureWithDatasetKey[],
  options: AddGeoJSONOptions,
  groupKey: string,
  datasetKey: string,
  singleGroup: boolean,
  pointModule: Point,
): { handle: LayerHandle | null } {
  const pointOpts = options.point;
  const name = resolveGeoJSONLayerName(options.layerName, groupKey, 'point', datasetKey, 0, singleGroup);

  if (pointOpts?.styleByProperties) {
    // 通过 feature style resolver 实现逐 feature 样式，保持单图层
    const baseOpts = { ...pointOpts };
    delete (baseOpts as Record<string, unknown>).styleByProperties;

    const pointIndexKey = Symbol('geojsonPointIndex');
    // 为传入点图层的数据挂临时索引标记，
    // normalizePointData 的 spread 会将标记带入 rawData，
    // resolver 再用它反查无内部字段的真实 GeoJSON Feature。
    const cleanPointFeatures = pointFeatures.map(stripDatasetMeta);
    const taggedPointFeatures: FeatureData[] = [];
    for (let i = 0; i < pointFeatures.length; i++) {
      const feature = cleanPointFeatures[i];
      const tagged: FeatureData = {
        ...feature,
        properties: { ...feature.properties, [pointIndexKey]: i },
      };
      taggedPointFeatures.push(tagged);
    }

    const styleResolver = ((olFeature: import('ol/Feature').default) => {
      const rawProps = (olFeature.get('rawData') ?? {}) as Record<string, unknown>;
      // 从临时标记读取组内索引，并从 rawData 中移除内部字段
      const rawWithIndex = rawProps as Record<PropertyKey, unknown>;
      const idx = Number.isInteger(rawWithIndex[pointIndexKey]) ? rawWithIndex[pointIndexKey] as number : 0;
      delete rawWithIndex[pointIndexKey];
      // 使用 stripped feature 的 properties（不含 lgtd/lttd）作为回调第一个参数
      const cleanProps = cleanPointFeatures[idx]?.properties ?? rawProps;
      const override = pointOpts.styleByProperties!(cleanProps, {
        datasetKey,
        groupKey,
        // 传入去除了 _datasetKey 元数据的真实 GeoJSON Feature
        feature: cleanPointFeatures[idx] ?? (rawProps as unknown as FeatureData),
        // 传入该 feature 在点分组内的真实索引
        index: idx,
      });
      // rawProps 仍包含 lgtd/lttd，传给 createPointStyle 用于坐标计算
      return pointModule.createPointStyle(override ? { ...baseOpts, ...override } : baseOpts, rawProps as PointData);
    }) as PointOptions['style'];

    const h = pointModule.addPoint(
      taggedPointFeatures as unknown as PointJSONInput,
      { ...baseOpts, layerName: name, style: styleResolver } as any
    );
    return { handle: h ?? null };
  }

  const h = pointModule.addPoint(
    pointFeatures.map(stripDatasetMeta) as unknown as PointJSONInput,
    { ...pointOpts, layerName: name } as any
  );
  return { handle: h ?? null };
}

/**
 * 创建线图层 handle
 */
function createLineHandle(
  lineFeatures: FeatureWithDatasetKey[],
  options: AddGeoJSONOptions,
  groupKey: string,
  datasetKey: string,
  singleGroup: boolean,
  lineModule: Line,
): LayerHandle | null {
  const name = resolveGeoJSONLayerName(options.layerName, groupKey, 'line', datasetKey, 0, singleGroup);
  const lineData: MapJSONData = { type: 'FeatureCollection', features: lineFeatures.map(stripDatasetMeta) };
  return lineModule.addLine(lineData, {
    ...options.line,
    layerName: name,
    dataProjection: options.dataProjection,
    featureProjection: options.featureProjection,
  } as any) ?? null;
}

/**
 * 创建面图层 handle
 */
function createPolygonHandle(
  polygonFeatures: FeatureWithDatasetKey[],
  options: AddGeoJSONOptions,
  groupKey: string,
  datasetKey: string,
  singleGroup: boolean,
  polygonModule: Polygon,
): LayerHandle | null {
  const name = resolveGeoJSONLayerName(options.layerName, groupKey, 'polygon', datasetKey, 0, singleGroup);
  const polyData: MapJSONData = { type: 'FeatureCollection', features: polygonFeatures.map(stripDatasetMeta) };
  return polygonModule.addPolygon(polyData, {
    ...options.polygon,
    layerName: name,
    dataProjection: options.dataProjection,
    featureProjection: options.featureProjection,
    fitView: options.fitView,
  } as any) ?? null;
}

/**
 * 组装 GeoJSONRenderHandle
 * 通过闭包维护 allHandles / groupHandles / pointMap / lineMap / polygonMap，
 * removeGroup / remove 不依赖 this 上下文。
 */
function createRenderHandle(
  allHandles: LayerHandle[],
  groupHandles: Record<string, GeoJSONGroupHandle>,
  pointMap: Record<string, LayerHandle | null>,
  lineMap: Record<string, LayerHandle | null>,
  polygonMap: Record<string, LayerHandle | null>,
): GeoJSONRenderHandle {
  return {
    groups: groupHandles,
    handles: allHandles,
    point: pointMap,
    line: lineMap,
    polygon: polygonMap,
    setVisible(visible: boolean) {
      for (const handle of allHandles) {
        handle.setVisible(visible);
      }
    },
    setGroupVisible(groupKey: string, visible: boolean) {
      groupHandles[groupKey]?.setVisible(visible);
    },
    removeGroup(groupKey: string) {
      const gh = groupHandles[groupKey];
      if (gh) {
        gh.remove();
        // 从 allHandles 中移除
        for (const h of gh.handles) {
          const idx = allHandles.indexOf(h);
          if (idx >= 0) allHandles.splice(idx, 1);
        }
        delete groupHandles[groupKey];
        // 同步清理 point/line/polygon 索引
        delete pointMap[groupKey];
        delete lineMap[groupKey];
        delete polygonMap[groupKey];
      }
    },
    remove() {
      for (const handle of allHandles) {
        handle.remove();
      }
      allHandles.length = 0;
      for (const key of Object.keys(groupHandles)) {
        delete groupHandles[key];
      }
      for (const key of Object.keys(pointMap)) {
        delete pointMap[key];
      }
      for (const key of Object.keys(lineMap)) {
        delete lineMap[key];
      }
      for (const key of Object.keys(polygonMap)) {
        delete polygonMap[key];
      }
    },
  };
}

/**
 * 综合 GeoJSON 渲染
 *
 * 自动识别点/线/面几何类型，按分组创建图层，返回统一句柄。
 * 支持单个 GeoJSON、GeoJSON 数组、或 `{ key: json }` 对象。
 *
 * @param data GeoJSON 输入数据
 * @param options 配置选项（含 layerName、groupBy、各类型样式）
 * @param deps 依赖注入（getPoint / getLine / getPolygon）
 * @returns GeoJSONRenderHandle 统一句柄
 */
export function renderGeoJSON(
  data: AddGeoJSONInput,
  options: AddGeoJSONOptions,
  deps: GeoJSONRenderDeps,
): GeoJSONRenderHandle {
  /** *********************输入标准化*********************/
  const normalized = normalizeGeoJSONInputs(data);
  const groups = splitByGroupAndGeometry(normalized, options.groupBy);

  const allHandles: LayerHandle[] = [];
  const groupHandles: Record<string, GeoJSONGroupHandle> = {};
  const singleGroup = Object.keys(groups).length === 1 && !options.groupBy;

  // 用于组装返回句柄的索引
  const pointMap: Record<string, LayerHandle | null> = {};
  const lineMap: Record<string, LayerHandle | null> = {};
  const polygonMap: Record<string, LayerHandle | null> = {};

  /** *********************遍历分组创建图层*********************/
  for (const [groupKey, { point: pointFeatures, line: lineFeatures, polygon: polygonFeatures }] of Object.entries(groups)) {
    const groupAllHandles: LayerHandle[] = [];
    let pointHandle: LayerHandle | null = null;
    let lineHandle: LayerHandle | null = null;
    let polygonHandle: LayerHandle | null = null;

    // 提取各几何类型的 datasetKey（取第一个 feature 的即可，同组内 datasetKey 相同）
    const pointDatasetKey = pointFeatures[0]?._datasetKey ?? 'default';
    const lineDatasetKey = lineFeatures[0]?._datasetKey ?? 'default';
    const polygonDatasetKey = polygonFeatures[0]?._datasetKey ?? 'default';

    // 面图层会清理同名旧图层；当 layerName 是字符串时点线面同名，
    // 因此先创建面图层，避免它误删本次刚创建的点/线图层。
    if (polygonFeatures.length > 0) {
      polygonHandle = createPolygonHandle(
        polygonFeatures, options, groupKey, polygonDatasetKey, singleGroup, deps.getPolygon()
      );
      if (polygonHandle) {
        groupAllHandles.push(polygonHandle);
        allHandles.push(polygonHandle);
      }
    }

    // 线图层
    if (lineFeatures.length > 0) {
      lineHandle = createLineHandle(
        lineFeatures, options, groupKey, lineDatasetKey, singleGroup, deps.getLine()
      );
      if (lineHandle) {
        groupAllHandles.push(lineHandle);
        allHandles.push(lineHandle);
      }
    }

    // 点图层
    if (pointFeatures.length > 0) {
      const result = createPointLayerHandle(
        pointFeatures, options, groupKey, pointDatasetKey, singleGroup, deps.getPoint()
      );
      pointHandle = result.handle;
      if (pointHandle) {
        groupAllHandles.push(pointHandle);
        allHandles.push(pointHandle);
      }
    }

    /** *********************组装分组句柄*********************/
    groupHandles[groupKey] = {
      point: pointHandle,
      line: lineHandle,
      polygon: polygonHandle,
      handles: groupAllHandles,
      setVisible(visible: boolean) {
        for (const handle of groupAllHandles) {
          handle.setVisible(visible);
        }
      },
      remove() {
        for (const handle of groupAllHandles) {
          handle.remove();
        }
      },
    };

    pointMap[groupKey] = pointHandle;
    lineMap[groupKey] = lineHandle;
    polygonMap[groupKey] = polygonHandle;
  }

  /** *********************组装总句柄*********************/
  return createRenderHandle(allHandles, groupHandles, pointMap, lineMap, polygonMap);
}
