# my-openlayer

my-openlayer 是一个基于 [OpenLayers](https://openlayers.org/) 的现代地图组件库，专为 Web GIS 应用开发者设计，支持天地图底图加载、要素绘制、图层管理、事件监听等丰富功能，极大提升地图开发效率。

---

## 目录

- [功能亮点](#功能亮点)
- [安装](#安装)
- [快速上手](#快速上手)
- [详细用法](#详细用法)
- [API 文档与示例](#api-文档与示例)
- [类型定义](#类型定义)
- [依赖](#依赖)
- [贡献指南](#贡献指南)
- [常见问题](#常见问题)
- [许可证](#许可证)
- [联系方式](#联系方式)

---

## 功能亮点

- **底图管理**
  - 支持天地图矢量、影像、地形底图
  - 动态切换底图与注记图层
  - 地图裁剪与自定义范围显示

- **要素操作**
  - 点位标注（支持自定义图标、文字、聚合、闪烁）
  - 线要素绘制（支持样式自定义、河流分级显示）
  - 面要素绘制与分区高亮
  - DOM 点位（支持 Vue 组件渲染）
  - 热力图、图片图层

- **地图工具**
  - 图层管理（获取、移除、显隐控制）
  - 地图事件监听（点击、悬停、移动等）
  - 坐标转换、视图控制
  - 测量工具

- **高扩展性**
  - 支持自定义图层、样式、交互逻辑
  - 兼容主流前端框架

---

## 安装

```bash
npm install my-openlayer
```

---

## 快速上手

### 1. 初始化地图

```javascript
import MyOl from 'my-openlayer';

const map = new MyOl('map-container', {
  center: [119.81, 29.969],
  zoom: 10,
  minZoom: 8,
  maxZoom: 20,
  token: 'your-tianditu-token',
  annotation: true,
  mapClip: false,
  mapClipData: undefined,
  layers: {
    vec_c: [],
    img_c: [],
    ter_c: []
  }
});
```

### 2. 容器 HTML

```html
<div id="map-container" style="width: 100vw; height: 100vh;"></div>
```

---

## 详细用法

### 底图管理

```javascript
const baseLayers = map.getMapBaseLayers();

// 切换底图
baseLayers.switchBaseLayer('vec_c');
baseLayers.switchBaseLayer('img_c');
baseLayers.switchBaseLayer('ter_c');

// 添加注记图层
baseLayers.addAnnotationLayer({
  type: 'cva_c',
  zIndex: 11,
  visible: true
});
```

### 点位操作

```javascript
const point = map.getPoint();

// 添加普通点位
point.addPoint([
  { lgtd: 119.81, lttd: 29.969, name: '测试点位' }
], {
  layerName: 'test-point',
  nameKey: 'name',
  img: 'marker.png',
  hasImg: true,
  textFont: '12px sans-serif',
  textFillColor: '#FFF',
  textStrokeColor: '#000',
  textStrokeWidth: 3,
  textOffsetY: 20,
  zIndex: 4,
  visible: true
});

// 添加聚合点位
point.addClusterPoint([
  { lgtd: 119.81, lttd: 29.969, name: 'A' },
  { lgtd: 119.82, lttd: 29.97, name: 'B' }
], {
  layerName: 'cluster-point',
  nameKey: 'name',
  img: 'cluster.png',
  zIndex: 4
});

// 添加 Vue 组件点位
const domPoints = point.setDomPointVue(
  [{ lgtd: 119.81, lttd: 29.969 }],
  YourVueComponent,
  Vue
);

// 控制组件点位显隐
domPoints.setVisible(true);

// 移除组件点位
domPoints.remove();

// 地图定位
point.locationAction(119.81, 29.969, 15, 1000);
```

### 线要素操作

```javascript
const line = map.getLine();

// 添加普通线要素
line.addLineCommon(lineGeoJSON, {
  layerName: 'test-line',
  type: 'test-line',
  strokeColor: '#037AFF',
  strokeWidth: 3,
  zIndex: 3
});

// 添加河流要素（支持分级显示）
line.addRiverLayersByZoom(riverGeoJSON, {
  layerName: 'river',
  type: 'river',
  strokeColor: '#0071FF',
  strokeWidth: 3,
  zIndex: 6,
  visible: true
});

// 控制河流图层显隐
line.showRiverLayer(true); // 显示
line.showRiverLayer(false); // 隐藏
```

### 面要素操作

```javascript
const polygon = map.getPolygon();

// 添加边界面
polygon.addBorderPolygon(borderGeoJSON, {
  layerName: 'border',
  fillColor: 'rgba(255,255,255,0)',
  strokeColor: '#EBEEF5',
  strokeWidth: 2
});

// 添加分区面
polygon.addPolygon(zoneGeoJSON, {
  layerName: 'zone',
  fillColor: 'rgba(1, 111, 255, 0.3)',
  strokeColor: '#037AFF',
  strokeWidth: 2,
  textVisible: true,
  nameKey: 'name',
  textFont: '14px Calibri,sans-serif',
  textFillColor: '#FFF',
  textStrokeColor: '#409EFF',
  textStrokeWidth: 2
});

// 更新面颜色
polygon.updateFeatureColor('zone', { 'A区': 'rgba(255,0,0,0.6)' }, { nameKey: 'name' });

// 添加图片图层
polygon.addImage('imgLayer', 'img.png', [minx, miny, maxx, maxy], { zIndex: 10 });

// 添加热力图
polygon.addHeatmap('heatLayer', [
  { lgtd: 119.81, lttd: 29.969, value: 10 },
  { lgtd: 119.82, lttd: 29.97, value: 20 }
], {
  valueKey: 'value',
  radius: 20,
  blur: 15
});
```

### 地图工具

```javascript
const tools = map.getTools();

// 获取图层
const layer = tools.getLayerByLayerName('layerName');

// 移除图层
tools.removeLayer('layerName');

// 设置图层可见性
tools.setLayerVisible('layerName', true);

// 事件监听
map.mapOnEvent('click', (feature, event) => {
  console.log('点击要素:', feature);
});

// 支持事件类型：click、moveend、hover
```

### 测量工具

```javascript
import { MeasureHandler } from 'my-openlayer';
const measure = new MeasureHandler(map.map); // 传入原生 ol.Map
measure.start('Polygon'); // 开始绘制多边形测量
// measure.start('LineString'); // 开始绘制线测量
// 结束测量
measure.end();
// 清除所有测量结果
measure.clean();
// 销毁测量工具
measure.destory();
```

---

## API 文档与示例

### MyOl

#### 构造函数

```typescript
new MyOl(id: string, options: MapInitType)
```

#### 方法

- **getPoint()**
  > 获取点位操作实例。
  ```javascript
  const point = map.getPoint();
  ```

- **getLine()**
  > 获取线要素操作实例。
  ```javascript
  const line = map.getLine();
  ```

- **getPolygon()**
  > 获取面要素操作实例。
  ```javascript
  const polygon = map.getPolygon();
  ```

- **getTools()**
  > 获取地图工具实例。
  ```javascript
  const tools = map.getTools();
  ```

- **getMapBaseLayers()**
  > 获取底图图层管理实例。
  ```javascript
  const baseLayers = map.getMapBaseLayers();
  ```

- **resetPosition(duration?: number)**
  > 重置地图位置。
  ```javascript
  map.resetPosition(1000); // 1秒动画重置
  ```

- **locationAction(lgtd: number, lttd: number, zoom?: number, duration?: number)**
  > 地图定位到指定点。
  ```javascript
  map.locationAction(119.81, 29.969, 15, 1000);
  ```

- **mapOnEvent(eventType: string, callback: Function, clickType?: string)**
  > 地图事件监听。
  ```javascript
  map.mapOnEvent('click', (feature, event) => {
    console.log('点击要素:', feature);
  });
  ```

---

### MapBaseLayers

- **switchBaseLayer(type: TiandituType)**
  > 切换底图。
  ```javascript
  baseLayers.switchBaseLayer('img_c');
  ```

- **addAnnotationLayer(options: AnnotationLayerOptions)**
  > 添加注记图层。
  ```javascript
  baseLayers.addAnnotationLayer({
    type: 'cva_c',
    zIndex: 11,
    visible: true
  });
  ```

- **initLayer()**
  > 初始化底图图层。
  ```javascript
  baseLayers.initLayer();
  ```

---

### Point

- **addPoint(pointData: PointData[], options: OptionsType)**
  > 添加普通点位。
  ```javascript
  point.addPoint([
    { lgtd: 119.81, lttd: 29.969, name: '测试点位' }
  ], {
    layerName: 'test-point',
    nameKey: 'name',
    img: 'marker.png',
    hasImg: true
  });
  ```

- **addClusterPoint(pointData: PointData[], options: OptionsType)**
  > 添加聚合点位。
  ```javascript
  point.addClusterPoint([
    { lgtd: 119.81, lttd: 29.969, name: 'A' },
    { lgtd: 119.82, lttd: 29.97, name: 'B' }
  ], {
    layerName: 'cluster-point',
    nameKey: 'name',
    img: 'cluster.png',
    zIndex: 4
  });
  ```

- **setDomPointVue(pointInfoList: any[], template: any, Vue: any)**
  > 添加 Vue 组件点位。
  ```javascript
  const domPoints = point.setDomPointVue(
    [{ lgtd: 119.81, lttd: 29.969 }],
    YourVueComponent,
    Vue
  );
  domPoints.setVisible(true);
  domPoints.remove();
  ```

- **locationAction(lgtd: number, lttd: number, zoom?: number, duration?: number)**
  > 地图定位。
  ```javascript
  point.locationAction(119.81, 29.969, 15, 1000);
  ```

---

### Line

- **addLineCommon(data: MapJSONData, options: OptionsType)**
  > 添加普通线要素。
  ```javascript
  line.addLineCommon(lineGeoJSON, {
    layerName: 'test-line',
    type: 'test-line',
    strokeColor: '#037AFF',
    strokeWidth: 3
  });
  ```

- **addRiverLayersByZoom(data: MapJSONData, options: OptionsType)**
  > 添加河流要素（分级显示）。
  ```javascript
  line.addRiverLayersByZoom(riverGeoJSON, {
    layerName: 'river',
    type: 'river',
    strokeColor: '#0071FF',
    strokeWidth: 3,
    zIndex: 6,
    visible: true
  });
  ```

- **showRiverLayer(show: boolean)**
  > 控制河流图层显隐。
  ```javascript
  line.showRiverLayer(true); // 显示
  line.showRiverLayer(false); // 隐藏
  ```

---

### Polygon

- **addBorderPolygon(data: MapJSONData, options?: OptionsType)**
  > 添加边界面。
  ```javascript
  polygon.addBorderPolygon(borderGeoJSON, {
    layerName: 'border',
    fillColor: 'rgba(255,255,255,0)',
    strokeColor: '#EBEEF5',
    strokeWidth: 2
  });
  ```

- **addPolygon(data: MapJSONData, options?: OptionsType)**
  > 添加分区面。
  ```javascript
  polygon.addPolygon(zoneGeoJSON, {
    layerName: 'zone',
    fillColor: 'rgba(1, 111, 255, 0.3)',
    strokeColor: '#037AFF',
    strokeWidth: 2,
    textVisible: true,
    nameKey: 'name',
    textFont: '14px Calibri,sans-serif',
    textFillColor: '#FFF',
    textStrokeColor: '#409EFF',
    textStrokeWidth: 2
  });
  ```

- **updateFeatureColor(layerName: string, colorObj?: { [propName: string]: string }, options?: OptionsType)**
  > 更新面颜色。
  ```javascript
  polygon.updateFeatureColor('zone', { 'A区': 'rgba(255,0,0,0.6)' }, { nameKey: 'name' });
  ```

- **addImage(layerName: string, img?: string, extent?: number[], options?: OptionsType)**
  > 添加图片图层。
  ```javascript
  polygon.addImage('imgLayer', 'img.png', [minx, miny, maxx, maxy], { zIndex: 10 });
  ```

- **addHeatmap(layerName: string, pointData: PointData[], options: HeatMapOptions)**
  > 添加热力图。
  ```javascript
  polygon.addHeatmap('heatLayer', [
    { lgtd: 119.81, lttd: 29.969, value: 10 },
    { lgtd: 119.82, lttd: 29.97, value: 20 }
  ], {
    valueKey: 'value',
    radius: 20,
    blur: 15
  });
  ```

- **removePolygonLayer(layerName: string)**
  > 移除面图层。
  ```javascript
  polygon.removePolygonLayer('zone');
  ```

---

### MapTools

- **getLayerByLayerName(layerName: string)**
  > 获取图层。
  ```javascript
  const layer = tools.getLayerByLayerName('myLayer');
  ```

- **removeLayer(layerName: string)**
  > 移除图层。
  ```javascript
  tools.removeLayer('myLayer');
  ```

- **setLayerVisible(layerName: string, visible: boolean)**
  > 设置图层可见性。
  ```javascript
  tools.setLayerVisible('myLayer', true);
  ```

- **mapOnEvent(eventType: string, callback: Function, clickType?: string)**
  > 地图事件监听。
  ```javascript
  tools.mapOnEvent('click', (feature, event) => {
    console.log('点击要素:', feature);
  });
  ```

- **static setMapClip(baseLayer: any, data: MapJSONData)**
  > 设置地图裁剪。
  ```javascript
  MapTools.setMapClip(baseLayer, clipGeoJSON);
  ```

---

### MeasureHandler

- **start(type: 'Polygon' | 'LineString')**
  > 开始测量。
  ```javascript
  measure.start('Polygon');
  measure.start('LineString');
  ```

- **end()**
  > 结束测量。
  ```javascript
  measure.end();
  ```

- **clean()**
  > 清除所有测量结果。
  ```javascript
  measure.clean();
  ```

- **destory()**
  > 销毁测量工具。
  ```javascript
  measure.destory();
  ```

---

## 类型定义

详见 [src/types.ts](src/types.ts)，主要类型如下：

```typescript
interface MapInitType {
  layers?: BaseLayer[] | { [key: string]: BaseLayer[] },
  zoom?: number,
  center?: number[],
  minZoom?: number,
  maxZoom?: number,
  extent?: number[],
  mapClipData?: MapJSONData,
  token?: string,
  annotation?: boolean
}

interface OptionsType {
  layerName?: string,
  nameKey?: string,
  img?: string,
  hasImg?: boolean,
  zIndex?: number,
  visible?: boolean,
  strokeColor?: string | number[],
  strokeWidth?: number,
  fillColor?: string,
  textFont?: string,
  textFillColor?: string,
  textStrokeColor?: string,
  textStrokeWidth?: number,
  textOffsetY?: number,
  [propName: string]: any
}

interface PointData {
  lgtd: number,
  lttd: number,
  [propName: string]: any
}
```

---

## 依赖

- [ol](https://openlayers.org/) ^6.15.1
- [proj4](https://github.com/proj4js/proj4js) ^2.7.5
- [turf](https://turfjs.org/) ^3.0.14

---

## 贡献指南

欢迎提交 Issue 或 Pull Request！

1. Fork 本仓库
2. 新建分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m 'feat: 新功能描述'`
4. 推送分支：`git push origin feature/your-feature`
5. 提交 Pull Request

---

## 常见问题

1. **如何获取天地图 token？**
   - 访问 [天地图开发者平台](https://lbs.tianditu.gov.cn/) 注册账号并申请密钥(token)。

2. **为什么地图无法加载？**
   - 检查 token 是否正确
   - 检查网络连接
   - 确认坐标系是否正确

3. **如何自定义点位样式？**
   - 通过 `options` 参数配置样式，支持自定义图标和文字样式

4. **如何在 Vue/React/Angular 中集成？**
   - 只需在组件生命周期内初始化和销毁 MyOl 实例即可，点位 DOM 支持 Vue 组件渲染

---

## 许可证

[MIT](LICENSE)

---

## 联系方式

如有问题或建议，请提交 [Issue](https://github.com/cuteyuchen/my-openlayer/issues) 或邮件联系 2364184627@qq.com

---

> 本项目长期维护，欢迎 Star、Fork 和贡献代码！