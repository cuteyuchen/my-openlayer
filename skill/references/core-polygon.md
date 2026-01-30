---
name: core-polygon
description: Management of polygon features, heatmaps, and styling
---

# Polygon Class

The `Polygon` class is used to draw polygon features, heatmaps, image layers, and mask layers on the map, supporting rich data visualization functions.

## Constructor

```typescript
const polygon = new Polygon(map: Map);
```

- **map**: OpenLayers Map instance.

## Interface Definitions

### PolygonOptions

Polygon layer configuration options, inherits from `BaseOptions`, `StyleOptions`, `TextOptions`.

| Property | Type | Description |
| :--- | :--- | :--- |
| **Basic Config** | | |
| `layerName` | `string` | Layer name |
| `zIndex` | `number` | Layer Z-index |
| `visible` | `boolean` | Whether visible |
| `opacity` | `number` | Opacity (0-1) |
| `fitView` | `boolean` | Whether to automatically zoom view |
| **Style Config** | | |
| `fillColor` | `string` | Fill color |
| `fillColorCallBack` | `(feature) => string` | Dynamic fill color callback |
| `strokeColor` | `string` | Border color |
| `strokeWidth` | `number` | Border width |
| `lineDash` | `number[]` | Border dash style |
| **Text Label** | | |
| `textVisible` | `boolean` | Whether to display text |
| `textKey` | `string` | Attribute field name for text |
| `textCallBack` | `(feature) => string` | Text callback function (priority higher than textKey) |
| `textFont` | `string` | Font style |
| `textFillColor` | `string` | Text color |
| `textStrokeColor` | `string` | Text stroke color |
| **Others** | | |
| `mask` | `boolean` | Whether to use as a mask (used with `setOutLayer`) |

### HeatMapOptions

Heatmap configuration options.

| Property | Type | Description |
| :--- | :--- | :--- |
| `layerName` | `string` | Layer name |
| `radius` | `number` | Radius size, default 8 |
| `blur` | `number` | Blur size, default 15 |
| `gradient` | `string[]` | Color gradient array |
| `opacity` | `number` | Opacity |
| `valueKey` | `string` | Weight field name, default 'value' |

### ImageLayerData

Image layer data.

| Property | Type | Description |
| :--- | :--- | :--- |
| `img` | `string` | Image URL |
| `extent` | `number[]` | Image extent `[minX, minY, maxX, maxY]` |

## Methods

### addPolygon

Add a polygon layer.

```typescript
addPolygon(data: MapJSONData, options?: PolygonOptions): VectorLayer<VectorSource>
```

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `data` | `MapJSONData` | GeoJSON data |
| `options` | `PolygonOptions` | Configuration options |

### addPolygonByUrl

Load polygon layer from URL.

```typescript
addPolygonByUrl(url: string, options?: PolygonOptions): VectorLayer<VectorSource>
```

### addBorderPolygon

Add border layer (usually for administrative boundaries, supports cutout effect).

```typescript
addBorderPolygon(data: MapJSONData, options?: PolygonOptions): VectorLayer<VectorSource>
```

### updateFeatureColor

Dynamically update polygon feature colors, commonly used for data visualization.

```typescript
updateFeatureColor(
  layerName: string, 
  colorObj?: { [propName: string]: string }, 
  options?: FeatureColorUpdateOptions
): void
```

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `layerName` | `string` | Target layer name |
| `colorObj` | `Object` | Color mapping object `{ 'AreaName': 'ColorValue' }` |
| `options` | `FeatureColorUpdateOptions` | Includes textKey etc. to match features |

### addImageLayer

Add static image layer (e.g., overlaying floor plans, satellite images).

```typescript
addImageLayer(imageData: ImageLayerData, options?: PolygonOptions): ImageLayer<any>
```

### addHeatmap

Add heatmap.

```typescript
addHeatmap(pointData: PointData[], options?: HeatMapOptions): Heatmap
```

### setOutLayer

Add mask layer (reverse clipping, highlights only specific area, masks outside).

```typescript
setOutLayer(data: MapJSONData, options?: {
  layerName?: string,
  extent?: any,
  fillColor?: string,
  strokeWidth?: number,
  strokeColor?: string,
  zIndex?: number
}): VectorLayer<VectorSource>
```

## Usage Examples

### Basic Polygon

```typescript
const polygonModule = map.getPolygon();

// GeoJSON Data
const polygonData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[120, 30], [121, 30], [121, 31], [120, 31], [120, 30]]]
      },
      properties: { name: 'Area A', value: 100 }
    }
  ]
};

// Add semi-transparent blue fill, blue border polygon
polygonModule.addPolygon(polygonData, {
  layerName: 'area-layer',
  fillColor: 'rgba(0, 0, 255, 0.1)',
  strokeColor: 'blue',
  strokeWidth: 2,
  textKey: 'name', // Display name
  textFillColor: '#fff',
  textStrokeColor: 'blue',
  textStrokeWidth: 2,
  fitView: true
});
```

### Data Visualization (Dynamic Coloring)

```typescript
// Assume features in 'area-layer' have 'name' property
// We set 'Area A' to red, others keep default or other colors
polygonModule.updateFeatureColor(
  'area-layer',
  {
    'Area A': 'rgba(255, 0, 0, 0.5)',
    'Area B': 'rgba(0, 255, 0, 0.5)'
  },
  { 
    textKey: 'name', // Matches key in colorObj
    strokeColor: '#666', // Uniformly update border color
    strokeWidth: 1
  }
);
```

### Heatmap

```typescript
const heatPoints = [
  { lgtd: 119.8, lttd: 29.9, value: 100 },
  { lgtd: 119.9, lttd: 30.0, value: 50 },
  // ... more points
];

polygonModule.addHeatmap(heatPoints, {
  layerName: 'heatmap-layer',
  radius: 20,       // Radius
  blur: 15,         // Blur
  valueKey: 'value', // Weight field
  gradient: ['#00f', '#0ff', '#0f0', '#ff0', '#f00'] // Custom gradient
});
```

### Image Layer

```typescript
// Overlay image on specific lat/lon extent
polygonModule.addImageLayer({
  img: 'https://example.com/plan.png',
  extent: [120.0, 30.0, 120.1, 30.1] // [minX, minY, maxX, maxY]
}, {
  layerName: 'image-overlay',
  opacity: 0.8
});
```

### Mask Layer (Reverse Clip)

```typescript
// Add mask, areas outside polygonData will be masked
polygonModule.setOutLayer(polygonData, {
  layerName: 'mask-layer',
  fillColor: 'rgba(0, 0, 0, 0.5)', // Black semi-transparent mask
  strokeColor: '#fff',
  strokeWidth: 2
});
```
