---
name: infra-projection-manager
description: Standalone projection registration and resolution for custom EPSG codes
---

# ProjectionManager

`ProjectionManager` is a standalone class (3.0 new) that centralizes all projection registration and resolution logic. It was extracted from `MyOl` so users can register custom EPSG codes **before** creating any map instance.

## Import

```typescript
import { ProjectionManager, PROJECTIONS } from 'my-openlayer';
```

## Constants

### PROJECTIONS

Built-in EPSG codes:

| Key | Code | Description |
| :--- | :--- | :--- |
| `WGS84` | `EPSG:4326` | WGS84 longitude/latitude |
| `CGCS2000` | `EPSG:4490` | CGCS2000 longitude/latitude (default view projection) |
| `CGCS2000_3_DEGREE` | `EPSG:4549` | CGCS2000 3-degree belt projection |

## Methods

### register

Register a custom EPSG projection to proj4 + OpenLayers. Call this **before** creating `MyOl` instances.

```typescript
static register(registration: CustomProjectionRegistration): void
```

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `registration.code` | `string` | Yes | EPSG code, e.g. `'EPSG:4528'` |
| `registration.def` | `string` | Yes | proj4 definition string |
| `registration.extent` | `number[]` | No | Projection extent `[minX, minY, maxX, maxY]` |
| `registration.worldExtent` | `number[]` | No | Geographic world extent |
| `registration.units` | `Units` | No | Explicit unit override. Usually omit — let proj4 infer from `def` |

### initialize

Initialize built-in projections and apply custom projection from `MapInitType`. Called internally by `MyOl` constructor and `MyOl.createView()`. **Idempotent** — safe to call multiple times.

```typescript
static initialize(options?: MapInitType): void
```

### resolveViewProjection

Resolve the OL `Projection` for a view, reusing the registered projection when possible to preserve inferred units.

```typescript
static resolveViewProjection(options: MapInitType, code: string): Projection
```

## Usage Examples

### Register Custom Projection Before Map Creation

```typescript
import { ProjectionManager, MyOl } from 'my-openlayer';

// Register once, before any MyOl instance
ProjectionManager.register({
  code: 'EPSG:4528',
  def: '+proj=tmerc +lat_0=0 +lon_0=120 +k=1 +x_0=40500000 +y_0=0 +ellps=GRS80 +units=m +no_defs'
});

// Now use it in map creation
const map = new MyOl('map-container', {
  projection: { code: 'EPSG:4528' },
  center: [40500000, 3300000],
  zoom: 10
});
```

### Query Registered Projection

```typescript
import { get as olProjGetProjection } from 'ol/proj';

const proj = olProjGetProjection('EPSG:4528');
console.log(proj?.getCode());  // 'EPSG:4528'
console.log(proj?.getUnits()); // 'm' (inferred from proj4 def)
```

### Override Units Explicitly

```typescript
ProjectionManager.register({
  code: 'EPSG:4528',
  def: '+proj=tmerc +lat_0=0 +lon_0=120 +k=1 +x_0=40500000 +y_0=0 +ellps=GRS80 +units=m +no_defs',
  units: 'm' // Only needed when explicitly overriding inferred unit
});
```
