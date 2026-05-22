---
name: infra-error-handler
description: Unified error handling and logging utility with specific error subtypes
---

# ErrorHandler

`ErrorHandler` is a singleton utility class for unified management and dispatching of application errors. It supports different log levels and allows registering custom error callbacks.

## Import

```typescript
import { ErrorHandler, ErrorType, MyOpenLayersError, LayerNotFoundError, InvalidGeoJSONError, ProjectionError } from 'my-openlayer';
```

## Enums and Classes

### ErrorType

Defines possible error types in the system:

| Member | Value | Description |
| :--- | :--- | :--- |
| `VALIDATION_ERROR` | `'VALIDATION_ERROR'` | Parameter validation error |
| `MAP_ERROR` | `'MAP_ERROR'` | Map related error |
| `LAYER_ERROR` | `'LAYER_ERROR'` | Layer related error |
| `COORDINATE_ERROR` | `'COORDINATE_ERROR'` | Invalid coordinate error |
| `DATA_ERROR` | `'DATA_ERROR'` | Data format error |
| `COMPONENT_ERROR` | `'COMPONENT_ERROR'` | Component internal error |

### MyOpenLayersError

Custom error class inheriting from `Error`.

| Property | Type | Description |
| :--- | :--- | :--- |
| `message` | `string` | Error message |
| `type` | `ErrorType` | Error type |
| `timestamp` | `Date` | Timestamp when error occurred |
| `context` | `any` | Context data related to the error |

### LayerNotFoundError (3.0 New)

Thrown when a layer is looked up by name but does not exist on the map.

```typescript
class LayerNotFoundError extends MyOpenLayersError {
  constructor(layerName: string, context?: any)
}
```

### InvalidGeoJSONError (3.0 New)

Thrown when GeoJSON data fails to parse or has an invalid structure.

```typescript
class InvalidGeoJSONError extends MyOpenLayersError {
  constructor(reason: string, context?: any)
}
```

### ProjectionError (3.0 New)

Thrown when a projection cannot be resolved or a transform between two EPSG codes is unavailable.

```typescript
class ProjectionError extends MyOpenLayersError {
  constructor(reason: string, context?: any)
}
```

### Using Specific Error Types

```typescript
import { LayerNotFoundError, InvalidGeoJSONError, ProjectionError } from 'my-openlayer';

try {
  map.getPolygon().addPolygon(badData, { layerName: 'test' });
} catch (error) {
  if (error instanceof InvalidGeoJSONError) {
    console.error('GeoJSON 格式错误:', error.message, error.context);
  } else if (error instanceof LayerNotFoundError) {
    console.error('图层不存在:', error.message);
  } else if (error instanceof ProjectionError) {
    console.error('投影错误:', error.message);
  }
}
```

## Methods

### Static Methods

| Method | Parameters | Return | Description |
| :--- | :--- | :--- | :--- |
| `getInstance()` | - | `ErrorHandler` | Get singleton instance of `ErrorHandler` |
| `validate(condition, message, context?)` | `condition: boolean`<br>`message: string`<br>`context?: any` | `void` | Validate condition, throws `VALIDATION_ERROR` if `false` |
| `validateMap(map)` | `map: any` | `void` | Validate if map instance exists |
| `validateCoordinates(longitude, latitude)` | `longitude: number`<br>`latitude: number` | `void` | Validate if coordinates are valid |
| `validateLayerName(layerName)` | `layerName: string` | `void` | Validate if layer name is valid |
| `validateData(data, dataType)` | `data: any`<br>`dataType: string` | `void` | Validate if data exists |
| `safeExecute<T>(fn, errorMessage, errorType?, context?)` | `fn: () => T`<br>`errorMessage: string`<br>`errorType?: ErrorType`<br>`context?: any` | `T` | Safely execute function, catch and handle exceptions |

### Instance Methods

| Method | Parameters | Return | Description |
| :--- | :--- | :--- | :--- |
| `setLogLevel(level)` | `level: 'debug' \| 'info' \| 'warn' \| 'error'` | `void` | Set log level |
| `debug(...args)` | `...args: any[]` | `void` | Output debug log |
| `info(...args)` | `...args: any[]` | `void` | Output info log |
| `warn(...args)` | `...args: any[]` | `void` | Output warn log |
| `createAndHandleError(message, type, context?)` | `message: string`<br>`type: ErrorType`<br>`context?: any` | `MyOpenLayersError` | Create and handle error, notify listeners |

## Usage Examples

### Basic Validation

```typescript
import { ErrorHandler } from 'my-openlayer';

function setCenter(longitude: number, latitude: number) {
  // Validate coordinates, throws exception if invalid
  ErrorHandler.validateCoordinates(longitude, latitude);
  
  // ... set center logic
}
```

### Catch and Handle Error

```typescript
import { ErrorHandler, ErrorType } from 'my-openlayer';

try {
  // Code that might fail
  throw new Error('Something went wrong');
} catch (error) {
  ErrorHandler.getInstance().createAndHandleError(
    'Operation failed',
    ErrorType.COMPONENT_ERROR,
    { originalError: error }
  );
}
```

### Safe Execution

```typescript
import { ErrorHandler } from 'my-openlayer';

const result = ErrorHandler.safeExecute(
  () => {
    // Dangerous operation
    return JSON.parse(someJsonString);
  },
  'Failed to parse JSON',
  ErrorType.DATA_ERROR
);
```
