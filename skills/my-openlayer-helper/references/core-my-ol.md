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

`createView()` can be used directly as a static helper. It initializes the built-in projections and any `projection.def` before resolving the view projection, so direct static calls have the same EPSG transform setup as the constructor path.

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

### Mixed Geometry Rendering

#### addGeoJSON

Automatically detects point/line/polygon geometry types from mixed GeoJSON data, groups features, and creates corresponding layers. Returns a unified `GeoJSONRenderHandle` for managing all created layers.

```typescript
addGeoJSON(data: AddGeoJSONInput, options: AddGeoJSONOptions): GeoJSONRenderHandle
```

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `data` | `AddGeoJSONInput` | Yes | GeoJSON data. Accepts `FeatureCollection`, `Feature`, bare `Geometry`, `Array`, or `Record<string, ...>` of any of these. |
| `options` | `AddGeoJSONOptions` | Yes | Rendering options. |

**AddGeoJSONOptions**

| Property | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `layerName` | `string \| string[] \| Record<string, string> \| callback` | Yes | Layer name rule. A string is used as the final layer name without appending `groupKey` or `geometryType`. Array/Record forms map to dataset indices/keys and derive grouped/type-specific names. Callback receives `{ datasetKey, groupKey, geometryType, index }` for full control. |
| `groupBy` | `string \| callback` | No | Group features by a property name or callback. Each group gets its own set of layers. |
| `dataProjection` | `string` | No | Source data projection code (e.g. `'EPSG:4326'`). |
| `featureProjection` | `string` | No | Target feature projection code. |
| `fitView` | `boolean` | No | Auto-fit map view to rendered features. |
| `point` | `AddGeoJSONPointOptions` | No | Point layer options (extends `PointOptions`). |
| `line` | `LineOptions` | No | Line layer options. |
| `polygon` | `PolygonOptions` | No | Polygon layer options. |

**AddGeoJSONPointOptions** (extends `PointOptions`)

| Property | Type | Description |
| :--- | :--- | :--- |
| `styleByProperties` | `(properties, context) => Partial<PointOptions> \| null` | Per-feature styling callback. `properties` is the original feature properties (without `lgtd`/`lttd`). `context` contains `{ datasetKey, groupKey, feature: FeatureData, index }` where `feature` is the real GeoJSON Feature and `index` is the position within the point group. Return value is merged with base `point` options (callback wins). |

**Returns**: `GeoJSONRenderHandle`

| Property / Method | Type | Description |
| :--- | :--- | :--- |
| `groups` | `Record<string, GeoJSONGroupHandle>` | Per-group handles, each containing `point`, `line`, `polygon` (nullable `LayerHandle`), and `handles` array. |
| `handles` | `LayerHandle[]` | Flat list of all created layer handles. |
| `point` | `Record<string, LayerHandle \| null>` | Per-group point layer handle index. Use `handle.point[groupKey]` to access. |
| `line` | `Record<string, LayerHandle \| null>` | Per-group line layer handle index. Use `handle.line[groupKey]` to access. |
| `polygon` | `Record<string, LayerHandle \| null>` | Per-group polygon layer handle index. Use `handle.polygon[groupKey]` to access. |
| `setVisible(visible)` | `(boolean) => void` | Show/hide all layers. |
| `setGroupVisible(groupKey, visible)` | `(string, boolean) => void` | Show/hide a specific group. |
| `removeGroup(groupKey)` | `(string) => void` | Remove all layers in a group. Also deletes the corresponding `point[groupKey]`/`line[groupKey]`/`polygon[groupKey]` indexes. |
| `remove()` | `() => void` | Remove all layers. Also clears all `point`/`line`/`polygon` indexes. |

**Example**

```typescript
const handle = map.addGeoJSON(mixedGeoJSON, {
  layerName: 'risk',
  groupBy: 'level',
  point: { textKey: 'name', textVisible: true },
  line:  { strokeColor: '#3b82f6', strokeWidth: 3 },
  polygon: { fillColor: 'rgba(239,68,68,0.15)' }
});

handle.setVisible(false);
handle.setGroupVisible('high', false);
handle.removeGroup('low');
handle.remove();

// Per-feature styling
map.addGeoJSON(points, {
  layerName: 'styled',
  point: {
    styleByProperties: (props) => ({
      circleColor: props.risk === 'high' ? '#ef4444' : '#22c55e'
    })
  }
});
```

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

Destroys the map instance and **cascades cleanup to all sub-modules** (3.0 behavior):

1. `SelectHandler.destroy()` — disables selection, clears all selected/rendered state
2. `Line.destroyAllFlowLines()` — stops all rAF loops, removes flow line layers
3. `Point.destroyAll()` — removes all point layers, stops pulse animations, unmounts Vue overlays
4. `Polygon.destroyAll()` — removes all polygon/mask/heatmap/image layers
5. `EventManager.clear()` — removes all event listeners

Each step is wrapped in its own try/catch, so a failure in one module does not prevent others from being cleaned up.

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
