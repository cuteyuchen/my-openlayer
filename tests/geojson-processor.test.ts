/**
 * GeoJSONProcessor 单元测试。
 *
 * 覆盖 normalizePointData 的所有输入形态：
 * PointData[]、FeatureCollection、Feature、Point geometry、MultiPoint geometry，
 * 以及非法坐标、非点 geometry 的过滤逻辑。
 */
import { describe, expect, it } from 'vitest';
import { normalizePointData } from '../src/utils/GeoJSONProcessor';
import type { PointData } from '../src/types/point';
import type { FeatureData, MapJSONData } from '../src/types/common';

describe('normalizePointData', () => {

  /** *********************PointData[] 输入*********************/

  describe('PointData[] 输入', () => {
    it('合法 PointData 数组原样返回（深拷贝）', () => {
      const input: PointData[] = [
        { lgtd: 120, lttd: 30, name: 'A' },
        { lgtd: 121, lttd: 31, name: 'B' },
      ];
      const result = normalizePointData(input);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ lgtd: 120, lttd: 30, name: 'A' });
      expect(result[1]).toEqual({ lgtd: 121, lttd: 31, name: 'B' });
      // 深拷贝，不是同一引用
      expect(result[0]).not.toBe(input[0]);
    });

    it('过滤含 NaN 坐标的项', () => {
      const input = [
        { lgtd: 120, lttd: 30 },
        { lgtd: NaN, lttd: 30 },
        { lgtd: 120, lttd: NaN },
      ];
      const result = normalizePointData(input);
      expect(result).toHaveLength(1);
    });

    it('过滤含 Infinity 坐标的项', () => {
      const input = [
        { lgtd: Infinity, lttd: 30 },
        { lgtd: 120, lttd: -Infinity },
        { lgtd: 120, lttd: 30 },
      ];
      const result = normalizePointData(input);
      expect(result).toHaveLength(1);
    });

    it('过滤缺失 lgtd 或 lttd 的项', () => {
      const input = [
        { lgtd: 120 } as any,
        { lttd: 30 } as any,
        { lgtd: 120, lttd: 30 },
      ];
      const result = normalizePointData(input);
      expect(result).toHaveLength(1);
    });

    it('空数组返回空', () => {
      expect(normalizePointData([])).toEqual([]);
    });
  });

  /** *********************FeatureCollection 输入*********************/

  describe('FeatureCollection 输入', () => {
    it('提取 Point Feature 的坐标和 properties', () => {
      const input: MapJSONData = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { name: '站点A', level: 3 },
            geometry: { type: 'Point', coordinates: [120.5, 30.5] },
          },
          {
            type: 'Feature',
            properties: { name: '站点B', level: 1 },
            geometry: { type: 'Point', coordinates: [121, 31] },
          },
        ],
      };
      const result = normalizePointData(input);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ name: '站点A', level: 3, lgtd: 120.5, lttd: 30.5 });
      expect(result[1]).toEqual({ name: '站点B', level: 1, lgtd: 121, lttd: 31 });
    });

    it('MultiPoint Feature 拆成多个点并保留 properties', () => {
      const input: MapJSONData = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { region: '华东' },
            geometry: {
              type: 'MultiPoint',
              coordinates: [[120, 30], [121, 31], [122, 32]],
            },
          },
        ],
      };
      const result = normalizePointData(input);
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ region: '华东', lgtd: 120, lttd: 30 });
      expect(result[2]).toEqual({ region: '华东', lgtd: 122, lttd: 32 });
    });

    it('跳过非 Point/MultiPoint geometry 的 Feature', () => {
      const input: MapJSONData = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: [[120, 30], [121, 31]] },
          },
          {
            type: 'Feature',
            properties: {},
            geometry: { type: 'Polygon', coordinates: [[[120, 30], [121, 30], [121, 31], [120, 31], [120, 30]]] },
          },
          {
            type: 'Feature',
            properties: { name: '有效点' },
            geometry: { type: 'Point', coordinates: [120, 30] },
          },
        ],
      };
      const result = normalizePointData(input);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('有效点');
    });

    it('过滤 FeatureCollection 中坐标非法的 Point Feature', () => {
      const input: MapJSONData = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: { type: 'Point', coordinates: [NaN, 30] },
          },
          {
            type: 'Feature',
            properties: {},
            geometry: { type: 'Point', coordinates: [120, 30] },
          },
        ],
      };
      const result = normalizePointData(input);
      expect(result).toHaveLength(1);
    });

    it('空 features 数组返回空', () => {
      const input: MapJSONData = { type: 'FeatureCollection', features: [] };
      expect(normalizePointData(input)).toEqual([]);
    });
  });

  /** *********************单个 Feature 输入*********************/

  describe('单个 Feature 输入', () => {
    it('Point Feature 转为单元素数组', () => {
      const input: FeatureData = {
        type: 'Feature',
        properties: { id: 1 },
        geometry: { type: 'Point', coordinates: [120, 30] },
      };
      const result = normalizePointData(input);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ id: 1, lgtd: 120, lttd: 30 });
    });

    it('MultiPoint Feature 拆成多个点', () => {
      const input: FeatureData = {
        type: 'Feature',
        properties: { group: 'A' },
        geometry: { type: 'MultiPoint', coordinates: [[120, 30], [121, 31]] },
      };
      const result = normalizePointData(input);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ group: 'A', lgtd: 120, lttd: 30 });
    });

    it('非 Point/MultiPoint Feature 返回空数组', () => {
      const input: FeatureData = {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: [[120, 30], [121, 31]] },
      };
      expect(normalizePointData(input)).toEqual([]);
    });

    it('坐标非法的 Point Feature 返回空数组', () => {
      const input: FeatureData = {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Point', coordinates: [Infinity, 30] },
      };
      expect(normalizePointData(input)).toEqual([]);
    });
  });

  /** *********************裸 Geometry 输入*********************/

  describe('裸 Geometry 输入', () => {
    it('Point geometry 转为单元素数组', () => {
      const input = { type: 'Point' as const, coordinates: [120, 30] };
      const result = normalizePointData(input);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ lgtd: 120, lttd: 30 });
    });

    it('MultiPoint geometry 拆成多个点', () => {
      const input = { type: 'MultiPoint' as const, coordinates: [[120, 30], [121, 31]] };
      const result = normalizePointData(input);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ lgtd: 120, lttd: 30 });
      expect(result[1]).toEqual({ lgtd: 121, lttd: 31 });
    });

    it('坐标非法的 Point geometry 返回空数组', () => {
      const input = { type: 'Point' as const, coordinates: [NaN, 30] };
      expect(normalizePointData(input)).toEqual([]);
    });

    it('MultiPoint 中部分坐标非法则过滤坏点', () => {
      const input = { type: 'MultiPoint' as const, coordinates: [[120, 30], [NaN, 31], [122, 32]] };
      const result = normalizePointData(input);
      expect(result).toHaveLength(2);
    });
  });

  /** *********************边界情况*********************/

  describe('边界情况', () => {
    it('null 返回空数组', () => {
      expect(normalizePointData(null)).toEqual([]);
    });

    it('undefined 返回空数组', () => {
      expect(normalizePointData(undefined)).toEqual([]);
    });

    it('非对象非数组输入返回空数组', () => {
      expect(normalizePointData('string' as any)).toEqual([]);
      expect(normalizePointData(123 as any)).toEqual([]);
    });

    it('无效的 FeatureCollection 结构返回空数组', () => {
      expect(normalizePointData({ type: 'FeatureCollection' } as any)).toEqual([]);
    });
  });
});
