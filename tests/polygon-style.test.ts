import { afterEach, describe, expect, it, vi } from 'vitest';
import Feature from 'ol/Feature';
import BaseLayer from 'ol/layer/Base';
import { Fill, Stroke, Style, Text } from 'ol/style';
import { ConfigManager, createPolygonStyle, Polygon } from '../src';
import type { MapJSONData, PolygonOptions } from '../src';

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

describe('createPolygonStyle 公开样式工厂', () => {
  afterEach(() => {
    ConfigManager.resetDefaults('POLYGON_OPTIONS');
  });

  it('从包入口创建静态样式，图层 zIndex 不影响样式层级', () => {
    const options: PolygonOptions = {
      fillColor: '#ff0000',
      strokeColor: '#123456',
      strokeWidth: 4,
      lineDash: [4, 2],
      lineDashOffset: 1,
      zIndex: 20,
      styleZIndex: 0
    };
    const style = createPolygonStyle(options, new Feature()) as Style;

    expect(style.getFill()?.getColor()).toBe('#ff0000');
    expect(style.getStroke()?.getColor()).toBe('#123456');
    expect(style.getStroke()?.getWidth()).toBe(4);
    expect(style.getStroke()?.getLineDash()).toEqual([4, 2]);
    expect(style.getStroke()?.getLineDashOffset()).toBe(1);
    expect(style.getZIndex()).toBe(0);
    expect(options).not.toHaveProperty('textFont');
  });

  it('与面图层共用运行时默认文字配置，调用方配置优先', () => {
    ConfigManager.setDefaults('POLYGON_OPTIONS', {
      textFont: '18px Arial',
      textFillColor: '#112233',
      textStrokeColor: '#445566',
      textStrokeWidth: 4
    });
    const styles = createPolygonStyle({
      textVisible: true,
      textKey: 'name',
      textFillColor: '#abcdef',
      textOverflow: true,
      styleZIndex: 3
    }, new Feature({ name: '区域A' }));
    const text = getTextStyle(styles);

    expect(text?.getText()).toBe('区域A');
    expect(text?.getFont()).toBe('18px Arial');
    expect(text?.getFill()?.getColor()).toBe('#abcdef');
    expect(text?.getStroke()?.getColor()).toBe('#445566');
    expect(text?.getStroke()?.getWidth()).toBe(4);
    expect(text?.getOverflow()).toBe(true);
    expect(normalizeStyles(styles)).toHaveLength(2);
    expect(normalizeStyles(styles).map(style => style.getZIndex())).toEqual([3, 3]);
  });

  it('执行动态填色和文本回调，未指定 styleZIndex 时保持原有默认行为', () => {
    const feature = new Feature({ name: '区域A', riskColor: '#ff0000' });
    const fillColorCallBack = vi.fn(item => item.get('riskColor'));
    const styles = createPolygonStyle({
      fillColorCallBack,
      textVisible: true,
      textKey: 'name',
      textCallBack: item => `${item.get('name')}风险`,
      zIndex: 20
    }, feature);

    expect(fillColorCallBack).toHaveBeenCalledWith(feature);
    expect(normalizeStyles(styles)[0].getFill()?.getColor()).toBe('#ff0000');
    expect(getTextStyle(styles)?.getText()).toBe('区域A风险');
    expect(normalizeStyles(styles).map(style => style.getZIndex())).toEqual([undefined, undefined]);
  });

  it('禁用默认填充和描边时可以只返回文字或空样式', () => {
    const feature = new Feature({ name: '区域A' });
    const options: PolygonOptions = {
      withDefaultFill: false,
      withDefaultStroke: false,
      textKey: 'name',
      styleZIndex: -1
    };
    const styles = normalizeStyles(createPolygonStyle({ ...options, textVisible: true }, feature));

    expect(styles).toHaveLength(1);
    expect(styles[0].getFill()).toBeNull();
    expect(styles[0].getStroke()).toBeNull();
    expect(styles[0].getText()?.getText()).toBe('区域A');
    expect(styles[0].getZIndex()).toBe(-1);
    expect(createPolygonStyle(options, feature)).toEqual([]);
  });

  it.each(['single', 'array', 'callback'] as const)('保留自定义 style 优先级和对象引用：%s', kind => {
    const feature = new Feature({ name: '区域A' });
    const customStyle = new Style({ zIndex: 8 });
    const expected = kind === 'array' ? [customStyle] : customStyle;
    const callback = vi.fn(() => expected);
    const style = createPolygonStyle({
      style: kind === 'callback' ? callback : expected,
      fillColor: '#ff0000',
      styleZIndex: 99
    }, feature);

    expect(style).toBe(expected);
    expect(customStyle.getZIndex()).toBe(8);
    expect(customStyle.getFill()).toBeNull();
    if (kind === 'callback') {
      expect(callback).toHaveBeenCalledWith(feature);
    }
  });
});

