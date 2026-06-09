---
name: my-openlayer-helper
description: "Initialize my-openlayer maps, add points/lines/polygons, configure Vue overlays, switch base layers, handle measurement tools, register custom projections, and manage runtime config. Use when the user asks about my-openlayer setup, OpenLayers map initialization, adding map markers, pulse points, static or animated flow lines, polygon drawing, map overlay components, layer switching, feature selection, measurement, custom projections, projection registration, EPSG transform errors, map clipping, or runtime default configuration."
---

## Workflow

1. **Initialize** the map via `MyOl` constructor with a container ID and options.
2. **Access modules** through lazy-loaded getters (`getPoint()`, `getLine()`, `getPolygon()`, `getTools()`).
3. **Add features** using `add*` methods. In 3.0 real layer methods return unified `LayerHandle`; Overlay/Vue point methods return `ControlHandle`. Point APIs (`addPoint`, `addClusterPoint`, `addPulsePointLayer`) accept both `PointData[]` and standard GeoJSON (FeatureCollection, Feature, MultiPoint geometry). Use `MyOl.addGeoJSON(data, options)` to render mixed geometry types (point/line/polygon) in one call, with automatic grouping and per-feature styling.
4. **Clean up** by calling `destroy()` — 3.0 `destroy()` cascades to all sub-modules automatically.

### Quick Start

```typescript
import { MyOl, ProjectionManager, ConfigManager } from 'my-openlayer';

// (Optional) Register custom projection before creating map
ProjectionManager.register({
  code: 'EPSG:4528',
  def: '+proj=tmerc +lat_0=0 +lon_0=120 +k=1 +x_0=40500000 +y_0=0 +ellps=GRS80 +units=m +no_defs'
});

// (Optional) Override global defaults
ConfigManager.setDefaults('LINE_OPTIONS', { strokeWidth: 4 });

// 1. Initialize map (container element must exist in DOM)
const map = new MyOl('map-container', {
  center: [120.155, 30.274],
  zoom: 12,
  token: 'YOUR_TIANDITU_TOKEN'
});

// 2. Add point markers (3.0 add* returns unified LayerHandle)
const handle = map.getPoint().addPoint(
  [{ lgtd: 120.15, lttd: 30.27, name: 'Hangzhou HQ' }],
  { layerName: 'offices', img: '/icons/marker.png', textKey: 'name', scale: 0.8 }
);

// 3. Add animated pulse markers
const pulseHandle = map.getPoint().addPulsePointLayer(
  [{ lgtd: 120.16, lttd: 30.28, name: 'Warning Village', lev: 0 }],
  {
    layerName: 'warnings',
    levelKey: 'lev',
    img: '/icons/village.svg',
    scale: 0.8,
    textKey: 'name',
    textVisible: true,
    pulse: { radius: [8, 28], duration: 2400 }
  }
);

// 4. Clip entire map to a region
map.getTools().clipMap(geoJsonBoundary);

// 5. Cleanup on unmount (cascades to all sub-modules in 3.0)
onUnmounted(() => {
  map.destroy();
});
```

### addGeoJSON — Mixed Geometry Rendering

```typescript
// Auto-detect point/line/polygon, group by property
const handle = map.addGeoJSON(mixedGeoJSON, {
  layerName: 'risk',
  groupBy: 'level',
  point: { textKey: 'name', textVisible: true },
  line: { strokeColor: '#3b82f6', strokeWidth: 3 },
  polygon: { fillColor: 'rgba(239,68,68,0.15)' }
});

// Per-feature styling via callback
// props = original feature properties (without lgtd/lttd)
// ctx  = { datasetKey, groupKey, feature: FeatureData, index }
map.addGeoJSON(points, {
  layerName: 'styled',
  point: {
    styleByProperties: (props, ctx) => ({
      circleColor: props.risk === 'high' ? '#ef4444' : '#22c55e',
      circleRadius: ctx.index === 0 ? 10 : 6
    })
  }
});

// Handle operations
handle.setVisible(false);
handle.setGroupVisible('high', false);
handle.removeGroup('low');
handle.remove();
```

### Error Recovery

