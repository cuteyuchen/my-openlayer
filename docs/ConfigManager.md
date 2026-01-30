# ConfigManager 配置管理

`ConfigManager` 类用于统一管理地图组件的默认配置和常量。它提供了一系列静态只读属性，确保整个应用中使用一致的配置默认值。

## 导入

```typescript
import { ConfigManager } from 'my-openlayer';
```

## 静态属性

`ConfigManager` 包含以下类别的默认配置：

### 点位配置 (Point Options)

| 属性名 | 类型 | 描述 | 默认值 |
| :--- | :--- | :--- | :--- |
| `DEFAULT_POINT_OPTIONS` | `object` | 默认点位基础配置 | `{ visible: true, zIndex: 21 }` |
| `DEFAULT_POINT_TEXT_OPTIONS` | `object` | 默认点位文本配置 | `{ textFont: '12px Calibri,sans-serif', textFillColor: '#FFF', textStrokeColor: '#000', textStrokeWidth: 3, textOffsetY: 20 }` |
| `DEFAULT_POINT_ICON_SCALE` | `number` | 默认图标缩放比例 | `1` |
| `DEFAULT_CLUSTER_OPTIONS` | `object` | 默认聚合配置 | `{ distance: 40, minDistance: 0, zIndex: 21 }` |
| `DEFAULT_DOM_POINT_OVERLAY_OPTIONS` | `object` | 默认 DOM 点覆盖物配置 | `{ positioning: 'center-center', stopEvent: false }` |

### 线配置 (Line Options)

| 属性名 | 类型 | 描述 | 默认值 |
| :--- | :--- | :--- | :--- |
| `DEFAULT_LINE_OPTIONS` | `object` | 默认线样式配置 | `{ type: 'line', strokeColor: 'rgba(3, 122, 255, 1)', strokeWidth: 2, visible: true, layerName: 'lineLayer', zIndex: 15 }` |

### 面配置 (Polygon Options)

| 属性名 | 类型 | 描述 | 默认值 |
| :--- | :--- | :--- | :--- |
| `DEFAULT_POLYGON_OPTIONS` | `object` | 默认面样式配置 | `{ zIndex: 11, visible: true, textFont: '14px Calibri,sans-serif', textFillColor: '#FFF', textStrokeColor: '#409EFF', textStrokeWidth: 2 }` |
| `DEFAULT_POLYGON_COLOR_MAP` | `object` | 默认面颜色映射 (用于分级渲染) | `{ '0': 'rgba(255, 0, 0, 0.6)', '1': 'rgba(245, 154, 35, 0.6)', ... }` |

## 使用示例

### 获取默认配置

```typescript
import { ConfigManager } from 'my-openlayer';

// 获取默认点位配置
const pointOptions = {
  ...ConfigManager.DEFAULT_POINT_OPTIONS,
  ...ConfigManager.DEFAULT_POINT_TEXT_OPTIONS
};

// 获取默认线配置
const lineOptions = ConfigManager.DEFAULT_LINE_OPTIONS;
```

### 在自定义组件中使用

```typescript
import { ConfigManager } from 'my-openlayer';

class MyComponent {
  private options: any;

  constructor(options: any) {
    // 合并用户配置和默认配置
    this.options = {
      ...ConfigManager.DEFAULT_POINT_OPTIONS,
      ...options
    };
  }
}
```
