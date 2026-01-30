# MapTools 地图工具类

`MapTools` 提供通用的地图操作工具，包括图层查找、移除、显隐控制、地图裁剪和视图自适应等功能。

## 构造函数

```typescript
const tools = new MapTools(map: Map);
```

- **map**: OpenLayers 地图实例。

## 方法

### 图层管理

#### getLayerByLayerName

根据名称获取图层对象（支持模糊匹配）。

```typescript
getLayerByLayerName(layerName: string | string[]): Layer[]
```

| 参数 | 类型 | 说明 |
| :--- | :--- | :--- |
| `layerName` | `string` \| `string[]` | 图层名称或名称数组 |

#### removeLayer

移除指定名称的图层。

```typescript
removeLayer(layerName: string | string[]): void
```

#### setLayerVisible

设置图层可见性。

```typescript
setLayerVisible(layerName: string, visible: boolean): void
```

### 视图操作

#### locationAction

视图定位动画。

```typescript
locationAction(lgtd: number, lttd: number, zoom = 20, duration = 3000): boolean
```

| 参数 | 类型 | 说明 |
| :--- | :--- | :--- |
| `lgtd` | `number` | 目标经度 |
| `lttd` | `number` | 目标纬度 |
| `zoom` | `number` | 目标缩放层级 |
| `duration` | `number` | 动画持续时间（毫秒） |

#### fitToLayers

缩放地图以适应指定图层的范围。

```typescript
fitToLayers(
  layerNameOrLayers: string | string[] | Layer[], 
  fitOptions?: {
    padding?: [number, number, number, number];
    maxZoom?: number;
    duration?: number;
  }
): boolean
```

| 参数 | 类型 | 说明 |
| :--- | :--- | :--- |
| `layerNameOrLayers` | `string` \| `Layer[]` | 图层名称或图层对象数组 |
| `fitOptions` | `Object` | 缩放配置：padding (边距), maxZoom, duration |

#### fitByData

缩放地图以适应 GeoJSON 数据的范围。

```typescript
fitByData(
  jsonData: MapJSONData, 
  fitOptions?: {
    padding?: [number, number, number, number];
    maxZoom?: number;
    duration?: number;
  }
): boolean
```

### 高级功能

#### setMapClip

设置地图裁剪区域（基于 Canvas 的裁剪）。

```typescript
static setMapClip(baseLayer: Layer, data: MapJSONData): Layer
```

| 参数 | 类型 | 说明 |
| :--- | :--- | :--- |
| `baseLayer` | `Layer` | 需要被裁剪的图层 |
| `data` | `MapJSONData` | 定义裁剪形状的 GeoJSON 数据 |

## 使用示例

### 图层查找与控制

```typescript
const tools = map.getTools();

// 1. 获取图层
const layers = tools.getLayerByLayerName('my-layer');
if (layers.length > 0) {
  console.log('找到图层:', layers[0]);
}

// 2. 移除图层
tools.removeLayer('temp-layer');

// 3. 设置可见性
tools.setLayerVisible('background-layer', false);
```

### 视图定位与缩放

```typescript
// 定位到指定坐标
tools.locationAction(120.123, 30.456, 15, 2000);

// 缩放以包含指定图层的所有要素
tools.fitToLayers('target-layer', {
  padding: [50, 50, 50, 50], // 上右下左边距
  duration: 1000
});

// 缩放以包含 GeoJSON 数据范围
tools.fitByData(geoJsonData, {
  maxZoom: 18
});
```

### 地图裁剪

```typescript
// 创建底图图层
const baseLayer = new TileLayer({ ... });

// 定义裁剪区域（例如一个多边形）
const clipPolygon = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[...]]
    }
  }]
};

// 应用裁剪
// 注意：这会修改 baseLayer 的渲染行为，使其只在 clipPolygon 范围内显示
MapTools.setMapClip(baseLayer, clipPolygon);
map.addLayer(baseLayer);
```
