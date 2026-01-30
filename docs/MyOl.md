# MyOl 类

`MyOl` 是地图的核心类，作为整个库的入口点，负责地图的初始化、配置管理、模块加载以及基础的地图操作（如定位、重置）。它采用了模块化设计，按需加载各个功能模块（如点、线、面要素管理）。

## 导入

```typescript
import { MyOl } from 'my-openlayer';
// 或者
import MyOl from 'my-openlayer';
```

## 构造函数

```typescript
constructor(id: string | HTMLElement, options?: Partial<MapInitType>)
```

初始化一个新的地图实例。

### 参数说明

| 参数名 | 类型 | 必填 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `string` \| `HTMLElement` | 是 | - | 地图容器的 DOM ID 字符串或 HTMLElement 对象。 |
| `options` | `Partial<MapInitType>` | 否 | `{}` | 地图初始化配置选项，详见下表。 |

### MapInitType 配置选项

| 属性名 | 类型 | 描述 |
| :--- | :--- | :--- |
| `center` | `number[]` | 地图初始中心点坐标 `[经度, 纬度]`，默认为 `[0, 0]`。 |
| `zoom` | `number` | 地图初始缩放级别，默认为 `2`。 |
| `minZoom` | `number` | 最小缩放级别。 |
| `maxZoom` | `number` | 最大缩放级别。 |
| `token` | `string` | 天地图 API Token，用于加载天地图底图。 |
| `annotation` | `boolean` | 是否显示注记图层（如地名标注），默认为 `false`。 |
| `layers` | `LayerItem[]` | 自定义初始图层数组。如果设置了此项，内置底图管理可能受到影响。 |
| `mapClipData` | `MapJSONData` | 地图裁剪数据（GeoJSON 格式），用于仅显示特定区域。 |
| `enableLog` | `boolean` | 是否启用内部日志输出，默认为 `false`。 |
| `logLevel` | `'debug' \| 'info' \| 'warn' \| 'error'` | 日志级别，默认为 `'error'`。 |
| `projection` | `object` | 自定义投影坐标系配置。 |
| `projection.code` | `string` | 投影代码，如 `'EPSG:4549'`。 |
| `projection.def` | `string` | proj4 定义字符串。 |
| `projection.extent` | `number[]` | 投影范围。 |

## 静态方法

### createView

创建 OpenLayers 的 `View` 实例。

```typescript
static createView(options: MapInitType): View
```

| 参数名 | 类型 | 描述 |
| :--- | :--- | :--- |
| `options` | `MapInitType` | 地图配置选项，主要使用其中的 `center`, `zoom`, `projection` 等属性。 |

## 实例方法

### 模块获取

`MyOl` 提供了懒加载的模块获取方法，只有在首次调用时才会初始化对应模块。

#### getPoint

获取点要素操作模块。

```typescript
getPoint(): Point
```

**返回值**: `Point` 实例，用于添加、删除、管理点要素。

#### getLine

获取线要素操作模块。

```typescript
getLine(): Line
```

**返回值**: `Line` 实例，用于绘制线条。

#### getPolygon

获取面要素操作模块。

```typescript
getPolygon(): Polygon
```

**返回值**: `Polygon` 实例，用于绘制多边形。

#### getMapBaseLayers

获取底图管理模块。

```typescript
getMapBaseLayers(): MapBaseLayers
```

**返回值**: `MapBaseLayers` 实例，用于切换底图类型（矢量、影像、地形）。

#### getTools

获取地图工具模块。

```typescript
getTools(): MapTools
```

**返回值**: `MapTools` 实例，包含地图截图、裁剪等工具。

#### getSelectHandler

获取要素选择处理器模块。

```typescript
getSelectHandler(): SelectHandler
```

**返回值**: `SelectHandler` 实例，用于处理地图要素的点击、悬停选择交互。

### 地图操作

#### locationAction

定位到指定坐标，支持动画过渡。

```typescript
locationAction(longitude: number, latitude: number, zoom: number = 20, duration: number = 3000): void
```

| 参数名 | 类型 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| `longitude` | `number` | - | 目标经度。 |
| `latitude` | `number` | - | 目标纬度。 |
| `zoom` | `number` | `20` | 目标缩放级别。 |
| `duration` | `number` | `3000` | 动画持续时间（毫秒）。 |

#### resetPosition

重置地图位置到初始化时设置的中心点。

```typescript
resetPosition(duration: number = 3000): void
```

| 参数名 | 类型 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| `duration` | `number` | `3000` | 动画持续时间（毫秒）。 |

### 管理器访问

#### getEventManager

获取事件管理器，用于监听地图事件。

```typescript
getEventManager(): EventManager
```

#### getErrorHandler

获取错误处理器，用于自定义错误处理逻辑。

```typescript
getErrorHandler(): ErrorHandler
```

#### getConfigManager

获取配置管理器。

```typescript
getConfigManager(): ConfigManager
```

#### getMapOptions

获取当前地图的只读配置副本。

```typescript
getMapOptions(): Readonly<MapInitType>
```

### 销毁

#### destroy

销毁地图实例，清理所有事件监听和资源。

```typescript
destroy(): void
```

## 使用示例

### 完整初始化

```typescript
import { MyOl } from 'my-openlayer';

// 定义配置
const options = {
  // 杭州市中心
  center: [120.15507, 30.274085],
  zoom: 12,
  minZoom: 5,
  maxZoom: 18,
  
  // 天地图 Token
  token: 'YOUR_TIANDITU_TOKEN',
  
  // 开启注记
  annotation: true,
  
  // 开启调试日志
  enableLog: true,
  logLevel: 'debug'
};

// 初始化地图
const map = new MyOl('map-container', options);

// 监听加载完成
map.getEventManager().on('rendercomplete', () => {
  console.log('Map loaded!');
});
```

### 使用自定义投影

```typescript
import { MyOl } from 'my-openlayer';

const map = new MyOl('map', {
  projection: {
    code: 'EPSG:4549', // CGCS2000 3度带
    def: '+proj=tmerc +lat_0=0 +lon_0=120 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs',
    extent: [...] // 可选
  }
});
```
