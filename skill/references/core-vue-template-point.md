---
name: core-vue-template-point
description: Render Vue components as map markers/overlays
---

# VueTemplatePoint Class

`VueTemplatePoint` allows rendering Vue components directly as map point overlays (Overlay), supporting Vue 2 and Vue 3. It achieves this by creating Overlays and mounting Vue components into the DOM elements of the Overlays.

## Constructor

```typescript
constructor(map: Map)
```

- **Parameters**:
  - `map` (Map): OpenLayers Map instance.

## Interface Definitions

### VueTemplatePointOptions

Configuration options interface for Vue template points.

| Property | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| Template | `any` | Yes | - | Vue component template object. |
| lgtd | `number` | Yes | - | Longitude. |
| lttd | `number` | Yes | - | Latitude. |
| props | `Record<string, any>` | No | - | Props passed to the component. |
| positioning | `string` | No | `'center-center'` | Anchor point of the overlay relative to the position. See OpenLayers Overlay positioning. |
| stopEvent | `boolean` | No | `false` | Whether to stop map event propagation. |
| zIndex | `number` | No | - | z-index of the DOM element. |
| className | `string` | No | - | CSS class name of the DOM element. |
| visible | `boolean` | No | `true` | Initial visibility. |

## Methods

### addVueTemplatePoint

Adds a group of Vue component points.

```typescript
addVueTemplatePoint(
  pointDataList: any[], 
  template: any, 
  options?: {
    positioning?: string,
    stopEvent?: boolean
  }
): VueTemplatePointController
```

- **Parameters**:
  - `pointDataList` (any[]): List of point data. Each object in the list must contain `lgtd` (longitude) and `lttd` (latitude) properties.
  - `template` (any): Vue component object.
  - `options` (Object): Optional configuration.
    - `positioning`: Overlay anchor point (e.g., `'center-center'`, `'bottom-center'`, etc.).
    - `stopEvent`: Whether to stop event propagation (default `false`).

- **Returns**:
  Returns a control object `VueTemplatePointController` used to manage this group of points in batches.

### VueTemplatePointController Interface

The object returned by `addVueTemplatePoint` contains the following methods:

| Method | Description |
| :--- | :--- |
| `setVisible(visible: boolean): void` | Sets the visibility of all points in this group. |
| `setOneVisibleByProp(propName: string, propValue: any, visible: boolean): void` | Controls the visibility of specific points based on property values in point data. |
| `remove(): void` | Removes all points in this group and destroys component instances. |
| `getPoints(): VueTemplatePointInstance[]` | Gets the list of all underlying point instances created in this group. |

### getPointById

Gets a single point instance by ID.

```typescript
getPointById(id: string): VueTemplatePointInstance | undefined
```

### getAllPoints

Gets all managed point instances.

```typescript
getAllPoints(): VueTemplatePointInstance[]
```

### removeAllPoints

Removes and destroys all points.

```typescript
removeAllPoints(): void
```

### getPointCount

Gets the number of currently managed points.

```typescript
getPointCount(): number
```

## VueTemplatePointInstance Instance Methods

Methods provided by a single point instance (`VueTemplatePointInstance`):

| Method | Description |
| :--- | :--- |
| `setVisible(visible: boolean): void` | Sets the visibility of the current point. |
| `isVisible(): boolean` | Gets the current visibility status. |
| `updatePosition(lgtd: number, lttd: number): void` | Updates point longitude and latitude. |
| `getPosition(): number[]` | Gets current position `[lgtd, lttd]`. |
| `updateProps(newProps: Record<string, any>): void` | Updates props passed to the component. |
| `setStyle(styles: Partial<CSSStyleDeclaration>): void` | Sets CSS styles for the DOM element. |
| `addClass(className: string): void` | Adds a CSS class name. |
| `removeClass(className: string): void` | Removes a CSS class name. |
| `remove(): void` | Removes and destroys the current point. |
| `getId(): string` | Gets the unique ID of the point. |
| `getDomElement(): HTMLElement` | Gets the DOM element corresponding to the point. |

## Usage Examples

### Vue 3 Example

```typescript
import { MyOl } from 'my-openlayer';
import MyPopup from './MyPopup.vue'; // Your Vue component

const map = new MyOl('map-container');
const vuePointManager = map.getPoint();

const pointData = [
  { lgtd: 120.1, lttd: 30.2, title: 'Location 1', status: 'normal' },
  { lgtd: 120.2, lttd: 30.3, title: 'Location 2', status: 'warning' }
];

// 1. Add component points
const pointsController = vuePointManager.addVueTemplatePoint(
  pointData,
  MyPopup,
  {
    positioning: 'bottom-center',
    stopEvent: true // Allow component interaction, block map clicks
  }
);

// 2. Batch control visibility
pointsController.setVisible(false);

// 3. Control specific points based on properties
pointsController.setOneVisibleByProp('status', 'warning', true);

// 4. Get individual instances for fine-grained control
const instances = pointsController.getPoints();
if (instances.length > 0) {
  const firstPoint = instances[0];
  
  // Update position
  firstPoint.updatePosition(120.15, 30.25);
  
  // Update Props
  firstPoint.updateProps({
    pointData: { ...pointData[0], title: 'Updated Title' }
  });
  
  // Add style class
  firstPoint.addClass('highlight-point');
}

// 5. Remove this group of points
// pointsController.remove();
```

### Vue Component Writing Standard (MyPopup.vue)

The component will receive `pointData` as props, containing the corresponding data item from the passed `pointDataList`.

```vue
<template>
  <div class="popup" :class="pointData.status">
    <h3>{{ pointData.title }}</h3>
    <p>Status: {{ pointData.status }}</p>
    <button @click="handleClick">Details</button>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  pointData: {
    type: Object,
    required: true
  }
});

const handleClick = () => {
  console.log('Clicked point:', props.pointData.title);
};
</script>

<style scoped>
.popup {
  background: white;
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  min-width: 150px;
  transform: translate(-50%, -100%); /* Adjust for bottom-center positioning */
}
.popup.warning {
  border: 2px solid orange;
}
</style>
```
