import { describe, expect, it, vi } from 'vitest';
import BaseLayer from 'ol/layer/Base';
import { Fill, Stroke, Style, Text } from 'ol/style';
import { Polygon } from '../src/core/polygon';
import type { MapJSONData } from '../src/types';

/** *********************测试工具*********************/

function createMapStub() {
  const layers: BaseLayer[] = [];
  return {
    layers,
    addLayer: vi.fn((layer: BaseLayer) => { layers.push(layer); }),
    removeLayer: vi.fn((layer: BaseLayer) => {
      const index = layers.indexOf(layer);
      if (index >= 0) layers.splice(index, 1);
    }),
    getView: vi.fn(() => ({ fit: vi.fn(), getResolution: () => 1 })),
    getLayers: vi.fn(() => ({ getArray: () => layers }))
  } as any;
}

function normalizeStyles(styles: Style | Style[] | undefined): Style[] {
  if (!styles) return [];
  return Array.isArray(styles) ? styles : [styles];
}

function getTextStyle(styles: Style | Style[] | undefined): Text | undefined {
  return normalizeStyles(styles).map(style => style.getText()).find(Boolean);
}

const polygonData: MapJSONData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: '区域A' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[120, 30], [120.1, 30], [120.1, 30.1], [120, 30.1], [120, 30]]]
      }
    }
  ]
};

/** *********************测试用例*********************/

describe('Polygon 文本样式', () => {
  it('addPolygon 支持 textOverflow，避免面文本随缩放尺寸不足而隐藏', () => {
    const map = createMapStub();
    const polygon = new Polygon(map);
    const handle = polygon.addPolygon(polygonData, {
      layerName: 'area',
      textVisible: true,
      textKey: 'name',
      textOverflow: true
    });
    const feature = handle.layer.getSource()!.getFeatures()[0];
    const styleLike = handle.layer.getStyle();
    const styles = typeof styleLike === 'function' ? styleLike(feature, 1) : styleLike;
    const text = getTextStyle(styles as Style | Style[]);

    expect(text?.getOverflow()).toBe(true);
  });

  it('updateFeatureColor 未指定文字样式时沿用原图层文字样式', () => {
    const map = createMapStub();
    const polygon = new Polygon(map);
    const handle = polygon.addPolygon(polygonData, {
      layerName: 'area',
      fillColor: 'rgba(0, 0, 255, 0.1)',
      strokeColor: '#123456',
      strokeWidth: 4,
      textVisible: true,
      textKey: 'name',
      textFont: '18px Arial',
      textFillColor: '#654321',
      textStrokeColor: '#abcdef',
      textStrokeWidth: 5,
      textOverflow: true
    });

    polygon.updateFeatureColor('area', { '区域A': 'rgba(255, 0, 0, 0.5)' }, { textKey: 'name' });

    const featureStyle = handle.layer.getSource()!.getFeatures()[0].getStyle() as Style;
    const text = featureStyle.getText();
    const stroke = featureStyle.getStroke() as Stroke;
    const fill = featureStyle.getFill() as Fill;

    expect(fill.getColor()).toBe('rgba(255, 0, 0, 0.5)');
    expect(stroke.getColor()).toBe('#123456');
    expect(stroke.getWidth()).toBe(4);
    expect(text?.getFont()).toBe('18px Arial');
    expect((text?.getFill() as Fill).getColor()).toBe('#654321');
    expect((text?.getStroke() as Stroke).getColor()).toBe('#abcdef');
    expect((text?.getStroke() as Stroke).getWidth()).toBe(5);
    expect(text?.getOverflow()).toBe(true);
  });
});
