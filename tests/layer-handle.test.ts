// @vitest-environment happy-dom

/**
 * P1-1 回归测试：3.0 add* 统一返回 Handle。
 *
 * 验证：
 * 1. 真实图层 add* 返回 { layer, remove, setVisible }
 * 2. 动画图层 add* 返回 AnimatedLayerHandle
 * 3. Overlay / Vue 点返回 { target, remove, setVisible } 并保留原字段
 * 4. ByUrl 系列 await 后返回完整 Handle
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Overlay from 'ol/Overlay';
import BaseLayer from 'ol/layer/Base';
import VectorLayer from 'ol/layer/Vector';
import { Line } from '../src/core/line';
import { Polygon } from '../src/core/polygon';
import { Point } from '../src/core/point';
import type { AnimatedLayerHandle, ControlHandle, LayerHandle, MapJSONData, PointData, PulsePointOptions } from '../src/types';

function createMapStub() {
  const layers: BaseLayer[] = [];
  const overlays: Overlay[] = [];
  return {
    layers,
    overlays,
    addLayer: vi.fn((l: BaseLayer) => { layers.push(l); }),
    removeLayer: vi.fn((l: BaseLayer) => { const i = layers.indexOf(l); if (i >= 0) layers.splice(i, 1); }),
    addOverlay: vi.fn((overlay: Overlay) => { overlays.push(overlay); }),
    removeOverlay: vi.fn((overlay: Overlay) => { const i = overlays.indexOf(overlay); if (i >= 0) overlays.splice(i, 1); }),
    render: vi.fn(),
    getView: vi.fn(() => ({ getZoom: () => 10, getResolution: () => 1, fit: vi.fn(), getProjection: () => ({ getExtent: () => [119, 29, 122, 32] }) })),
    getLayers: vi.fn(() => ({ getArray: () => layers }))
  } as any;
}

const lineData: MapJSONData = {
  type: 'FeatureCollection',
  features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[120, 30], [120.1, 30.1]] } }]
};
const polygonData: MapJSONData = {
  type: 'FeatureCollection',
  features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[120, 30], [120.1, 30], [120.1, 30.1], [120, 30.1], [120, 30]]] } }]
};
const pointData: PointData[] = [{ lgtd: 120, lttd: 30, lev: 1, name: 'p1' }];

function expectLayerHandle(handle: LayerHandle<any>, map: ReturnType<typeof createMapStub>) {
  expect(handle.layer).toBeInstanceOf(BaseLayer);
  expect(typeof handle.remove).toBe('function');
  expect(typeof handle.setVisible).toBe('function');
  expect(map.layers.length).toBeGreaterThan(0);

  handle.setVisible(false);
  expect(handle.layer.getVisible()).toBe(false);

  handle.remove();
  expect(map.layers.includes(handle.layer)).toBe(false);
  expect(() => handle.remove()).not.toThrow();
}

describe('P1-1 add* 统一 LayerHandle / ControlHandle', () => {
  let rafSpy: ReturnType<typeof vi.spyOn>;
  let cafSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    if (!('requestAnimationFrame' in globalThis)) {
      vi.stubGlobal('requestAnimationFrame', () => 1);
      vi.stubGlobal('cancelAnimationFrame', () => undefined);
    }
    rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);
    cafSpy = vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => undefined);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      createLinearGradient: () => ({ addColorStop: vi.fn() }),
      fillRect: vi.fn()
    } as any);
  });

  afterEach(() => {
    rafSpy.mockRestore();
    cafSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('Point.addPoint 返回 LayerHandle，remove() 移除图层', () => {
    const map = createMapStub();
    const point = new Point(map);
    const handle = point.addPoint(pointData, { layerName: 'p-add' });
    expect(handle).not.toBeNull();
    expectLayerHandle(handle!, map);
  });

  it('Point.addClusterPoint 返回 LayerHandle', () => {
    const map = createMapStub();
    const point = new Point(map);
    const handle = point.addClusterPoint(pointData, { layerName: 'cluster-add' });
    expect(handle).not.toBeNull();
    expectLayerHandle(handle!, map);
  });

  it('Point.addPointByUrl await 后返回 LayerHandle', async () => {
    const map = createMapStub();
    const point = new Point(map);
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => pointData
    })));

    const handle = await point.addPointByUrl('/points.json', { layerName: 'point-url-add' });
    expect(handle).not.toBeNull();
    expectLayerHandle(handle!, map);
  });

  it('Point.addDomPoint 返回 ControlHandle 并保留 anchors', () => {
    const map = createMapStub();
    const point = new Point(map);
    const handle: ControlHandle<Overlay[]> & { anchors: Overlay[] } = point.addDomPoint(pointData);

    expect(handle.target).toBe(handle.anchors);
    expect(handle.target.length).toBe(1);
    expect(typeof handle.remove).toBe('function');
    expect(typeof handle.setVisible).toBe('function');

    handle.setVisible(false);
    expect(handle.target[0].getElement()?.style.display).toBe('none');

    handle.remove();
    expect(map.overlays.length).toBe(0);
  });

  it('Point.addVueTemplatePoint 返回 ControlHandle 并保留 getPoints', () => {
    const map = createMapStub();
    const point = new Point(map);
    const template = { template: '<div>{{ name }}</div>' };
    const handle = point.addVueTemplatePoint(pointData, template);

    expect(handle.target).toBe(handle.getPoints());
    expect(Array.isArray(handle.target)).toBe(true);
    expect(typeof handle.remove).toBe('function');
    expect(typeof handle.setVisible).toBe('function');
    expect(typeof handle.setOneVisibleByProp).toBe('function');
    handle.remove();
  });

  it('Line.addLine 返回 LayerHandle', () => {
    const map = createMapStub();
    const line = new Line(map);
    const handle: LayerHandle<VectorLayer<any>> = line.addLine(lineData, { layerName: 'l-add' });
    expectLayerHandle(handle, map);
  });

  it('Line.addLineByUrl await 后返回 LayerHandle', async () => {
    const map = createMapStub();
    const line = new Line(map);
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => lineData
    })));

    const handle = await line.addLineByUrl('/line.json', { layerName: 'line-url-add' });
    expectLayerHandle(handle, map);
  });

  it('Polygon.addPolygon 返回 LayerHandle', () => {
    const map = createMapStub();
    const polygon = new Polygon(map);
    const handle = polygon.addPolygon(polygonData, { layerName: 'poly-add' });
    expectLayerHandle(handle, map);
  });

  it('Polygon.addBorderPolygon 返回 LayerHandle', () => {
    const map = createMapStub();
    const polygon = new Polygon(map);
    const handle = polygon.addBorderPolygon(polygonData, { layerName: 'border-add' });
    expectLayerHandle(handle, map);
  });

  it('Polygon.addPolygonByUrl await 后返回 LayerHandle', async () => {
    const map = createMapStub();
    const polygon = new Polygon(map);
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => polygonData
    })));

    const handle = await polygon.addPolygonByUrl('/polygon.json', { layerName: 'polygon-url-add' });
    expectLayerHandle(handle, map);
  });

  it('Polygon.addBorderPolygonByUrl await 后返回 LayerHandle', async () => {
    const map = createMapStub();
    const polygon = new Polygon(map);
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => polygonData
    })));

    const handle = await polygon.addBorderPolygonByUrl('/border.json', { layerName: 'border-url-add' });
    expectLayerHandle(handle, map);
  });

  it('Polygon.addImageLayer 返回 LayerHandle', () => {
    const map = createMapStub();
    const polygon = new Polygon(map);
    const handle = polygon.addImageLayer(
      { img: '/overlay.png', extent: [120, 30, 121, 31] },
      { layerName: 'image-add' }
    );
    expectLayerHandle(handle, map);
  });

  it('Polygon.addHeatmap 返回 LayerHandle', () => {
    const map = createMapStub();
    const polygon = new Polygon(map);
    const handle = polygon.addHeatmap(pointData, { layerName: 'heatmap-add', valueKey: 'lev' });
    expectLayerHandle(handle, map);
  });

  it('Polygon.addMaskLayer 返回 LayerHandle', () => {
    const map = createMapStub();
    const polygon = new Polygon(map);
    const handle = polygon.addMaskLayer(polygonData, { layerName: 'mask-add' });
    expectLayerHandle(handle, map);
  });

  it('Point.addPulsePointLayer 返回 AnimatedLayerHandle', () => {
    const map = createMapStub();
    const point = new Point(map);
    const opts: PulsePointOptions & { layerName: string } = {
      layerName: 'pulse-add',
      pulse: { enabled: true, frameCount: 4, duration: 1000, radius: [4, 12] }
    };
    const handle: AnimatedLayerHandle<VectorLayer<any>> | null = point.addPulsePointLayer(pointData, opts);
    expect(handle).not.toBeNull();
    expect(typeof handle!.start).toBe('function');
    expect(typeof handle!.stop).toBe('function');
    expectLayerHandle(handle!, map);
  });

  it('Point.addPulsePointLayerByUrl await 后返回 AnimatedLayerHandle', async () => {
    const map = createMapStub();
    const point = new Point(map);
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => pointData
    })));

    const handle = await point.addPulsePointLayerByUrl('/pulse-points.json', {
      layerName: 'pulse-url-add',
      pulse: { enabled: true, frameCount: 4, duration: 1000, radius: [4, 12] }
    });
    expect(handle).not.toBeNull();
    expect(typeof handle!.start).toBe('function');
    expectLayerHandle(handle!, map);
  });

  it('Line.addFlowLine 返回 AnimatedLayerHandle', () => {
    const map = createMapStub();
    const line = new Line(map);
    const handle: AnimatedLayerHandle<VectorLayer<any>> | null = line.addFlowLine(lineData, { layerName: 'flow-add' });
    expect(handle).not.toBeNull();
    expect(typeof handle!.pause).toBe('function');
    expect(typeof handle!.resume).toBe('function');
    expectLayerHandle(handle!, map);
  });

  it('Line.addFlowLineByUrl await 后返回 AnimatedLayerHandle', async () => {
    const map = createMapStub();
    const line = new Line(map);
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => lineData
    })));

    const handle = await line.addFlowLineByUrl('/flow.json', { layerName: 'flow-url-add' });
    expect(handle).not.toBeNull();
    expect(typeof handle!.pause).toBe('function');
    expectLayerHandle(handle!, map);
  });
});
