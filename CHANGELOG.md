# Changelog

## [3.1.1] - 2026-06-09

### Bug Fixes

- **GeoJSON:** 修复 `addGeoJSON` 传入字符串 `layerName` 时被追加 `groupKey` 和 `geometryType` 的问题；字符串现在作为最终图层名原样使用。
- **GeoJSON:** 调整混合点线面渲染顺序，避免字符串 `layerName` 同名时面图层清理逻辑误删本次创建的点/线图层。

### Tests

- 更新 `addGeoJSON` 图层命名回归测试，覆盖字符串 `layerName` 原样使用且混合图层完整保留。

## [3.1.0] - 2026-06-09

### Features

- **GeoJSON:** 新增 `MyOl.addGeoJSON(data, options)` 综合渲染入口，自动识别点、线、面几何类型并返回统一 `GeoJSONRenderHandle`。
- **GeoJSON:** 支持单个 GeoJSON、数组、Record 多数据集输入，并支持 `layerName` 使用字符串、数组、Record 或回调自定义。
- **GeoJSON:** 支持 `groupBy` 分组渲染，以及点要素 `styleByProperties` 按 `properties` 返回逐要素样式。
- **Point:** `addPoint`、`addClusterPoint`、`addPulsePointLayer` 支持直接传入 GeoJSON 点数据。

### Bug Fixes

- **ErrorHandler:** 修复 `MyOpenLayersError` 被外层 `catch` 二次包装的问题，避免错误类型被覆盖和错误回调重复触发。

### Documentation

- 更新 README、VitePress 文档和 `skills/my-openlayer-helper`，同步 GeoJSON 综合渲染、点 API GeoJSON 输入和统一错误类型说明。

### Tests

- 新增 GeoJSON 渲染、点 GeoJSON 输入、GeoJSON 处理器和错误处理回归测试。

## [3.0.0] - 2026-05-22

### 🚀 BREAKING CHANGE: 总览

3.0 在保持向后兼容的前提下统一了 API 形态、加强了类型约束、把投影管理抽成独立类。所有 2.x 用户都应**配合 [`docs/MIGRATION-3.0.md`](./docs/MIGRATION-3.0.md) 阅读升级**。

升级核心结论：

- 真实图层类 `add*` 返回值从原始 OpenLayers layer 改为统一 `LayerHandle`
- 所有公开 `add*` 方法签名上 `layerName` 现在是**必填**（编译时强制）
- `addPointByUrl` / `addLineByUrl` / `addPolygonByUrl` 统一异步返回完整 Handle

### ✨ Features

- **handle**：新增统一 [`LayerHandle`](./src/types/handle.ts)、`AnimatedLayerHandle` 与 `ControlHandle` 接口；真实图层 add* 返回 `{ layer, remove, setVisible }`，非图层点位返回 `{ target, remove, setVisible }`。
- **add\***：Point / Line / Polygon 的真实图层 add 方法统一返回 `LayerHandle`；`PulsePointLayerHandle`、`FlowLineLayerHandle` 显式继承动画句柄契约。
- **\*ByUrl**：`Point.addPointByUrl`、`Line.addLineByUrl`、`Polygon.addPolygonByUrl` 统一先获取 JSON，再调用对应 add 方法并返回 Promise Handle。
- **Point \*ByUrl**：新增 `Point.addPointByUrl` / `Point.addPulsePointLayerByUrl`，从 URL 直接异步加载点位数据。
- **ProjectionManager**：投影注册逻辑从 `MyOl` 抽到独立 [`ProjectionManager`](./src/core/projection/ProjectionManager.ts) 类，对外暴露 `register / initialize / resolveViewProjection`。用户现在可在 MyOl 实例之外注册任意 EPSG。
- **ConfigManager.setDefaults**：运行时修改全局默认配置（如线宽、闪烁颜色），所有未提供该字段的后续调用都生效。配 `resetDefaults` 恢复。
- **错误体系**：新增 `LayerNotFoundError` / `InvalidGeoJSONError` / `ProjectionError` 三个具体子类，方便调用方 `instanceof` 判别。
- **类型导出**：补齐 `TwinkleItem` / `VueTemplatePointInstance` / `MeasureHandlerType` 等遗漏类型；运行时枚举 `VueTemplatePointState` 也导出。

