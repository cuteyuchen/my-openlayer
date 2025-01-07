# my-openlayer

基于 OpenLayers 的地图组件库，提供了一系列便捷的地图操作功能，支持天地图底图加载、要素绘制、图层管理等功能。

## 功能特点

- **底图管理**
  - 支持天地图矢量图、影像图、地形图
  - 支持底图动态切换
  - 支持注记图层控制
  - 支持地图裁剪

- **要素操作**
  - 点位标注（支持图标、文字）
  - 线要素绘制（支持样式自定义）
  - 面要素绘制
  - DOM点位（支持Vue组件）
  - 点位聚合展示
  - 闪烁点位效果

- **地图工具**
  - 图层管理
  - 事件监听
  - 坐标转换
  - 视图控制

## 安装

```bash
npm install my-openlayer
```

## 使用方法

### 基础初始化

```javascript
import MyOl from 'my-openlayer';

const map = new MyOl('map-container', {
    // 中心点坐标
    center: [119.81, 29.969],
    // 缩放级别
    zoom: 10,
    // 最小缩放级别
    minZoom: 8,
    // 最大缩放级别
    maxZoom: 20,
    // 天地图token
    token: 'your-tianditu-token',
    // 是否显示注记
    annotation: true,
    // 地图裁剪
    mapClip: false,
    mapClipData: undefined,
    // 图层配置
    layers: {
        vec_c: [], // 矢量图层
        img_c: [], // 影像图层
        ter_c: []  // 地形图层
    }
});
```

### 底图操作

```javascript
// 获取底图管理实例
const baseLayers = map.getMapBaseLayers();

// 切换底图
baseLayers.switchBaseLayer('vec_c');  // 切换到矢量图
baseLayers.switchBaseLayer('img_c');  // 切换到影像图
baseLayers.switchBaseLayer('ter_c');  // 切换到地形图

// 添加注记图层
baseLayers.addAnnotationLayer({
    type: 'cva_c',  // 注记类型
    zIndex: 11,     // 图层层级
    visible: true   // 是否可见
});
```

### 点位操作

```javascript
// 获取点位操作实例
const point = map.getPoint();

// 添加普通点位
point.addPoint([
    {
        lgtd: 119.81,
        lttd: 29.969,
        name: '测试点位'
    }
], 'test-point', {
    nameKey: 'name',            // 名称字段
    img: 'marker.png',          // 图标路径
    hasImg: true,              // 是否显示图标
    textFont: '12px sans-serif', // 文字样式
    textFillColor: '#FFF',      // 文字颜色
    textStrokeColor: '#000',    // 文字描边颜色
    textStrokeWidth: 3,         // 文字描边宽度
    textOffsetY: 20,           // 文字Y轴偏移
    zIndex: 4,                 // 图层层级
    visible: true              // 是否可见
});

// 添加聚合点位
point.addClusterPoint(pointData, 'cluster-point', {
    nameKey: 'name',
    img: 'cluster.png',
    zIndex: 4
});

// 添加Vue组件点位
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
// 获取线要素操作实例
const line = map.getLine();

// 添加普通线要素
line.addLineCommon(lineGeoJSON, {
    type: 'test-line',          // 线要素类型
    strokeColor: '#037AFF',     // 线条颜色
    strokeWidth: 3,             // 线条宽度
    zIndex: 3                   // 图层层级
});

// 添加河流要素（支持分级显示）
line.addRiverLayersByZoom(riverGeoJSON, {
    type: 'river',
    strokeColor: '#0071FF',
    strokeWidth: 3,
    zIndex: 6,
    visible: true
});
```

### 地图工具

```javascript
// 获取工具实例
const tools = map.getTools();

// 获取图层
const layer = tools.getLayerByLayerName('layerName');

// 移除图层
tools.removeLayer('layerName');

// 事件监听
MapTools.mapOnEvent(map, 'click', (feature, event) => {
    console.log('点击要素:', feature);
});

// 支持的事件类型
// - click: 点击事件
// - moveend: 地图移动结束事件
// - hover: 鼠标悬停事件
```

## API文档

### MyOl

主类，用于创建和管理地图实例。

#### 构造函数

