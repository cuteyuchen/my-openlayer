# MapTools 地图工具类

`MapTools` 提供通用的地图操作工具，如图层查找、移除、显隐控制、地图裁剪和视图自适应。

## 方法

### 图层管理

- **getLayerByLayerName(layerName: string | string[])**: 根据名称获取图层对象（支持模糊匹配）。
- **removeLayer(layerName: string | string[])**: 移除指定名称的图层。
- **setLayerVisible(layerName: string, visible: boolean)**: 设置图层可见性。

### 视图操作

- **locationAction(lgtd: number, lttd: number, zoom?: number, duration?: number)**: 视图定位。
- **fitToLayers(layerNameOrLayers: string | string[] | Layer[], fitOptions?)**: 缩放地图以适应指定图层的范围。
- **fitByData(jsonData: MapJSONData, fitOptions?)**: 缩放地图以适应 GeoJSON 数据的范围。

### 其他

- **setMapClip(baseLayer: any, data: MapJSONData)**: 设置地图裁剪区域（Canvas 级裁剪）。

## 使用示例

```typescript
const tools = map.getTools();

// 1. 获取图层
const layers = tools.getLayerByLayerName('my-layer');
if (layers.length > 0) {
  console.log('找到图层:', layers[0]);
}

// 2. 移除图层
tools.removeLayer('temp-layer');

// 3. 视图自适应图层
tools.fitToLayers('target-layer', {
  padding: [50, 50, 50, 50],
  duration: 1000
});

// 4. 根据数据缩放
tools.fitByData(geoJsonData);

// 5. 设置可见性
tools.setLayerVisible('background-layer', false);
```
