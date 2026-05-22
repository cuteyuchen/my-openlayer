---
name: tool-measure-handler
description: Distance and area measurement functionality
---

# MeasureHandler Class

The `MeasureHandler` class provides distance and area measurement functionality on the map.

## Constructor

```typescript
constructor(map: Map)
```

- **map**: OpenLayers Map instance.

## Type Definitions

### MeasureHandlerType

```typescript
type MeasureHandlerType = 'LineString' | 'Polygon';
```

## Methods

### start

Start measurement.

```typescript
start(type: MeasureHandlerType): void
```

- **type**: Measurement type, `'LineString'` (Distance) or `'Polygon'` (Area).
- **Description**: After calling this method, click on the map to start drawing, double-click to end drawing. Tooltips showing measurement results will be displayed during drawing.

### end

End measurement drawing interaction, but keep measurement results.

```typescript
end(): void
```

### clean

Clear all measurement results and interactions.

```typescript
clean(): void
```

- **Description**: Removes all measurement drawings, result labels, and tooltips from the map.

### destroy

Destroy the instance.

```typescript
destory(): void
```

- **Description**: Completely cleans up resources, same as `clean`.

## Usage Examples

### Measure Distance

```typescript
import { MeasureHandler } from 'my-openlayers';

const measureTool = new MeasureHandler(map);

// Start measuring distance
measureTool.start('LineString');
```

### Measure Area

```typescript
// Start measuring area
measureTool.start('Polygon');
```

### Clear Measurement

```typescript
// Clear all measurement results
measureTool.clean();
```