- **Container not found**: Ensure the DOM element exists before `new MyOl(...)`. In Vue, initialize inside `onMounted`, never in `setup`.
- **Wrong coordinates**: The library expects `[longitude, latitude]` in EPSG:4326. EPSG:3857 projected values will misplace features.
- **Projection registration**: Use `ProjectionManager.register({ code, def })` to register custom EPSG before creating map instances. `MyOl` automatically registers EPSG:4326, EPSG:4490, and EPSG:4549.
- **Static createView transforms**: `MyOl.createView()` initializes projections internally. If production reports `No transform available between EPSG:4326 and EPSG:4490`, check that the package version includes this static initialization path.
- **Custom projection metadata**: When `projection.def` contains `+units=m`, let proj4/OpenLayers infer the unit. Only pass `projection.units` when explicitly overriding the inferred unit.
- **Clustering conflicts**: Enabling clustering replaces individual point rendering. Remove the existing non-clustered layer before switching.
- **Many animated markers**: Prefer `addPulsePointLayer` over `addDomPoint` when rendering large warning/village pulse point lists.
- **Heatmap not rendering**: If `addHeatmap` produces an invisible layer, check that the data has a numeric field matching `valueKey` (default `'value'`). 3.0 auto-falls back to equal weight when the field is missing, but you should specify `valueKey` explicitly for meaningful gradients.
- **Mask layer not visible**: 3.0 fixes the default `zIndex` for `addMaskLayer` to 12 (above Tianditu base at 9). If upgrading from 2.x and the mask was previously invisible, no code change needed.
- **destroy() cascade**: In 3.0, `MyOl.destroy()` automatically calls `SelectHandler.destroy()`, `Line.destroyAllFlowLines()`, `Point.destroyAll()`, and `Polygon.destroyAll()`. You do not need to manually clean up sub-module handles before calling `destroy()`.
- **updateProps on VueTemplatePoint**: 3.0 fixes `updateProps` to correctly pass prop values (previously they were placed in the prop declaration position). Call `instance.updateProps({ label: 'new value' })` and the Vue component will re-render with the new value.
- **Unified error types**: All thrown errors use `MyOpenLayersError` with an `ErrorType` tag (`VALIDATION_ERROR`, `MAP_ERROR`, `LAYER_ERROR`, `COORDINATE_ERROR`, `DATA_ERROR`, `COMPONENT_ERROR`). Catch and `instanceof` check to distinguish error categories. Subclasses `LayerNotFoundError`, `InvalidGeoJSONError`, `ProjectionError` are available for finer-grained handling.

## Core Components

- [MyOl](references/core-my-ol.md) — Map initialization, configuration, module access, and `destroy()` cascade.
- [Point](references/core-point.md) — Point features, clustering, high-performance pulse markers, Vue template points, unified `add*` handles, and `destroyAll`.
- [Line](references/core-line.md) — Polyline features, animated flow lines, async `addLineByUrl`, and `destroyAllFlowLines`.
- [Polygon](references/core-polygon.md) — Polygon features, heatmaps, image layers, mask layers, async `addPolygonByUrl`, and `destroyAll`.
- [VueTemplatePoint](references/core-vue-template-point.md) — Vue components rendered as map overlays, with fixed `updateProps` in 3.0.

## Map Tools

- [MapTools](references/tool-map-tools.md) — Layer management, zoom, pan, `setMapClip`, `clipMap` (all-layer clipping), `fitToLayers`, `fitByData`.
- [MeasureHandler](references/tool-measure-handler.md) — Distance and area measurement.
- [SelectHandler](references/tool-select-handler.md) — Feature click/hover/ctrl selection with `selectByIds`, `selectByProperty`, and `destroy`.
- [MapBaseLayers](references/tool-map-base-layers.md) — Base layer switching (Tianditu vector/image/terrain), annotation management, `getCurrentBaseLayers`.

## Infrastructure

- [ProjectionManager](references/infra-projection-manager.md) — **3.0 new.** Standalone projection registration (`register`, `initialize`, `resolveViewProjection`). Replaces `MyOl.initializeProjections`.
- [ConfigManager](references/infra-config-manager.md) — Centralized defaults and **3.0 new** `setDefaults` / `getDefaults` / `resetDefaults` for runtime config changes.
- [EventManager](references/infra-event-manager.md) — Event listening and dispatching with `on` / `off` / `offAll` / `clear`.
- [ErrorHandler](references/infra-error-handler.md) — Error handling and logging, with **3.0 new** `LayerNotFoundError` / `InvalidGeoJSONError` / `ProjectionError` subclasses.
- [ValidationUtils](references/infra-validation-utils.md) — Parameter and data validation.
