# EventManager 事件管理类

`EventManager` 提供统一的地图事件监听和管理功能，支持事件过滤、一次性监听和自动计数。

## 方法

- **on(type: MapEventType, callback: EventCallback, options?: { once?: boolean; filter?: (event: MapEventData) => boolean })**: 注册事件监听器。
  - 支持的事件类型: `click`, `dblclick`, `hover`, `moveend`, `zoomend`, `pointermove`, `rendercomplete`, `error`。
- **off(id: string)**: 根据 ID 移除事件监听器。
- **offAll(type: MapEventType)**: 移除指定类型的所有监听器。
- **clear()**: 清除所有事件监听器。
- **getListenerCount(type: MapEventType)**: 获取指定类型的监听器数量。

## 类型定义

### MapEventData
包含事件的详细信息：
- `type`: 事件类型。
- `coordinate`: 地理坐标。
- `pixel`: 屏幕像素坐标。
- `feature`: 触发事件的要素（如有）。
- `features`: 触发事件的所有要素列表。
- `zoom`: 当前缩放级别。

## 使用示例

```typescript
const eventManager = map.getEventManager();

// 1. 监听点击事件
const clickListenerId = eventManager.on('click', (event) => {
  console.log('点击坐标:', event.coordinate);
  if (event.feature) {
    console.log('点击到的要素:', event.feature.getProperties());
  }
});

// 2. 监听一次性事件
eventManager.on('rendercomplete', () => {
  console.log('地图渲染完成');
}, { once: true });

// 3. 带过滤器的监听
eventManager.on('click', (event) => {
  console.log('点击了特定图层的要素');
}, {
  filter: (e) => e.feature && e.feature.get('layerName') === 'target-layer'
});

// 4. 移除监听
eventManager.off(clickListenerId);
```
