/**
 * P0-1 回归测试：MyOl 的子模块 destroy 级联清理。
 *
 * 历史 bug：MyOl.destroy() 只把 _point/_line/_polygon/_selectHandler 字段置为
 * undefined，没有调用各自的清理方法。导致 LineFlowAnimator 的
 * requestAnimationFrame、PointPulseLayer 的 rAF、PointOverlay 的 Overlay、
 * VueTemplatePoint 的 Vue 应用、SelectHandler 的 Select 交互全部泄漏。
 *
 * 这组测试用 OL Map 桩，验证：
 * 1. Line 暴露 destroyAllFlowLines，会清空 flowLineRegistry 并触发各 handle.remove()
 * 2. Point.destroyAll 触发所有 addPulsePointLayer/addPoint 句柄的 remove
 * 3. Polygon.destroyAll 移除所有由 add 系列 / setOutLayer 注册的图层
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BaseLayer from 'ol/layer/Base';
import { Line } from '../src/core/line';
import { Polygon } from '../src/core/polygon';
import { Point } from '../src/core/point';
import type { MapJSONData, PointData, PulsePointOptions } from '../src/types';

const flowLineData: MapJSONData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [[120, 30], [120.1, 30.1]]
      }
    }
  ]
};

const polygonData: MapJSONData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[[120, 30], [120.1, 30], [120.1, 30.1], [120, 30.1], [120, 30]]]
      }
    }
  ]
};

const pointData: PointData[] = [
  { lgtd: 120, lttd: 30, lev: 1 },
  { lgtd: 120.1, lttd: 30.1, lev: 2 }
];

function createMapStub() {
  const layers: BaseLayer[] = [];
  return {
    layers,
    addLayer: vi.fn((layer: BaseLayer) => { layers.push(layer); }),
    removeLayer: vi.fn((layer: BaseLayer) => {
      const i = layers.indexOf(layer);
      if (i >= 0) layers.splice(i, 1);
    }),
    addOverlay: vi.fn(),
    removeOverlay: vi.fn(),
    render: vi.fn(),
    getView: vi.fn(() => ({
      getZoom: () => 10,
      getResolution: () => 1,
      getCenter: () => [120, 30],
      fit: vi.fn()
    })),
    getLayers: vi.fn(() => ({ getArray: () => layers }))
  } as any;
}

describe('destroy 级联清理', () => {
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
    vi.restoreAllMocks();
  });

  describe('Line.destroyAllFlowLines', () => {
    it('会调用每个 flow line handle 的 remove 并清空 registry', () => {
      const map = createMapStub();
      const line = new Line(map);

      line.addFlowLine(flowLineData, { layerName: 'flow-a' });
      line.addFlowLine(flowLineData, { layerName: 'flow-b' });

      // 每条 flow 两层：base + animation
      expect(map.layers.length).toBe(4);

      line.destroyAllFlowLines();
      expect(map.layers.length).toBe(0);
      expect(cafSpy).toHaveBeenCalled();

      // 幂等：再次调用不抛错
      expect(() => line.destroyAllFlowLines()).not.toThrow();
    });
  });

  describe('Polygon.destroyAll', () => {
    it('会移除所有由 addPolygon / addBorderPolygon 注册的图层', () => {
      const map = createMapStub();
      const polygon = new Polygon(map);

      polygon.addPolygon(polygonData, { layerName: 'poly-a' });
      polygon.addBorderPolygon(polygonData, { layerName: 'border-a' });

      expect(map.layers.length).toBeGreaterThanOrEqual(2);

      polygon.destroyAll();
      expect(map.layers.length).toBe(0);

      // 幂等
      expect(() => polygon.destroyAll()).not.toThrow();
    });

    it('removePolygonLayer 不再依赖动态属性赋值（[key:string]:any 已删）', () => {
      const map = createMapStub();
      const polygon = new Polygon(map);
      polygon.addPolygon(polygonData, { layerName: 'poly-to-remove' });
      expect(() => polygon.removePolygonLayer('poly-to-remove')).not.toThrow();
    });
  });

  describe('Point.destroyAll', () => {
    it('会移除 addPoint / addPulsePointLayer 注册的图层与动画', () => {
      const map = createMapStub();
      const point = new Point(map);

      point.addPoint(pointData, { layerName: 'static-points' });
      const pulseOpts: PulsePointOptions = {
        layerName: 'pulse-points',
        pulse: { enabled: true, frameCount: 4, duration: 1000, radius: [4, 12] }
      };
      point.addPulsePointLayer(pointData, pulseOpts);

      expect(map.layers.length).toBe(2);

      point.destroyAll();
      expect(map.layers.length).toBe(0);
      expect(cafSpy).toHaveBeenCalled();

      expect(() => point.destroyAll()).not.toThrow();
    });
  });
});
