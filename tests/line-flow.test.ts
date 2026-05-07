import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Icon, RegularShape } from 'ol/style';
import { Line, LineStyleFactory } from '../src/core/line';
import ProjectionUtils from '../src/utils/ProjectionUtils';
import type { FlowLineOptions, MapJSONData } from '../src/types';

const lineStringData: MapJSONData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'line-a' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [120, 30],
          [120.1, 30.1]
        ]
      }
    }
  ]
};

const multiLineStringData: MapJSONData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'multi-line' },
      geometry: {
        type: 'MultiLineString',
        coordinates: [
          [
            [120, 30],
            [120.1, 30.1]
          ],
          [
            [121, 31],
            [121.1, 31.1]
          ]
        ]
      }
    }
  ]
};

function createMapStub() {
  const layers: VectorLayer<VectorSource>[] = [];
  return {
    layers,
    addLayer: vi.fn((layer: VectorLayer<VectorSource>) => {
      layers.push(layer);
    }),
    removeLayer: vi.fn((layer: VectorLayer<VectorSource>) => {
      const index = layers.indexOf(layer);
      if (index >= 0) {
        layers.splice(index, 1);
      }
    }),
    render: vi.fn(),
    getLayers: vi.fn(() => ({
      getArray: () => layers
    }))
  } as any;
}

describe('Line.addFlowLine', () => {
  let rafSpy: ReturnType<typeof vi.spyOn>;
  let cafSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    if (!('requestAnimationFrame' in globalThis)) {
      vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      });
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

  it('LineString 与 MultiLineString 都能返回稳定 handle', () => {
    const map = createMapStub();
    const line = new Line(map);

    const lineHandle = line.addFlowLine(lineStringData, {
      layerName: 'flow-line-a',
      flowSymbol: {
        scale: 1,
        rotateWithView: true,
        count: 2,
        spacing: 0.2
      }
    });
    const multiHandle = line.addFlowLine(multiLineStringData, {
      layerName: 'flow-line-b',
      flowSymbol: {
        src: '/ship.svg',
        color: '#19b1ff'
      }
    });

    expect(lineHandle?.layer).toBeInstanceOf(VectorLayer);
    expect(lineHandle?.animationLayer).toBeInstanceOf(VectorLayer);
    expect(lineHandle?.layer.get('layerName')).toBe('flow-line-a');
    expect(lineHandle?.animationLayer.get('layerName')).toBe('flow-line-a__flow-animation');
    expect(multiHandle?.layer.getSource()?.getFeatures()).toHaveLength(2);
    expect(multiHandle?.animationLayer.getSource()?.getFeatures()).toHaveLength(2);
  });

  it('setVisible 会同步控制基础线图层和动画图层', () => {
    const map = createMapStub();
    const handle = new Line(map).addFlowLine(lineStringData, { layerName: 'visible-flow' });

    handle?.setVisible(false);
    expect(handle?.layer.getVisible()).toBe(false);
    expect(handle?.animationLayer.getVisible()).toBe(false);

    handle?.setVisible(true);
    expect(handle?.layer.getVisible()).toBe(true);
    expect(handle?.animationLayer.getVisible()).toBe(true);
  });

  it('updateData 与 remove 可重复调用且不抛错', () => {
    const map = createMapStub();
    const handle = new Line(map).addFlowLine(lineStringData, { layerName: 'lifecycle-flow' });

    expect(() => handle?.updateData(multiLineStringData)).not.toThrow();
    expect(handle?.layer.getSource()?.getFeatures()).toHaveLength(2);
    expect(() => handle?.stop()).not.toThrow();
    expect(() => handle?.stop()).not.toThrow();
    expect(() => handle?.remove()).not.toThrow();
    expect(() => handle?.remove()).not.toThrow();
  });

  it('同名重复调用会移除旧实例并注册新实例', () => {
    const map = createMapStub();
    const line = new Line(map);

    const first = line.addFlowLine(lineStringData, { layerName: 'same-flow' });
    const second = line.addFlowLine(multiLineStringData, { layerName: 'same-flow' });

    expect(second).not.toBe(first);
    expect(map.removeLayer).toHaveBeenCalledWith(first?.layer);
    expect(map.removeLayer).toHaveBeenCalledWith(first?.animationLayer);
    expect(map.layers).toContain(second?.layer);
    expect(map.layers).toContain(second?.animationLayer);
  });

  it('showBaseLine 为 false 时 handle 仍完整且动画层可用', () => {
    const map = createMapStub();
    const handle = new Line(map).addFlowLine(lineStringData, {
      layerName: 'hidden-base-flow',
      showBaseLine: false
    });

    expect(handle?.layer).toBeInstanceOf(VectorLayer);
    expect(handle?.animationLayer).toBeInstanceOf(VectorLayer);
    expect(handle?.layer.getSource()).toBeTruthy();
    expect(handle?.animationLayer.getSource()).toBeTruthy();
  });

  it.each(['icon', 'dash', 'icon+dash'] as const)('animationMode=%s 时能创建动画线', (animationMode) => {
    const map = createMapStub();
    const handle = new Line(map).addFlowLine(lineStringData, {
      layerName: `mode-${animationMode}`,
      animationMode,
      flowSymbol: {
        src: '/symbol.svg',
        scale: 0.9,
        rotateWithView: true,
        count: 2,
        spacing: 0.25
      }
    });

    expect(handle).not.toBeNull();
    expect(handle?.animationLayer.get('layerName')).toBe(`mode-${animationMode}__flow-animation`);
  });

  it('flowSymbol 配置可作为沿线运动符号主入口', () => {
    const map = createMapStub();
    const options: FlowLineOptions = {
      layerName: 'symbol-flow',
      animationMode: 'icon',
      flowSymbol: {
        src: '/boat.svg',
        scale: 1.1,
        color: '#00d2ff',
        rotateWithView: true,
        count: 3,
        spacing: 0.18
      }
    };

    const handle = new Line(map).addFlowLine(lineStringData, options);
    expect(handle).not.toBeNull();
    expect(handle?.animationLayer.get('layerName')).toBe('symbol-flow__flow-animation');
  });

  it('非法数据返回 null 且不留下脏图层', () => {
    const map = createMapStub();
    const handle = new Line(map).addFlowLine({ type: 'FeatureCollection', features: [] }, {
      layerName: 'bad-flow'
    });

    expect(handle).toBeNull();
    expect(map.layers).toHaveLength(0);
  });
});

