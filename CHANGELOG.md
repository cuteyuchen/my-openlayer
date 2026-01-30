# Changelog

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

