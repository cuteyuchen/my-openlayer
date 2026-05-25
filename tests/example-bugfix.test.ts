/**
 * 用户在 examples dev server 上发现的 3 个真实库 bug 的回归测试。
 *
 * 1. VueTemplatePoint.updateProps 把 prop 值塞进 prop 声明位置，导致 render 读不到值
 * 2. PolygonHeatmapLayer.addHeatmap 数据无 valueKey 时 weight=NaN，整层不渲染
 * 3. PolygonMaskLayer.addMaskLayer 未传 zIndex 给 VectorLayer，被底图覆盖
 */

// 必须在所有 import 之前 mock，否则 Polygon 会拿到真 Heatmap。
// 真 Heatmap 构造时会创建 canvas 渐变，需要 DOM + canvas 2d context，node 环境不可用。
import { vi } from 'vitest';
vi.mock('ol/layer', async () => {
  const actual = await vi.importActual<typeof import('ol/layer')>('ol/layer');
  const VectorLayerMod = await vi.importActual<typeof import('ol/layer/Vector')>('ol/layer/Vector');
  const VectorLayer = VectorLayerMod.default;
  class HeatmapStub extends VectorLayer<any> {
    public readonly _weightFn: (feature: any) => number;
    constructor(opts: any) {
      super(opts);
      this._weightFn = opts.weight;
    }
  }
  return { ...actual, Heatmap: HeatmapStub };
});

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import BaseLayer from 'ol/layer/Base';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import { ConfigManager, Polygon } from '../src';
import type { MapJSONData, PointData } from '../src';

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

function createMapStub() {
  const layers: BaseLayer[] = [];
  return {
    layers,
    addLayer: vi.fn((layer: BaseLayer) => { layers.push(layer); }),
    removeLayer: vi.fn((layer: BaseLayer) => {
      const i = layers.indexOf(layer);
      if (i >= 0) layers.splice(i, 1);
    }),
    render: vi.fn(),
    getView: vi.fn(() => ({
      getZoom: () => 10,
      getResolution: () => 1,
      getCenter: () => [120, 30],
      fit: vi.fn(),
      getProjection: () => ({ getExtent: () => [-180, -90, 180, 90] })
    })),
    getLayers: vi.fn(() => ({ getArray: () => layers }))
  } as any;
}

describe('addMaskLayer：zIndex 默认值不再为 0，避免被底图盖住', () => {
  it('默认 zIndex = 12（高于天地图底图的 9）', () => {
    const map = createMapStub();
    const { layer } = new Polygon(map).addMaskLayer(polygonData, { layerName: 'demo-mask' });
    expect(layer).toBeInstanceOf(VectorLayer);
    expect(layer.getZIndex()).toBe(12);
  });

  it('用户传 zIndex 仍能覆盖默认', () => {
    const map = createMapStub();
    const { layer } = new Polygon(map).addMaskLayer(polygonData, { layerName: 'demo-mask', zIndex: 99 });
    expect(layer.getZIndex()).toBe(99);
  });

  it('ConfigManager.DEFAULT_MASK_OPTIONS 已加入 zIndex', () => {
    expect((ConfigManager.DEFAULT_MASK_OPTIONS as any).zIndex).toBe(12);
  });
});

describe('addHeatmap：数据无 valueKey 字段时回退为等权重而非整层不渲染', () => {
  const pointsWithoutValue: PointData[] = [
    { lgtd: 120, lttd: 30, lev: 1 },
    { lgtd: 120.05, lttd: 30.05, lev: 2 }
  ];

  it('数据无 "value" 字段，回退为等权重 1 仍能添加图层', () => {
    const map = createMapStub();
    const { layer } = new Polygon(map).addHeatmap(pointsWithoutValue, { layerName: 'h1' }) as any;
    expect(layer).toBeInstanceOf(VectorLayer);
    const feats = (layer.getSource() as VectorSource).getFeatures();
    expect(feats).toHaveLength(2);
    feats.forEach((f: Feature) => {
      const w = f.get('weight');
      expect(Number.isFinite(w)).toBe(true);
      expect(w).toBe(1);
    });
  });

  it('显式指定 valueKey 正常归一化', () => {
    const map = createMapStub();
    const { layer } = new Polygon(map).addHeatmap(pointsWithoutValue, { layerName: 'h2', valueKey: 'lev' }) as any;
    const feats = (layer.getSource() as VectorSource).getFeatures();
    expect(feats[0].get('weight')).toBeCloseTo(0.5);
    expect(feats[1].get('weight')).toBe(1);
  });
});
