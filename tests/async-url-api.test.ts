/**
 * P1-2 回归测试：异步 *ByUrl API。
 *
 * 3.0 *ByUrl 方法统一先获取 JSON，再调用对应 add* 返回 Handle。
 * 不再保留 *ByUrlAsync 双入口。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BaseLayer from 'ol/layer/Base';
import VectorLayer from 'ol/layer/Vector';
import { Line } from '../src/core/line';
import { Polygon } from '../src/core/polygon';
import { Point } from '../src/core/point';

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

const lineCollection = {
  type: 'FeatureCollection',
  features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[120, 30], [120.1, 30.1]] } }]
};

const polygonCollection = {
  type: 'FeatureCollection',
  features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[120, 30], [120.1, 30], [120.1, 30.1], [120, 30.1], [120, 30]]] } }]
};

const pointArray = [
  { lgtd: 120, lttd: 30, lev: 1 },
  { lgtd: 120.1, lttd: 30.1, lev: 2 }
];

describe('P1-2 异步 *ByUrl API', () => {
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
    // mock global fetch
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('line')) return { ok: true, json: async () => lineCollection } as any;
      if (url.includes('polygon')) return { ok: true, json: async () => polygonCollection } as any;
      if (url.includes('point')) return { ok: true, json: async () => pointArray } as any;
      if (url.includes('404')) return { ok: false, status: 404 } as any;
      return { ok: false, status: 500 } as any;
    }));
  });
  afterEach(() => {
    rafSpy.mockRestore();
    cafSpy.mockRestore();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('Polygon.addPolygonByUrl resolve 一个 LayerHandle', async () => {
    const map = createMapStub();
    const polygon = new Polygon(map);
    const handle = await polygon.addPolygonByUrl('/polygon.json', { layerName: 'poly-async' });
    expect(handle.layer).toBeInstanceOf(VectorLayer);
  });

  it('Polygon 不再暴露 addPolygonByUrlAsync', () => {
    const map = createMapStub();
    const polygon = new Polygon(map);
    expect('addPolygonByUrlAsync' in polygon).toBe(false);
  });

  it('Point.addPointByUrl 从 PointData[] 数组 URL 加载', async () => {
    const map = createMapStub();
    const point = new Point(map);
    const handle = await point.addPointByUrl('/point.json', { layerName: 'point-async' });
    expect(handle?.layer).toBeInstanceOf(VectorLayer);
    point.destroyAll();
  });

  it('Point.addPointByUrl 404 时 reject', async () => {
    const map = createMapStub();
    const point = new Point(map);
    await expect(point.addPointByUrl('/404.json', { layerName: 'point-404' }))
      .rejects.toThrow(/404/);
  });

  it('Point.addPulsePointLayerByUrl 从 FeatureCollection URL 加载', async () => {
    vi.unstubAllGlobals();
    // 重新挂回 raf spy（unstubAllGlobals 把它也 unstub 了）
    if (!('requestAnimationFrame' in globalThis)) {
      vi.stubGlobal('requestAnimationFrame', () => 1);
      vi.stubGlobal('cancelAnimationFrame', () => undefined);
    }
    vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', properties: { lev: 1 }, geometry: { type: 'Point', coordinates: [120, 30] } }
        ]
      })
    } as any)));
    const map = createMapStub();
    const point = new Point(map);
    const handle = await point.addPulsePointLayerByUrl('/pulse.json', { layerName: 'pulse-async' });
    expect(handle).not.toBeNull();
    point.destroyAll();
  });

  it('Line.addLineByUrl 返回 Promise<LayerHandle>', async () => {
    const map = createMapStub();
    const line = new Line(map);
    const handle = await line.addLineByUrl('/line.json', { layerName: 'line-async' });
    expect(handle.layer).toBeInstanceOf(VectorLayer);
  });

  it('Line 不再暴露 addLineByUrlAsync', () => {
    const map = createMapStub();
    const line = new Line(map);
    expect('addLineByUrlAsync' in line).toBe(false);
  });
});
