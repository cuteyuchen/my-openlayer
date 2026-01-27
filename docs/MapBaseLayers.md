# MapBaseLayers 底图管理类

`MapBaseLayers` 用于管理地图底图（如天地图）和注记图层，支持图层切换和自定义图层。

## 方法

### 底图操作

- **switchBaseLayer(type: string)**: 切换底图类型（如 `vec_c`, `img_c`, `ter_c`）。
- **getCurrentBaseLayerType()**: 获取当前底图类型。

### 注记操作

- **addAnnotationLayer(options: AnnotationLayerOptions)**: 添加注记图层。
- **switchAnnotationLayer(annotationType: AnnotationType)**: 切换注记类型（如 `cva_c`）。
- **setAnnotationVisible(visible: boolean)**: 设置注记图层可见性。
- **isAnnotationVisible()**: 检查注记图层是否可见。

### 其他图层

- **addGeoServerLayer(url: string, layerName: string, options: GeoServerLayerOptions)**: 添加 GeoServer WMS 图层。
- **removeLayersByType(type: string)**: 移除指定类型的图层。
- **clearAllLayers()**: 清除所有底图和注记图层。
- **getLayerStats()**: 获取图层统计信息。

## 使用示例

```typescript
const baseLayers = map.getMapBaseLayers();

// 1. 切换底图
// vec_c: 矢量底图, img_c: 影像底图, ter_c: 地形底图
baseLayers.switchBaseLayer('img_c');

// 2. 控制注记图层
baseLayers.setAnnotationVisible(false); // 隐藏注记
baseLayers.switchAnnotationLayer('cia_c'); // 切换为影像注记

// 3. 添加 GeoServer WMS 图层
baseLayers.addGeoServerLayer(
  'http://localhost:8080/geoserver/wms',
  'workspace:layer_name',
  {
    visible: true,
    zIndex: 5
  }
);
```