### 🐛 Bug Fixes

- **destroy 泄漏（P0-1）**：`MyOl.destroy()` 现在会级联调用 `SelectHandler.destroy / Line.destroyAllFlowLines / Point.destroyAll / Polygon.destroyAll`，确保所有 rAF / Overlay / Vue 实例 / Select interaction 释放。
- **Point/Polygon 句柄注册表**：`Point` / `Polygon` 内部新增 `managedLayers` / `managedDisposables` 注册表，所有 `add*` 都会登记；`destroyAll` 一次性回收。
- **VueTemplatePoint 实例复用**：`Point.addVueTemplatePoint` 之前每次调用都 `new VueTemplatePoint(map)` 丢弃引用，现在改为单例复用并随 `destroyAll` 一起清理。
- **Polygon `[key:string]:any` 删除**：`removePolygonLayer` 不再依赖动态属性赋值。

### 🔒 Hardening

- 公开 `add*` 方法签名上 `layerName` 变成必填（用 `Options & { layerName: string }` 形式），不动 interface 本身保证 2.x 用户的 options 对象赋值不报错。
- `MapTools.setMapClip` 的 `baseLayer` 类型从 `any` 收紧为 `BaseLayer`；坐标数组从 `any[]` 收紧为 `number[][]` / `number[][][]`。
- `PulsePointIconOptions.src` 标 `@deprecated`，统一改名为 `img`（PointPulseLayer 同时识别两者）。

### 📝 Documentation

- 新增 [`docs/MIGRATION-3.0.md`](./docs/MIGRATION-3.0.md) 迁移指南。
- `addPolygonByUrl` / `addLineByUrl` / `Point.addVueTemplatePoint` 等破坏性返回值变化已写入迁移指南。

### 🧪 Tests

- 新增 5 个测试文件，共 40 个用例：`destroy-leak`、`config-defaults`、`async-url-api`、`layer-handle`、`config-defaults`，覆盖 P0/P1/P2 所有改动点。

---

## [2.5.5] - Unreleased（P0 补丁版）

### 🐛 Bug Fixes (P0)

- **destroy 级联清理**：`MyOl.destroy()` 现在会依次调用 `SelectHandler.destroy / Line.destroyAllFlowLines / Point.destroyAll / Polygon.destroyAll / EventManager.clear`，每一步独立 try/catch，确保所有 RAF、Overlay、Vue app、Select interaction 真正释放。
- **Point/Polygon 句柄注册表**：`Point.addPoint / addClusterPoint / addPulsePointLayer / addDomPoint / addVueTemplatePoint` 与 `Polygon.addPolygon / addBorderPolygon / addImageLayer / addHeatmap / addMaskLayer / setOutLayer` 创建的图层都注册到内部表，便于 `destroyAll()` 一次性回收。
- **VueTemplatePoint 实例复用**：`Point.addVueTemplatePoint` 之前每次都 `new VueTemplatePoint(map)` 丢弃引用导致内存泄漏，现改为单例复用。
- **死代码清理**：删除 `Point.ts` 注释段（旧 `addTwinkleLayerFromPolygon` 实现）；删除 `Polygon` 的 `[key:string]:any` 索引签名，重写 `removePolygonLayer`。

### 🔒 Hardening (P0)

- `MapTools.setMapClip` 的 `baseLayer` 类型从 `any` 收紧到 `BaseLayer`；坐标数组从 `any[]` 收紧为 `number[][]` / `number[][][]`。

### ✨ Type Exports (P0)

- 补齐 `TwinkleItem` / `VueTemplatePointInstance` / `MeasureHandlerType` 等遗漏类型；导出运行时枚举 `VueTemplatePointState`。

### 🧪 Tests (P0)

- 新增 `tests/destroy-leak.test.ts`，4 个用例覆盖 `Line.destroyAllFlowLines` / `Point.destroyAll` / `Polygon.destroyAll` / `removePolygonLayer`。

## [2.5.4] - 2026-05-18

