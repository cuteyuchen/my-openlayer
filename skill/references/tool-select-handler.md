---
name: tool-select-handler
description: Feature selection interactions (click, hover, box selection)
---

# SelectHandler Class

The `SelectHandler` class handles feature selection interactions on the map, supporting click, hover, Ctrl+click modes, and programmatic selection.

## Constructor

```typescript
constructor(map: Map)
```

- **map**: OpenLayers Map instance.

## Interface Definitions

### SelectOptions

| Property | Type | Description |
| :--- | :--- | :--- |
| multi | `boolean` | Whether to support multi-selection, default `false` |
| layerFilter | `string[]` | Layer filter, list of selectable layer names |
| featureFilter | `(feature: FeatureLike) => boolean` | Feature filter function |
| hitTolerance | `number` | Click tolerance (pixels), default 0 |
| selectStyle | `Style \| Style[] \| ((feature: FeatureLike) => Style \| Style[])` | Style for selected features |
| onSelect | `(event: SelectCallbackEvent) => void` | Callback when feature is selected |
| onDeselect | `(event: SelectCallbackEvent) => void` | Callback when feature is deselected |

### ProgrammaticSelectOptions

| Property | Type | Description |
| :--- | :--- | :--- |
| layerName | `string` | Layer name, specifies in which layer to select features |
| selectStyle | `Style \| Style[] \| ((feature: FeatureLike) => Style \| Style[])` | Custom selection style (only for this selection) |
| fitView | `boolean` | Whether to zoom to selected feature, default `false` |
| fitDuration | `number` | Zoom animation duration (ms), default 500 |
| fitPadding | `number` | Zoom padding (pixels), default 100 |

### SelectMode

```typescript
type SelectMode = 'click' | 'hover' | 'ctrl';
```

## Methods

### enableSelect

Enable feature selection.

```typescript
enableSelect(mode: SelectMode = 'click', options?: SelectOptions): this
```

- **mode**: Selection mode.
- **options**: Configuration options.
- **Returns**: `SelectHandler` instance, supports chaining.

### disableSelect

Disable feature selection.

```typescript
disableSelect(): this
```

- **Returns**: `SelectHandler` instance.

### clearSelection

Clear all selections (both interactive and programmatic).

```typescript
clearSelection(): this
```

- **Returns**: `SelectHandler` instance.

### selectByIds

Programmatically select features by ID.

```typescript
selectByIds(featureIds: string[], options?: ProgrammaticSelectOptions): this
```

- **featureIds**: Array of feature IDs.
- **options**: Programmatic selection options.
- **Returns**: `SelectHandler` instance.

### selectByProperty

Programmatically select features by property.

```typescript
selectByProperty(propertyName: string, propertyValue: any, options?: ProgrammaticSelectOptions): this
```

- **propertyName**: Property name.
- **propertyValue**: Property value.
- **options**: Programmatic selection options.
- **Returns**: `SelectHandler` instance.

## Usage Examples

### Enable Click Selection

```typescript
import { SelectHandler } from 'my-openlayers';

const selectHandler = new SelectHandler(map);

// Enable click selection, only for 'cities' layer
selectHandler.enableSelect('click', {
  layerFilter: ['cities'],
  onSelect: (event) => {
    console.log('Selected:', event.selected);
  },
  onDeselect: (event) => {
    console.log('Deselected:', event.deselected);
  }
});
```

### Enable Hover Highlight

```typescript
selectHandler.enableSelect('hover', {
  selectStyle: new Style({
    stroke: new Stroke({ color: 'yellow', width: 4 })
  })
});
```

### Programmatic Selection and Zoom

```typescript
// Select feature with ID 'beijing' and auto-zoom
selectHandler.selectByIds(['beijing'], {
  fitView: true,
  fitPadding: 50
});
```

### Clear Selection

```typescript
selectHandler.clearSelection();
```
