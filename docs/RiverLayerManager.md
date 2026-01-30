# RiverLayerManager 河流图层管理类

`RiverLayerManager` 专门用于处理河流数据的分级显示和样式管理。它支持基于地图缩放级别（Zoom-based）的动态分级显示，以及基于河流属性等级（Level-based）的固定线宽渲染。

## 构造函数

```typescript
constructor(map: Map, eventManager?: EventManager)
```

- **参数**:
  - `map` (Map): OpenLayers 地图实例。
  - `eventManager` (EventManager): 可选。事件管理器实例，如果未提供则内部创建。

## 接口定义

### RiverLayerOptions

河流图层配置选项，继承自 `LineOptions`。

| 属性 | 类型 | 必填 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| levelCount | `number` | 否 | `5` | 河流等级总数。用于分级显示循环加载。 |
| zoomOffset | `number` | 否 | `8` | 缩放级别偏移量。控制何时显示哪一级河流 (Zoom > Level + Offset)。 |
| levelWidthMap | `RiverLevelWidthMap` | 否 | 默认映射 | 河流级别与线宽的映射对象。 |
| removeExisting | `boolean` | 否 | `false` | 添加前是否删除由本管理器创建的旧图层。 |
| layerName | `string` | 否 | - | 图层名称，用于标识和清理。 |
| visible | `boolean` | 否 | `true` | 初始可见性。 |
| strokeColor | `string` | 否 | - | 线条颜色。 |
| strokeWidth | `number` | 否 | - | 基础线宽（如果未使用 levelWidthMap）。 |
| zIndex | `number` | 否 | - | 图层 Z-Index。 |
| projectionOptOptions | `any` | 否 | - | GeoJSON 读取时的投影选项。 |

### RiverLevelWidthMap

河流级别线宽映射接口。

```typescript
interface RiverLevelWidthMap {
  [level: number]: number;
}
```

默认映射 (`ConfigManager.DEFAULT_RIVER_LEVEL_WIDTH_MAP`) 通常为 `{1: 5, 2: 4, 3: 3, 4: 2, 5: 1}` 等类似结构。

## 方法

### 分级显示 (Zoom-based)

根据地图缩放级别自动显示不同等级的河流。通常用于实现“缩放越大约详细”的效果。

#### addRiverLayersByZoom

直接传递 GeoJSON 数据添加分级河流图层。

```typescript
addRiverLayersByZoom(fyRiverJson: MapJSONData, options?: RiverLayerOptions): void
```

- **参数**:
  - `fyRiverJson`: 河流 GeoJSON 数据对象。
  - `options`: 配置选项。

#### addRiverLayersByZoomByUrl

通过 URL 加载 GeoJSON 数据并添加分级河流图层。

```typescript
addRiverLayersByZoomByUrl(url: string, options?: RiverLayerOptions): void
```

#### showRiverLayer

控制分级河流图层的总开关。

```typescript
showRiverLayer(show: boolean): void
```

#### showRiverLayerByZoom

手动触发根据当前缩放级别更新图层可见性（通常不需要手动调用，已绑定 `moveend` 事件）。

```typescript
showRiverLayerByZoom(): void
```

### 宽度分级 (Level-based Width)

根据河流数据中的 `level` 属性渲染不同宽度的线条，通常用于静态展示不同等级河流的粗细差异。

#### addRiverWidthByLevel

直接传递 GeoJSON 数据添加按等级设定宽度的河流。

```typescript
addRiverWidthByLevel(data: MapJSONData, options?: RiverLayerOptions): VectorLayer<VectorSource>
```

- **返回值**: 创建的矢量图层。

#### addRiverWidthByLevelByUrl

通过 URL 加载 GeoJSON 数据并添加按等级设定宽度的河流。

```typescript
addRiverWidthByLevelByUrl(url: string, options?: RiverLayerOptions): VectorLayer<VectorSource>
```

### 管理与清理

#### clearRiverLayers

清除所有由该管理器创建的分级河流图层。

```typescript
clearRiverLayers(): void
```

#### getRiverLayerVisibility

获取当前分级河流图层的总显示状态。

```typescript
getRiverLayerVisibility(): boolean
```

#### getRiverLayers

获取当前管理的所有分级河流图层列表。

```typescript
getRiverLayers(): VectorLayer<VectorSource>[]
```

#### destroy

销毁管理器，清理所有图层和事件监听。

```typescript
destroy(): void
```

## 使用示例

```typescript
import { MyOl, RiverLayerManager } from 'my-openlayer';

const map = new MyOl('map-container');
const riverManager = new RiverLayerManager(map.map);

// 假设 riverGeoJSON 数据中每个 feature 都有 properties.level (1-5)

// 示例 1: 添加分级河流（随地图缩放自动显隐不同级别的河流）
// Level 1 在 Zoom > 9 (1+8) 显示
// Level 2 在 Zoom > 10 (2+8) 显示
// ...
riverManager.addRiverLayersByZoom(riverGeoJSON, {
  layerName: 'dynamic-river',
  levelCount: 5, 
  zoomOffset: 8, 
  strokeColor: '#0071FF',
  strokeWidth: 2,
  removeExisting: true
});

// 控制分级河流的总开关
riverManager.showRiverLayer(false); // 全部隐藏
riverManager.showRiverLayer(true);  // 恢复并根据当前 Zoom 显示对应级别

// 示例 2: 添加静态河流，根据等级显示不同粗细
riverManager.addRiverWidthByLevel(riverGeoJSON, {
  layerName: 'static-river',
  strokeColor: '#0071FF',
  levelWidthMap: {
    1: 6, // 1级河流宽 6px
    2: 5,
    3: 4,
    4: 3,
    5: 1
  },
  zIndex: 10
});

// 清理资源
// riverManager.destroy();
```
