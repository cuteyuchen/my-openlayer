---
name: core-point
description: Management of point features, clustering, and markers
---

# Point Class

The `Point` class is used to add and manage point features on the map, supporting ordinary points, cluster points, DOM points, and Vue component points.

## Constructor

```typescript
constructor(map: Map)
```

- **map**: OpenLayers Map instance.

## Interface Definitions

### PointOptions

Inherits from `BaseOptions`, `StyleOptions`, `TextOptions`.

| Property | Type | Description |
| :--- | :--- | :--- |
| textKey | `string` | Field key in data for displaying text |
| img | `string` | URL of the icon image |
| scale | `number` | Icon scale factor |
| iconColor | `string` | Icon color (for changing icon hue) |
| layerName | `string` | Layer name (required, inherited from BaseOptions) |
| zIndex | `number` | Layer Z-index |
| visible | `boolean` | Whether the layer is visible |
| style | `Style \| Style[] \| ((feature: FeatureLike) => Style \| Style[])` | Custom style function |

### ClusterOptions

Inherits from `PointOptions`.

| Property | Type | Description |
| :--- | :--- | :--- |
| distance | `number` | Clustering distance (pixels), default is 20 |
| minDistance | `number` | Minimum clustering distance |

### PointData

| Property | Type | Description |
| :--- | :--- | :--- |
| lgtd | `number` | Longitude |
| lttd | `number` | Latitude |
| [key: string] | `any` | Other business data fields |

### VueTemplatePointOptions

| Property | Type | Description |
| :--- | :--- | :--- |
| Template | `any` | Vue component template |
| lgtd | `number` | Longitude |
| lttd | `number` | Latitude |
| props | `any` | Props passed to the component |
| styleType | `'default' \| 'custom'` | Style type |
| positioning | `string` | Positioning, e.g., 'bottom-center' |
| stopEvent | `boolean` | Whether to stop event propagation |
| visible | `boolean` | Whether visible |
| className | `string` | Custom class name |
| zIndex | `number` | Z-index |

## Methods

### addPoint

Add an ordinary point layer.

```typescript
addPoint(pointData: PointData[], options: PointOptions): VectorLayer<VectorSource> | null
```

- **pointData**: Array of point data.
- **options**: Configuration options.
- **Returns**: The created vector layer, or `null` if data is invalid.

### addClusterPoint

Add a cluster point layer.

```typescript
addClusterPoint(pointData: PointData[], options: ClusterOptions): VectorLayer<VectorSource> | null
```

- **pointData**: Array of point data.
- **options**: Cluster configuration options.
- **Returns**: The created cluster layer.

### addDomPoint

Add DOM element points (Overlay).

```typescript
addDomPoint(twinkleList: TwinkleItem[], callback?: Function): {
  anchors: Overlay[],
  remove: () => void,
  setVisible: (visible: boolean) => void
}
```

- **twinkleList**: Data list containing longitude, latitude, and class name.
- **callback**: Click callback function.
- **Returns**: Control object containing `remove` and `setVisible` methods.

### addVueTemplatePoint

Add Vue components as points.

```typescript
addVueTemplatePoint(pointDataList: PointData[], template: any, options?: VueTemplatePointOptions): {
  setVisible: (visible: boolean) => void,
  setOneVisibleByProp: (propName: string, propValue: any, visible: boolean) => void,
  remove: () => void,
  getPoints: () => VueTemplatePointInstance[]
}
```

- **pointDataList**: List of point data.
- **template**: Vue component.
- **options**: Configuration options.
- **Returns**: Control object containing display/hide and remove methods.

## Usage Examples

### Add Ordinary Points

```typescript
import { Point } from 'my-openlayers';

const point = new Point(map);
const data = [
  { lgtd: 116.40, lttd: 39.90, name: 'Beijing' },
  { lgtd: 121.47, lttd: 31.23, name: 'Shanghai' }
];

point.addPoint(data, {
  layerName: 'cities',
  img: 'path/to/icon.png',
  textKey: 'name',
  scale: 0.8
});
```

### Add Cluster Points

```typescript
point.addClusterPoint(data, {
  layerName: 'clusters',
  distance: 40,
  img: 'path/to/cluster-icon.png'
});
```

### Add Vue Component Points

```typescript
import MyComponent from './MyComponent.vue';

const ctrl = point.addVueTemplatePoint(data, MyComponent, {
  positioning: 'bottom-center',
  props: { status: 'active' }
});

// Hide all points
ctrl.setVisible(false);
```
