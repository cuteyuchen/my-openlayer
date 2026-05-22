---
name: infra-validation-utils
description: Parameter validation and data integrity checks
---

# ValidationUtils

`ValidationUtils` provides a set of static methods for validating various parameters and data in map operations, ensuring data integrity and type correctness.

## Import

```typescript
import { ValidationUtils } from 'my-openlayer';
```

## Static Methods

### Coordinate Validation

| Method | Parameters | Return | Description |
| :--- | :--- | :--- | :--- |
| `isValidCoordinate(longitude, latitude)` | `longitude: number`<br>`latitude: number` | `boolean` | Check if coordinates are valid (numbers and within legal range) |
| `validateLngLat(lgtd, lttd)` | `lgtd: number`<br>`lttd: number` | `boolean` | Compatibility boolean validator for longitude/latitude |
| `validateCoordinates(item)` | `item: { lgtd, lttd }` | `boolean` | Validate one point-like object with `lgtd` / `lttd` |
| `validateCoordinate(longitude, latitude)` | `longitude: number`<br>`latitude: number` | `void` | Validate coordinates, throw exception if invalid |

### Data Validation

| Method | Parameters | Return | Description |
| :--- | :--- | :--- | :--- |
| `validatePointData(pointData)` | `pointData: any[]` | `boolean` | Validate point data array |
| `validateGeoJSONData(data)` | `data: any` | `boolean` | Validate GeoJSON-like data with a `features` array |
| `validateOptions(options)` | `options: any` | `boolean` | Validate if options is an object |
| `validateImageData(imageData, allowEmptyImg?)` | `imageData: any`<br>`allowEmptyImg?: boolean` | `void` | Validate image layer data and optional extent |
| `validateMaskData(data)` | `data: any` | `void` | Validate mask data, throw exception if invalid |

### Object/Instance Validation

| Method | Parameters | Return | Description |
| :--- | :--- | :--- | :--- |
| `validateMapInstance(map)` | `map: any` | `void` | Validate if OpenLayers Map instance exists |
| `validateMap(map)` | `map: any` | `void` | General map instance presence validator |
| `validateElementId(id)` | `id: string` | `boolean` | Validate if DOM element ID exists |
| `validateVueParams(pointInfoList, template, Vue)` | `pointInfoList: any[]`<br>`template: any`<br>`Vue: any` | `boolean` | Validate Vue component related parameters |

### General Validation

| Method | Parameters | Return | Description |
| :--- | :--- | :--- | :--- |
| `validateRequired(value, message)` | `value: any`<br>`message: string` | `void` | Validate if value exists, otherwise throw exception with message |
| `validateType(value, expectedType, message)` | `value: any`<br>`expectedType: string`<br>`message: string` | `void` | Validate value type, otherwise throw exception with message |
| `isValidColor(color)` | `color: string` | `boolean` | Validate hex, rgb/rgba, or named color strings |
| `isValidLayerName(layerName)` | `layerName: string` | `boolean` | Validate non-empty layer names |
| `validateLayerName(layerName)` | `layerName: string` | `void` | Throw if layer name is empty |
| `validateLayerNameParam(layerName)` | `layerName: string \| string[]` | `void` | Throw if layer name parameter is not a non-empty string or valid string array |
| `isValidExtent(extent)` | `extent: number[]` | `boolean` | Validate `[minX, minY, maxX, maxY]` extent |
| `validateNumberRange(value, min, max)` | `value: number`<br>`min: number`<br>`max: number` | `boolean` | Validate numeric range |
| `validateNonEmptyString(str, message)` | `str: string`<br>`message: string` | `void` | Throw if string is empty |
| `validateMeasureType(type)` | `type: string` | `void` | Throw unless type is `LineString` or `Polygon` |
| `validatePositiveNumber(value, message)` | `value: number`<br>`message: string` | `void` | Throw if value is not positive |

## Usage Examples

### Validate Coordinates

```typescript
import { ValidationUtils } from 'my-openlayer';

const lng = 120.5;
const lat = 30.5;

if (ValidationUtils.isValidCoordinate(lng, lat)) {
  // Coordinates valid, proceed
  map.getView().setCenter([lng, lat]);
} else {
  console.error('Invalid coordinates');
}
```

### Validate Required Parameters

```typescript
function initLayer(map, options) {
  try {
    ValidationUtils.validateMapInstance(map);
    ValidationUtils.validateRequired(options, 'Options are required');
    
    // Initialize layer
  } catch (error) {
    console.error('Initialization failed:', error.message);
  }
}
```

### Validate Vue Component Parameters

```typescript
if (ValidationUtils.validateVueParams(points, MyComponent, Vue)) {
  // Create Vue overlay
  new VueTemplatePoint(map).addVueTemplatePoint(points, MyComponent);
}
```
