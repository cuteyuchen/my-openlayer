---
name: my-openlayer-helper
description: "Initialize my-openlayer maps, add points/lines/polygons, configure Vue overlays, switch base layers, and handle measurement tools. Use when the user asks about my-openlayer setup, OpenLayers map initialization, adding map markers, pulse points, static or animated flow lines, polygon drawing, map overlay components, layer switching, feature selection, measurement, custom projections, projection registration, or EPSG transform errors."
---

## Workflow

1. **Initialize** the map via `MyOl` constructor with a container ID and options.
2. **Access modules** through lazy-loaded getters (`getPoint()`, `getLine()`, `getPolygon()`, `getTools()`).
3. **Add features** by passing data arrays and options to module methods.
4. **Clean up** by calling `destroy()` or event-manager dispose functions on unmount.

### Quick Start

```typescript
import { MyOl } from 'my-openlayer';

// 1. Initialize map (container element must exist in DOM)
const map = new MyOl('map-container', {
  center: [120.155, 30.274],
  zoom: 12,
  token: 'YOUR_TIANDITU_TOKEN'
});

// 2. Add point markers
const pointModule = map.getPoint();
pointModule.addPoint(
  [{ lgtd: 120.15, lttd: 30.27, name: 'Hangzhou HQ' }],
  { layerName: 'offices', img: '/icons/marker.png', textKey: 'name', scale: 0.8 }
);

// 3. Add many animated warning markers without per-point DOM animations
pointModule.addPulsePointLayer(
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

// 4. Listen for map ready
const eventMgr = map.getEventManager();
const unsub = eventMgr.on('rendercomplete', () => console.log('Map ready'));

// 5. Cleanup on unmount
onUnmounted(() => {
  unsub();       // remove listener
  map.destroy(); // release resources
});
```

### Error Recovery

- **Container not found**: Ensure the DOM element exists before `new MyOl(...)`. In Vue, initialize inside `onMounted`, never in `setup`.
- **Wrong coordinates**: The library expects `[longitude, latitude]` in EPSG:4326. EPSG:3857 projected values will misplace features.
- **Projection registration**: `MyOl` owns projection setup and explicitly registers EPSG:4326, EPSG:4490, and EPSG:4549 before OpenLayers proj4 registration. Do not ask app code to manually register EPSG:4326 for production builds.
- **Custom projection metadata**: When `projection.def` contains `+units=m`, let proj4/OpenLayers infer the unit. Only pass `projection.units` when explicitly overriding the inferred unit.
- **Clustering conflicts**: Enabling clustering replaces individual point rendering. Remove the existing non-clustered layer before switching.
- **Many animated markers**: Prefer `addPulsePointLayer` over `addDomPoint` when rendering large warning/village pulse point lists.
- **Event listener leaks**: Always call the dispose/unsubscribe function returned by `EventManager.on()` when the component unmounts.

## Core Components

- [MyOl](references/core-my-ol.md) — Map initialization, configuration, and module access.
- [Point](references/core-point.md) — Point features, clustering, high-performance pulse markers, and Vue template points.
- [Line](references/core-line.md) — Polyline features and styling.
- [Polygon](references/core-polygon.md) — Polygon features, heatmaps, and styling.
- [VueTemplatePoint](references/core-vue-template-point.md) — Vue components rendered as map overlays.

## Map Tools

- [MapTools](references/tool-map-tools.md) — Zoom, pan, export, z-index helpers.
- [MeasureHandler](references/tool-measure-handler.md) — Distance and area measurement.
- [SelectHandler](references/tool-select-handler.md) — Feature click/hover selection.
- [MapBaseLayers](references/tool-map-base-layers.md) — Base layer switching (Tianditu, ArcGIS).
- [RiverLayerManager](references/tool-river-layer-manager.md) — Specialized river system layers.

## Infrastructure

- [ConfigManager](references/infra-config-manager.md) — Centralized defaults and runtime config.
- [EventManager](references/infra-event-manager.md) — Event listening and dispatching.
- [ErrorHandler](references/infra-error-handler.md) — Error handling and logging.
- [ValidationUtils](references/infra-validation-utils.md) — Parameter and data validation.