```
constructor(id: string, options: MapInitType)
```

参数：
- `id`: 地图容器ID
- `options`: 地图初始化配置
  - `center`: 中心点坐标 [经度, 纬度]
  - `zoom`: 缩放级别
  - `minZoom`: 最小缩放级别
  - `maxZoom`: 最大缩放级别
  - `token`: 天地图token
  - `annotation`: 是否显示注记
  - `mapClip`: 是否启用地图裁剪
  - `mapClipData`: 裁剪数据
  - `layers`: 图层配置

#### 方法

- `getPoint()`: 获取点位操作实例
- `getLine()`: 获取线要素操作实例
- `getPolygon()`: 获取面要素操作实例
- `getTools()`: 获取地图工具实例
- `getMapBaseLayers()`: 获取底图图层管理实例
- `restPosition(duration?: number)`: 重置地图位置
- `locationAction(lgtd: number, lttd: number, zoom?: number, duration?: number)`: 地图定位
- `mapOnEvent(eventType: string, callback: Function, clickType?: string)`: 地图事件监听
- `showMapLayer(layerName: string, show: boolean)`: 控制图层显隐

### MapBaseLayers

底图图层管理类。

#### 方法

- `switchBaseLayer(type: TiandituType)`: 切换底图
- `addAnnotationLayer(options: AnnotationLayerOptions)`: 添加注记图层
- `initLayer()`: 初始化图层

### Point

点位操作类。

#### 方法

- `addPoint(pointData: PointData[], type: string, options: OptionsType)`: 添加点位
- `addClusterPoint(pointData: any[], type: string, options: OptionsType)`: 添加聚合点位
- `setDomPointVue(pointInfoList: any[], template: any, Vue: any)`: 添加Vue组件点位
- `locationAction(lgtd: number, lttd: number, zoom?: number, duration?: number)`: 地图定位

### Line

线要素操作类。

#### 方法

- `addLineCommon(data: MapJSONData, options: OptionsType)`: 添加普通线要素
- `addRiverLayersByZoom(data: MapJSONData, options: OptionsType)`: 添加河流要素
- `showRiverLayer(show: boolean)`: 控制河流图层显隐

### MapTools

地图工具类。

#### 方法

- `getLayerByLayerName(layerName: string)`: 获取图层
- `removeLayer(layerName: string)`: 移除图层
- `static mapOnEvent(map: Map, eventType: string, callback: Function, clickType?: string)`: 事件监听
- `static setMapClip(baseLayer: any, data: MapJSONData)`: 设置地图裁剪

## 类型定义

```typescript
interface MapInitType {
    layers?: undefined;
    zoom?: number;
    center?: number[];
    minZoom?: number;
    maxZoom?: number;
    extent?: undefined;
    token?: string;
    annotation?: boolean;
    mapClip?: boolean;
    mapClipData?: any;
}

type TiandituType = 'vec_c' | 'img_c' | 'ter_c';

interface AnnotationLayerOptions {
    type: string;
    token: string;
    zIndex?: number;
    visible?: boolean;
}

interface OptionsType {
    type?: string;
    nameKey?: string;
    img?: string;
    hasImg?: boolean;
    textFont?: string;
    textFillColor?: string;
    textStrokeColor?: string;
    textStrokeWidth?: number;
    textOffsetY?: number;
    zIndex?: number;
    visible?: boolean;
    strokeColor?: string;
    strokeWidth?: number;
}
```

## 依赖

- ol ^6.15.1
- proj4 ^2.7.5
- turf ^3.0.14


## 许可证

[MIT](LICENSE)


## 更新日志

### 0.1.1
- 初始版本发布
- 支持基础地图功能
- 支持点线面要素操作
- 支持天地图底图

## 常见问题

1. **如何获取天地图token？**
   - 访问天地图开发者平台注册账号
   - 申请密钥(token)

2. **为什么地图无法加载？**
   - 检查token是否正确
   - 检查网络连接
   - 确认坐标系是否正确

3. **如何自定义点位样式？**
   - 通过options参数配置样式
   - 支持自定义图标和文字样式

## 联系方式

如有问题或建议，请提交 [Issue](https://github.com/cuteyuchen/my-openlayer/issues)