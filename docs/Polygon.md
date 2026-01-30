# Polygon 面要素类

`Polygon` 类用于在地图上绘制面要素、热力图、图片图层和遮罩层，支持丰富的数据可视化功能。

## 构造函数

```typescript
const polygon = new Polygon(map: Map);
```

- **map**: OpenLayers 地图实例。

## 接口定义

### PolygonOptions

面图层配置项，继承自 `BaseOptions`, `StyleOptions`, `TextOptions`。

| 属性 | 类型 | 说明 |
| :--- | :--- | :--- |
| **基础配置** | | |
| `layerName` | `string` | 图层名称 |
| `zIndex` | `number` | 图层层级 |
| `visible` | `boolean` | 是否可见 |
| `opacity` | `number` | 透明度 (0-1) |
| `fitView` | `boolean` | 是否自动缩放视图 |
| **样式配置** | | |
| `fillColor` | `string` | 填充颜色 |
| `fillColorCallBack` | `(feature) => string` | 动态填充颜色回调 |
| `strokeColor` | `string` | 边框颜色 |
| `strokeWidth` | `number` | 边框宽度 |
| `lineDash` | `number[]` | 边框虚线样式 |
| **文本标注** | | |
| `textVisible` | `boolean` | 是否显示文本 |
| `textKey` | `string` | 文本对应的属性字段名 |
| `textCallBack` | `(feature) => string` | 文本回调函数（优先级高于 textKey） |
| `textFont` | `string` | 字体样式 |
| `textFillColor` | `string` | 文本颜色 |
| `textStrokeColor` | `string` | 文本描边颜色 |
| **其他** | | |
| `mask` | `boolean` | 是否作为蒙版（配合 `setOutLayer` 使用） |

### HeatMapOptions

热力图配置项。

| 属性 | 类型 | 说明 |
| :--- | :--- | :--- |
| `layerName` | `string` | 图层名称 |
| `radius` | `number` | 热点半径，默认 8 |
| `blur` | `number` | 模糊度，默认 15 |
| `gradient` | `string[]` | 颜色渐变数组 |
| `opacity` | `number` | 透明度 |
| `valueKey` | `string` | 权重字段名，默认 'value' |

### ImageLayerData

图片图层数据。

| 属性 | 类型 | 说明 |
| :--- | :--- | :--- |
| `img` | `string` | 图片 URL |
| `extent` | `number[]` | 图片覆盖范围 `[minX, minY, maxX, maxY]` |

## 方法

### addPolygon

添加多边形图层。

```typescript
addPolygon(data: MapJSONData, options?: PolygonOptions): VectorLayer<VectorSource>
```

| 参数 | 类型 | 说明 |
| :--- | :--- | :--- |
| `data` | `MapJSONData` | GeoJSON 数据 |
| `options` | `PolygonOptions` | 配置项 |

### addPolygonByUrl

从 URL 加载多边形图层。

```typescript
addPolygonByUrl(url: string, options?: PolygonOptions): VectorLayer<VectorSource>
```

### addBorderPolygon

添加边界图层（通常用于行政区划边界，支持镂空效果）。

```typescript
addBorderPolygon(data: MapJSONData, options?: PolygonOptions): VectorLayer<VectorSource>
```

### updateFeatureColor

动态更新面要素颜色，常用于数据可视化展示。

```typescript
updateFeatureColor(
  layerName: string, 
  colorObj?: { [propName: string]: string }, 
  options?: FeatureColorUpdateOptions
): void
```

| 参数 | 类型 | 说明 |
| :--- | :--- | :--- |
| `layerName` | `string` | 目标图层名称 |
| `colorObj` | `Object` | 颜色映射对象 `{ '区域名': '颜色值' }` |
| `options` | `FeatureColorUpdateOptions` | 包含 textKey 等配置以匹配要素 |

### addImageLayer

添加静态图片图层（如叠加平面图、卫星图）。

```typescript
addImageLayer(imageData: ImageLayerData, options?: PolygonOptions): ImageLayer<any>
```

### addHeatmap

添加热力图。

```typescript
addHeatmap(pointData: PointData[], options?: HeatMapOptions): Heatmap
```

### setOutLayer

添加遮罩图层（反向裁剪，只高亮指定区域，遮挡外部）。

```typescript
setOutLayer(data: MapJSONData, options?: {
  layerName?: string,
  extent?: any,
  fillColor?: string,
  strokeWidth?: number,
  strokeColor?: string,
  zIndex?: number
}): VectorLayer<VectorSource>
```

## 使用示例

### 基础多边形

```typescript
const polygonModule = map.getPolygon();

// GeoJSON 数据
const polygonData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[120, 30], [121, 30], [121, 31], [120, 31], [120, 30]]]
      },
      properties: { name: '区域A', value: 100 }
    }
  ]
};

// 添加半透明蓝色填充、蓝色边框的多边形
polygonModule.addPolygon(polygonData, {
  layerName: 'area-layer',
  fillColor: 'rgba(0, 0, 255, 0.1)',
  strokeColor: 'blue',
  strokeWidth: 2,
  textKey: 'name', // 显示名称
  textFillColor: '#fff',
  textStrokeColor: 'blue',
  textStrokeWidth: 2,
  fitView: true
});
```

### 数据可视化（动态填色）

```typescript
// 假设 'area-layer' 中的要素有 'name' 属性
// 我们将 '区域A' 设为红色，其他区域保持默认或设为其他颜色
polygonModule.updateFeatureColor(
  'area-layer',
  {
    '区域A': 'rgba(255, 0, 0, 0.5)',
    '区域B': 'rgba(0, 255, 0, 0.5)'
  },
  { 
    textKey: 'name', // 匹配 colorObj 的键
    strokeColor: '#666', // 统一更新边框颜色
    strokeWidth: 1
  }
);
```

### 热力图

```typescript
const heatPoints = [
  { lgtd: 119.8, lttd: 29.9, value: 100 },
  { lgtd: 119.9, lttd: 30.0, value: 50 },
  // ... 更多点
];

polygonModule.addHeatmap(heatPoints, {
  layerName: 'heatmap-layer',
  radius: 20,       // 热点半径
  blur: 15,         // 边缘模糊
  valueKey: 'value', // 权重字段
  gradient: ['#00f', '#0ff', '#0f0', '#ff0', '#f00'] // 自定义渐变色
});
```

### 图片图层

```typescript
// 将图片叠加到指定经纬度范围
polygonModule.addImageLayer({
  img: 'https://example.com/plan.png',
  extent: [120.0, 30.0, 120.1, 30.1] // [minX, minY, maxX, maxY]
}, {
  layerName: 'image-overlay',
  opacity: 0.8
});
```

### 遮罩层（反向裁剪）

```typescript
// 添加遮罩，除了 polygonData 覆盖的区域外，其他区域都会被遮挡
polygonModule.setOutLayer(polygonData, {
  layerName: 'mask-layer',
  fillColor: 'rgba(0, 0, 0, 0.5)', // 黑色半透明遮罩
  strokeColor: '#fff',
  strokeWidth: 2
});
```
