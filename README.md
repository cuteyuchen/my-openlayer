# my-openlayer

my-openlayer 是一个基于 [OpenLayers](https://openlayers.org/) 的现代地图组件库，专为 Web GIS 应用开发者设计。提供完整的 TypeScript 支持、模块化的类型定义、强大的错误处理和事件管理系统，支持天地图底图加载、要素绘制、图层管理、事件监听等丰富功能，极大提升地图开发效率。

[![npm version](https://img.shields.io/npm/v/my-openlayer.svg)](https://www.npmjs.com/package/my-openlayer)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 项目概述

- **项目名称**：`my-openlayer`
- **用途**：基于 OpenLayers 的 TypeScript 地图组件库，提供点/线/面要素、底图切换、热力图、事件与配置管理等能力。
- **目标用户**：Web GIS 开发者、可视化工程师、前端开发者

## 功能亮点

- **🗺️ 底图管理 (MapBaseLayers)**
  - 支持天地图矢量、影像、地形底图切换
  - 动态切换底图与注记图层管理
  - 地图裁剪与自定义范围显示
  - 支持 GeoServer WMS 图层

- **📍 要素操作**
  - **点位管理 (Point)**：点位标注（自定义图标、聚合、闪烁）
  - **线要素绘制 (Line)**：线要素绘制（虚线、样式自定义）
  - **面要素 (Polygon)**：面要素绘制、分区高亮、遮罩层
  - **Vue组件支持 (VueTemplatePoint)**：支持将 Vue 组件作为地图点位渲染
  - **河流图层 (RiverLayerManager)**：支持分级显示的河流图层管理

- **🛠️ 地图工具**
  - **测量工具 (MeasureHandler)**：距离和面积测量
  - **要素选择 (SelectHandler)**：支持点击、悬停、多选等交互选择
  - **地图工具 (MapTools)**：图层管理、定位、视图自适应
  - **事件管理 (EventManager)**：统一的地图事件监听与管理

- **⚡ 高级特性**
  - **TypeScript 完全支持**：提供完整的类型定义
  - **错误处理 (ErrorHandler)**：统一的错误捕获与日志
  - **配置管理 (ConfigManager)**：集中管理默认配置
  - **坐标系支持**：内置 CGCS2000 坐标系支持

## 安装

```bash
npm install my-openlayer
# 或
yarn add my-openlayer
# 或
pnpm add my-openlayer
```

### 依赖要求

- **Node.js**: >= 18
- **OpenLayers**: ^10.6.1
- **proj4**: ^2.7.5
- **@turf/turf**: ^7.2.0

## 快速上手

### 1. 初始化地图

```typescript
import MyOl, { MapInitType } from 'my-openlayer';

const mapConfig: MapInitType = {
  center: [119.81, 29.969],
  zoom: 10,
  token: import.meta.env.VITE_TIANDITU_TOKEN, // 天地图 Token
  annotation: true
};

const map = new MyOl('map-container', mapConfig);
```

### 2. 使用功能模块

```typescript
// 获取模块实例
const point = map.getPoint();
const line = map.getLine();
const polygon = map.getPolygon();

// 添加点位
point.addPoint([{ lgtd: 119.81, lttd: 29.969, name: '示例点' }], {
  layerName: 'example-point',
  img: 'marker.png'
});
```

## 文档索引

为了提供更详细的说明，我们将文档拆分为独立的模块文件：

### 核心类库
- **[MyOl](docs/MyOl.md)**: 地图入口类，负责初始化和模块访问。
- **[MapBaseLayers](docs/MapBaseLayers.md)**: 底图与注记管理。
- **[ConfigManager](docs/ConfigManager.md)**: 配置管理。
- **[EventManager](docs/EventManager.md)**: 事件管理。
- **[ErrorHandler](docs/ErrorHandler.md)**: 错误处理。

### 要素操作
- **[Point](docs/Point.md)**: 点要素（含聚合、DOM点位）。
- **[Line](docs/Line.md)**: 线要素。
- **[Polygon](docs/Polygon.md)**: 面要素（含热力图、图片层）。
- **[VueTemplatePoint](docs/VueTemplatePoint.md)**: Vue 组件点位。
- **[RiverLayerManager](docs/RiverLayerManager.md)**: 河流图层管理。

### 交互与工具
- **[SelectHandler](docs/SelectHandler.md)**: 要素选择交互（支持独立样式渲染、多选隔离）。
- **[MeasureHandler](docs/MeasureHandler.md)**: 测量工具。
- **[MapTools](docs/MapTools.md)**: 通用地图工具。
- **[ValidationUtils](docs/ValidationUtils.md)**: 验证工具。

## 详细用法示例

### 底图切换

```typescript
const baseLayers = map.getMapBaseLayers();
baseLayers.switchBaseLayer('img_c'); // 切换到影像底图
```

### 测量工具

```typescript
import { MeasureHandler } from 'my-openlayer';

// 需要传入原生的 OpenLayers map 实例
const measure = new MeasureHandler(map.map);

measure.start('LineString'); // 开始测距
measure.end(); // 结束测量
```

> 注意：部分高级功能（如 SelectHandler）可以通过 `map.getSelectHandler()` 访问。

## 贡献指南

欢迎提交 Issue 或 Pull Request！

1. Fork 本仓库
2. 新建分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m 'feat: 新功能描述'`
4. 推送分支：`git push origin feature/your-feature`
5. 提交 Pull Request

## 许可证

[MIT](LICENSE)

---

**联系方式**: 2364184627@qq.com | [GitHub Issues](https://github.com/cuteyuchen/my-openlayer/issues)
