---
name: infra-config-manager
description: Centralized configuration and constant management
---

# ConfigManager

`ConfigManager` provides centralized management for default configurations and constants across the map component. It ensures consistency in default values throughout the application.

## Import

```typescript
import { ConfigManager } from 'my-openlayer';
```

## Static Properties

### Point Options

| Property | Type | Description | Default Value |
| :--- | :--- | :--- | :--- |
| `DEFAULT_POINT_OPTIONS` | `object` | Default point base configuration | `{ visible: true, zIndex: 21 }` |
| `DEFAULT_POINT_TEXT_OPTIONS` | `object` | Default point text configuration | `{ textFont: '12px Calibri,sans-serif', textFillColor: '#FFF', textStrokeColor: '#000', textStrokeWidth: 3, textOffsetY: 20 }` |
| `DEFAULT_POINT_ICON_SCALE` | `number` | Default icon scale | `1` |
| `DEFAULT_CLUSTER_OPTIONS` | `object` | Default cluster configuration | `{ distance: 40, minDistance: 0, zIndex: 21 }` |
| `DEFAULT_DOM_POINT_OVERLAY_OPTIONS` | `object` | Default DOM point overlay configuration | `{ positioning: 'center-center', stopEvent: false }` |

### Line Options

| Property | Type | Description | Default Value |
| :--- | :--- | :--- | :--- |
| `DEFAULT_LINE_OPTIONS` | `object` | Default line style configuration | `{ type: 'line', strokeColor: 'rgba(3, 122, 255, 1)', strokeWidth: 2, visible: true, layerName: 'lineLayer', zIndex: 15 }` |

### Polygon Options

| Property | Type | Description | Default Value |
| :--- | :--- | :--- | :--- |
| `DEFAULT_POLYGON_OPTIONS` | `object` | Default polygon style configuration | `{ zIndex: 11, visible: true, textFont: '14px Calibri,sans-serif', textFillColor: '#FFF', textStrokeColor: '#409EFF', textStrokeWidth: 2 }` |
| `DEFAULT_POLYGON_COLOR_MAP` | `object` | Default polygon color map (for graduated rendering) | `{ '0': 'rgba(255, 0, 0, 0.6)', '1': 'rgba(245, 154, 35, 0.6)', ... }` |

## Usage Examples

### Get Default Configuration

```typescript
import { ConfigManager } from 'my-openlayer';

// Get default point options
const pointOptions = {
  ...ConfigManager.DEFAULT_POINT_OPTIONS,
  ...ConfigManager.DEFAULT_POINT_TEXT_OPTIONS
};

// Get default line options
const lineOptions = ConfigManager.DEFAULT_LINE_OPTIONS;
```

### Use in Custom Component

```typescript
import { ConfigManager } from 'my-openlayer';

class MyComponent {
  private options: any;

  constructor(options: any) {
    // Merge user options with default options
    this.options = {
      ...ConfigManager.DEFAULT_POINT_OPTIONS,
      ...options
    };
  }
}
```
