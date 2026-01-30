---
name: core-line
description: Management of polyline features and styling
---

# Line Class

The `Line` class is used to draw line features on the map, supporting GeoJSON data loading, custom styles, and layer management.

## Constructor

```typescript
const line = new Line(map: Map);
```

- **map**: OpenLayers Map instance.

## Interface Definitions

### LineOptions

Configures the style, properties, and behavior of the line layer. Inherits from `BaseOptions`, `StyleOptions`, `TextOptions`.

| Property | Type | Description |
| :--- | :--- | :--- |
| **Basic Config** | | |
| `layerName` | `string` | Layer name, used for unique identification and management |
| `zIndex` | `number` | Layer Z-index, automatically handled by default |
| `visible` | `boolean` | Whether layer is visible, default `true` |
| `opacity` | `number` | Layer opacity (0-1) |
| `fitView` | `boolean` | Whether to automatically zoom view to fit feature extent after adding |
| **Style Config** | | |
| `strokeColor` | `string` \| `number[]` | Line color, e.g., `'#ff0000'` or `[255, 0, 0, 1]` |
| `strokeWidth` | `number` | Line width (pixels) |
| `lineDash` | `number[]` | Dash pattern, e.g., `[10, 10]` means 10px line, 10px gap |
| `lineDashOffset` | `number` | Dash offset |
| `style` | `Style` \| `Function` | Custom OpenLayers Style or style function |
| **Text Label** | | |
| `textVisible` | `boolean` | Whether to display text labels |
| `textCallBack` | `(feature) => string` | Callback function to get text content |
| `textFont` | `string` | Font style, default `'12px sans-serif'` |
| `textFillColor` | `string` | Text fill color |
| `textStrokeColor` | `string` | Text stroke color |
| `textStrokeWidth` | `number` | Text stroke width |
| `textOffsetY` | `number` | Text Y-axis offset |
| **Others** | | |
| `type` | `string` | Line type identifier, written into Feature properties |

### MapJSONData (GeoJSON)

Standard GeoJSON format data structure.

```typescript
interface MapJSONData {
  type: string;        // Usually "FeatureCollection"
  name?: string;       // Dataset name
  features: FeatureData[]; // Array of features
}

interface FeatureData {
  type: string;        // "Feature"
  properties: any;     // Properties object
  geometry: {
    type: "LineString" | "MultiLineString";
    coordinates: number[][] | number[][][];
  };
}
```

## Methods

### addLine

Add a line feature layer.

```typescript
addLine(data: MapJSONData, options?: LineOptions): VectorLayer<VectorSource>
```

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `data` | `MapJSONData` | Line data in GeoJSON format |
| `options` | `LineOptions` | Layer configuration options |

**Returns**: The created `VectorLayer` instance.

### addLineByUrl

Load and add a line feature layer from a URL.

```typescript
addLineByUrl(url: string, options?: LineOptions): VectorLayer<VectorSource>
```

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `url` | `string` | URL address of GeoJSON data |
| `options` | `LineOptions` | Layer configuration options |

**Returns**: The created `VectorLayer` instance.

### removeLineLayer

Remove a line layer by its name.

```typescript
removeLineLayer(layerName: string): void
```

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `layerName` | `string` | Name of the layer to remove |

## Usage Examples

### Basic Usage

```typescript
const lineModule = map.getLine();

// GeoJSON Data
const lineData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [[119.8, 29.9], [119.9, 30.0]]
      },
      properties: { name: 'Line 1', status: 'active' }
    }
  ]
};

// Add red solid line
lineModule.addLine(lineData, {
  layerName: 'base-line',
  strokeColor: '#ff0000',
  strokeWidth: 3,
  fitView: true
});
```

### Dashed Line with Labels

```typescript
lineModule.addLine(lineData, {
  layerName: 'dash-line',
  strokeColor: '#0000ff',
  strokeWidth: 2,
  lineDash: [10, 5], // 10px line, 5px gap
  textVisible: true,
  textFillColor: '#000',
  textStrokeColor: '#fff',
  textStrokeWidth: 2,
  // Dynamically get display text
  textCallBack: (feature) => feature.get('name')
});
```

### Custom Style Function

```typescript
import { Style, Stroke } from 'ol/style';

lineModule.addLine(lineData, {
  layerName: 'custom-style-line',
  // Set color dynamically based on property
  style: (feature) => {
    const status = feature.get('properties').status;
    const color = status === 'active' ? 'green' : 'gray';
    
    return new Style({
      stroke: new Stroke({
        color: color,
        width: 4
      })
    });
  }
});
```

### Load from API

```typescript
lineModule.addLineByUrl('/api/lines/all.json', {
  layerName: 'api-lines',
  strokeColor: 'orange',
  strokeWidth: 2
});
```