describe('Line.addFlowLineByUrl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('网络失败、JSON 解析失败、数据结构非法时返回 null 且不留下脏图层', async () => {
    const map = createMapStub();
    const line = new Line(map);

    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('network')));
    await expect(line.addFlowLineByUrl('/network-error.json', { layerName: 'url-flow-a' })).resolves.toBeNull();

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.reject(new Error('bad json'))
    }));
    await expect(line.addFlowLineByUrl('/bad-json.json', { layerName: 'url-flow-b' })).resolves.toBeNull();

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ bad: true })
    }));
    await expect(line.addFlowLineByUrl('/bad-data.json', { layerName: 'url-flow-c' })).resolves.toBeNull();

    expect(map.layers).toHaveLength(0);
  });
});

describe('ProjectionUtils', () => {
  it('显式投影字段优先级高于 projectionOptOptions', () => {
    const options = ProjectionUtils.getGeoJSONReadOptions({
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857',
      projectionOptOptions: {
        dataProjection: 'EPSG:4490',
        featureProjection: 'EPSG:4549'
      }
    });

    expect(options).toMatchObject({
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    });
  });
});

describe('LineStyleFactory.getMovingSymbolStyle', () => {
  it('传入 src 时使用 Icon，未传 src 时回退为内建图形', () => {
    const styleFactory = new LineStyleFactory();

    const iconStyle = styleFactory.getMovingSymbolStyle(0, {
      flowSymbol: {
        src: '/symbol.svg',
        scale: 1
      }
    });
    const builtinStyle = styleFactory.getMovingSymbolStyle(0, {
      flowSymbol: {
        scale: 1
      }
    });

    expect(iconStyle.getImage()).toBeInstanceOf(Icon);
    expect(builtinStyle.getImage()).toBeInstanceOf(RegularShape);
  });
});