### 🐛 Bug Fixes

- 修复生产环境下直接调用 `MyOl.createView()` 时，`EPSG:4326 -> EPSG:4490` 转换缺失的问题。

### 📝 Documentation

- 同步更新 `MyOl` 文档与 skill 说明，明确 `createView()` 会自动完成投影初始化。

## [2.4.12] - 2026-04-21

### Features

- **Point:** 新增 `addPulsePointLayer`，使用 `VectorLayer` 和单个 `requestAnimationFrame` 支持大量高性能闪烁点。
- **Point:** 高性能闪烁点参数对齐 `addPoint`，支持 `img`、`scale`、`iconColor`、`textKey`、`textVisible` 等常用配置。
- **examples:** 新增高性能闪烁点示例和村庄点位 SVG 图标。

### Documentation

- 更新 README、VitePress docs 和 Codex skill 文档，补充 `addPulsePointLayer` 用法。

## [2.4.8] - 2026-01-30

### ✨ Features

- **SelectHandler:** 重构选择交互以支持独立样式渲染和多选隔离
- 重构Polygon样式处理并添加示例组件
- **core:** 添加基于GeoJSON数据的地图定位功能
- **core:** 添加地图定位功能并重构点位相关方法
- **Point:** 添加闪烁点功能及示例
- **core:** 为Polygon添加layerName选项并调整图层添加逻辑
- **Point:** 添加setOneVisibleByProp方法控制点显示
- **Polygon:** 优化遮罩功能支持多几何图形处理
- **测量工具:** 添加测量距离和面积功能及工具栏样式
- **地图:** 添加自定义投影配置支持
- **日志管理:** 实现统一日志开关与级别控制
- **SelectHandler:** 新增要素选择处理器模块
- upgrade OpenLayers to v10.6.1 and update project to v2.0.0
- update MapBaseLayers to handle optional token and improve annotation layer management
- 重新添加已清理的App.vue文件，移除了所有敏感token信息
- 重构Vue模板点位功能并优化事件管理
- **Polygon:** 改进图像图层处理逻辑并添加更新功能
- 添加验证工具类并重构现有验证逻辑
- **地图工具:** 重构地图工具类并增强错误处理
- 重构类型系统并增强核心功能

### 🐛 Bug Fixes

- **core:** 改进Vue依赖检测逻辑并更新版本号
- **VueTemplatePoint:** 修复Vue3环境下pointData的类型定义
- **core:** 修正Line类中layerName属性设置错误
- resolve TypeScript build error in MapBaseLayers.ts

### ⚡ Performance

- **Polygon:** 优化GeoJSON解析性能，直接注入layerName

### ♻️ Refactor

- **MapBaseLayers:** 重构图层管理逻辑，优化代码结构和可维护性
- **ConfigManager:** 集中管理默认配置并移除无用接口
- **样式处理:** 统一处理自定义样式逻辑并修复代码格式
- 将nameKey重命名为textKey以提高语义清晰度
- 更新依赖项并优化类型导出结构
- **core:** 重构DomPoint和MapBaseLayers类，优化代码结构和功能

### 📝 Documentation

- add vitepress documentation and github actions workflow
- 添加详细模块文档并更新发布配置
- update README with branch strategy and add migration guide

## [2.4.7] - 2026-01-30

### ✨ Features

- **SelectHandler:** 重构选择交互以支持独立样式渲染和多选隔离
- 重构Polygon样式处理并添加示例组件
- **core:** 添加基于GeoJSON数据的地图定位功能
- **core:** 添加地图定位功能并重构点位相关方法
- **Point:** 添加闪烁点功能及示例
- **core:** 为Polygon添加layerName选项并调整图层添加逻辑
- **Point:** 添加setOneVisibleByProp方法控制点显示
- **Polygon:** 优化遮罩功能支持多几何图形处理
- **测量工具:** 添加测量距离和面积功能及工具栏样式
- **地图:** 添加自定义投影配置支持
- **日志管理:** 实现统一日志开关与级别控制
- **SelectHandler:** 新增要素选择处理器模块
- upgrade OpenLayers to v10.6.1 and update project to v2.0.0
- update MapBaseLayers to handle optional token and improve annotation layer management
- 重新添加已清理的App.vue文件，移除了所有敏感token信息
- 重构Vue模板点位功能并优化事件管理
- **Polygon:** 改进图像图层处理逻辑并添加更新功能
- 添加验证工具类并重构现有验证逻辑
- **地图工具:** 重构地图工具类并增强错误处理
- 重构类型系统并增强核心功能

