# MeasureHandler 类

`MeasureHandler` 类提供地图上的距离和面积测量功能。

## 构造函数

```typescript
constructor(map: Map)
```

- **map**: OpenLayers 地图实例。

## 类型定义

### MeasureHandlerType

```typescript
type MeasureHandlerType = 'LineString' | 'Polygon';
```

## 方法

### start

开始测量。

```typescript
start(type: MeasureHandlerType): void
```

- **type**: 测量类型，`'LineString'` (测距) 或 `'Polygon'` (测面)。
- **说明**: 调用此方法后，鼠标在地图上点击开始绘制，双击结束绘制。绘制过程中会显示测量结果的 tooltip。

### end

结束测量绘制交互，但保留测量结果。

```typescript
end(): void
```

### clean

清除所有测量结果和交互。

```typescript
clean(): void
```

- **说明**: 移除地图上的所有测量绘制、结果标签和 tooltip。

### destroy

销毁实例。

```typescript
destory(): void
```

- **说明**: 彻底清理资源，同 `clean`。

## 使用示例

### 测距

```typescript
import { MeasureHandler } from 'my-openlayers';

const measureTool = new MeasureHandler(map);

// 开始测距
measureTool.start('LineString');
```

### 测面

```typescript
// 开始测面
measureTool.start('Polygon');
```

### 清除测量

```typescript
// 清除所有测量结果
measureTool.clean();
```
