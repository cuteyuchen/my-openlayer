---
name: infra-event-manager
description: Unified map event management and type-safe event handling
---

# EventManager

`EventManager` provides unified management for map events, offering a simple API to listen, remove, and trigger map events. It wraps OpenLayers' native event system and provides type-safe event handling.

## Import

```typescript
import { EventManager, MapEventData } from 'my-openlayer';
```

## Interfaces

### MapEventData

Unified event data structure received by callback functions.

| Property | Type | Description |
| :--- | :--- | :--- |
| `type` | `MapEventType` | Event type |
| `originalEvent` | `Event` | Original DOM event object (optional) |
| `coordinate` | `number[]` | Geographic coordinate where event occurred (optional) |
| `pixel` | `Pixel` | Screen pixel coordinate where event occurred (optional) |
| `features` | `FeatureLike[]` | List of features at event location (optional) |
| `feature` | `FeatureLike` | First feature at event location (optional) |
| `zoom` | `number` | Current map zoom level (optional) |
| `[key: string]` | `any` | Other custom properties |

### MapEventType

Supported event type strings:
`'click'` | `'dblclick'` | `'hover'` | `'moveend'` | `'zoomend'` | `'pointermove'` | `'rendercomplete'` | `'error'`

## Constructor

```typescript
constructor(map: Map)
```

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `map` | `Map` | OpenLayers Map instance |

## Methods

### Listen to Event

```typescript
on(type: MapEventType, callback: EventCallback, options?: { once?: boolean; filter?: (event: MapEventData) => boolean; }): string
```

Registers an event listener.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `type` | `MapEventType` | Event type |
| `callback` | `EventCallback` | Event callback function |
| `options` | `object` | Listener options (optional) |
| `options.once` | `boolean` | Whether to trigger only once |
| `options.filter` | `function` | Event filter, callback is not triggered if returns false |

**Returns**: `string` - Listener ID, used to remove listener.

### Remove Listener

```typescript
off(id: string): boolean
```

Removes an event listener by ID.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Listener ID |

**Returns**: `boolean` - Whether removal was successful.

### Clear All Listeners

```typescript
clear(): void
```

Removes all registered event listeners.

## Usage Examples

### Basic Event Listening

```typescript
import { MyOl } from 'my-openlayer';

const myOl = new MyOl('map-container');
const eventManager = myOl.getEventManager();

// Listen to click event
const clickId = eventManager.on('click', (event) => {
  console.log('Clicked at:', event.coordinate);
  
  if (event.feature) {
    console.log('Clicked feature:', event.feature);
  }
});

// Listen to zoom end
eventManager.on('zoomend', (event) => {
  console.log('Current zoom:', event.zoom);
});
```

### One-time Listener

```typescript
// Listen to click only once
eventManager.on('click', (event) => {
  console.log('First click only');
}, { once: true });
```

### Filtered Listener

```typescript
// Listen only to clicks on features with specific property
eventManager.on('click', (event) => {
  console.log('Clicked special feature');
}, {
  filter: (event) => {
    if (!event.feature) return false;
    const props = event.feature.getProperties();
    return props.type === 'special';
  }
});
```

### Remove Listener

```typescript
// Stop listening
eventManager.off(clickId);

// Or clear all
eventManager.clear();
```
