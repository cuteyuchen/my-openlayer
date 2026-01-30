---
name: tool-map-tools
description: Common map operation tools including layer finding, removal, and view adaptation
---

# MapTools Class

`MapTools` provides common map operation tools, including layer finding, removal, visibility control, map clipping, and view adaptation.

## Constructor

```typescript
const tools = new MapTools(map: Map);
```

- **map**: OpenLayers Map instance.

## Methods

### Layer Management

#### getLayerByLayerName

Get layer objects by name (supports fuzzy matching).

```typescript
getLayerByLayerName(layerName: string | string[]): Layer[]
```

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `layerName` | `string` \| `string[]` | Layer name or array of names |

#### removeLayer

Remove layer(s) by name.

```typescript
removeLayer(layerName: string | string[]): void
```

#### setLayerVisible

Set layer visibility.

```typescript
setLayerVisible(layerName: string, visible: boolean): void
```

### View Operations

#### locationAction

View positioning animation.

```typescript
locationAction(lgtd: number, lttd: number, zoom = 20, duration = 3000): boolean
```

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `lgtd` | `number` | Target longitude |
| `lttd` | `number` | Target latitude |
| `zoom` | `number` | Target zoom level |
| `duration` | `number` | Animation duration (ms) |

#### fitToLayers

Zoom map to fit extent of specified layers.

```typescript
fitToLayers(
  layerNameOrLayers: string | string[] | Layer[], 
  fitOptions?: {
    padding?: [number, number, number, number];
    maxZoom?: number;
    duration?: number;
  }
): boolean
```

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `layerNameOrLayers` | `string` \| `Layer[]` | Layer name(s) or layer object(s) |
| `fitOptions` | `Object` | Zoom config: padding, maxZoom, duration |

#### fitByData

Zoom map to fit extent of GeoJSON data.

```typescript
fitByData(
  jsonData: MapJSONData, 
  fitOptions?: {
    padding?: [number, number, number, number];
    maxZoom?: number;
    duration?: number;
  }
): boolean
```

### Advanced Features

#### setMapClip

Set map clipping area (Canvas-based clipping).

```typescript
static setMapClip(baseLayer: Layer, data: MapJSONData): Layer
```

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `baseLayer` | `Layer` | Layer to be clipped |
| `data` | `MapJSONData` | GeoJSON data defining clip shape |

## Usage Examples

### Layer Lookup and Control

```typescript
const tools = map.getTools();

// 1. Get layer
const layers = tools.getLayerByLayerName('my-layer');
if (layers.length > 0) {
  console.log('Layer found:', layers[0]);
}

// 2. Remove layer
tools.removeLayer('temp-layer');

// 3. Set visibility
tools.setLayerVisible('background-layer', false);
```

### View Positioning and Zooming

```typescript
// Position to specific coordinates
tools.locationAction(120.123, 30.456, 15, 2000);

// Zoom to include all features in specified layer
tools.fitToLayers('target-layer', {
  padding: [50, 50, 50, 50], // Top Right Bottom Left padding
  duration: 1000
});

// Zoom to include GeoJSON data extent
tools.fitByData(geoJsonData, {
  maxZoom: 18
});
```

### Map Clipping

```typescript
// Create base layer
const baseLayer = new TileLayer({ ... });

// Define clip area (e.g., a polygon)
const clipPolygon = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[...]]
    }
  }]
};

// Apply clip
// Note: This modifies baseLayer's render behavior to show only within clipPolygon
MapTools.setMapClip(baseLayer, clipPolygon);
map.addLayer(baseLayer);
```
