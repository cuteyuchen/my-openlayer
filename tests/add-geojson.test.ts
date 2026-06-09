// @vitest-environment happy-dom

/**
 * MyOl.addGeoJSON 综合方法测试。
 *
 * 覆盖输入形态、分组逻辑、图层命名、句柄操作、styleByProperties。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BaseLayer from 'ol/layer/Base';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Circle as CircleStyle, Style } from 'ol/style';
import MyOl from '../src/MyOl';

/** *********************测试工具*********************/

function createMapContainer(): HTMLElement {
  const div = document.createElement('div');
  div.id = 'map-test-' + Math.random().toString(36).slice(2);
  div.style.width = '800px';
  div.style.height = '600px';
  document.body.appendChild(div);
  return div;
}

function createMyOl() {
  const container = createMapContainer();
  return new MyOl(container, {
    center: [120, 30],
    zoom: 10,
  });
}

/** *********************测试数据*********************/

const mixedFC = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { name: '点A' }, geometry: { type: 'Point', coordinates: [120, 30] } },
    { type: 'Feature', properties: { name: '点B' }, geometry: { type: 'Point', coordinates: [121, 31] } },
    { type: 'Feature', properties: { name: '线1' }, geometry: { type: 'LineString', coordinates: [[120, 30], [121, 31]] } },
    { type: 'Feature', properties: { name: '面1' }, geometry: { type: 'Polygon', coordinates: [[[120, 30], [121, 30], [121, 31], [120, 31], [120, 30]]] } },
  ],
};

const pointOnlyFC = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { name: 'P1' }, geometry: { type: 'Point', coordinates: [120, 30] } },
    { type: 'Feature', properties: { name: 'P2' }, geometry: { type: 'Point', coordinates: [121, 31] } },
  ],
};

const lineOnlyFC = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[120, 30], [121, 31]] } },
  ],
};

const polygonOnlyFC = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[120, 30], [121, 30], [121, 31], [120, 31], [120, 30]]] } },
  ],
};

const groupedFC = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { level: 'high', name: 'H1' }, geometry: { type: 'Point', coordinates: [120, 30] } },
    { type: 'Feature', properties: { level: 'low', name: 'L1' }, geometry: { type: 'Point', coordinates: [121, 31] } },
    { type: 'Feature', properties: { level: 'high', name: 'H2' }, geometry: { type: 'Point', coordinates: [122, 32] } },
  ],
};

/** *********************测试用例*********************/

