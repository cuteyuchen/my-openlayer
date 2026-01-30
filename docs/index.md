# My OpenLayers

My OpenLayers 是一个基于 OpenLayers 的轻量级地图封装库，旨在简化地图开发流程，提供开箱即用的常用功能。它集成了点、线、面绘制，测量工具，选择交互，Vue 组件覆盖物等功能，特别优化了 Vue 项目的集成体验。

## 特性

- **开箱即用**: 封装了常用的地图功能，减少样板代码。
- **Vue 集成**: 支持使用 Vue 组件作为地图覆盖物，轻松创建复杂的交互式标记。
- **TypeScript**: 完全使用 TypeScript 编写，提供完整的类型定义。
- **工具丰富**: 内置测量、选择、裁剪、遮罩等实用工具。
- **扩展性强**: 提供基础类和接口，方便二次封装和扩展。

## 安装

```bash
npm install my-openlayer
# 或者
yarn add my-openlayer
# 或者
pnpm add my-openlayer
```

## 快速开始

```typescript
import { MyOl } from 'my-openlayer';
import 'ol/ol.css'; // 引入 OpenLayers 样式

// 初始化地图
const map = new MyOl('map-container', {
  center: [120.2, 30.3],
  zoom: 12,
  projection: 'EPSG:4326'
});

// 获取原生 Map 实例
const olMap = map.map;

// 添加一个点
const point = map.getPoint();
point.addPoint([{
  lgtd: 120.2,
  lttd: 30.3,
  style: {
    icon: 'path/to/icon.png'
  }
}]);
```

## 核心模块

- **[MyOl](./MyOl.md)**: 核心入口类，负责地图初始化和模块管理。
- **[Point](./Point.md)**: 点位管理，支持图标、文本、聚合等。
- **[Line](./Line.md)**: 线条绘制，支持不同样式和动画。
- **[Polygon](./Polygon.md)**: 多边形绘制，支持遮罩、热力图等。
- **[VueTemplatePoint](./VueTemplatePoint.md)**: 使用 Vue 组件作为地图点位覆盖物。

## 工具模块

- **[MapTools](./MapTools.md)**: 通用地图工具，如裁剪、定位、导出图片等。
- **[MeasureHandler](./MeasureHandler.md)**: 距离和面积测量工具。
- **[SelectHandler](./SelectHandler.md)**: 要素选择交互工具。
- **[MapBaseLayers](./MapBaseLayers.md)**: 底图切换和管理。

## 基础设施

- **[ConfigManager](./ConfigManager.md)**: 全局配置管理。
- **[EventManager](./EventManager.md)**: 统一事件管理系统。
- **[ErrorHandler](./ErrorHandler.md)**: 错误处理和日志系统。
- **[ValidationUtils](./ValidationUtils.md)**: 参数验证工具。

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
