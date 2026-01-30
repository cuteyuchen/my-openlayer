---
name: tool-river-layer-manager
description: Specialized management for river data display and styling
---

# RiverLayerManager Class

`RiverLayerManager` is specialized for handling level-based display and style management of river data. It supports dynamic Zoom-based display and fixed Level-based line width rendering.

## Constructor

```typescript
constructor(map: Map, eventManager?: EventManager)
```

- **Parameters**:
  - `map` (Map): OpenLayers Map instance.
  - `eventManager` (EventManager): Optional. Event manager instance, created internally if not provided.

## Interface Definitions

### RiverLayerOptions

River layer configuration options, inherits from `LineOptions`.

| Property | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| levelCount | `number` | No | `5` | Total river levels. Used for loop loading in Zoom-based display. |
| zoomOffset | `number` | No | `8` | Zoom level offset. Controls when to show which level (Zoom > Level + Offset). |
| levelWidthMap | `RiverLevelWidthMap` | No | Default map | Mapping object of river level to line width. |
| removeExisting | `boolean` | No | `false` | Whether to remove old layers created by this manager before adding. |
| layerName | `string` | No | - | Layer name, used for identification and cleanup. |
| visible | `boolean` | No | `true` | Initial visibility. |
| strokeColor | `string` | No | - | Line color. |
| strokeWidth | `number` | No | - | Base line width (if levelWidthMap is not used). |
| zIndex | `number` | No | - | Layer Z-Index. |
| projectionOptOptions | `any` | No | - | Projection options when reading GeoJSON. |

### RiverLevelWidthMap

River level to line width mapping interface.

```typescript
interface RiverLevelWidthMap {
  [level: number]: number;
}
```

Default map (`ConfigManager.DEFAULT_RIVER_LEVEL_WIDTH_MAP`) is typically `{1: 5, 2: 4, 3: 3, 4: 2, 5: 1}`.

## Methods

### Zoom-based Display

Automatically displays rivers of different levels based on map zoom level. Usually used to achieve "more detail as zoom increases" effect.

#### addRiverLayersByZoom

Add Zoom-based river layers by passing GeoJSON data directly.

```typescript
addRiverLayersByZoom(fyRiverJson: MapJSONData, options?: RiverLayerOptions): void
```

- **Parameters**:
  - `fyRiverJson`: River GeoJSON data object.
  - `options`: Configuration options.

#### addRiverLayersByZoomByUrl

Add Zoom-based river layers by loading GeoJSON data from URL.

```typescript
addRiverLayersByZoomByUrl(url: string, options?: RiverLayerOptions): void
```

#### showRiverLayer

Master switch for Zoom-based river layers.

```typescript
showRiverLayer(show: boolean): void
```

#### showRiverLayerByZoom

Manually trigger layer visibility update based on current zoom level (usually not needed, bound to `moveend` event).

```typescript
showRiverLayerByZoom(): void
```

### Level-based Width

Renders lines with different widths based on `level` property in river data, usually used for static display of river hierarchy.

#### addRiverWidthByLevel

Add level-based width rivers by passing GeoJSON data directly.

```typescript
addRiverWidthByLevel(data: MapJSONData, options?: RiverLayerOptions): VectorLayer<VectorSource>
```

- **Returns**: Created vector layer.

#### addRiverWidthByLevelByUrl

Add level-based width rivers by loading GeoJSON data from URL.

```typescript
addRiverWidthByLevelByUrl(url: string, options?: RiverLayerOptions): VectorLayer<VectorSource>
```

### Management and Cleanup

#### clearRiverLayers

Clear all Zoom-based river layers created by this manager.

```typescript
clearRiverLayers(): void
```

#### getRiverLayerVisibility

Get total display status of current Zoom-based river layers.

```typescript
getRiverLayerVisibility(): boolean
```

#### getRiverLayers

Get list of all Zoom-based river layers currently managed.

```typescript
getRiverLayers(): VectorLayer<VectorSource>[]
```

#### destroy

Destroy manager, clean up all layers and event listeners.

```typescript
destroy(): void
```

## Usage Examples

```typescript
import { MyOl, RiverLayerManager } from 'my-openlayer';

const map = new MyOl('map-container');
const riverManager = new RiverLayerManager(map.map);

// Assuming each feature in riverGeoJSON has properties.level (1-5)

// Example 1: Add Zoom-based rivers (auto show/hide based on map zoom)
// Level 1 shows at Zoom > 9 (1+8)
// Level 2 shows at Zoom > 10 (2+8)
// ...
riverManager.addRiverLayersByZoom(riverGeoJSON, {
  layerName: 'dynamic-river',
  levelCount: 5, 
  zoomOffset: 8, 
  strokeColor: '#0071FF',
  strokeWidth: 2,
  removeExisting: true
});

// Master switch
riverManager.showRiverLayer(false); // Hide all
riverManager.showRiverLayer(true);  // Restore and show based on current Zoom

// Example 2: Add static rivers, different width by level
riverManager.addRiverWidthByLevel(riverGeoJSON, {
  layerName: 'static-river',
  strokeColor: '#0071FF',
  levelWidthMap: {
    1: 6, // Level 1 width 6px
    2: 5,
    3: 4,
    4: 3,
    5: 1
  },
  zIndex: 10
});

// Clean up resources
// riverManager.destroy();
```
