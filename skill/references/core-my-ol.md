---
name: core-my-ol
description: Core Map initialization, configuration, and module access
---

# MyOl Core Class

`MyOl` is the core class of the map, serving as the entry point for the entire library. It is responsible for map initialization, configuration management, module loading, and basic map operations (such as positioning and resetting). It adopts a modular design, loading functional modules (such as point, line, and polygon feature management) on demand.

## Import

```typescript
import { MyOl } from 'my-openlayer';
// or
import MyOl from 'my-openlayer';
```

## Constructor

```typescript
constructor(id: string | HTMLElement, options?: Partial<MapInitType>)
```

Initializes a new map instance.

### Parameters

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `string` \| `HTMLElement` | Yes | - | The DOM ID string or HTMLElement object of the map container. |
| `options` | `Partial<MapInitType>` | No | `{}` | Map initialization configuration options, see the table below. |

### MapInitType Configuration Options

| Property | Type | Description |
| :--- | :--- | :--- |
| `center` | `number[]` | Map initial center coordinates `[longitude, latitude]`, default is `[0, 0]`. |
| `zoom` | `number` | Map initial zoom level, default is `2`. |
| `minZoom` | `number` | Minimum zoom level. |
| `maxZoom` | `number` | Maximum zoom level. |
| `token` | `string` | TianDiTu API Token, used to load TianDiTu base maps. |
| `annotation` | `boolean` | Whether to display annotation layers (such as place name labels), default is `false`. |
| `layers` | `LayerItem[]` | Custom initial layer array. If this is set, built-in base map management may be affected. |
| `mapClipData` | `MapJSONData` | Map clip data (GeoJSON format), used to display only specific areas. |
| `enableLog` | `boolean` | Whether to enable internal log output, default is `false`. |
| `logLevel` | `'debug' \| 'info' \| 'warn' \| 'error'` | Log level, default is `'error'`. |
| `projection` | `object` | Custom projection coordinate system configuration. |
| `projection.code` | `string` | Projection code, such as `'EPSG:4549'`. |
| `projection.def` | `string` | proj4 definition string. |
| `projection.extent` | `number[]` | Projection extent. |
| `projection.worldExtent` | `number[]` | Geographic world extent for the projection. |
| `projection.units` | `Units` | Explicit unit override. Usually omit this and let `projection.def` drive proj4/OpenLayers inference. |

### Built-in Projections

`MyOl` explicitly registers these built-in projections before calling OpenLayers `register(proj4)`, so application code does not need to manually define EPSG:4326 for production builds:

| Projection | Purpose |
| :--- | :--- |
| `EPSG:4326` | WGS84 longitude/latitude source coordinates and transform base. |
| `EPSG:4490` | CGCS2000 longitude/latitude projection, used by the default view. |
| `EPSG:4549` | CGCS2000 3-degree belt projection, usable through `projection.code`. |

When `projection.def` is provided, `MyOl` writes it to `proj4.defs` before registering proj4 with OpenLayers. If only `code` and `def` are provided, the view reuses the registered projection object and preserves units inferred from the proj4 definition, such as `+units=m`.

## Static Methods

### createView

Creates an OpenLayers `View` instance.

```typescript
static createView(options: MapInitType): View
```

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `options` | `MapInitType` | Map configuration options, mainly using `center`, `zoom`, `projection` properties. |

### getView

Deprecated compatibility alias for `createView`.

```typescript
static getView(options: MapInitType): View
```

## Instance Methods

### Module Access

`MyOl` provides lazy-loaded module access methods, initializing the corresponding module only when called for the first time.

#### getPoint

Gets the point feature operation module.

```typescript
getPoint(): Point
```

**Returns**: `Point` instance, used to add, delete, and manage point features.

#### getLine

Gets the line feature operation module.

```typescript
getLine(): Line
```

**Returns**: `Line` instance, used to draw lines.

#### getPolygon

Gets the polygon feature operation module.

```typescript
getPolygon(): Polygon
```

**Returns**: `Polygon` instance, used to draw polygons.

#### getMapBaseLayers

Gets the base map management module.

```typescript
getMapBaseLayers(): MapBaseLayers
```

**Returns**: `MapBaseLayers` instance, used to switch base map types (vector, satellite, terrain).

#### getTools

Gets the map tools module.

```typescript
getTools(): MapTools
```

**Returns**: `MapTools` instance, containing map screenshot, clipping, and other tools.

#### getSelectHandler

Gets the feature selection handler module.

```typescript
getSelectHandler(): SelectHandler
```

**Returns**: `SelectHandler` instance, used to handle click and hover selection interactions on map features.

### Map Operations

#### locationAction

Locates to specific coordinates, supports animation transition.

```typescript
locationAction(longitude: number, latitude: number, zoom: number = 20, duration: number = 3000): void
```

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `longitude` | `number` | - | Target longitude. |
| `latitude` | `number` | - | Target latitude. |
| `zoom` | `number` | `20` | Target zoom level. |
| `duration` | `number` | `3000` | Animation duration (ms). |

#### resetPosition

Resets the map position to the center point set during initialization.

```typescript
resetPosition(duration: number = 3000): void
```

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `duration` | `number` | `3000` | Animation duration (ms). |

### Manager Access

#### getEventManager

Gets the event manager for listening to map events.

```typescript
getEventManager(): EventManager
```

#### getErrorHandler

Gets the error handler for custom error handling logic.

```typescript
getErrorHandler(): ErrorHandler
```

#### getConfigManager

Gets the configuration manager.

```typescript
getConfigManager(): ConfigManager
```

#### getMapOptions

Gets a read-only copy of the current map configuration.

```typescript
getMapOptions(): Readonly<MapInitType>
```

### Destruction

#### destroy

Destroys the map instance, clearing all event listeners and resources.

```typescript
destroy(): void
```

## Usage Examples

### Complete Initialization

```typescript
import { MyOl } from 'my-openlayer';

// Define configuration
const options = {
  // Hangzhou City Center
  center: [120.15507, 30.274085],
  zoom: 12,
  minZoom: 5,
  maxZoom: 18,
  
  // TianDiTu Token
  token: 'YOUR_TIANDITU_TOKEN',
  
  // Enable annotation
  annotation: true,
  
  // Enable debug logs
  enableLog: true,
  logLevel: 'debug'
};

// Initialize map
const map = new MyOl('map-container', options);

// Listen for load completion
map.getEventManager().on('rendercomplete', () => {
  console.log('Map loaded!');
});
```

### Using Custom Projection

```typescript
import { MyOl } from 'my-openlayer';

const map = new MyOl('map', {
  projection: {
    code: 'EPSG:4549', // CGCS2000 3-degree belt
    def: '+proj=tmerc +lat_0=0 +lon_0=120 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs',
    extent: [...], // Optional, only when constraining projected extent
    worldExtent: [...] // Optional geographic world extent
  }
});
```

When `projection.def` is provided, `MyOl` writes it to `proj4.defs` before registering proj4 with OpenLayers. This keeps the transform from EPSG:4326 to the target projection available during `createView`.

`projection.extent` and `projection.worldExtent` are applied only when explicitly provided. Pass `projection.units` only when overriding the unit inferred from `projection.def`; meter projections normally only need `+units=m` in the proj4 definition.