### 🐛 Bug Fixes

- **core:** 改进Vue依赖检测逻辑并更新版本号
- **VueTemplatePoint:** 修复Vue3环境下pointData的类型定义
- **core:** 修正Line类中layerName属性设置错误
- resolve TypeScript build error in MapBaseLayers.ts

### ⚡ Performance

- **Polygon:** 优化GeoJSON解析性能，直接注入layerName

### ♻️ Refactor

- **MapBaseLayers:** 重构图层管理逻辑，优化代码结构和可维护性
- **ConfigManager:** 集中管理默认配置并移除无用接口
- **样式处理:** 统一处理自定义样式逻辑并修复代码格式
- 将nameKey重命名为textKey以提高语义清晰度
- 更新依赖项并优化类型导出结构
- **core:** 重构DomPoint和MapBaseLayers类，优化代码结构和功能

### 📝 Documentation

- 添加详细模块文档并更新发布配置
- update README with branch strategy and add migration guide

## [2.4.6] - 2026-01-30

### ✨ Features

- **SelectHandler:** 重构选择交互以支持独立样式渲染和多选隔离
- 重构Polygon样式处理并添加示例组件
- **core:** 添加基于GeoJSON数据的地图定位功能
- **core:** 添加地图定位功能并重构点位相关方法
- **Point:** 添加闪烁点功能及示例
- **core:** 为Polygon添加layerName选项并调整图层添加逻辑
- **Point:** 添加setOneVisibleByProp方法控制点显示
- **Polygon:** 优化遮罩功能支持多几何图形处理
- **测量工具:** 添加测量距离和面积功能及工具栏样式
- **地图:** 添加自定义投影配置支持
- **日志管理:** 实现统一日志开关与级别控制
- **SelectHandler:** 新增要素选择处理器模块
- upgrade OpenLayers to v10.6.1 and update project to v2.0.0
- update MapBaseLayers to handle optional token and improve annotation layer management
- 重新添加已清理的App.vue文件，移除了所有敏感token信息
- 重构Vue模板点位功能并优化事件管理
- **Polygon:** 改进图像图层处理逻辑并添加更新功能
- 添加验证工具类并重构现有验证逻辑
- **地图工具:** 重构地图工具类并增强错误处理
- 重构类型系统并增强核心功能

### 🐛 Bug Fixes

- **core:** 改进Vue依赖检测逻辑并更新版本号
- **VueTemplatePoint:** 修复Vue3环境下pointData的类型定义
- **core:** 修正Line类中layerName属性设置错误
- resolve TypeScript build error in MapBaseLayers.ts

### ⚡ Performance

- **Polygon:** 优化GeoJSON解析性能，直接注入layerName

### ♻️ Refactor

- **MapBaseLayers:** 重构图层管理逻辑，优化代码结构和可维护性
- **ConfigManager:** 集中管理默认配置并移除无用接口
- **样式处理:** 统一处理自定义样式逻辑并修复代码格式
- 将nameKey重命名为textKey以提高语义清晰度
- 更新依赖项并优化类型导出结构
- **core:** 重构DomPoint和MapBaseLayers类，优化代码结构和功能

### 📝 Documentation

- 添加详细模块文档并更新发布配置
- update README with branch strategy and add migration guide

## [2.4.5] - 2026-01-30

### ✨ Features

