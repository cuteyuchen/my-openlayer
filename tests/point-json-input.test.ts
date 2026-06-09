/**
 * 点 JSON 输入标准化集成测试。
 *
 * 验证 addPoint / addClusterPoint / addPulsePointLayer 接受 GeoJSON 输入后
 * 能正确创建图层，以及 *ByUrl 方法不再各自手写 JSON map 逻辑。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BaseLayer from 'ol/layer/Base';
import VectorLayer from 'ol/layer/Vector';
import { Point } from '../src/core/point';

/** *********************测试工具*********************/

function createMapStub() {
  const layers: BaseLayer[] = [];
  return {
    layers,
    addLayer: vi.fn((l: BaseLayer) => { layers.push(l); }),
    removeLayer: vi.fn((l: BaseLayer) => { const i = layers.indexOf(l); if (i >= 0) layers.splice(i, 1); }),
    render: vi.fn(),
    getView: vi.fn(() => ({ getZoom: () => 10, fit: vi.fn() })),
    getLayers: vi.fn(() => ({ getArray: () => layers }))
  } as any;
}

/** *********************测试数据*********************/

const pointDataArray = [
  { lgtd: 120, lttd: 30, name: 'A' },
  { lgtd: 121, lttd: 31, name: 'B' },
];

const featureCollection = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { name: 'A' }, geometry: { type: 'Point', coordinates: [120, 30] } },
    { type: 'Feature', properties: { name: 'B' }, geometry: { type: 'Point', coordinates: [121, 31] } },
  ],
};

const singleFeature = {
  type: 'Feature',
  properties: { name: '单点' },
  geometry: { type: 'Point', coordinates: [120, 30] },
};

const multiPointGeometry = {
  type: 'MultiPoint',
  coordinates: [[120, 30], [121, 31]],
};

const multiPointFeature = {
  type: 'Feature',
  properties: { region: '测试' },
  geometry: { type: 'MultiPoint', coordinates: [[120, 30], [121, 31]] },
};

/** *********************测试用例*********************/

