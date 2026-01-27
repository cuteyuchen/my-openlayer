# Polygon 面要素类

`Polygon` 类用于在地图上绘制面要素、热力图、图片图层和遮罩层。

## 方法

### 面要素操作

- **addPolygon(dataJSON: MapJSONData, options?: PolygonOptions)**: 添加多边形图层。
  - 支持填充色 `fillColor`、边框 `strokeColor`、文本标注 `textKey` 等配置。
- **addPolygonByUrl(url: string, options?: PolygonOptions)**: 从 URL 加载多边形图层。
- **addBorderPolygon(data: MapJSONData, options?: PolygonOptions)**: 添加边界图层（通常用于行政区划边界）。
- **addBorderPolygonByUrl(url: string, options?: PolygonOptions)**: 从 URL 加载边界图层。
- **removePolygonLayer(layerName: string)**: 移除面图层。

### 样式更新

- **updateFeatureColor(layerName: string, colorObj?: { [propName: string]: string }, options?: FeatureColorUpdateOptions)**: 动态更新面要素颜色，常用于数据可视化展示。

### 高级图层

- **addImageLayer(imageData: ImageLayerData, options?: PolygonOptions)**: 添加图片图层（ImageStatic）。
  - 支持将图片叠加在特定地理范围 `extent` 上。
- **addHeatmap(pointData: PointData[], options?: HeatMapOptions)**: 添加热力图。
- **addMaskLayer(data: any, options?: MaskLayerOptions)**: 添加遮罩图层（反向裁剪效果）。
- **setOutLayer(data: MapJSONData, options?)**: 设置外围蒙版图层（擦除效果）。

## 使用示例

```typescript
const polygonModule = map.getPolygon();

// 1. 添加面图层
polygonModule.addPolygon(geoJsonData, {
  layerName: 'area-layer',
  fillColor: 'rgba(0, 0, 255, 0.1)',
  strokeColor: 'blue',
  strokeWidth: 2,
  textKey: 'name', // 显示名称
  textFillColor: '#fff'
});

// 2. 动态更新颜色（数据可视化）
// 假设 'area-layer' 中的要素有 'name' 属性，我们将 '区域A' 设为红色
polygonModule.updateFeatureColor(
  'area-layer',
  {
    '区域A': 'rgba(255, 0, 0, 0.5)',
    '区域B': 'rgba(0, 255, 0, 0.5)'
  },
  { textKey: 'name' }
);

// 3. 添加热力图
const heatPoints = [
  { lgtd: 119.8, lttd: 29.9, value: 100 },
  { lgtd: 119.9, lttd: 30.0, value: 50 }
];
polygonModule.addHeatmap(heatPoints, {
  layerName: 'heatmap',
  radius: 20,
  blur: 15,
  valueKey: 'value' // 权重字段
});
```
