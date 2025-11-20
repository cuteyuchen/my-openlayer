# my-openlayer

my-openlayer 是一个基于 [OpenLayers](https://openlayers.org/) 的现代地图组件库，专为 Web GIS 应用开发者设计。提供完整的 TypeScript 支持、模块化的类型定义、强大的错误处理和事件管理系统，支持天地图底图加载、要素绘制、图层管理、事件监听等丰富功能，极大提升地图开发效率。支持 TypeScript，具备完整的类型定义和模块化设计。

[![npm version](https://img.shields.io/npm/v/my-openlayer.svg)](https://www.npmjs.com/package/my-openlayer)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 项目概述

- 项目名称：`my-openlayer`
- 用途：基于 OpenLayers 的 TypeScript 地图组件库，提供点/线/面要素、底图切换、热力图、事件与配置管理等能力，面向 Web GIS 开发者
- 目标用户：Web GIS 开发者、可视化工程师、前端开发者
- 状态徽章：
  - [![npm](https://img.shields.io/npm/v/my-openlayer.svg)](https://www.npmjs.com/package/my-openlayer)
  - ![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)
  - ![License](https://img.shields.io/badge/License-MIT-yellow.svg)
  - ![Build](https://img.shields.io/badge/build-local%20(vite)-blue.svg)
  - ![Coverage](https://img.shields.io/badge/coverage-not%20configured-lightgrey.svg)
  - ![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-6DA55F.svg)
  - ![ol](https://img.shields.io/badge/ol-^10.6.1-blue.svg)

## 环境要求

- Node.js >= 18（Vite 5 要求）
- 包管理器：npm / yarn / pnpm
- 运行时依赖：`ol@^10.6.1`、`proj4@^2.7.5`、`@turf/turf@^7.2.0`
- 开发依赖：`vite@^5.4.10`、`@vitejs/plugin-vue@^5.0.4`、`typescript@~5.6.2`、`vue-tsc@^2.0.6`

## 安装指南

- 安装库：`npm i my-openlayer` 或 `yarn add my-openlayer` 或 `pnpm add my-openlayer`
- 示例与开发：
  - 安装依赖：`npm i`
  - 开发示例：`npm run dev`
  - 构建库：`npm run build`
- 配置文件：
  - TypeScript：`tsconfig.json`（声明输出 `dist/`）
  - Vite：`vite.config.ts`（插件：@vitejs/plugin-vue、vite-plugin-libcss）
  - 环境变量：`.env` 设置 `VITE_TIANDITU_TOKEN=your_token`

## 使用说明

- 主要功能的使用参考下文「详细用法」与「API 文档与示例」
- 示例代码与截图：运行 `npm run dev` 后查看 `examples/App.vue` 渲染效果（截图略）
- FAQ：见下文「常见问题」

## 开发指南

- 项目结构：
  - `src/` 核心库源码；`src/core` 包含 BaseLayers/Tools/Point/Line/Polygon/Select 等模块
  - `examples/` Vue3 + Vite 示例；入口 `index.html` → `examples/main.ts`
  - `dist/` 构建输出；`temp-publish/` 发布前整理产物
  - 配置与脚本：`package.json`、`tsconfig.json`、`vite.config.ts`、`scripts/prepare-publish.cjs`
- 开发环境搭建：Node 18+，`npm i` 安装依赖，`npm run dev` 启动示例，`.env` 设置 `VITE_TIANDITU_TOKEN`
- 代码贡献规范：分支 `feature/xxx`、`fix/xxx`；`type(scope): subject` 提交信息；TypeScript 严格类型，2 空格缩进

## 许可证信息

- 许可证：MIT（见 `LICENSE`）
- 版权声明：Copyright (c) 2025 cuteyuchen

## 目录

- [功能亮点](#功能亮点)
- [安装](#安装)
- [快速上手](#快速上手)
- [详细用法](#详细用法)
- [高级功能](#高级功能)
- [API 文档与示例](#api-文档与示例)
- [类型定义](#类型定义)
- [迁移指南](#迁移指南)
- [依赖](#依赖)
- [贡献指南](#贡献指南)
- [常见问题](#常见问题)
- [许可证](#许可证)
- [联系方式](#联系方式)

---

## 功能亮点

- **🗺️ 底图管理 (MapBaseLayers)**
  - 支持天地图矢量、影像、地形底图切换
  - 动态切换底图与注记图层管理
  - 地图裁剪与自定义范围显示
  - 支持自定义底图源和配置

- **📍 要素操作**
  - **点位管理 (Point)**：点位标注（支持自定义图标、文字、聚合、闪烁）
  - **线要素绘制 (Line)**：线要素绘制（支持样式自定义、河流分级显示）
  - **面要素 (Polygon)**：面要素绘制与分区高亮
  - **Vue组件支持 (VueTemplatePoint)**：DOM 点位（支持 Vue 组件渲染，完整生命周期管理）
  - 热力图、图片图层
  - 动态要素颜色更新

- **🛠️ 地图工具**
  - **测量工具 (MeasureHandler)**：距离和面积测量
  - **地图工具 (MapTools)**：图层管理（获取、移除、显隐控制）
  - **事件管理 (EventManager)**：地图事件监听（点击、悬停、移动等）
  - **配置管理 (ConfigManager)**：坐标转换、视图控制、配置管理器

- **⚡ 高级特性**
  - **TypeScript 完全支持**：模块化类型定义，更好的开发体验
  - **错误处理系统 (ErrorHandler)**：统一的错误处理和日志记录
  - **验证工具 (ValidationUtils)**：参数验证和数据校验
  - **模块化设计**：支持按需加载和懒加载
  - **坐标系支持**：CGCS2000坐标系和投影转换
  - **向后兼容**：保持 API 稳定性

- **🔧 开发友好**
  - 支持自定义图层、样式、交互逻辑
  - 兼容主流前端框架（Vue、React、Angular）
  - 完整的 JSDoc 注释
  - 详细的迁移指南
  - 丰富的示例代码

---

## 安装

```bash
npm install my-openlayer
# 或
yarn add my-openlayer
# 或
pnpm add my-openlayer
```

### 依赖要求

- **OpenLayers**: ^7.0.0 或更高版本
- **proj4**: ^2.8.0 或更高版本
- **@turf/turf**: ^6.5.0 或更高版本（用于高级几何计算）

### 环境配置

使用天地图服务需要配置API Token：

```bash
# 在项目根目录创建 .env 文件（Vite）
VITE_TIANDITU_TOKEN=your_tianditu_token_here

# 其他可选配置（示例）
VITE_MAP_CENTER_LON=119.81
VITE_MAP_CENTER_LAT=29.969
VITE_MAP_ZOOM=10
```

### 配置选项

#### 基础配置

```javascript
const config = {
  target: 'map',                                    // 地图容器ID
  center: [119.81, 29.969],                         // 地图中心点
  zoom: 10,                                         // 缩放级别
  tiandituToken: process.env.VUE_APP_TIANDITU_TOKEN, // 天地图token（从环境变量获取）
  minZoom: 1,                                       // 最小缩放级别
  maxZoom: 20,                                      // 最大缩放级别
  annotation: true,                                 // 是否显示注记
  coordinateSystem: 'EPSG:4326',                    // 坐标系（默认WGS84，支持CGCS2000）
};
```

---

## 快速上手

### 1. 初始化地图

```typescript
// 方式一：默认导入（推荐）
import MyOl, { MapInitType } from 'my-openlayer';

// 方式二：命名导入
// import { MyOl, MapInitType } from 'my-openlayer';

// 地图初始化配置
const mapConfig: MapInitType = {
  center: [119.81, 29.969],
  zoom: 10,
  minZoom: 8,
  maxZoom: 20,
  token: import.meta.env.VITE_TIANDITU_TOKEN, // 从环境变量获取天地图 token（Vite）
  annotation: true,
  layers: {
    vec_c: [],
    img_c: [],
    ter_c: []
  }
};

// 创建地图实例
const map = new MyOl('map-container', mapConfig);
```

### 2. 容器 HTML

```html
<div id="map-container" style="width: 100vw; height: 100vh;"></div>
```

### 模块获取与使用模式

```typescript
// 1) 链式调用（推荐）：通过 MyOl 获取模块并直接使用
const myOl = new MyOl('map-container', mapConfig);
myOl.getPoint().addPoint(pointData, { layerName: 'p', textKey: 'name', img: 'marker.png' });
myOl.getLine().addLine(lineGeoJSON, { layerName: 'line', strokeColor: '#037AFF', strokeWidth: 3 });
myOl.getPolygon().addPolygon(zoneGeoJSON, { layerName: 'zone', textKey: 'name', textVisible: true });

// 2) 独立实例化：直接传入原生 ol.Map 创建模块实例
const olMap = myOl.map; // MyOl 暴露原生 Map 实例
import { Point, Line, Polygon } from 'my-openlayer';

const point = new Point(olMap);
point.addPoint(pointData, { layerName: 'p', textKey: 'name', img: 'marker.png' });

const line = new Line(olMap);
line.addLine(lineGeoJSON, { layerName: 'line' });

const polygon = new Polygon(olMap);
polygon.addPolygon(zoneGeoJSON, { layerName: 'zone', textKey: 'name' });
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

```typescript
import { PointOptions, ClusterOptions, PointData } from 'my-openlayer';

const point = map.getPoint();

// 点位数据
const pointData: PointData[] = [
  { lgtd: 119.81, lttd: 29.969, name: '测试点位', type: 'marker' }
];

// 添加普通点位
const pointOptions: PointOptions = {
  layerName: 'test-point',
  textKey: 'name',
  img: 'marker.png',
  scale: 1.2,
  textFont: '12px sans-serif',
  textFillColor: '#FFF',
  textStrokeColor: '#000',
  textStrokeWidth: 3,
  textOffsetY: 20,
  zIndex: 4,
  visible: true
};
point.addPoint(pointData, pointOptions);

// 添加聚合点位
const clusterData: PointData[] = [
  { lgtd: 119.81, lttd: 29.969, name: 'A' },
  { lgtd: 119.82, lttd: 29.97, name: 'B' }
];
const clusterOptions: ClusterOptions = {
  layerName: 'cluster-point',
  textKey: 'name',
  img: 'cluster.png',
  distance: 50,
  minDistance: 20,
  zIndex: 4
};
point.addClusterPoint(clusterData, clusterOptions);

// 添加 Vue 组件点位
const domPoints = point.addVueTemplatePoint(
  [{ lgtd: 119.81, lttd: 29.969 }],
  YourVueComponent,
  { positioning: 'center-center' }
);

// 控制组件点位显隐
domPoints.setVisible(true);

// 移除组件点位
domPoints.remove();

// 地图定位
point.locationAction(119.81, 29.969, 15, 1000);
```

### 线要素操作

```typescript
import { LineOptions, MapJSONData } from 'my-openlayer';

const line = map.getLine();

// 线要素数据（GeoJSON 格式）
const lineGeoJSON: MapJSONData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: '测试线路', type: 'highway' },
      geometry: {
        type: 'LineString',
        coordinates: [[119.81, 29.969], [119.82, 29.97]]
      }
    }
  ]
};

// 添加普通线要素
const lineOptions: LineOptions = {
  layerName: 'test-line',
  type: 'test-line',
  strokeColor: '#037AFF',
  strokeWidth: 3,
  lineDash: [5, 5], // 虚线样式
  zIndex: 3,
  textVisible: true,
  textCallBack: (feature) => feature.get('name')
};
line.addLineCommon(lineGeoJSON, lineOptions);

// 添加河流要素（支持分级显示）
const riverOptions: LineOptions = {
  layerName: 'river',
  type: 'river',
  strokeColor: '#0071FF',
  strokeWidth: 3,
  zIndex: 6,
  visible: true
};
line.addRiverLayersByZoom(riverGeoJSON, riverOptions);

// 控制河流图层显隐
line.showRiverLayer(true); // 显示
line.showRiverLayer(false); // 隐藏
```

### 面要素操作

```typescript
import MyOl, { PolygonOptions, HeatMapOptions, FeatureColorUpdateOptions, PointData } from 'my-openlayer';

const polygon = map.getPolygon();

// 面要素数据（GeoJSON 格式）
const borderGeoJSON: MapJSONData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: '边界区域' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[119.8, 29.96], [119.82, 29.96], [119.82, 29.98], [119.8, 29.98], [119.8, 29.96]]]
      }
    }
  ]
};

// 添加边界面
const borderOptions: PolygonOptions = {
  layerName: 'border',
  fillColor: 'rgba(255,255,255,0)',
  strokeColor: '#EBEEF5',
  strokeWidth: 2,
  zIndex: 1
};
polygon.addBorderPolygon(borderGeoJSON, borderOptions);

// 添加分区面
const zoneOptions: PolygonOptions = {
  layerName: 'zone',
  fillColor: 'rgba(1, 111, 255, 0.3)',
  strokeColor: '#037AFF',
  strokeWidth: 2,
  textVisible: true,
  textKey: 'name',
  textFont: '14px Calibri,sans-serif',
  textFillColor: '#FFF',
  textStrokeColor: '#409EFF',
  textStrokeWidth: 2,
  zIndex: 2
};
polygon.addPolygon(zoneGeoJSON, zoneOptions);

// 更新面颜色
const colorUpdateOptions: FeatureColorUpdateOptions = {
  textKey: 'name'
};
polygon.updateFeatureColor('zone', { 'A区': 'rgba(255,0,0,0.6)' }, colorUpdateOptions);

// 添加图片图层
const extent = [119.8, 29.96, 119.82, 29.98]; // [minx, miny, maxy]
polygon.addImageLayer({ img: 'img.png', extent }, { layerName: 'imgLayer', zIndex: 10 });

// 添加热力图
const heatData: PointData[] = [
  { lgtd: 119.81, lttd: 29.969, value: 10 },
  { lgtd: 119.82, lttd: 29.97, value: 20 }
];
const heatOptions: HeatMapOptions = {
  layerName: 'heatLayer',
  valueKey: 'value',
  radius: 20,
  blur: 15,
  opacity: 0.8,
  zIndex: 5
};
polygon.addHeatmap('heatLayer', heatData, heatOptions);
```

## 高级功能

### 错误处理系统

```typescript
import { MyOl, ErrorHandler, ErrorType, MyOpenLayersError } from 'my-openlayer';

// 获取错误处理器实例
const errorHandler = ErrorHandler.getInstance();

// 设置全局错误回调
errorHandler.addErrorCallback((error: MyOpenLayersError) => {
  console.log('地图错误:', error.message);
  console.log('错误类型:', error.type);
  console.log('错误详情:', error.details);
  
  // 发送错误到监控系统
  sendToMonitoring({
    type: error.type,
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// 手动验证和错误处理
try {
  // 验证坐标
  ErrorHandler.validateCoordinates(longitude, latitude);
  
  // 验证图层名称
  ErrorHandler.validateLayerName(layerName);
  
  // 验证颜色格式
  ErrorHandler.validateColor(color);
  
} catch (error) {
  if (error instanceof MyOpenLayersError) {
    console.error(`${error.type}错误:`, error.message);
  }
}

// 错误类型
// ErrorType.COORDINATE_ERROR - 坐标错误
// ErrorType.LAYER_ERROR - 图层错误
// ErrorType.STYLE_ERROR - 样式错误
// ErrorType.DATA_ERROR - 数据错误
// ErrorType.CONFIG_ERROR - 配置错误
```

### 事件管理系统

```typescript
import { MapEventType, EventCallback, MapEventData } from 'my-openlayer';

// 获取事件管理器
const eventManager = map.getEventManager();

// 监听点击事件
const clickCallback: EventCallback = (eventData: MapEventData) => {
  console.log('点击位置:', eventData.coordinate);
  console.log('点击要素:', eventData.feature);
  console.log('像素位置:', eventData.pixel);
};
const clickListenerId = eventManager.on('click', clickCallback);

// 监听缩放事件
eventManager.on('zoomend', (eventData) => {
  console.log('当前缩放级别:', eventData.zoom);
  console.log('地图范围:', eventData.extent);
});

// 监听鼠标悬停事件
eventManager.on('pointermove', (eventData) => {
  if (eventData.feature) {
    console.log('悬停要素:', eventData.feature.get('name'));
  }
});

// 移除特定事件监听
eventManager.off(clickListenerId);

// 移除所有事件监听
eventManager.removeAllListeners();

// 一次性事件监听
eventManager.on('click', (eventData) => {
  console.log('只触发一次');
}, { once: true });

// 带过滤器的事件监听
eventManager.on('click', (eventData) => {
  console.log('点击了要素');
}, {
  filter: (eventData) => eventData.feature !== undefined
});

// 事件统计
console.log('点击事件监听器数量:', eventManager.getListenerCount('click'));
console.log('总事件触发次数:', eventManager.getTotalEventCount());
```

### 配置管理系统

```typescript
import { MyOl, ConfigManager, PointOptions, LineOptions } from 'my-openlayer';

// 使用默认配置
const pointOptions: PointOptions = ConfigManager.mergeOptions(
  ConfigManager.DEFAULT_POINT_OPTIONS,
  {
    strokeColor: '#ff0000',
    scale: 1.5,
    textVisible: true
  }
);

// 获取默认配置
const defaultPointConfig = ConfigManager.DEFAULT_POINT_OPTIONS;
const defaultLineConfig = ConfigManager.DEFAULT_LINE_OPTIONS;
const defaultPolygonConfig = ConfigManager.DEFAULT_POLYGON_OPTIONS;

// 验证工具
if (ConfigManager.isValidCoordinate(lng, lat)) {
  console.log('坐标有效');
}

if (ConfigManager.isValidColor('#ff0000')) {
  console.log('颜色格式有效');
}

if (ConfigManager.isValidZIndex(10)) {
  console.log('层级有效');
}

// 生成唯一ID
const layerId = ConfigManager.generateId('layer'); // layer_1234567890
const pointId = ConfigManager.generateId('point'); // point_1234567890

// 深度合并配置
const mergedConfig = ConfigManager.mergeOptions(
  { a: 1, b: { c: 2 } },
  { b: { d: 3 }, e: 4 }
); // { a: 1, b: { c: 2, d: 3 }, e: 4 }
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

// 事件监听（使用 EventManager）
const em = map.getEventManager();
em.on('click', (eventData) => {
  console.log('点击要素:', eventData.feature);
});
```

### 测量工具

```javascript
import { MyOl, MeasureHandler } from 'my-openlayer';
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

**参数说明：**

- `id`: 地图容器的 DOM 元素 ID
- `options`: 地图初始化配置对象
  - `center`: 地图中心点坐标 `[longitude, latitude]`
  - `zoom`: 初始缩放级别
  - `token`: 天地图 API Token（建议从环境变量获取）
  - `minZoom`: 最小缩放级别（可选，默认：1）
  - `maxZoom`: 最大缩放级别（可选，默认：20）
  - `annotation`: 是否显示注记图层（可选，默认：true）
  - `layers`: 图层配置（可选）
  - `extent`: 地图范围限制（可选）
  - `mapClipData`: 地图裁剪数据（可选）

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
  > 获取地图工具实例，提供图层管理、事件监听等功能。
  ```javascript
  const tools = map.getTools();
  ```

- **getMapBaseLayers()**
  > 获取底图图层管理实例，用于底图切换和管理。
  ```javascript
  const baseLayers = map.getMapBaseLayers();
  ```

- **getEventManager()**
  > 获取事件管理器实例，用于统一的事件监听和管理。
  ```javascript
  const eventManager = map.getEventManager();
  ```

- **getConfigManager()**
  > 获取配置管理器实例，用于配置验证和管理。
  ```javascript
  const configManager = map.getConfigManager();
  ```

- 不直接暴露原生地图实例；推荐通过模块实例（如 `MapTools`）与 `EventManager` 完成操作

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

// 事件监听：使用 EventManager 统一管理
// const eventManager = map.getEventManager();
// eventManager.on('click', (eventData) => { ... })

---

### MapBaseLayers

- **switchBaseLayer(type: TiandituType)**
  > 切换底图类型，自动处理注记图层。
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

- **toggleAnnotation(show?: boolean)**
  > 切换注记图层显示状态。
  ```javascript
  baseLayers.toggleAnnotation(true); // 显示注记
  baseLayers.toggleAnnotation(false); // 隐藏注记
  ```

- **getCurrentBaseLayer()**
  > 获取当前底图类型。
  ```javascript
  const currentType = baseLayers.getCurrentBaseLayer();
  ```

- **initLayer()**
  > 初始化底图图层。
  ```javascript
  baseLayers.initLayer();
  ```

---

### Point

- **addPoint(pointData: PointData[], options: PointOptions)**
  > 添加普通点位到指定图层，支持文本与图标样式。
  ```javascript
  point.addPoint([
    { lgtd: 119.81, lttd: 29.969, name: '测试点位' }
  ], {
    layerName: 'test-point',
    textKey: 'name',
    img: 'marker.png'
  });
  ```

- **addClusterPoint(pointData: PointData[], options: ClusterOptions)**
  > 添加聚合点位，自动根据缩放级别聚合显示。
  ```javascript
  point.addClusterPoint([
    { lgtd: 119.81, lttd: 29.969, name: 'A' },
    { lgtd: 119.82, lttd: 29.97, name: 'B' }
  ], {
    layerName: 'cluster-point',
    textKey: 'name',
    img: 'cluster.png',
    zIndex: 4
  });
  ```

- **addVueTemplatePoint(pointDataList: PointData[], template: any, options?)**
  > 添加 Vue 组件点位。
  ```javascript
  const domPoints = point.addVueTemplatePoint(
    [{ lgtd: 119.81, lttd: 29.969 }],
    YourVueComponent,
    { positioning: 'center-center' }
  );
  domPoints.setVisible(true);
  domPoints.remove();
  ```

- **addTwinkleLayer(twinkleList: any[], className?: string, key: string, callback?)**
  > 添加闪烁点覆盖物。

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
    textKey: 'name',
    textFont: '14px Calibri,sans-serif',
    textFillColor: '#FFF',
    textStrokeColor: '#409EFF',
    textStrokeWidth: 2
  });
  ```

- **updateFeatureColor(layerName: string, colorObj?: { [propName: string]: string }, options?: FeatureColorUpdateOptions)**
  > 更新面颜色。
  ```javascript
  polygon.updateFeatureColor('zone', { 'A区': 'rgba(255,0,0,0.6)' }, { textKey: 'name' });
  ```

- **addImageLayer(imageData: ImageLayerData, options?: PolygonOptions)**
  > 添加图片图层。
  ```javascript
  polygon.addImageLayer({ img: 'img.png', extent: [minx, miny, maxx, maxy] }, { layerName: 'imgLayer', zIndex: 10 });
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

// 事件监听请使用 EventManager：
// const em = map.getEventManager();
// em.on('click', (eventData) => { console.log(eventData.feature) })

- **static setMapClip(baseLayer: any, data: MapJSONData)**
  > 设置地图裁剪。
  ```javascript
  MapTools.setMapClip(baseLayer, clipGeoJSON);
  ```

---

### MeasureHandler

测量工具类，提供距离和面积测量功能，支持实时测量显示。

- **start(type: 'Polygon' | 'LineString')**
  > 开始测量，支持距离和面积测量。
  ```javascript
  measure.start('Polygon');  // 面积测量
  measure.start('LineString');  // 距离测量
  ```

- **end()**
  > 结束当前测量操作。
  ```javascript
  measure.end();
  ```

- **clean()**
  > 清除所有测量结果和图形。
  ```javascript
  measure.clean();
  ```

- **destory()**
  > 销毁测量工具，释放资源。
  ```javascript
  measure.destory();
  ```

### ErrorHandler

错误处理工具类，提供统一的错误处理和日志记录。

- **getInstance()**
  > 获取错误处理器单例实例。
  ```javascript
  const errorHandler = ErrorHandler.getInstance();
  ```

- **handleError(error: MyOpenLayersError)**
  > 处理错误，记录日志并触发回调。
  ```javascript
  errorHandler.handleError(error);
  ```

- **validate(condition: boolean, message: string, context?: any)**
  > 验证条件，失败时抛出错误。
  ```javascript
  ErrorHandler.validate(isValid, '验证失败', { data });
  ```

### ValidationUtils

验证工具类，提供各种数据验证方法。

- **isValidCoordinate(longitude: number, latitude: number)**
  > 验证坐标是否有效。
  ```javascript
  const isValid = ValidationUtils.isValidCoordinate(119.81, 29.969);
  ```

- **validateMapInstance(map: any)**
  > 验证地图实例。
  ```javascript
  ValidationUtils.validateMapInstance(map);
  ```

- **validateLayerName(layerName: string)**
  > 验证图层名称。
  ```javascript
  ValidationUtils.validateLayerName('myLayer');
  ```

---

## 类型定义

本库提供完整的 TypeScript 类型定义，采用模块化设计，详见 [src/types.ts](src/types.ts)。

### 核心类型

```typescript
// 地图初始化配置
interface MapInitType {
  layers?: BaseLayer[] | { [key: string]: BaseLayer[] },
  zoom?: number,
  center?: number[],
  minZoom?: number,
  maxZoom?: number,
  extent?: number[],
  mapClipData?: MapJSONData,
  token?: string,
  annotation?: boolean,
  coordinateSystem?: string // 坐标系（支持CGCS2000）
}

// 点位数据
interface PointData {
  lgtd: number,  // 经度
  lttd: number,  // 纬度
  [key: string]: any  // 其他属性
}

// GeoJSON 数据
interface MapJSONData {
  type: string,
  name?: string,
  features: Feature[]
}

// 事件类型
type EventType = 'click' | 'hover' | 'moveend';

// 天地图类型
type TiandituType = 'vec_c' | 'img_c' | 'ter_c' | string;
```

### 模块化选项接口

```typescript
// 基础选项 - 所有图层的公共配置
interface BaseOptions {
  /** 图层名称 */
  layerName?: string;
  /** 图层层级 */
  zIndex?: number;
  /** 图层可见性 */
  visible?: boolean;
  /** 图层透明度 */
  opacity?: number;
  /** 是否适应视图 */
  fitView?: boolean;
  // ... 其他基础属性
}

// 样式选项 - 图形样式相关配置
interface StyleOptions {
  /** 描边颜色 */
  strokeColor?: string | number[];
  /** 描边宽度 */
  strokeWidth?: number;
  /** 线条虚线样式 */
  lineDash?: number[];
  /** 填充颜色 */
  fillColor?: string;
  // ... 其他样式属性
}

// 文本选项 - 文本标注相关配置
interface TextOptions {
  /** 文本可见性 */
  textVisible?: boolean;
  /** 文本内容回调函数 */
  textCallBack?: (feature: any) => string;
  /** 文本字体 */
  textFont?: string;
  /** 文本填充颜色 */
  textFillColor?: string;
  // ... 其他文本属性
}

// 点位选项 - 点位图层专用配置
interface PointOptions extends BaseOptions, StyleOptions, TextOptions {
  /** 文本字段键 */
  textKey?: string;
  /** 图标图片 */
  img?: string;
  /** 图标缩放比例 */
  scale?: number;
  /** 图标颜色 */
  iconColor?: string;
}

// 线条选项 - 线条图层专用配置
interface LineOptions extends BaseOptions, StyleOptions, TextOptions {
  /** 线条类型 */
  type?: string;
}

// 多边形选项 - 多边形图层专用配置
interface PolygonOptions extends BaseOptions, StyleOptions, TextOptions {
  /** 文本字段键 */
  textKey?: string;
  /** 是否为蒙版 */
  mask?: boolean;
}

// 聚合选项 - 聚合点位专用配置
interface ClusterOptions extends PointOptions {
  /** 聚合距离 */
  distance?: number;
  /** 最小聚合距离 */
  minDistance?: number;
}

// 热力图选项
interface HeatMapOptions {
  layerName?: string,
  radius?: number,
  blur?: number,
  gradient?: string[],
  opacity?: number,
  visible?: boolean,
  zIndex?: number,
  valueKey?: string,
}
```

### VueTemplatePointOptions

Vue 组件点位配置类型，支持 Vue 2 和 Vue 3。

```typescript
interface VueTemplatePointOptions {
  coordinate: [number, number];     // 点位坐标
  template: any;                    // Vue 组件模板
  data?: any;                       // 传递给组件的数据
  vue: VueInstance | VueApp;        // Vue 实例（Vue 2/3）
  layerName?: string;               // 图层名称
  id?: string;                      // 点位唯一标识
  className?: string;               // CSS 类名
  stopEvent?: boolean;              // 是否阻止事件冒泡
}
```

### ErrorType

错误类型枚举。

```typescript
enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MAP_ERROR = 'MAP_ERROR',
  LAYER_ERROR = 'LAYER_ERROR',
  COORDINATE_ERROR = 'COORDINATE_ERROR',
  DATA_ERROR = 'DATA_ERROR',
  COMPONENT_ERROR = 'COMPONENT_ERROR'
}
```

### MyOpenLayersError

自定义错误类。

```typescript
class MyOpenLayersError extends Error {
  public readonly type: ErrorType;
  public readonly timestamp: Date;
  public readonly context?: any;
}
```

### 兼容性类型

```typescript
/**
 * 兼容性类型别名 - 保持向后兼容
 * @deprecated 请使用具体的选项接口：PointOptions, LineOptions, PolygonOptions
 */
type OptionsType = BaseOptions & StyleOptions & TextOptions & {
  textKey?: string;
  img?: string;
  scale?: number;
  iconColor?: string;
  type?: string;
  mask?: boolean;
};
```

## 迁移指南

### 快速迁移示例

```typescript
// 旧写法
import { MyOl, OptionsType } from 'my-openlayer';
const options: OptionsType = {
  layerName: 'points',
  strokeColor: '#ff0000',
  img: '/icons/marker.png'
};

// 新写法
import { MyOl, PointOptions } from 'my-openlayer';
const options: PointOptions = {
  layerName: 'points',
  strokeColor: '#ff0000',
  img: '/icons/marker.png'
};
```

### 迁移优势

- **类型安全**：更精确的类型检查
- **代码提示**：更好的 IDE 支持
- **可维护性**：清晰的模块化结构
- **向后兼容**：保留 `OptionsType` 作为兼容性类型

---

## 依赖

### 运行时依赖

- **ol**: ^10.6.1 - OpenLayers 地图库
- **proj4**: ^2.7.5 - 坐标系转换库
- **@turf/turf**: ^7.2.0 - 地理空间分析库

### 开发依赖

- **typescript**: ~5.6.2 - TypeScript 编译器
- **vite**: ^5.4.10 - 构建工具
- **@vitejs/plugin-vue**: ^5.0.4 - Vue 插件支持
- **vue-tsc**: ^2.0.6 - Vue 类型检查

### 对等依赖

- 无强制对等依赖；推荐 `ol` 与库版本保持一致（^10.6.1）。

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

### 基础配置

**Q: 如何获取天地图 token？**

A: 访问 [天地图开发者平台](https://lbs.tianditu.gov.cn/) 注册账号并申请密钥(token)。申请后在初始化地图时传入 `token` 参数。

**Q: 为什么地图无法加载？**

A: 请检查以下几点：
- 天地图 token 是否正确且有效
- 网络连接是否正常
- 坐标系是否正确（默认使用 EPSG:4326）
- 容器元素是否存在且有正确的尺寸

### 类型和开发

**Q: 如何从旧版本迁移到新的类型系统？**

A: 参考 [迁移指南](MIGRATION_GUIDE.md)，主要是将 `OptionsType` 替换为具体的类型接口如 `PointOptions`、`LineOptions` 等。

**Q: TypeScript 报错怎么办？**

A: 
- 确保安装了正确的类型定义包
- 使用具体的类型接口而不是通用的 `OptionsType`
- 检查导入语句是否正确

### 功能使用

**Q: 如何自定义点位样式？**

A: 通过 `PointOptions` 配置样式：
```typescript
const options: PointOptions = {
  img: '/path/to/icon.png',
  scale: 1.2,
  strokeColor: '#ff0000',
  textVisible: true
};
```

**Q: 如何监听地图事件？**

A: 使用 `EventManager`：
```typescript
const eventManager = map.getEventManager();
eventManager.on('click', (eventData) => {
  console.log('点击位置:', eventData.coordinate);
});
```

**Q: 如何处理错误？**

A: 使用 `ErrorHandler` 进行错误处理：
```typescript
import { MyOl, ErrorHandler } from 'my-openlayer';

// 设置全局错误回调
ErrorHandler.getInstance().addErrorCallback((error) => {
  console.error('地图错误:', error.message);
});

// 手动验证
try {
  ErrorHandler.validateCoordinates(lng, lat);
} catch (error) {
  console.error('坐标验证失败:', error.message);
}
```

### 框架集成

**Q: 如何在 Vue 中使用？**

A: 在组件生命周期中初始化和销毁：
```vue
<template>
  <div id="map-container" style="width: 100%; height: 400px;"></div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { MyOl } from 'my-openlayer';

let map = null;

onMounted(() => {
  map = new MyOl('map-container', {
    center: [119.81, 29.969],
    zoom: 10,
    token: 'your-token'
  });
});

onUnmounted(() => {
  if (map) {
    map.map.dispose();
  }
});
</script>
```

**Q: 如何在 React 中使用？**

A: 使用 useEffect 钩子：
```jsx
import React, { useEffect, useRef } from 'react';
import MyOl from 'my-openlayer';

function MapComponent() {
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      mapRef.current = new MyOl(containerRef.current, {
        center: [119.81, 29.969],
        zoom: 10,
        token: 'your-token'
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.map.dispose();
      }
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '400px' }} />;
}
```

### 性能优化

**Q: 如何优化大量点位的性能？**

A: 
- 使用聚合功能：`addClusterPoint`
- 设置合适的 `distance` 和 `minDistance` 参数
- 考虑使用分层加载或虚拟化技术

**Q: 如何减少内存占用？**

A: 
- 及时移除不需要的图层：`tools.removeLayer(layerName)`
- 使用事件管理器的 `removeAllListeners()` 清理事件监听
- 在组件销毁时调用 `map.dispose()`

---

## 许可证

[MIT](LICENSE)

---

## 联系方式

如有问题或建议，欢迎通过以下方式联系：

- 📧 **邮箱**: 2364184627@qq.com
- 🐛 **问题反馈**: [GitHub Issues](https://github.com/cuteyuchen/my-openlayer/issues)
- 💡 **功能建议**: [GitHub Discussions](https://github.com/cuteyuchen/my-openlayer/discussions)
- 📖 **文档**: [在线文档](https://github.com/cuteyuchen/my-openlayer/blob/main/README.md)

## 相关资源

- 🌐 **OpenLayers 官网**: [https://openlayers.org/](https://openlayers.org/)
- 🗺️ **天地图开发者平台**: [https://lbs.tianditu.gov.cn/](https://lbs.tianditu.gov.cn/)
- 📚 **TypeScript 文档**: [https://www.typescriptlang.org/](https://www.typescriptlang.org/)
- 🛠️ **Vite 构建工具**: [https://vitejs.dev/](https://vitejs.dev/)

## 更新日志

### v1.0.15 (2025-08-20)

#### 新增功能
- ✨ 完整的 TypeScript 支持和类型定义
- ✨ 模块化架构设计，支持按需引入
- ✨ 天地图底图支持（矢量、影像、地形）
- ✨ 点要素操作（普通点位、聚合点位、闪烁点位）
- ✨ Vue 组件集成支持（Vue 2/3 兼容）
- ✨ 线要素和面要素绘制
- ✨ 热力图和图片图层支持
- ✨ 测量工具（距离、面积）
- ✨ 事件管理和配置管理系统
- ✨ 错误处理和验证工具
- ✨ CGCS2000 坐标系支持

#### 技术特性
- 🔧 支持 Vue 2 和 Vue 3
- 🔧 完整的 TypeScript 类型定义
- 🔧 模块化设计，懒加载支持
- 🔧 统一的错误处理机制
- 🔧 向后兼容性保证
- 🔧 环境变量配置支持

#### 核心类库
- 📦 MyOl - 地图核心管理类
- 📦 MapBaseLayers - 底图管理
- 📦 Point/Line/Polygon - 要素操作
- 📦 VueTemplatePoint - Vue 组件支持
- 📦 MapTools - 地图工具集
- 📦 MeasureHandler - 测量工具
- 📦 EventManager - 事件管理
- 📦 ConfigManager - 配置管理
- 📦 ErrorHandler - 错误处理
- 📦 ValidationUtils - 验证工具

#### 文档
- 📚 完整的 API 文档和类型定义
- 📚 详细的使用示例和最佳实践
- 📚 环境配置和部署指南
- 📚 FAQ 和常见问题解决方案

查看完整的 [更新日志](CHANGELOG.md)

---

## 致谢

感谢以下开源项目的支持：

- [OpenLayers](https://openlayers.org/) - 强大的地图库
- [TypeScript](https://www.typescriptlang.org/) - 类型安全的 JavaScript
- [Vite](https://vitejs.dev/) - 快速的构建工具

---

<div align="center">

**⭐ 如果这个项目对您有帮助，请给我们一个 Star！⭐**

[![GitHub stars](https://img.shields.io/github/stars/cuteyuchen/my-openlayer.svg?style=social&label=Star)](https://github.com/cuteyuchen/my-openlayer)
[![GitHub forks](https://img.shields.io/github/forks/cuteyuchen/my-openlayer.svg?style=social&label=Fork)](https://github.com/cuteyuchen/my-openlayer/fork)

**本项目长期维护，欢迎 Star、Fork 和贡献代码！**

</div>