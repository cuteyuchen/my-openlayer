# OpenLayers Helper Skill

This skill provides comprehensive documentation and helpers for the `my-openlayer` package. It is designed to assist developers in using the wrapper library effectively.

## Core Components

Essential classes for map initialization and basic feature management.

- [MyOl](references/core-my-ol.md) - Main entry point, map initialization, and module access.
- [Point](references/core-point.md) - Management of point features, clustering, and markers.
- [VueTemplatePoint](references/core-vue-template-point.md) - Integration of Vue components as map overlays.
- [Line](references/core-line.md) - Management of polyline features and styling.
- [Polygon](references/core-polygon.md) - Management of polygon features, heatmaps, and styling.

## Map Tools

Interactive tools and layer management utilities.

- [MapTools](references/tool-map-tools.md) - Common map operations (zoom, pan, export, etc.).
- [MeasureHandler](references/tool-measure-handler.md) - Distance and area measurement tools.
- [SelectHandler](references/tool-select-handler.md) - Feature selection and interaction handling.
- [MapBaseLayers](references/tool-map-base-layers.md) - Base layer switching (Tianditu, ArcGIS, etc.).
- [RiverLayerManager](references/tool-river-layer-manager.md) - Specialized manager for river system layers.

## Infrastructure

Low-level utilities, configuration, and event handling.

- [ConfigManager](references/infra-config-manager.md) - Centralized configuration and default values.
- [EventManager](references/infra-event-manager.md) - Unified event listening and dispatching system.
- [ErrorHandler](references/infra-error-handler.md) - Error handling, logging, and validation.
- [ValidationUtils](references/infra-validation-utils.md) - Parameter and data validation helpers.

## Usage Overview

### Initialization

```typescript
import { MyOl } from 'my-openlayer';

const map = new MyOl('map-container', {
  center: [120.15, 30.28],
  zoom: 12
});
```

### Accessing Modules

Modules are lazy-loaded via the `MyOl` instance:

```typescript
// Get Point module
const pointModule = map.getPoint();
pointModule.addPoint([...]);

// Get Tools module
const tools = map.getMapTools();
tools.zoomIn();
```
