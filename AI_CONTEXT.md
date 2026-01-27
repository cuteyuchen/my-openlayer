# AI Context for my-openlayer

Use this context to understand how to use the `my-openlayer` library.

## Project Overview

`my-openlayer` is a modern map component library based on OpenLayers, designed for Web GIS applications. It provides a modular, TypeScript-ready wrapper around OpenLayers features.

- **Core Dependency**: `ol` (OpenLayers)
- **Key Features**: Map initialization, Tianditu (天地图) support, Point/Line/Polygon management, Event handling, Selection, Measurement, Vue component markers.

## Core Architecture

- **MyOl**: The main entry class. Initializes the map and provides access to sub-modules.
- **Modules** (Lazy loaded via getters):
  - `MapBaseLayers`: Base map switching (Vector, Image, Terrain) and Annotation layers.
  - `Point`: Point features, clusters, DOM markers.
  - `Line`: Line features, river layers.
  - `Polygon`: Polygon features, heatmaps, image layers, masks.
  - `MapTools`: General tools (Zoom, Fit, Layer management).
  - `MeasureHandler`: Distance and Area measurement.
  - `SelectHandler`: Feature selection interaction.
  - `EventManager`: Unified event listener management.
- **Utils**: `ConfigManager`, `ErrorHandler`, `ValidationUtils`.

## Quick Start (Minimal Example)

```typescript
import MyOl, { MapInitType } from 'my-openlayer';

// 1. Configuration
const config: MapInitType = {
  target: 'map-container', // ID of the DIV
  center: [119.81, 29.969], // [Longitude, Latitude]
  zoom: 10,
  token: 'YOUR_TIANDITU_TOKEN', // Required for Tianditu base maps
  annotation: true // Show annotation layer by default
};

// 2. Initialize
const map = new MyOl('map-container', config);

// 3. Access Modules & Add Features
map.getPoint().addPoint([{ lgtd: 119.81, lttd: 29.969, name: 'Demo' }], {
  layerName: 'demo-layer',
  img: 'marker.png'
});
```

## API Reference (Condensed)

### `MyOl` (Main Class)
- `constructor(id: string | HTMLElement, options?: MapInitType)`
- `getPoint()`: Returns `Point` instance.
- `getLine()`: Returns `Line` instance.
- `getPolygon()`: Returns `Polygon` instance.
- `getMapBaseLayers()`: Returns `MapBaseLayers` instance.
- `getTools()`: Returns `MapTools` instance.
- `getSelectHandler()`: Returns `SelectHandler` instance.
- `getEventManager()`: Returns `EventManager` instance.
- `locationAction(lon, lat, zoom, duration)`: Animate to location.

### `MapBaseLayers`
- `switchBaseLayer(type: 'vec_c' | 'img_c' | 'ter_c')`: Switch base map.
- `setAnnotationVisible(visible: boolean)`: Toggle text annotations.
- `addGeoServerLayer(url, layerName, options)`: Add WMS layer.

### `Point`
- `addPoint(data: PointData[], options: PointOptions)`: Add markers.
- `addClusterPoint(data, options)`: Add clustered markers.
- `addVueTemplatePoint(data, Component, options)`: Use Vue component as marker.

### `Line`
- `addLine(geoJson, options)`: Add lines from GeoJSON.
- `addLineByUrl(url, options)`: Load GeoJSON from URL.

### `Polygon`
- `addPolygon(geoJson, options)`: Add polygons.
- `addBorderPolygon(geoJson, options)`: Add boundary lines.
- `updateFeatureColor(layerName, colorMap, options)`: Update colors dynamically.
- `addHeatmap(data, options)`: Add heatmap.

### `SelectHandler`
- `enableSelect(mode: 'click'|'hover', options)`: Enable selection.
- `selectByIds(ids, options)`: Programmatic selection.

### `MeasureHandler`
- **Important**: Must be instantiated manually if not exposed via `MyOl`.
- `new MeasureHandler(map.map)`
- `start('LineString' | 'Polygon')`
- `end()`, `clean()`

## Key Type Definitions (TypeScript)

Use these interfaces to ensure type safety.

```typescript
export interface MapInitType {
  layers?: LayerItem[] | { [key: string]: LayerItem[] };
  zoom?: number;
  center?: number[]; // [lon, lat]
  minZoom?: number;
  maxZoom?: number;
  token?: string; // Tianditu Token
  annotation?: boolean;
}

export interface BaseOptions {
  layerName?: string;
  zIndex?: number;
  visible?: boolean;
  opacity?: number;
}

export interface PointOptions extends BaseOptions {
  textKey?: string; // Property key for label text
  img?: string; // Icon URL
  scale?: number;
  textFillColor?: string;
}

export interface PointData {
  lgtd: number;
  lttd: number;
  [key: string]: any;
}

export interface LineOptions extends BaseOptions {
  strokeColor?: string;
  strokeWidth?: number;
  lineDash?: number[];
}

export interface PolygonOptions extends BaseOptions {
  fillColor?: string;
  strokeColor?: string;
  textKey?: string;
}
```

## Best Practices

1.  **Use Modules**: Access functionality through `map.getPoint()`, `map.getLine()`, etc., rather than manipulating the `ol.Map` directly when possible.
2.  **Layer Names**: Always provide a unique `layerName` in options to easily retrieve or remove layers later (`map.getTools().removeLayer('my-layer')`).
3.  **Coordinate System**: The library defaults to `EPSG:4326` (WGS84) for input coordinates (lon/lat) and `CGCS2000` internally where applicable.
4.  **Vue Integration**: Use `addVueTemplatePoint` for complex markers requiring interactivity or dynamic content.
5.  **Event Handling**: Use `map.getEventManager().on('click', ...)` instead of native listeners for better management.
