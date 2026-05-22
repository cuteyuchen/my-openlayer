/**
 * P1-1 回归测试：统一 LayerHandle / AnimatedLayerHandle。
 *
 * 验证：
 * 1. attach* 系列方法返回带 { layer, remove, setVisible } 的统一形态
 * 2. PulsePointLayerHandle / FlowLineLayerHandle 在类型层面满足 AnimatedLayerHandle 契约
 * 3. handle.remove() 真正从地图移除图层
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BaseLayer from 'ol/layer/Base';
import VectorLayer from 'ol/layer/Vector';
import { Line } from '../src/core/line';
import { Polygon } from '../src/core/polygon';
import { Point } from '../src/core/point';
import type { AnimatedLayerHandle, LayerHandle, MapJSONData, PointData, PulsePointOptions } from '../src/types';

function createMapStub() {
  const layers: BaseLayer[] = [];
  return {
    layers,
    addLayer: vi.fn((l: BaseLayer) => { layers.push(l); }),
    removeLayer: vi.fn((l: BaseLayer) => { const i = layers.indexOf(l); if (i >= 0) layers.splice(i, 1); }),
    render: vi.fn(),
    getView: vi.fn(() => ({ getZoom: () => 10, getResolution: () => 1, fit: vi.fn() })),
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
const pointData: PointData[] = [{ lgtd: 120, lttd: 30, lev: 1 }];

describe('P1-1 统一 LayerHandle / AnimatedLayerHandle', () => {
  let rafSpy: ReturnType<typeof vi.spyOn>;
  let cafSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    if (!('requestAnimationFrame' in globalThis)) {
      vi.stubGlobal('requestAnimationFrame', () => 1);
      vi.stubGlobal('cancelAnimationFrame', () => undefined);
    }
    rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);
    cafSpy = vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => undefined);
  });
  afterEach(() => {
    rafSpy.mockRestore();
    cafSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('Point.attachPoint 返回 LayerHandle，remove() 移除图层', () => {
    const map = createMapStub();
    const point = new Point(map);
    const handle = point.attachPoint(pointData, { layerName: 'p-attach' });
    expect(handle).not.toBeNull();
    expect(handle!.layer).toBeInstanceOf(VectorLayer);
    expect(typeof handle!.remove).toBe('function');
    expect(typeof handle!.setVisible).toBe('function');
    expect(map.layers.length).toBe(1);

    handle!.setVisible(false);
    expect(handle!.layer.getVisible()).toBe(false);

    handle!.remove();
    expect(map.layers.length).toBe(0);

    // 幂等：再 remove 不抛错
    expect(() => handle!.remove()).not.toThrow();
  });

  it('Line.attachLine 返回 LayerHandle，符合契约', () => {
    const map = createMapStub();
    const line = new Line(map);
    const handle: LayerHandle<VectorLayer<any>> = line.attachLine(lineData, { layerName: 'l-attach' });
    expect(handle.layer).toBeInstanceOf(VectorLayer);
    expect(map.layers.length).toBe(1);
    handle.remove();
    expect(map.layers.length).toBe(0);
  });

  it('Polygon.attachPolygon 返回 LayerHandle', () => {
    const map = createMapStub();
    const polygon = new Polygon(map);
    const handle = polygon.attachPolygon(polygonData, { layerName: 'poly-attach' });
    expect(handle.layer).toBeInstanceOf(VectorLayer);
    expect(map.layers.length).toBe(1);
    handle.remove();
    expect(map.layers.length).toBe(0);
  });

  it('Point.attachPulsePointLayer 返回的 PulsePointLayerHandle 满足 AnimatedLayerHandle 契约', () => {
    const map = createMapStub();
    const point = new Point(map);
    const opts: PulsePointOptions & { layerName: string } = {
      layerName: 'pulse-handle',
      pulse: { enabled: true, frameCount: 4, duration: 1000, radius: [4, 12] }
    };
    const handle: AnimatedLayerHandle<VectorLayer<any>> | null = point.attachPulsePointLayer(pointData, opts);
    expect(handle).not.toBeNull();
    expect(typeof handle!.start).toBe('function');
    expect(typeof handle!.stop).toBe('function');
    expect(typeof handle!.setVisible).toBe('function');
    expect(typeof handle!.remove).toBe('function');
    handle!.remove();
  });

  it('Line.attachFlowLine 返回的 FlowLineLayerHandle 满足 AnimatedLayerHandle 契约', () => {
    const map = createMapStub();
    const line = new Line(map);
    const handle: AnimatedLayerHandle<VectorLayer<any>> | null = line.attachFlowLine(lineData, { layerName: 'flow-handle' });
    expect(handle).not.toBeNull();
    expect(typeof handle!.start).toBe('function');
    expect(typeof handle!.stop).toBe('function');
    expect(typeof handle!.pause).toBe('function');
    expect(typeof handle!.resume).toBe('function');
    handle!.remove();
  });
});
