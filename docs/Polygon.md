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
| `styleZIndex` | `number` | 同一图层内面与文字的样式层级，较大的值后绘制；不影响图层 `zIndex` |
| **文本标注** | | |
| `textVisible` | `boolean` | 是否显示文本 |
| `textKey` | `string` | 文本对应的属性字段名 |
| `textCallBack` | `(feature) => string` | 文本回调函数（优先级高于 textKey） |
| `textFont` | `string` | 字体样式 |
| `textFillColor` | `string` | 文本颜色 |
| `textStrokeColor` | `string` | 文本描边颜色 |
| `textStrokeWidth` | `number` | 文本描边宽度 |
| `textOverflow` | `boolean` | 是否允许文字溢出面范围。设为 `true` 时，文字不会因为当前缩放下放不进面内而被 OpenLayers 隐藏 |
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
| `projection` | `ProjectionLike` | 图片数据投影；未传时沿用 OpenLayers 默认行为 |
| `interpolate` | `boolean` | 重采样时是否插值；设为 `false` 时使用最近邻插值 |

## 方法

### createPolygonStyle

从 `3.2.0` 起由包入口导出的样式工具函数，无需创建地图实例，也不是 `Polygon` 的实例方法。`styleZIndex` 同版本新增，原有 `zIndex` 仍只控制图层。

```typescript
import { createPolygonStyle } from 'my-openlayer';

createPolygonStyle(options: PolygonOptions, feature: FeatureLike): Style | Style[]
```

| 参数 | 类型 | 说明 |
| :--- | :--- | :--- |
| `options` | `PolygonOptions` | 面、描边和文字样式配置，与内置面样式保持一致 |
| `feature` | `FeatureLike` | 当前 OpenLayers 要素，用于解析动态填色和文字回调 |

配置会与 `ConfigManager.DEFAULT_POLYGON_OPTIONS` 合并，调用方配置优先。函数直接返回当前要素的 `Style` 或 `Style[]`，不会返回样式回调；面和文字分开创建时，两者都会应用同一个 `styleZIndex`。

`options.style` 保持最高优先级：传入自定义样式时，返回该样式或其回调结果，不再应用其他样式配置，也不会修改自定义样式对象。`zIndex` 只属于图层配置，单独创建样式时不会将它转换成样式层级。

### addPolygon

添加多边形图层。

```typescript
addPolygon(data: MapJSONData, options: PolygonOptions & { layerName: string }): LayerHandle<VectorLayer<VectorSource>>
```

| 参数 | 类型 | 说明 |
| :--- | :--- | :--- |
| `data` | `MapJSONData` | GeoJSON 数据 |
| `options` | `PolygonOptions` | 配置项 |

### addPolygonByUrl

从 URL 加载多边形图层。

```typescript
addPolygonByUrl(url: string, options: PolygonOptions & { layerName: string }): Promise<LayerHandle<VectorLayer<VectorSource>>>
```

### addBorderPolygon

添加边界图层（通常用于行政区划边界，支持镂空效果）。

```typescript
addBorderPolygon(data: MapJSONData, options?: PolygonOptions): LayerHandle<VectorLayer<VectorSource>>
addBorderPolygonByUrl(url: string, options?: PolygonOptions): Promise<LayerHandle<VectorLayer<VectorSource>>>
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

未在 `options` 中指定的样式会沿用要素当前样式，例如 `strokeColor`、`strokeWidth`、`textFont`、`textFillColor`、`textStrokeColor`、`textStrokeWidth`、`textOverflow`、`styleZIndex` 等。只传颜色映射时不会重置原有文字样式和样式层级；也可以通过 `options.styleZIndex` 显式覆盖层级，包括 `0` 和负数。

### addImageLayer

添加静态图片图层（如叠加平面图、卫星图）。

```typescript
addImageLayer(imageData: ImageLayerData, options?: PolygonOptions): LayerHandle<ImageLayer<any>>
```

### addHeatmap

添加热力图。

```typescript
addHeatmap(pointData: PointData[], options?: HeatMapOptions): LayerHandle<BaseLayer>
```

### addMaskLayer

添加遮罩图层。

```typescript
addMaskLayer(data: MapJSONData, options?: MaskLayerOptions): LayerHandle<VectorLayer<VectorSource>>
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
  textOverflow: true, // 允许文字溢出面范围，避免随缩放尺寸不足被隐藏
  fitView: true
});
```

### 按要素计算风险色与选中边框

业务层只计算颜色和选中状态，填充、描边及文字对象由框架创建：

```typescript
import { createPolygonStyle } from 'my-openlayer';

const boundary = map.getPolygon().addPolygon(polygonData, {
  layerName: 'region-boundaries',
  zIndex: 20, // 控制整个图层的叠放顺序
  style: feature => {
    const active = feature.get('selected') === true;
    return createPolygonStyle({
      fillColor: feature.get('riskColor') ?? 'rgba(0, 0, 0, 0)',
      strokeColor: active ? '#ff0000' : '#666666',
      strokeWidth: active ? 3 : 1,
      styleZIndex: active ? 1 : 0, // 激活区域后绘制，避免边框被邻区覆盖
      textVisible: true,
      textKey: 'name',
      textOverflow: true
    }, feature);
  }
});
```

同样适用于 `map.addGeoJSON(data, { layerName: 'regions', polygon: { style: ... } })`。如果风险色或选中状态来自要素之外的数据，数据变化后调用 `boundary.layer.changed()` 重新计算样式即可，不需要重建图层。

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
// 将 EPSG:4326 图片叠加到地图，OpenLayers 会根据 source projection 执行栅格重投影
polygonModule.addImageLayer({
  img: 'https://example.com/inundation.png',
  extent: [117.560633, 28.028820, 120.738828, 30.591628],
  projection: 'EPSG:4326',
  interpolate: false
}, {
  layerName: 'inundationLayer',
  opacity: 0.6,
  visible: true
});
```

`extent` 始终保持图片数据投影下的原始范围。不要先用 `transformExtent()` 将外框转换到地图投影后再线性铺图；只需传入 `projection`，OpenLayers 会创建重投影图片并完成真正的栅格重采样。同名 `layerName` 更新 source 时也会应用新的 `projection` 和 `interpolate`，未传时保持 OpenLayers 默认行为。

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