- **SelectHandler:** 重构选择交互以支持独立样式渲染和多选隔离
- 重构Polygon样式处理并添加示例组件
- **core:** 添加基于GeoJSON数据的地图定位功能
- **core:** 添加地图定位功能并重构点位相关方法
- **Point:** 添加闪烁点功能及示例
- **core:** 为Polygon添加layerName选项并调整图层添加逻辑
- **Point:** 添加setOneVisibleByProp方法控制点显示
- **Polygon:** 优化遮罩功能支持多几何图形处理
- **测量工具:** 添加测量距离和面积功能及工具栏样式
- **地图:** 添加自定义投影配置支持
- **日志管理:** 实现统一日志开关与级别控制
- **SelectHandler:** 新增要素选择处理器模块
- upgrade OpenLayers to v10.6.1 and update project to v2.0.0
- update MapBaseLayers to handle optional token and improve annotation layer management
- 重新添加已清理的App.vue文件，移除了所有敏感token信息
- 重构Vue模板点位功能并优化事件管理
- **Polygon:** 改进图像图层处理逻辑并添加更新功能
- 添加验证工具类并重构现有验证逻辑
- **地图工具:** 重构地图工具类并增强错误处理
- 重构类型系统并增强核心功能

### 🐛 Bug Fixes

- **core:** 改进Vue依赖检测逻辑并更新版本号
- **VueTemplatePoint:** 修复Vue3环境下pointData的类型定义
- **core:** 修正Line类中layerName属性设置错误
- resolve TypeScript build error in MapBaseLayers.ts

### ⚡ Performance

- **Polygon:** 优化GeoJSON解析性能，直接注入layerName

### ♻️ Refactor

- **MapBaseLayers:** 重构图层管理逻辑，优化代码结构和可维护性
- **ConfigManager:** 集中管理默认配置并移除无用接口
- **样式处理:** 统一处理自定义样式逻辑并修复代码格式
- 将nameKey重命名为textKey以提高语义清晰度
- 更新依赖项并优化类型导出结构
- **core:** 重构DomPoint和MapBaseLayers类，优化代码结构和功能

### 📝 Documentation

- 添加详细模块文档并更新发布配置
- update README with branch strategy and add migration guide

# Changelog

## [2.4.3] - 2026-01-27

### ✨ Features

- 重构Polygon样式处理并添加示例组件
- **core:** 添加基于GeoJSON数据的地图定位功能
- **core:** 添加地图定位功能并重构点位相关方法
- **Point:** 添加闪烁点功能及示例
- **core:** 为Polygon添加layerName选项并调整图层添加逻辑
- **Point:** 添加setOneVisibleByProp方法控制点显示
- **Polygon:** 优化遮罩功能支持多几何图形处理
- **测量工具:** 添加测量距离和面积功能及工具栏样式
- **地图:** 添加自定义投影配置支持
- **日志管理:** 实现统一日志开关与级别控制
- **SelectHandler:** 新增要素选择处理器模块
- upgrade OpenLayers to v10.6.1 and update project to v2.0.0
- update MapBaseLayers to handle optional token and improve annotation layer management
- 重新添加已清理的App.vue文件，移除了所有敏感token信息
- 重构Vue模板点位功能并优化事件管理
- **Polygon:** 改进图像图层处理逻辑并添加更新功能
- 添加验证工具类并重构现有验证逻辑
- **地图工具:** 重构地图工具类并增强错误处理
- 重构类型系统并增强核心功能

### 🐛 Bug Fixes

- **core:** 改进Vue依赖检测逻辑并更新版本号
- **VueTemplatePoint:** 修复Vue3环境下pointData的类型定义
- **core:** 修正Line类中layerName属性设置错误
- resolve TypeScript build error in MapBaseLayers.ts

### ⚡ Performance

- **Polygon:** 优化GeoJSON解析性能，直接注入layerName

### ♻️ Refactor

- **MapBaseLayers:** 重构图层管理逻辑，优化代码结构和可维护性
- **ConfigManager:** 集中管理默认配置并移除无用接口
- **样式处理:** 统一处理自定义样式逻辑并修复代码格式
- 将nameKey重命名为textKey以提高语义清晰度
- 更新依赖项并优化类型导出结构
- **core:** 重构DomPoint和MapBaseLayers类，优化代码结构和功能

### 📝 Documentation

- 添加详细模块文档并更新发布配置
- update README with branch strategy and add migration guide

All notable changes to this project will be documented in this file.

