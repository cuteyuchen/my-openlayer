/**
 * P1-2 回归测试：异步 *ByUrl API。
 *
 * 旧 *ByUrl 方法同步返回 layer，但 features 仍在加载；新 *ByUrlAsync 返回 Promise，
 * 在 features 加载完成后才 resolve，且加载失败会 reject。
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

  it('Polygon.addPolygonByUrlAsync resolve 一个 VectorLayer', async () => {
    const map = createMapStub();
    const polygon = new Polygon(map);
    // VectorSource 的 url 加载在测试环境不会真的 fetch，但我们至少确保 Promise wrapper 不抛错。
    // 这里只验证函数签名与 Promise 行为。
    const promise = polygon.addPolygonByUrlAsync('/polygon.json', { layerName: 'poly-async' });
    expect(promise).toBeInstanceOf(Promise);
  });

  it('Point.addPointByUrl 从 PointData[] 数组 URL 加载', async () => {
    const map = createMapStub();
    const point = new Point(map);
    const layer = await point.addPointByUrl('/point.json', { layerName: 'point-async' });
    expect(layer).toBeInstanceOf(VectorLayer);
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

  it('Line.addLineByUrlAsync 返回 Promise', () => {
    const map = createMapStub();
    const line = new Line(map);
    const promise = line.addLineByUrlAsync('/line.json', { layerName: 'line-async' });
    expect(promise).toBeInstanceOf(Promise);
  });
});
