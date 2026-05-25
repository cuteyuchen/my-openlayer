/**
 * P2-1 回归测试：ConfigManager.setDefaults 应该影响后续 add* 方法的默认值。
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import BaseLayer from 'ol/layer/Base';
import VectorLayer from 'ol/layer/Vector';
import { ConfigManager } from '../src/core/map';
import { Line } from '../src/core/line';
import type { MapJSONData } from '../src/types';

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

const lineData: MapJSONData = {
  type: 'FeatureCollection',
  features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[120, 30], [120.1, 30.1]] } }]
};

describe('ConfigManager.setDefaults', () => {
  afterEach(() => {
    ConfigManager.resetDefaults();
  });

  it('修改 LINE_OPTIONS 默认值后，addLine 不传 strokeWidth 时取新默认', () => {
    expect(ConfigManager.DEFAULT_LINE_OPTIONS.strokeWidth).toBe(2);

    ConfigManager.setDefaults('LINE_OPTIONS', { strokeWidth: 7 });
    expect(ConfigManager.DEFAULT_LINE_OPTIONS.strokeWidth).toBe(7);

    const line = new Line(createMapStub());
    const handle = line.addLine(lineData, { layerName: 'l1' });
    expect(handle.layer).toBeInstanceOf(VectorLayer);

    // 重置后回到原默认
    ConfigManager.resetDefaults('LINE_OPTIONS');
    expect(ConfigManager.DEFAULT_LINE_OPTIONS.strokeWidth).toBe(2);
  });

  it('嵌套 FLOW_LINE_OPTIONS.flowSymbol 做深合并', () => {
    ConfigManager.setDefaults('FLOW_LINE_OPTIONS', { flowSymbol: { scale: 1.5 } } as any);
    expect(ConfigManager.DEFAULT_FLOW_LINE_OPTIONS.flowSymbol.scale).toBe(1.5);
    // 其它字段保持
    expect(ConfigManager.DEFAULT_FLOW_LINE_OPTIONS.flowSymbol.count).toBe(1);
    expect(ConfigManager.DEFAULT_FLOW_LINE_OPTIONS.duration).toBe(4000);
  });

  it('getDefaults 返回深拷贝，外部修改不影响内部', () => {
    const snapshot = ConfigManager.getDefaults('LINE_OPTIONS');
    snapshot.strokeWidth = 999;
    expect(ConfigManager.DEFAULT_LINE_OPTIONS.strokeWidth).toBe(2);
  });

  it('resetDefaults() 清掉所有覆盖', () => {
    ConfigManager.setDefaults('LINE_OPTIONS', { strokeWidth: 99 });
    ConfigManager.setDefaults('POINT_OPTIONS', { zIndex: 999 });
    ConfigManager.resetDefaults();
    expect(ConfigManager.DEFAULT_LINE_OPTIONS.strokeWidth).toBe(2);
    expect(ConfigManager.DEFAULT_POINT_OPTIONS.zIndex).toBe(21);
  });
});
