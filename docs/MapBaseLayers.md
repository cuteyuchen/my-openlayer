# MapBaseLayers 底图管理类

`MapBaseLayers` 用于管理地图底图（如天地图、自定义切片）和注记图层，支持图层切换、WMS 图层加载和图层状态管理。

## 构造函数

```typescript
// 通常通过 MyOl 实例内部初始化，或者手动创建
const baseLayers = new MapBaseLayers(map: Map, options: MapLayersOptions);
```

- **map**: OpenLayers 地图实例。
- **options**: 图层配置选项。

## 接口定义

### MapLayersOptions

初始化时的图层配置。

| 属性 | 类型 | 说明 |
| :--- | :--- | :--- |
| `layers` | `Layer[]` \| `Object` | 底图配置。如果是数组，视为自定义底图；如果是对象，键为类型，值为图层数组。 |
| `token` | `string` | 天地图 Token（如果使用内置天地图逻辑） |
| `annotation` | `boolean` | 是否初始化注记图层 |
| `zIndex` | `number` | 基础层级，默认 0 |
| `mapClip` | `boolean` | 是否启用地图裁剪 |
| `mapClipData` | `MapJSONData` | 裁剪数据 |

### AnnotationLayerOptions

注记图层配置。

| 属性 | 类型 | 说明 |
| :--- | :--- | :--- |
| `type` | `string` | 注记类型：`cva_c` (矢量注记), `cia_c` (影像注记), `cta_c` (地形注记) |
| `token` | `string` | 天地图 Token |
| `zIndex` | `number` | 图层层级 |
| `visible` | `boolean` | 是否可见 |

### GeoServerLayerOptions

GeoServer WMS 图层配置。

| 属性 | 类型 | 说明 |
| :--- | :--- | :--- |
| `zIndex` | `number` | 图层层级 |
| `visible` | `boolean` | 是否可见 |
| `version` | `'1.1.1' \| '1.3.0'` | WMS 版本 |
| `serverType` | `string` | 服务器类型，如 `'geoserver'` |
| `crossOrigin` | `string` | 跨域设置，默认 `'anonymous'` |
| `params` | `Object` | 额外的 WMS 参数 |

## 方法

### 底图操作

#### switchBaseLayer

切换底图类型（如 `vec_c`, `img_c`, `ter_c`）。

```typescript
switchBaseLayer(type: string): this
```

#### getCurrentBaseLayerType

获取当前底图类型。

```typescript
getCurrentBaseLayerType(): string | null
```

#### removeLayersByType

移除指定类型的图层。

```typescript
removeLayersByType(type: string): this
```

#### clearAllLayers

清除所有底图和注记图层。

```typescript
clearAllLayers(): this
```

### 注记操作

#### addAnnotationLayer

添加注记图层。

```typescript
addAnnotationLayer(options: Omit<AnnotationLayerOptions, 'token'>): TileLayer<XYZ>
```

#### switchAnnotationLayer

切换注记类型。

```typescript
switchAnnotationLayer(annotationType: AnnotationType): this
```

#### setAnnotationVisible

设置注记图层可见性。

```typescript
setAnnotationVisible(visible: boolean): this
```

#### isAnnotationVisible

检查注记图层是否可见。

```typescript
isAnnotationVisible(): boolean
```

### 高级图层

#### addGeoServerLayer

添加 GeoServer WMS 图层。

```typescript
addGeoServerLayer(url: string, layerName: string, options?: GeoServerLayerOptions): TileLayer<TileWMS>
```

| 参数 | 类型 | 说明 |
| :--- | :--- | :--- |
| `url` | `string` | WMS 服务地址 |
| `layerName` | `string` | WMS 图层名称 |
| `options` | `GeoServerLayerOptions` | 配置项 |

#### getLayerStats

获取图层数量统计。

```typescript
getLayerStats(): { totalTypes: number; totalLayers: number; layersByType: Record<string, number> }
```

## 使用示例

### 切换天地图底图

```typescript
const baseLayers = map.getMapBaseLayers();

// 切换到影像底图 (img_c)
baseLayers.switchBaseLayer('img_c');

// 切换回矢量底图 (vec_c)
baseLayers.switchBaseLayer('vec_c');
```

### 管理注记图层

```typescript
// 隐藏注记
baseLayers.setAnnotationVisible(false);

// 切换为影像注记 (cia_c)
baseLayers.switchAnnotationLayer('cia_c');

// 显示注记
baseLayers.setAnnotationVisible(true);
```

### 加载 GeoServer WMS 图层

```typescript
// 添加一个 WMS 图层
const wmsLayer = baseLayers.addGeoServerLayer(
  'http://localhost:8080/geoserver/wms',
  'myworkspace:mylayer',
  {
    visible: true,
    zIndex: 10,
    params: {
      'CQL_FILTER': "status = 'active'" // 可选：传递自定义参数
    }
  }
);
```

### 图层统计

```typescript
const stats = baseLayers.getLayerStats();
console.log(`总图层数: ${stats.totalLayers}`);
console.log('各类型图层数:', stats.layersByType);
```
