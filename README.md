# my-openlayer

my-openlayer 是一个基于 [OpenLayers](https://openlayers.org/) 的现代地图组件库，专为 Web GIS 应用开发者设计。提供完整的 TypeScript 支持、模块化的类型定义、强大的错误处理和事件管理系统，支持天地图底图加载、要素绘制、图层管理、事件监听等丰富功能，极大提升地图开发效率。

[![npm version](https://img.shields.io/npm/v/my-openlayer.svg)](https://www.npmjs.com/package/my-openlayer)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**[在线 Demo](https://cuteyuchen.github.io/my-openlayer/demo/)** · [文档](https://cuteyuchen.github.io/my-openlayer/) · [迁移指南 (2.x → 3.0)](docs/MIGRATION-3.0.md)

---

## 3.0 亮点

3.0 是一次 API 形态层的范式转移，核心目标是**统一 lifecycle、降低学习成本**：

- **统一 LayerHandle** — 真实图层类 `add*` 返回 `{ layer, remove(), setVisible() }` 形态的句柄，跨 Point / Line / Polygon 复用同一套 lifecycle 模型
- **统一 ControlHandle** — `addDomPoint` / `addVueTemplatePoint` 返回 `{ target, remove(), setVisible() }`，并保留 `anchors` / `getPoints()` 等原有能力
- ***ByUrl 异步化** — `addPointByUrl` / `addLineByUrl` / `addPolygonByUrl` 统一先获取 JSON，再返回完整 Handle
- **destroy 级联清理** — `MyOl.destroy()` 现在依次调用 `SelectHandler.destroy` / `Line.destroyAllFlowLines` / `Point.destroyAll` / `Polygon.destroyAll`，确保 rAF / Overlay / Vue 实例 / Select interaction 全部释放
- **ProjectionManager** — 投影逻辑从 MyOl 内部抽取为独立类，支持 `ProjectionManager.register({ code, def })` 在 MyOl 实例之外注册任意 EPSG
- **ConfigManager.setDefaults** — 运行时修改全局默认配置，所有未提供该字段的后续调用都生效
- **具体错误类型** — `LayerNotFoundError` / `InvalidGeoJSONError` / `ProjectionError`，方便 `instanceof` 判别
- **layerName 必填** — 公开 `add*` 方法签名上 `layerName` 变成必填（编译时强制）
- **PulsePointIconOptions `src` → `img`** — 统一命名，旧 `src` 标 `@deprecated`

> 从 2.x 升级请参考 [MIGRATION-3.0.md](docs/MIGRATION-3.0.md)。3.0 会把旧 `add*` 的原始 layer 返回值改为 Handle；访问 OL 图层请使用 `handle.layer`。

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
  - **点位管理 (Point)**：点位标注（自定义图标、聚合、DOM 闪烁、高性能矢量闪烁）
  - **线要素绘制 (Line)**：支持静态线、流光线、流动线图标动画，详见 [Line 动画文档](docs/Line.md#流动线--动态图标线)
  - **面要素 (Polygon)**：面要素绘制、分区高亮、遮罩层
  - **Vue组件支持 (VueTemplatePoint)**：支持将 Vue 组件作为地图点位渲染

- **🛠️ 地图工具**
  - **测量工具 (MeasureHandler)**：距离和面积测量
  - **要素选择 (SelectHandler)**：支持点击、悬停、多选等交互选择
  - **地图工具 (MapTools)**：图层管理、定位、视图自适应、全图裁剪 (`clipMap`)
  - **事件管理 (EventManager)**：统一的地图事件监听与管理

- **⚡ 高级特性**
  - **TypeScript 完全支持**：提供完整的类型定义，严格模式
  - **错误处理 (ErrorHandler)**：统一的错误捕获与日志，含具体子类型
  - **配置管理 (ConfigManager)**：集中管理默认配置，支持运行时 `setDefaults`
  - **投影管理 (ProjectionManager)**：内置 `EPSG:4326` / `EPSG:4490` / `EPSG:4549`，支持 `ProjectionManager.register()` 注册任意自定义投影

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

## CC Switch 技能仓库

本仓库已按 CC Switch 技能仓库结构提供 `my-openlayer-helper`：

```txt
skills/my-openlayer-helper/SKILL.md
```

在 CC Switch 的“添加技能仓库”中填写：

```txt
仓库 URL：cuteyuchen/my-openlayer
分支：main
```

CC Switch 扫描后会识别到 `my-openlayer-helper`。后续更新只需要同步本仓库，使用者在 CC Switch 中刷新/更新技能即可。

## 快速上手

### 1. 初始化地图

```typescript
import { MyOl } from 'my-openlayer';

const map = new MyOl('map-container', {
  center: [119.81, 29.969],
  zoom: 10,
  token: import.meta.env.VITE_TIANDITU_TOKEN, // 天地图 Token
  annotation: true
});
```

### 2. 使用功能模块

```typescript
// 获取模块实例（懒加载）
const point = map.getPoint();
const line = map.getLine();
const polygon = map.getPolygon();

// 添加点位（3.0 add* 返回统一 LayerHandle）
const handle = point.addPoint(
  [{ lgtd: 119.81, lttd: 29.969, name: '示例点' }],
  { layerName: 'example-point', img: 'marker.png' }
);
handle?.remove(); // 统一的生命周期管理
```

### 3. 添加高性能闪烁点

当需要展示大量预警点位时，优先使用 `addPulsePointLayer`。它与 `addPoint` 保持一致的 `img`、`scale`、`textKey` 等参数习惯，通过单个 `requestAnimationFrame` 驱动整个 `VectorLayer`，避免为每个点创建 DOM 动画。

```typescript
const pulseLayer = point.addPulsePointLayer(
  [
    { lgtd: 119.81, lttd: 29.969, lev: 0, stnm: '风险村' },
    { lgtd: 119.86, lttd: 29.992, lev: 3, stnm: '普通村' }
  ],
  {
    layerName: 'village-pulse',
    levelKey: 'lev',
    textKey: 'stnm',
    img: '/icons/village.svg',
    scale: 0.8,
    textVisible: true,
    pulse: {
      duration: 2400,
      radius: [8, 28],
      colorMap: {
        0: 'rgba(255, 48, 54, 0.48)',
        1: 'rgba(255, 136, 0, 0.45)',
        2: 'rgba(253, 216, 46, 0.4)',
        3: 'rgba(6, 183, 253, 0.32)'
      }
    }
  }
);

pulseLayer?.stop();
pulseLayer?.start();
pulseLayer?.remove();
```

### 4. 添加流动线

```typescript
const flow = map.getLine().addFlowLine(lineData, {
  layerName: 'river-flow',
  animationMode: 'icon+dash',
  strokeColor: '#19b1ff',
  strokeWidth: 3,
  flowSymbol: {
    src: '/symbols/boat.svg',
    scale: 0.9,
    count: 2,
    spacing: 0.2
  }
});

flow?.pause();
flow?.resume();
flow?.remove();
```

### 5. 全图裁剪

```typescript
const tools = map.getTools();

// 裁剪整张地图（底图 + 注记 + 用户图层全部只在区域内可见）
tools.clipMap(geoJsonBoundary);

// 或只裁剪当前底图
const baseLayers = map.getMapBaseLayers().getCurrentBaseLayers();
baseLayers.forEach(layer => MapTools.setMapClip(layer, geoJsonBoundary));
```

### 6. 注册自定义投影

```typescript
import { ProjectionManager } from 'my-openlayer';

// 在 MyOl 实例之外注册任意 EPSG
ProjectionManager.register({
  code: 'EPSG:4528',
  def: '+proj=tmerc +lat_0=0 +lon_0=120 +k=1 +x_0=40500000 +y_0=0 +ellps=GRS80 +units=m +no_defs'
});

// 之后 MyOl 构造时直接用
const map = new MyOl('map', { projection: { code: 'EPSG:4528' } });
```

### 7. 运行时修改默认配置

```typescript
import { ConfigManager } from 'my-openlayer';

// 所有后续 addLine 调用的默认 strokeWidth 变为 4
ConfigManager.setDefaults('LINE_OPTIONS', { strokeWidth: 4 });

// 恢复内置默认
ConfigManager.resetDefaults('LINE_OPTIONS');
```

## 文档索引

详细文档请访问 **[在线文档](https://cuteyuchen.github.io/my-openlayer/)**，交互式 Demo 请访问 **[Demo 站点](https://cuteyuchen.github.io/my-openlayer/demo/)**。

### 核心类库
- **[MyOl](docs/MyOl.md)**: 地图入口类，负责初始化和模块访问。
- **[ProjectionManager](docs/ProjectionManager.md)**: 投影管理（3.0 新增），支持 `register()` 注册任意 EPSG。
- **[MapBaseLayers](docs/MapBaseLayers.md)**: 底图与注记管理。
- **[ConfigManager](docs/ConfigManager.md)**: 配置管理，支持运行时 `setDefaults`。
- **[EventManager](docs/EventManager.md)**: 事件管理。
- **[ErrorHandler](docs/ErrorHandler.md)**: 错误处理，含 `LayerNotFoundError` / `InvalidGeoJSONError` / `ProjectionError`。

### 要素操作
- **[Point](docs/Point.md)**: 点要素（含聚合、DOM 点位、高性能闪烁点、统一 Handle）。
- **[Point](docs/Point.md)**: 点要素（含聚合、DOM 点位、高性能闪烁点、统一 Handle）。
- **[Line](docs/Line.md)**: 线要素（含静态线、流动线、URL 异步加载）。
- **[Polygon](docs/Polygon.md)**: 面要素（含热力图、图片层、遮罩层、统一 Handle）。
- **[VueTemplatePoint](docs/VueTemplatePoint.md)**: Vue 组件点位。

### 交互与工具
- **[SelectHandler](docs/SelectHandler.md)**: 要素选择交互（支持独立样式渲染、多选隔离）。
- **[MeasureHandler](docs/MeasureHandler.md)**: 测量工具。
- **[MapTools](docs/MapTools.md)**: 通用地图工具（含 `clipMap` 全图裁剪）。
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

### 要素选择

```typescript
const selectHandler = map.getSelectHandler();

selectHandler.enableSelect('click', {
  layerFilter: ['cities'],
  onSelect: (event) => console.log('选中:', event.selected)
});

// 编程式选择
selectHandler.selectByProperty('name', '杭州', { fitView: true });
```

> 注意：更多示例请访问 [Demo 站点](https://cuteyuchen.github.io/my-openlayer/demo/)，每个公开类都有独立的交互式演示页。

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
