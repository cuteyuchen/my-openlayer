# EventManager 事件管理

`EventManager` 类用于统一管理地图事件，提供简单的 API 来监听、移除和触发地图事件。它对 OpenLayers 的原生事件系统进行了封装，提供了类型安全的事件处理。

## 导入

```typescript
import { EventManager, MapEventData } from 'my-openlayer';
```

## 接口定义

### MapEventData 接口

统一的事件数据结构，回调函数会接收此类型的参数。

| 属性名 | 类型 | 描述 |
| :--- | :--- | :--- |
| `type` | `MapEventType` | 事件类型 |
| `originalEvent` | `Event` | 原始 DOM 事件对象 (可选) |
| `coordinate` | `number[]` | 发生事件的地理坐标 (可选) |
| `pixel` | `Pixel` | 发生事件的屏幕像素坐标 (可选) |
| `features` | `FeatureLike[]` | 事件位置处的要素列表 (可选) |
| `feature` | `FeatureLike` | 事件位置处的第一个要素 (可选) |
| `zoom` | `number` | 当前地图缩放级别 (可选) |
| `[key: string]` | `any` | 其他自定义属性 |

### MapEventType 类型

支持的事件类型字符串：
`'click'` | `'dblclick'` | `'hover'` | `'moveend'` | `'zoomend'` | `'pointermove'` | `'rendercomplete'` | `'error'`

## 构造函数

```typescript
constructor(map: Map)
```

| 参数名 | 类型 | 描述 |
| :--- | :--- | :--- |
| `map` | `Map` | OpenLayers 地图实例 |

## 方法

### 监听事件

```typescript
on(type: MapEventType, callback: EventCallback, options?: { once?: boolean; filter?: (event: MapEventData) => boolean; }): string
```

注册事件监听器。

| 参数名 | 类型 | 描述 |
| :--- | :--- | :--- |
| `type` | `MapEventType` | 事件类型 |
| `callback` | `EventCallback` | 事件回调函数 |
| `options` | `object` | 监听选项 (可选) |
| `options.once` | `boolean` | 是否只触发一次 |
| `options.filter` | `function` | 事件过滤器，返回 false 则不触发回调 |

**返回值**: `string` - 监听器 ID，用于取消监听。

### 移除监听

```typescript
off(id: string): boolean
```

根据监听器 ID 移除事件监听。

| 参数名 | 类型 | 描述 |
| :--- | :--- | :--- |
| `id` | `string` | 监听器 ID |

**返回值**: `boolean` - 是否成功移除。

### 移除所有监听

```typescript
clear(): void
```

移除所有已注册的事件监听器。

## 使用示例

### 基础事件监听

```typescript
import { MyOl } from 'my-openlayer';

const myOl = new MyOl('map-container');
const eventManager = myOl.getEventManager();

// 监听点击事件
const clickId = eventManager.on('click', (event) => {
  console.log('Clicked at:', event.coordinate);
  
  if (event.feature) {
    console.log('Clicked feature:', event.feature);
  }
});

// 监听缩放结束
eventManager.on('zoomend', (event) => {
  console.log('Current zoom:', event.zoom);
});
```

### 一次性监听

```typescript
// 只监听一次点击
eventManager.on('click', (event) => {
  console.log('First click only');
}, { once: true });
```

### 带过滤条件的监听

```typescript
// 只监听包含特定属性要素的点击
eventManager.on('click', (event) => {
  console.log('Clicked special feature');
}, {
  filter: (event) => {
    if (!event.feature) return false;
    const props = event.feature.getProperties();
    return props.type === 'special';
  }
});
```

### 移除监听

```typescript
// 停止监听
eventManager.off(clickId);

// 或清除所有
eventManager.clear();
```
