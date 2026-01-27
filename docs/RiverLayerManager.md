# RiverLayerManager 河流图层管理类

`RiverLayerManager` 专门用于处理河流数据的分级显示和样式管理。

## 方法

### 分级显示 (Zoom-based)

根据地图缩放级别自动显示不同等级的河流。

- **addRiverLayersByZoom(fyRiverJson: MapJSONData, options?: RiverLayerOptions)**: 添加分级河流图层。
  - `options.levelCount`: 河流等级总数。
  - `options.zoomOffset`: 缩放级别偏移量，控制何时显示哪一级。
- **addRiverLayersByZoomByUrl(url: string, options?)**: 从 URL 加载分级河流。
- **showRiverLayer(show: boolean)**: 控制分级河流图层的总开关。

### 宽度分级 (Level-based Width)

根据河流等级属性渲染不同宽度的线条。

- **addRiverWidthByLevel(data: MapJSONData, options?)**: 添加按等级设定宽度的河流。
- **addRiverWidthByLevelByUrl(url: string, options?)**: 从 URL 加载。

### 管理

- **clearRiverLayers()**: 清除所有由该管理器创建的河流图层。
- **getRiverLayerVisibility()**: 获取当前可见性状态。

## 使用示例

```typescript
// 需要单独实例化，或扩展 MyOl
import { RiverLayerManager } from 'my-openlayer';

const riverManager = new RiverLayerManager(map.map);

// 1. 添加分级河流（随缩放显示更多细节）
riverManager.addRiverLayersByZoom(riverGeoJSON, {
  layerName: 'main-river',
  levelCount: 5, // 数据中包含 level 1-5
  zoomOffset: 8, // level 1 在 zoom > 9 (1+8) 显示
  strokeColor: '#0071FF',
  strokeWidth: 2
});

// 2. 控制显隐
riverManager.showRiverLayer(true);

// 3. 添加按等级设定宽度的河流（静态显示）
riverManager.addRiverWidthByLevel(riverGeoJSON, {
  layerName: 'width-river',
  strokeColor: '#0071FF',
  levelWidthMap: {
    1: 5, // 1级河流宽5px
    2: 3,
    3: 1
  }
});
```
