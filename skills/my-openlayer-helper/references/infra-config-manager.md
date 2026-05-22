---
name: infra-config-manager
description: Centralized configuration, constant management, and runtime default overrides
---

# ConfigManager

`ConfigManager` provides centralized management for default configurations and constants across the map component. In 3.0, it also supports **runtime default overrides** via `setDefaults` / `resetDefaults`, so users can change global defaults without modifying source code.

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
| `DEFAULT_MASK_OPTIONS` | `object` | Default mask layer configuration | `{ fillColor: 'rgba(0, 0, 0, 0.5)', opacity: 1, visible: true, layerName: 'maskLayer', zIndex: 12 }` |

## Runtime Default Override Methods (3.0 New)

### setDefaults

Override a group of default values at runtime. All subsequent calls that use these defaults (via `ConfigManager.DEFAULT_*` getters) will see the merged result. Uses deep merge — only the keys you pass are overwritten.

```typescript
static setDefaults<K extends keyof DefaultsRegistry>(group: K, partial: Partial<DefaultsRegistry[K]>): void
```

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `group` | `string` | Default group name, e.g. `'LINE_OPTIONS'`, `'POINT_TEXT_OPTIONS'`, `'MASK_OPTIONS'` |
| `partial` | `object` | Partial override object. Unmentioned keys keep their current value. |

### getDefaults

Get a deep copy of the current defaults for a group (including any `setDefaults` overrides). Safe to read — the returned copy cannot be accidentally mutated.

```typescript
static getDefaults<K extends keyof DefaultsRegistry>(group: K): DefaultsRegistry[K]
```

### resetDefaults

Reset one or all default groups back to the built-in values.

```typescript
static resetDefaults(group?: keyof DefaultsRegistry): void
```

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `group` | `string` (optional) | If omitted, resets **all** groups. If provided, resets only that group. |

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

### Runtime Override (3.0)

```typescript
import { ConfigManager } from 'my-openlayer';

// All subsequent addLine calls use strokeWidth: 4 as default
ConfigManager.setDefaults('LINE_OPTIONS', { strokeWidth: 4 });

// All subsequent addPoint text uses 16px font
ConfigManager.setDefaults('POINT_TEXT_OPTIONS', {
  textFont: '16px Calibri,sans-serif',
  textOffsetY: 24
});

// Verify current defaults
const current = ConfigManager.getDefaults('LINE_OPTIONS');
console.log(current.strokeWidth); // 4

// Restore to built-in
ConfigManager.resetDefaults('LINE_OPTIONS');
// Or reset everything
ConfigManager.resetDefaults();
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
