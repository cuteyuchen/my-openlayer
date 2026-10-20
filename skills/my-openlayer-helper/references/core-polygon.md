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
| `styleZIndex` | `number` | Since 3.2.0: style order within one layer, applied to both polygon and text. Larger values draw later; independent of layer `zIndex` |
| **Text Label** | | |
| `textVisible` | `boolean` | Whether to display text |
| `textKey` | `string` | Attribute field name for text |
| `textCallBack` | `(feature) => string` | Text callback function (priority higher than textKey) |
| `textFont` | `string` | Font style |
| `textFillColor` | `string` | Text color |
| `textStrokeColor` | `string` | Text stroke color |
| `textStrokeWidth` | `number` | Text stroke width |
| `textOverflow` | `boolean` | Whether polygon text can overflow the polygon area. Set `true` to avoid OpenLayers hiding text when the label does not fit at the current zoom |
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
| `projection` | `ProjectionLike` | Image data projection; omit to keep OpenLayers default behavior |
| `interpolate` | `boolean` | Whether to interpolate while resampling; `false` uses nearest-neighbor resampling |

## Methods

### createPolygonStyle (3.2.0+)

Public utility exported from the package root, not a `Polygon` instance method. It does not require a map instance.

```typescript
import { createPolygonStyle } from 'my-openlayer';

createPolygonStyle(options: PolygonOptions, feature: FeatureLike): Style | Style[]
```

The helper merges `ConfigManager.DEFAULT_POLYGON_OPTIONS` with caller options, then resolves fill/text callbacks for the supplied feature. It returns concrete styles, never a style function. When polygon and text use separate styles, both receive the same `styleZIndex`. Keep business rules for risk colors and selection in the caller's `style` callback; do not deep-import the internal factory.

Explicit `options.style` keeps highest priority: the helper returns that style or its callback result without applying other style fields or mutating the supplied styles. Layer `zIndex` is not converted into style order.

### addPolygon

Add a polygon layer, returning a unified `LayerHandle`.

```typescript
addPolygon(data: MapJSONData, options: PolygonOptions & { layerName: string }): LayerHandle<VectorLayer<VectorSource>>
```

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `data` | `MapJSONData` | GeoJSON data |
| `options` | `PolygonOptions` | Configuration options |

### addPolygonByUrl

Load polygon layer from URL.

```typescript
addPolygonByUrl(url: string, options: PolygonOptions & { layerName: string }): Promise<LayerHandle<VectorLayer<VectorSource>>>
```

### addBorderPolygon

Add border layer (usually for administrative boundaries, supports cutout effect).

```typescript
addBorderPolygon(data: MapJSONData, options?: PolygonOptions): LayerHandle<VectorLayer<VectorSource>>
```

### addBorderPolygonByUrl

Load border polygon data from a URL.

```typescript
addBorderPolygonByUrl(url: string, options?: PolygonOptions): Promise<LayerHandle<VectorLayer<VectorSource>>>
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

Styles not specified in `options` inherit from the feature's current style, including `strokeColor`, `strokeWidth`, `textFont`, `textFillColor`, `textStrokeColor`, `textStrokeWidth`, `textOverflow`, and `styleZIndex`. Passing only the color map does not reset existing text styles or style order. Pass `options.styleZIndex` to override the order explicitly; `0` and negative values are supported.

### addImageLayer

Add static image layer (e.g., overlaying floor plans, satellite images).

```typescript
addImageLayer(imageData: ImageLayerData, options?: PolygonOptions): LayerHandle<ImageLayer<any>>
```

### addHeatmap

Add heatmap.

```typescript
addHeatmap(pointData: PointData[], options?: HeatMapOptions): LayerHandle<BaseLayer>
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

### addMaskLayer

Add a regular mask layer through `PolygonMaskLayer`.

```typescript
addMaskLayer(data: MapJSONData, options?: MaskLayerOptions): LayerHandle<VectorLayer<VectorSource>>
```

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `data` | `MapJSONData` | GeoJSON data for the mask boundary |
| `options` | `MaskLayerOptions` | Configuration: `fillColor`, `strokeColor`, `zIndex` (default 12), `opacity`, `visible`, `layerName` |

### destroyAll (3.0)

Destroy all layers created by this `Polygon` instance. Called automatically by `MyOl.destroy()`.

```typescript
destroyAll(): void
```

### removePolygonLayer

Remove a polygon layer by name.

```typescript
removePolygonLayer(layerName: string): void
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
  textOverflow: true, // Keep polygon text visible even when it exceeds the polygon at the current zoom
  fitView: true
});
```

### Per-feature Risk and Selection Styles (3.2.0+)

```typescript
import { createPolygonStyle } from 'my-openlayer';

const boundary = polygonModule.addPolygon(polygonData, {
  layerName: 'region-boundaries',
  zIndex: 20, // Order of the entire layer
  style: feature => createPolygonStyle({
    fillColor: feature.get('riskColor') ?? 'rgba(0, 0, 0, 0)',
    strokeColor: feature.get('selected') ? '#ff0000' : '#666666',
    strokeWidth: feature.get('selected') ? 3 : 1,
    styleZIndex: feature.get('selected') ? 1 : 0, // Draw selected boundaries later
    textVisible: true,
    textKey: 'name',
    textOverflow: true
  }, feature)
});
```

The same callback works in `MyOl.addGeoJSON(data, { layerName: 'regions', polygon: { style: ... } })`. `styleByProperties` is only available for points, not polygons. If risk/selection state comes from outside feature properties, call `boundary.layer.changed()` after that state changes; for `GeoJSONRenderHandle`, refresh the relevant polygon handles' layers. No layer reconstruction is needed.

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
// Overlay an EPSG:4326 raster on the map; OpenLayers performs true raster reprojection
polygonModule.addImageLayer({
  img: 'https://example.com/inundation.png',
  extent: [117.560633, 28.028820, 120.738828, 30.591628],
  projection: 'EPSG:4326',
  interpolate: false
}, {
  layerName: 'inundationLayer',
  opacity: 0.6,
  visible: true
});
```

Keep `extent` in the source image projection. Do not call `transformExtent()` to convert only the boundary corners and then linearly place the image; pass `projection` so OpenLayers can create a reprojection image and resample the raster correctly. When updating an existing `layerName`, the new `projection` and `interpolate` values are applied to the replacement source, while an omitted `img` reuses the previous URL.

### Mask Layer (Reverse Clip)

```typescript
// Add mask, areas outside polygonData will be masked
polygonModule.setOutLayer(polygonData, {
  layerName: 'mask-layer',
  fillColor: 'rgba(0, 0, 0, 0.5)', // Black semi-transparent mask
  strokeColor: '#fff',
  strokeWidth: 2
});

polygonModule.removePolygonLayer('mask-layer');
```
