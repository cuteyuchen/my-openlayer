---
name: tool-map-base-layers
description: Management of map base layers and annotation layers
---

# MapBaseLayers Class

`MapBaseLayers` manages map base layers (e.g., TianDiTu, custom tiles) and annotation layers, supporting layer switching, WMS layer loading, and layer state management.

## Constructor

```typescript
// Usually initialized internally via MyOl instance, or manually created
const baseLayers = new MapBaseLayers(map: Map, options: MapLayersOptions);
```

- **map**: OpenLayers Map instance.
- **options**: Layer configuration options.

## Interface Definitions

### MapLayersOptions

Configuration at initialization.

| Property | Type | Description |
| :--- | :--- | :--- |
| `layers` | `Layer[]` \| `Object` | Base layer config. If array, treated as custom base maps; if object, keys are types, values are layer arrays. |
| `token` | `string` | TianDiTu Token (if using built-in logic) |
| `annotation` | `boolean` | Whether to initialize annotation layer |
| `zIndex` | `number` | Base z-index, default 0 |
| `mapClip` | `boolean` | Whether to enable map clipping |
| `mapClipData` | `MapJSONData` | Clipping data |

### AnnotationLayerOptions

Annotation layer configuration.

| Property | Type | Description |
| :--- | :--- | :--- |
| `type` | `string` | Annotation type: `cva_c` (Vector Annotation), `cia_c` (Image Annotation), `cta_c` (Terrain Annotation) |
| `token` | `string` | TianDiTu Token |
| `zIndex` | `number` | Layer z-index |
| `visible` | `boolean` | Whether visible |

### GeoServerLayerOptions

GeoServer WMS layer configuration.

| Property | Type | Description |
| :--- | :--- | :--- |
| `zIndex` | `number` | Layer z-index |
| `visible` | `boolean` | Whether visible |
| `version` | `'1.1.1' \| '1.3.0'` | WMS version |
| `serverType` | `string` | Server type, e.g., `'geoserver'` |
| `crossOrigin` | `string` | Cross-origin setting, default `'anonymous'` |
| `params` | `Object` | Extra WMS parameters |

## Methods

### Base Layer Operations

#### switchBaseLayer

Switch base layer type (e.g., `vec_c`, `img_c`, `ter_c`).

```typescript
switchBaseLayer(type: string): this
```

#### getCurrentBaseLayerType

Get current base layer type.

```typescript
getCurrentBaseLayerType(): string | null
```

#### removeLayersByType

Remove layers of specified type.

```typescript
removeLayersByType(type: string): this
```

#### clearAllLayers

Clear all base maps and annotation layers.

```typescript
clearAllLayers(): this
```

### Annotation Operations

#### addAnnotationLayer

Add annotation layer.

```typescript
addAnnotationLayer(options: Omit<AnnotationLayerOptions, 'token'>): TileLayer<XYZ>
```

#### switchAnnotationLayer

Switch annotation type.

```typescript
switchAnnotationLayer(annotationType: AnnotationType): this
```

#### setAnnotationVisible

Set annotation layer visibility.

```typescript
setAnnotationVisible(visible: boolean): this
```

#### isAnnotationVisible

Check if annotation layer is visible.

```typescript
isAnnotationVisible(): boolean
```

### Advanced Layers

#### addGeoServerLayer

Add GeoServer WMS layer.

```typescript
addGeoServerLayer(url: string, layerName: string, options?: GeoServerLayerOptions): TileLayer<TileWMS>
```

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `url` | `string` | WMS service address |
| `layerName` | `string` | WMS layer name |
| `options` | `GeoServerLayerOptions` | Configuration options |

#### getLayerStats

Get layer count statistics.

```typescript
getLayerStats(): { totalTypes: number; totalLayers: number; layersByType: Record<string, number> }
```

## Usage Examples

### Switch TianDiTu Base Map

```typescript
const baseLayers = map.getMapBaseLayers();

// Switch to Image base map (img_c)
baseLayers.switchBaseLayer('img_c');

// Switch back to Vector base map (vec_c)
baseLayers.switchBaseLayer('vec_c');
```

### Manage Annotation Layer

```typescript
// Hide annotation
baseLayers.setAnnotationVisible(false);

// Switch to Image Annotation (cia_c)
baseLayers.switchAnnotationLayer('cia_c');

// Show annotation
baseLayers.setAnnotationVisible(true);
```

### Load GeoServer WMS Layer

```typescript
// Add a WMS layer
const wmsLayer = baseLayers.addGeoServerLayer(
  'http://localhost:8080/geoserver/wms',
  'myworkspace:mylayer',
  {
    visible: true,
    zIndex: 10,
    params: {
      'CQL_FILTER': "status = 'active'" // Optional: Pass custom parameters
    }
  }
);
```

### Layer Statistics

```typescript
const stats = baseLayers.getLayerStats();
console.log(`Total Layers: ${stats.totalLayers}`);
console.log('Layers by Type:', stats.layersByType);
```