describe('Polygon 样式层级', () => {
  it.each([false, true])('内置面与文字样式使用同一层级，动态填色：%s', dynamicFill => {
    const polygon = new Polygon(createMapStub());
    const handle = polygon.addPolygon(polygonData, {
      layerName: 'area',
      zIndex: 20,
      styleZIndex: -2,
      textVisible: true,
      textKey: 'name',
      ...(dynamicFill ? { fillColorCallBack: () => '#ff0000' } : {})
    });
    const feature = handle.layer.getSource()!.getFeatures()[0];
    const styles = handle.layer.getStyleFunction()!(feature, 1) as Style[];

    expect(handle.layer.getZIndex()).toBe(20);
    expect(styles).toHaveLength(2);
    expect(styles.map(style => style.getZIndex())).toEqual([-2, -2]);
  });

  it('style 回调通过公开工厂按要素创建样式，并响应选中状态变化', () => {
    const handle = new Polygon(createMapStub()).addPolygon(polygonData, {
      layerName: 'area',
      zIndex: 20,
      style: feature => createPolygonStyle({
        fillColor: feature.get('riskColor'),
        strokeColor: feature.get('active') ? '#ff0000' : '#123456',
        strokeWidth: feature.get('active') ? 4 : 2,
        styleZIndex: feature.get('active') ? 1 : 0,
        textVisible: true,
        textKey: 'name'
      }, feature)
    });
    const feature = handle.layer.getSource()!.getFeatures()[0];
    const styleFunction = handle.layer.getStyleFunction()!;
    feature.set('riskColor', '#00ff00');
    const previous = normalizeStyles(styleFunction(feature, 1) as Style[]);

    expect(previous[0].getStroke()?.getColor()).toBe('#123456');
    expect(previous[0].getStroke()?.getWidth()).toBe(2);
    expect(previous.map(style => style.getZIndex())).toEqual([0, 0]);

    feature.set('active', true);
    const active = normalizeStyles(styleFunction(feature, 1) as Style[]);

    expect(active[0].getFill()?.getColor()).toBe('#00ff00');
    expect(active[0].getStroke()?.getColor()).toBe('#ff0000');
    expect(active[0].getStroke()?.getWidth()).toBe(4);
    expect(active.map(style => style.getZIndex())).toEqual([1, 1]);
    expect(previous[0].getZIndex()).toBe(0);
    expect(handle.layer.getZIndex()).toBe(20);
  });

  it('updateFeatureColor 沿用图层或要素当前样式的层级', () => {
    const polygon = new Polygon(createMapStub());
    const handle = polygon.addPolygon(polygonData, {
      layerName: 'area',
      zIndex: 20,
      styleZIndex: 7,
      textVisible: true,
      textKey: 'name'
    });
    const feature = handle.layer.getSource()!.getFeatures()[0];

    polygon.updateFeatureColor('area', { '区域A': '#ff0000' }, { textKey: 'name' });
    const previousStyle = feature.getStyle() as Style;
    expect(previousStyle.getZIndex()).toBe(7);
    expect(previousStyle.getText()?.getText()).toBe('区域A');

    // 要素级样式优先于图层样式，后续填色不能把激活区域降回图层默认层级。
    previousStyle.setZIndex(9);
    polygon.updateFeatureColor('area', { '区域A': '#00ff00' }, { textKey: 'name' });

    expect((feature.getStyle() as Style).getZIndex()).toBe(9);
    expect((feature.getStyle() as Style).getFill()?.getColor()).toBe('#00ff00');
    expect(handle.layer.getZIndex()).toBe(20);
  });

  it.each([0, -1])('updateFeatureColor 可以显式覆盖样式层级为 %s', styleZIndex => {
    const polygon = new Polygon(createMapStub());
    const handle = polygon.addPolygon(polygonData, {
      layerName: 'area',
      zIndex: 20,
      styleZIndex: 7
    });

    polygon.updateFeatureColor('area', undefined, { styleZIndex, zIndex: 99 });

    const feature = handle.layer.getSource()!.getFeatures()[0];
    expect((feature.getStyle() as Style).getZIndex()).toBe(styleZIndex);
    expect(handle.layer.getZIndex()).toBe(20);
  });
});

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
