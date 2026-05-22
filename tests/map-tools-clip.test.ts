import { describe, expect, it, vi } from 'vitest';
import { MapTools } from '../src/core/map';
import type { MapJSONData } from '../src/types';

const clipData: MapJSONData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [1, 2],
            [3, 4],
            [5, 6],
            [1, 2]
          ]
        ]
      }
    }
  ]
};

function createLayerStub() {
  const listeners = new Map<string, (event: any) => void>();
  return {
    on: vi.fn((type: string, handler: (event: any) => void) => {
      listeners.set(type, handler);
    }),
    trigger(type: string, event: any) {
      listeners.get(type)?.(event);
    }
  };
}

function createCanvasContextStub() {
  return {
    save: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    clip: vi.fn(),
    restore: vi.fn()
  };
}

describe('MapTools.setMapClip', () => {
  it('高分屏渲染时会把裁剪坐标转换到当前 canvas 像素坐标', () => {
    const layer = createLayerStub();
    const context = createCanvasContextStub();

    MapTools.setMapClip(layer, clipData);

    layer.trigger('prerender', {
      context,
      inversePixelTransform: [2, 0, 0, 2, 100, 200],
      frameState: {
        coordinateToPixelTransform: [1, 0, 0, 1, 10, 20]
      }
    });

    expect(context.moveTo).toHaveBeenCalledWith(122, 244);
    expect(context.lineTo).toHaveBeenNthCalledWith(1, 126, 248);
    expect(context.lineTo).toHaveBeenNthCalledWith(2, 130, 252);
    expect(context.closePath).toHaveBeenCalled();
    expect(context.clip).toHaveBeenCalled();
  });
});

describe('MapTools.clipMap', () => {
  it('遍历 map.getLayers() 上每一层并绑定 prerender + postrender', () => {
    const layerA = createLayerStub();
    const layerB = createLayerStub();
    const layerC = createLayerStub();
    const layers = [layerA, layerB, layerC];
    const mapStub = {
      getLayers: () => ({ getArray: () => layers })
    } as any;

    MapTools.clipMap(mapStub, clipData);

    // 每层都被绑定了 prerender + postrender，即每层 .on 调用 2 次
    [layerA, layerB, layerC].forEach(l => {
      expect(l.on).toHaveBeenCalledTimes(2);
      const types = (l.on as any).mock.calls.map((c: any[]) => c[0]);
      expect(types).toContain('prerender');
      expect(types).toContain('postrender');
    });
  });

  it('单层抛错不影响其它层继续裁剪', () => {
    const ok1 = createLayerStub();
    const bad = {
      on: vi.fn(() => { throw new Error('boom'); })
    };
    const ok2 = createLayerStub();
    const mapStub = {
      getLayers: () => ({ getArray: () => [ok1, bad, ok2] })
    } as any;

    expect(() => MapTools.clipMap(mapStub, clipData)).not.toThrow();
    expect(ok1.on).toHaveBeenCalledTimes(2);
    expect(ok2.on).toHaveBeenCalledTimes(2);
  });
});