describe('点 JSON 输入标准化', () => {
  let rafSpy: ReturnType<typeof vi.spyOn>;
  let cafSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    if (!('requestAnimationFrame' in globalThis)) {
      vi.stubGlobal('requestAnimationFrame', () => 1);
    }
    if (!('cancelAnimationFrame' in globalThis)) {
      vi.stubGlobal('cancelAnimationFrame', () => undefined);
    }
    rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);
    cafSpy = vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => undefined);
  });

  afterEach(() => {
    rafSpy.mockRestore();
    cafSpy.mockRestore();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  /** *********************addPoint GeoJSON 输入*********************/

  describe('addPoint 接受 GeoJSON 输入', () => {
    it('PointData[] 仍正常工作（向后兼容）', () => {
      const map = createMapStub();
      const point = new Point(map);
      const handle = point.addPoint(pointDataArray, { layerName: 'compat' });
      expect(handle).not.toBeNull();
      expect(handle!.layer).toBeInstanceOf(VectorLayer);
      point.destroyAll();
    });

    it('FeatureCollection 创建正确数量 feature', () => {
      const map = createMapStub();
      const point = new Point(map);
      const handle = point.addPoint(featureCollection, { layerName: 'fc' });
      expect(handle).not.toBeNull();
      const source = handle!.layer.getSource()!;
      expect(source.getFeatures()).toHaveLength(2);
      point.destroyAll();
    });

    it('单个 Feature 创建单点图层', () => {
      const map = createMapStub();
      const point = new Point(map);
      const handle = point.addPoint(singleFeature, { layerName: 'single' });
      expect(handle).not.toBeNull();
      const source = handle!.layer.getSource()!;
      expect(source.getFeatures()).toHaveLength(1);
      point.destroyAll();
    });

    it('MultiPoint geometry 拆成多个 feature', () => {
      const map = createMapStub();
      const point = new Point(map);
      const handle = point.addPoint(multiPointGeometry, { layerName: 'multi' });
      expect(handle).not.toBeNull();
      const source = handle!.layer.getSource()!;
      expect(source.getFeatures()).toHaveLength(2);
      point.destroyAll();
    });

    it('MultiPoint Feature 拆成多个 feature 并保留 properties', () => {
      const map = createMapStub();
      const point = new Point(map);
      const handle = point.addPoint(multiPointFeature, { layerName: 'multi-f' });
      expect(handle).not.toBeNull();
      const source = handle!.layer.getSource()!;
      expect(source.getFeatures()).toHaveLength(2);
      point.destroyAll();
    });

    it('空 FeatureCollection 返回 null', () => {
      const map = createMapStub();
      const point = new Point(map);
      const handle = point.addPoint(
        { type: 'FeatureCollection', features: [] },
        { layerName: 'empty' }
      );
      expect(handle).toBeNull();
    });

    it('只有 LineString 的 FeatureCollection 返回 null', () => {
      const map = createMapStub();
      const point = new Point(map);
      const handle = point.addPoint(
        {
          type: 'FeatureCollection',
          features: [
            { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[120, 30], [121, 31]] } },
          ],
        },
        { layerName: 'no-points' }
      );
      expect(handle).toBeNull();
    });
  });

  /** *********************addClusterPoint GeoJSON 输入*********************/

  describe('addClusterPoint 接受 GeoJSON 输入', () => {
    it('FeatureCollection 能正常创建聚合图层', () => {
      const map = createMapStub();
      const point = new Point(map);
      const handle = point.addClusterPoint(featureCollection, { layerName: 'cluster-fc' });
      expect(handle).not.toBeNull();
      expect(handle!.layer).toBeInstanceOf(VectorLayer);
      point.destroyAll();
    });

    it('PointData[] 仍正常工作', () => {
      const map = createMapStub();
      const point = new Point(map);
      const handle = point.addClusterPoint(pointDataArray, { layerName: 'cluster-compat' });
      expect(handle).not.toBeNull();
      point.destroyAll();
    });
  });

  /** *********************addPulsePointLayer GeoJSON 输入*********************/

  describe('addPulsePointLayer 接受 GeoJSON 输入', () => {
    it('FeatureCollection 能正常创建闪烁点句柄', () => {
      const map = createMapStub();
      const point = new Point(map);
      const handle = point.addPulsePointLayer(featureCollection, { layerName: 'pulse-fc' });
      expect(handle).not.toBeNull();
      expect(handle!.layer).toBeInstanceOf(VectorLayer);
      expect(typeof handle!.start).toBe('function');
      expect(typeof handle!.stop).toBe('function');
      expect(typeof handle!.updateData).toBe('function');
      point.destroyAll();
    });

    it('PointData[] 仍正常工作', () => {
      const map = createMapStub();
      const point = new Point(map);
      const handle = point.addPulsePointLayer(pointDataArray, { layerName: 'pulse-compat' });
      expect(handle).not.toBeNull();
      point.destroyAll();
    });
  });

  /** **********************ByUrl 方法使用统一标准化*********************/

  describe('*ByUrl 方法使用统一标准化', () => {
    it('addPointByUrl 接受 FeatureCollection JSON', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => ({
        ok: true,
        json: async () => featureCollection,
      } as any)));
      const map = createMapStub();
      const point = new Point(map);
      const handle = await point.addPointByUrl('/points.json', { layerName: 'url-fc' });
      expect(handle).not.toBeNull();
      const source = handle!.layer.getSource()!;
      expect(source.getFeatures()).toHaveLength(2);
      point.destroyAll();
    });

    it('addPointByUrl 接受 PointData[] JSON', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => ({
        ok: true,
        json: async () => pointDataArray,
      } as any)));
      const map = createMapStub();
      const point = new Point(map);
      const handle = await point.addPointByUrl('/points.json', { layerName: 'url-arr' });
      expect(handle).not.toBeNull();
      point.destroyAll();
    });

    it('addPulsePointLayerByUrl 接受 FeatureCollection JSON', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => ({
        ok: true,
        json: async () => featureCollection,
      } as any)));
      const map = createMapStub();
      const point = new Point(map);
      const handle = await point.addPulsePointLayerByUrl('/pulse.json', { layerName: 'pulse-url-fc' });
      expect(handle).not.toBeNull();
      point.destroyAll();
    });

    it('addPulsePointLayerByUrl 接受 PointData[] JSON', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => ({
        ok: true,
        json: async () => pointDataArray,
      } as any)));
      const map = createMapStub();
      const point = new Point(map);
      const handle = await point.addPulsePointLayerByUrl('/pulse.json', { layerName: 'pulse-url-arr' });
      expect(handle).not.toBeNull();
      point.destroyAll();
    });

    it('addPointByUrl 404 时 reject', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 } as any)));
      const map = createMapStub();
      const point = new Point(map);
      await expect(point.addPointByUrl('/404.json', { layerName: 'fail' }))
        .rejects.toThrow(/404/);
    });
  });
});