describe('MyOl.addGeoJSON', () => {

  /** *********************基本输入形态*********************/

  describe('输入形态', () => {
    it('单个 FeatureCollection 创建对应图层', () => {
      const myol = createMyOl();
      const handle = myol.addGeoJSON(mixedFC, { layerName: 'test' });
      expect(handle.handles.length).toBeGreaterThan(0);
      // 应该有点、线、面三个图层
      expect(handle.groups.default.point).not.toBeNull();
      expect(handle.groups.default.line).not.toBeNull();
      expect(handle.groups.default.polygon).not.toBeNull();
      handle.remove();
      myol.destroy();
    });

    it('单个 Feature 创建图层', () => {
      const myol = createMyOl();
      const feature = mixedFC.features[0];
      const handle = myol.addGeoJSON(feature, { layerName: 'single' });
      expect(handle.handles.length).toBe(1);
      handle.remove();
      myol.destroy();
    });

    it('裸 Point geometry 创建点图层', () => {
      const myol = createMyOl();
      const handle = myol.addGeoJSON(
        { type: 'Point', coordinates: [120, 30] },
        { layerName: 'bare' }
      );
      expect(handle.groups.default.point).not.toBeNull();
      handle.remove();
      myol.destroy();
    });

    it('数组输入按索引作为 datasetKey', () => {
      const myol = createMyOl();
      const handle = myol.addGeoJSON([pointOnlyFC, lineOnlyFC], {
        layerName: ['points', 'lines'],
      });
      // 两个 dataset 各自创建图层
      expect(handle.handles.length).toBe(2);
      handle.remove();
      myol.destroy();
    });

    it('Record 输入按 key 作为 datasetKey', () => {
      const myol = createMyOl();
      const handle = myol.addGeoJSON(
        { stations: pointOnlyFC, routes: lineOnlyFC },
        { layerName: { stations: '站点', routes: '路线' } }
      );
      expect(handle.handles.length).toBe(2);
      handle.remove();
      myol.destroy();
    });
  });

  /** *********************图层命名*********************/

  describe('图层命名', () => {
    it('字符串 layerName 作为最终图层名，不自动拼接分组或几何类型', () => {
      const myol = createMyOl();
      const handle = myol.addGeoJSON(mixedFC, { layerName: 'risk' });
      expect(handle.handles.length).toBe(3);
      const names = handle.handles.map((h: any) => h.layer?.get?.('name') ?? h.layer?.get?.('layerName'));
      expect(names).toEqual(['risk', 'risk', 'risk']);
      handle.remove();
      myol.destroy();
    });

    it('回调 layerName 完全控制最终名称', () => {
      const myol = createMyOl();
      const layerNameFn = vi.fn(({ geometryType }: any) => `custom-${geometryType}`);
      const handle = myol.addGeoJSON(pointOnlyFC, { layerName: layerNameFn });
      expect(layerNameFn).toHaveBeenCalled();
      const layers = myol.map.getLayers().getArray() as BaseLayer[];
      const names = layers.map((l: any) => l.get?.('name') ?? l.get?.('layerName')).filter(Boolean);
      expect(names.some((n: string) => n === 'custom-point')).toBe(true);
      handle.remove();
      myol.destroy();
    });

    it('数组 layerName 与数组输入一一对应', () => {
      const myol = createMyOl();
      const handle = myol.addGeoJSON([pointOnlyFC, lineOnlyFC], {
        layerName: ['站点', '路线'],
      });
      // 通过 handle 检查图层名
      const allNames = handle.handles.map((h: any) => h.layer?.get?.('name') ?? h.layer?.get?.('layerName')).filter(Boolean);
      expect(allNames.some((n: string) => n.includes('站点'))).toBe(true);
      expect(allNames.some((n: string) => n.includes('路线'))).toBe(true);
      handle.remove();
      myol.destroy();
    });

    it('对象 layerName 与 Record 输入 key 对应', () => {
      const myol = createMyOl();
      const handle = myol.addGeoJSON(
        { a: pointOnlyFC, b: lineOnlyFC },
        { layerName: { a: '图层A', b: '图层B' } }
      );
      const allNames = handle.handles.map((h: any) => h.layer?.get?.('name') ?? h.layer?.get?.('layerName')).filter(Boolean);
      expect(allNames.some((n: string) => n.includes('图层A'))).toBe(true);
      expect(allNames.some((n: string) => n.includes('图层B'))).toBe(true);
      handle.remove();
      myol.destroy();
    });
  });

  /** *********************分组逻辑*********************/

  describe('分组逻辑', () => {
    it('groupBy 字符串按 properties 分组', () => {
      const myol = createMyOl();
      const handle = myol.addGeoJSON(groupedFC, {
        layerName: 'stations',
        groupBy: 'level',
      });
      // 应该有 high 和 low 两个分组
      expect(Object.keys(handle.groups)).toContain('high');
      expect(Object.keys(handle.groups)).toContain('low');
      expect(handle.groups.high.point).not.toBeNull();
      expect(handle.groups.low.point).not.toBeNull();
      handle.remove();
      myol.destroy();
    });

    it('groupBy 回调函数', () => {
      const myol = createMyOl();
      const groupByFn = vi.fn((props: any) => props.level?.toString());
      const handle = myol.addGeoJSON(groupedFC, {
        layerName: 'test',
        groupBy: groupByFn,
      });
      expect(groupByFn).toHaveBeenCalled();
      expect(Object.keys(handle.groups)).toContain('high');
      expect(Object.keys(handle.groups)).toContain('low');
      handle.remove();
      myol.destroy();
    });

    it('groupBy 取不到值时回退到 datasetKey', () => {
      const myol = createMyOl();
      const fc = {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [120, 30] } },
        ],
      };
      const handle = myol.addGeoJSON(fc, {
        layerName: 'test',
        groupBy: 'nonexistent',
      });
      // 应回退到 datasetKey 'default'
      expect(Object.keys(handle.groups)).toContain('default');
      handle.remove();
      myol.destroy();
    });
  });

  /** *********************句柄操作*********************/

  describe('句柄操作', () => {
    it('setVisible(false) 隐藏全部图层', () => {
      const myol = createMyOl();
      const handle = myol.addGeoJSON(mixedFC, { layerName: 'test' });
      handle.setVisible(false);
      for (const h of handle.handles) {
        expect(h.layer.getVisible()).toBe(false);
      }
      handle.remove();
      myol.destroy();
    });

    it('setVisible(true) 显示全部图层', () => {
      const myol = createMyOl();
      const handle = myol.addGeoJSON(mixedFC, { layerName: 'test' });
      handle.setVisible(false);
      handle.setVisible(true);
      for (const h of handle.handles) {
        expect(h.layer.getVisible()).toBe(true);
      }
      handle.remove();
      myol.destroy();
    });

    it('setGroupVisible 只影响指定组', () => {
      const myol = createMyOl();
      const handle = myol.addGeoJSON(groupedFC, {
        layerName: 'test',
        groupBy: 'level',
      });
      handle.setGroupVisible('high', false);
      // high 组的图层应该被隐藏
      for (const h of handle.groups.high.handles) {
        expect(h.layer.getVisible()).toBe(false);
      }
      // low 组不受影响
      for (const h of handle.groups.low.handles) {
        expect(h.layer.getVisible()).toBe(true);
      }
      handle.remove();
      myol.destroy();
    });

    it('removeGroup 只移除指定组', () => {
      const myol = createMyOl();
      const handle = myol.addGeoJSON(groupedFC, {
        layerName: 'test',
        groupBy: 'level',
      });
      const totalBefore = handle.handles.length;
      handle.removeGroup('high');
      expect(handle.groups.high).toBeUndefined();
      expect(handle.handles.length).toBeLessThan(totalBefore);
      // low 组仍然存在
      expect(handle.groups.low).toBeDefined();
      handle.remove();
      myol.destroy();
    });

    it('remove() 移除全部图层', () => {
      const myol = createMyOl();
      const handle = myol.addGeoJSON(mixedFC, { layerName: 'test' });
      const initialLayers = myol.map.getLayers().getArray().length;
      handle.remove();
      expect(handle.handles.length).toBe(0);
      expect(Object.keys(handle.groups).length).toBe(0);
      myol.destroy();
    });

    it('group handle 的 setVisible 和 remove', () => {
      const myol = createMyOl();
      const handle = myol.addGeoJSON(groupedFC, {
        layerName: 'test',
        groupBy: 'level',
      });
      const group = handle.groups.high;
      expect(group).toBeDefined();
      group.setVisible(false);
      for (const h of group.handles) {
        expect(h.layer.getVisible()).toBe(false);
      }
      group.remove();
      handle.remove();
      myol.destroy();
    });
  });

  /** *********************空数据处理*********************/

  describe('空数据处理', () => {
    it('null 返回空句柄', () => {
      const myol = createMyOl();
      const handle = myol.addGeoJSON(null as any, { layerName: 'empty' });
      expect(handle.handles.length).toBe(0);
      expect(Object.keys(handle.groups).length).toBe(0);
      myol.destroy();
    });

    it('undefined 返回空句柄', () => {
      const myol = createMyOl();
      const handle = myol.addGeoJSON(undefined as any, { layerName: 'empty' });
      expect(handle.handles.length).toBe(0);
      myol.destroy();
    });

    it('空 FeatureCollection 返回空句柄', () => {
      const myol = createMyOl();
      const handle = myol.addGeoJSON(
        { type: 'FeatureCollection', features: [] },
        { layerName: 'empty' }
      );
      expect(handle.handles.length).toBe(0);
      myol.destroy();
    });
  });

  /** *********************混合几何类型*********************/

  describe('混合几何类型', () => {
    it('只包含点数据时不创建线/面图层', () => {
      const myol = createMyOl();
      const handle = myol.addGeoJSON(pointOnlyFC, { layerName: 'pts' });
      expect(handle.groups.default.point).not.toBeNull();
      expect(handle.groups.default.line).toBeNull();
      expect(handle.groups.default.polygon).toBeNull();
      handle.remove();
      myol.destroy();
    });

    it('只包含线数据时只创建线图层', () => {
      const myol = createMyOl();
      const handle = myol.addGeoJSON(lineOnlyFC, { layerName: 'lines' });
      expect(handle.groups.default.point).toBeNull();
      expect(handle.groups.default.line).not.toBeNull();
      expect(handle.groups.default.polygon).toBeNull();
      handle.remove();
      myol.destroy();
    });

    it('只包含面数据时只创建面图层', () => {
      const myol = createMyOl();
      const handle = myol.addGeoJSON(polygonOnlyFC, { layerName: 'polys' });
      expect(handle.groups.default.point).toBeNull();
      expect(handle.groups.default.line).toBeNull();
      expect(handle.groups.default.polygon).not.toBeNull();
      handle.remove();
      myol.destroy();
    });
  });

  /** *********************styleByProperties 逐点样式*********************/

  describe('styleByProperties', () => {
    it('多个点仍只创建一个点图层', () => {
      const myol = createMyOl();
      const handle = myol.addGeoJSON(pointOnlyFC, {
        layerName: 'pts',
        point: {
          circleColor: '#3399CC',
          circleRadius: 6,
          styleByProperties: (props) => {
            // 即使返回不同样式，也应保持单图层
            return props.name === 'P1'
              ? { circleColor: '#ff0000' }
              : { circleColor: '#00ff00' };
          },
        },
      });
      // 应只有一个点图层 handle
      expect(handle.groups.default.point).not.toBeNull();
      // 索引 point.default 存在
      expect(handle.point.default).toBeDefined();
      expect(handle.point.default).not.toBeNull();
      handle.remove();
      myol.destroy();
    });

    it('回调拿到正确的 properties（不含 lgtd/lttd）、真实 FeatureData 和组内 index', () => {
      const myol = createMyOl();
      const cb = vi.fn((props: any, ctx: any) => {
        return { circleColor: '#3399CC' };
      });
      const handle = myol.addGeoJSON(pointOnlyFC, {
        layerName: 'pts',
        point: {
          circleColor: '#3399CC',
          circleRadius: 6,
          styleByProperties: cb,
        },
      });
      // 应被调用 2 次（每个点一次）
      expect(cb).toHaveBeenCalledTimes(2);
      const calls = cb.mock.calls;

      // 第一个点：P1
      const [props0, ctx0] = calls[0];
      // properties 应是原始 properties，不含 lgtd/lttd（除非原 properties 有）
      expect(props0.name).toBe('P1');
      expect(props0.lgtd).toBeUndefined();
      expect(props0.lttd).toBeUndefined();
      expect(props0._gIdx).toBeUndefined();
      // context.feature 应是真实 GeoJSON Feature（含 type/geometry/properties）
      expect(ctx0.feature.type).toBe('Feature');
      expect(ctx0.feature.geometry).toBeDefined();
      expect(ctx0.feature.geometry.type).toBe('Point');
      expect(ctx0.feature.properties.name).toBe('P1');
      expect(ctx0.feature.properties._gIdx).toBeUndefined();
      // context.index 应是组内真实索引
      expect(ctx0.index).toBe(0);
      expect(ctx0.groupKey).toBe('default');

      // 第二个点：P2，index 应为 1
      const [, ctx1] = calls[1];
      expect(ctx1.index).toBe(1);
      expect(ctx1.feature.properties.name).toBe('P2');

      handle.remove();
      myol.destroy();
    });

    it('circleColor/circleRadius 实际创建圆点 Style', () => {
      const myol = createMyOl();
      const handle = myol.addGeoJSON(pointOnlyFC, {
        layerName: 'pts',
        point: {
          circleColor: '#ff6600',
          circleRadius: 10,
          styleByProperties: () => ({ circleColor: '#ff6600', circleRadius: 10 }),
        },
      });
      // 通过 handle.point.default 获取图层句柄
      const ptHandle = handle.point.default!;
      expect(ptHandle).not.toBeNull();
      const layer = ptHandle.layer as VectorLayer<VectorSource>;
      const source = layer.getSource()!;
      const features = source.getFeatures();
      expect(features.length).toBe(2);

      // 验证每个 feature 的 style 包含 CircleStyle
      for (const f of features) {
        const style = f.getStyle() as Style;
        const image = style.getImage();
        expect(image).toBeInstanceOf(CircleStyle);
        expect((image as CircleStyle).getRadius()).toBe(10);
      }

      handle.remove();
      myol.destroy();
    });

    it('styleByProperties 可按 properties 返回不同样式', () => {
      const myol = createMyOl();
      const handle = myol.addGeoJSON(pointOnlyFC, {
        layerName: 'pts',
        point: {
          circleColor: '#3399CC',
          circleRadius: 6,
          styleByProperties: (props) => {
            if (props.name === 'P1') return { circleColor: '#ff0000', circleRadius: 8 };
            return { circleColor: '#00ff00', circleRadius: 12 };
          },
        },
      });
      const ptHandle = handle.point.default!;
      const layer = ptHandle.layer as VectorLayer<VectorSource>;
      const features = layer.getSource()!.getFeatures();

      // P1 的样式
      const style0 = features[0].getStyle() as Style;
      const img0 = style0.getImage() as CircleStyle;
      expect(img0.getRadius()).toBe(8);

      // P2 的样式
      const style1 = features[1].getStyle() as Style;
      const img1 = style1.getImage() as CircleStyle;
      expect(img1.getRadius()).toBe(12);

      handle.remove();
      myol.destroy();
    });
  });

  /** *********************handle.point/line/polygon 索引与同步清理*********************/

  describe('handle 索引与清理', () => {
    it('handle.point / line / polygon 索引可访问', () => {
      const myol = createMyOl();
      const handle = myol.addGeoJSON(mixedFC, { layerName: 'test' });
      // 默认组
      expect(handle.point.default).not.toBeNull();
      expect(handle.line.default).not.toBeNull();
      expect(handle.polygon.default).not.toBeNull();
      handle.remove();
      myol.destroy();
    });

    it('removeGroup 后 point/line/polygon 索引同步删除', () => {
      const myol = createMyOl();
      const handle = myol.addGeoJSON(groupedFC, {
        layerName: 'test',
        groupBy: 'level',
      });
      // high 组的索引存在
      expect(handle.point.high).toBeDefined();
      expect(handle.point.high).not.toBeNull();
      handle.removeGroup('high');
      // removeGroup 后索引应被删除
      expect(handle.point.high).toBeUndefined();
      expect(handle.line.high).toBeUndefined();
      expect(handle.polygon.high).toBeUndefined();
      // low 组不受影响
      expect(handle.point.low).toBeDefined();
      handle.remove();
      myol.destroy();
    });

    it('remove 后 point/line/polygon 索引全部清空', () => {
      const myol = createMyOl();
      const handle = myol.addGeoJSON(groupedFC, {
        layerName: 'test',
        groupBy: 'level',
      });
      // 索引存在
      expect(handle.point.high).toBeDefined();
      expect(handle.point.low).toBeDefined();
      handle.remove();
      // remove 后索引应全部清空
      expect(Object.keys(handle.point).length).toBe(0);
      expect(Object.keys(handle.line).length).toBe(0);
      expect(Object.keys(handle.polygon).length).toBe(0);
      myol.destroy();
    });
  });
});
