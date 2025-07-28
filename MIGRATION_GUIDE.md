# 类型接口迁移指南

本指南帮助您从旧的 `OptionsType` 迁移到新的模块化类型接口。

## 概述

我们将原来的 `OptionsType` 接口重构为更清晰的模块化结构：

- **BaseOptions**: 所有图层的公共配置
- **StyleOptions**: 图形样式相关配置
- **TextOptions**: 文本标注相关配置
- **PointOptions**: 点位图层专用配置
- **LineOptions**: 线条图层专用配置
- **PolygonOptions**: 多边形图层专用配置

## 迁移步骤

### 1. 更新导入语句

**旧写法：**
```typescript
import { OptionsType } from './types';
```

**新写法：**
```typescript
// 根据实际使用场景选择合适的类型
import { PointOptions, LineOptions, PolygonOptions } from './types';

// 或者继续使用兼容性类型（不推荐）
import { OptionsType } from './types'; // @deprecated
```

### 2. 更新方法参数类型

#### 点位相关方法

**旧写法：**
```typescript
addPoint(pointData: PointData[], options: OptionsType): VectorLayer<VectorSource>
addClusterPoint(pointData: PointData[], options: OptionsType): VectorLayer<VectorSource>
```

**新写法：**
```typescript
addPoint(pointData: PointData[], options: PointOptions): VectorLayer<VectorSource>
addClusterPoint(pointData: PointData[], options: ClusterOptions): VectorLayer<VectorSource>
```

#### 线条相关方法

**旧写法：**
```typescript
addLine(data: MapJSONData, options: OptionsType): VectorLayer<VectorSource>
addRiverLayersByZoom(data: MapJSONData, options: OptionsType): void
```

**新写法：**
```typescript
addLine(data: MapJSONData, options: LineOptions): VectorLayer<VectorSource>
addRiverLayersByZoom(data: MapJSONData, options: LineOptions): void
```

#### 多边形相关方法

**旧写法：**
```typescript
addPolygon(data: MapJSONData, options?: OptionsType): VectorLayer<VectorSource>
addBorderPolygon(data: MapJSONData, options?: OptionsType): VectorLayer<VectorSource>
```

**新写法：**
```typescript
addPolygon(data: MapJSONData, options?: PolygonOptions): VectorLayer<VectorSource>
addBorderPolygon(data: MapJSONData, options?: PolygonOptions): VectorLayer<VectorSource>
```

### 3. 更新配置对象

#### 点位配置示例

**旧写法：**
```typescript
const options: OptionsType = {
  layerName: 'points',
  strokeColor: '#ff0000',
  fillColor: 'rgba(255, 0, 0, 0.3)',
  img: '/icons/marker.png',
  scale: 1.2,
  textVisible: true,
  textCallBack: (feature) => feature.get('name')
};
```

**新写法：**
```typescript
const options: PointOptions = {
  layerName: 'points',
  strokeColor: '#ff0000',
  fillColor: 'rgba(255, 0, 0, 0.3)',
  img: '/icons/marker.png',
  scale: 1.2,
  textVisible: true,
  textCallBack: (feature) => feature.get('name')
};
```

#### 线条配置示例

**旧写法：**
```typescript
const options: OptionsType = {
  layerName: 'lines',
  strokeColor: '#00ff00',
  strokeWidth: 3,
  type: 'highway'
};
```

**新写法：**
```typescript
const options: LineOptions = {
  layerName: 'lines',
  strokeColor: '#00ff00',
  strokeWidth: 3,
  type: 'highway'
};
```

#### 多边形配置示例

**旧写法：**
```typescript
const options: OptionsType = {
  layerName: 'polygons',
  fillColor: 'rgba(0, 0, 255, 0.3)',
  strokeColor: '#0000ff',
  nameKey: 'region_name',
  mask: false
};
```

**新写法：**
```typescript
const options: PolygonOptions = {
  layerName: 'polygons',
  fillColor: 'rgba(0, 0, 255, 0.3)',
  strokeColor: '#0000ff',
  nameKey: 'region_name',
  mask: false
};
```

## 新接口的优势

### 1. 类型安全
每个功能模块有专门的类型定义，编译时能更好地检查类型错误。

### 2. 代码提示
IDE 能提供更精确的代码提示和自动补全。

### 3. 可维护性
清晰的模块化结构便于维护和扩展。

### 4. 文档完善
所有属性都有详细的 JSDoc 注释。

## 组合使用

新的接口支持灵活的组合使用：

```typescript
// 只需要基础配置
function createBaseLayer(): BaseOptions {
  return {
    layerName: 'base-layer',
    zIndex: 1,
    visible: true
  };
}

// 组合基础配置和样式配置
function createStyledLayer(): BaseOptions & StyleOptions {
  return {
    ...createBaseLayer(),
    strokeColor: '#ff0000',
    fillColor: 'rgba(255, 0, 0, 0.3)'
  };
}

// 完整的点位配置
function createPointLayer(): PointOptions {
  return {
    ...createStyledLayer(),
    img: '/icons/marker.png',
    scale: 1.2,
    textVisible: true
  };
}
```

## 向后兼容性

为了保持向后兼容性，我们保留了 `OptionsType` 作为类型别名：

```typescript
// 这样的代码仍然可以工作，但不推荐
const options: OptionsType = {
  layerName: 'legacy-layer',
  strokeColor: '#ff0000'
};
```

**建议：** 逐步迁移到新的类型接口，以获得更好的类型安全性和开发体验。

## 常见问题

### Q: 我需要立即更新所有代码吗？
A: 不需要。我们保持了向后兼容性，您可以逐步迁移。

### Q: 新接口有哪些属性？
A: 请参考 `src/types.ts` 文件中的详细定义，或查看 `examples/type-usage-example.ts` 中的使用示例。

### Q: 如何选择合适的接口？
A: 根据您的使用场景选择：
- 点位图层 → `PointOptions`
- 线条图层 → `LineOptions`
- 多边形图层 → `PolygonOptions`
- 聚合点位 → `ClusterOptions`
- 通用配置 → `BaseOptions` + `StyleOptions` + `TextOptions`

## 更多示例

请查看 `examples/type-usage-example.ts` 文件获取更多使用示例。