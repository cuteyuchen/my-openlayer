---
name: core-point
description: Management of point features, clustering, pulse markers, and markers
---

# Point Class

The `Point` class is used to add and manage point features on the map, supporting ordinary points, cluster points, DOM points, high-performance pulse points, and Vue component points.

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

### PulsePointOptions

Inherits from `PointOptions`, so it follows the same `img`, `scale`, `iconColor`, `textKey`, and `textVisible` conventions as `addPoint`.

| Property | Type | Description |
| :--- | :--- | :--- |
| levelKey | `string` | Field used for point level, defaults to `lev` |
| icon | `PulsePointIconOptions` | Fallback vector dot config when `img` is not provided |
| pulse.enabled | `boolean` | Whether the pulse ring is enabled, default `true` |
| pulse.duration | `number` | One animation cycle duration, default `2400ms` |
| pulse.radius | `[number, number]` | Pulse ring radius range, default `[8, 26]` |
| pulse.colorMap | `Record<string \| number, string>` | Fill color map by level |
| pulse.strokeColorMap | `Record<string \| number, string>` | Stroke color map by level |
| pulse.strokeWidth | `number` | Pulse ring stroke width, default `0` |
| pulse.frameCount | `number` | Cached animation frame count, default `24` |

### PulsePointLayerHandle

| Property | Type | Description |
| :--- | :--- | :--- |
| layer | `VectorLayer<VectorSource>` | Created pulse point layer |
| source | `VectorSource` | Layer source |
| start | `() => void` | Start the pulse animation |
| stop | `() => void` | Stop the pulse animation |
| setVisible | `(visible: boolean) => void` | Toggle layer visibility |
| updateData | `(data: PointData[]) => void` | Replace point data |
| remove | `() => void` | Stop animation and remove the layer |

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

### addPulsePointLayer

Add a high-performance pulse point layer.

```typescript
addPulsePointLayer(pointData: PointData[], options: PulsePointOptions): PulsePointLayerHandle | null
```

- **pointData**: Array of point data.
- **options**: Pulse point options that reuse the icon, text, and layer option style from `addPoint`.
- **Returns**: Control object for starting/stopping animation, visibility, data updates, and removal; returns `null` if data is invalid.

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

### locationAction

Proxy to `MapTools.locationAction` for positioning the map from the point module.

```typescript
locationAction(
  lgtd: number,
  lttd: number,
  zoom = 20,
  duration = 3000,
  projection?: {
    dataProjection?: string;
    featureProjection?: string;
  }
): boolean
```

- **projection**: Optional source/target projection. Omit it for EPSG:4326 longitude/latitude.

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

### Add High-Performance Pulse Points

```typescript
const pulseCtrl = point.addPulsePointLayer(data, {
  layerName: 'village-warning-pulse',
  levelKey: 'lev',
  textKey: 'name',
  img: '/icons/village.svg',
  scale: 0.8,
  textVisible: true,
  pulse: {
    duration: 2400,
    radius: [8, 28],
    colorMap: {
      0: 'rgba(255, 48, 54, 0.48)',
      1: 'rgba(255, 136, 0, 0.45)',
      2: 'rgba(253, 216, 46, 0.4)',
      3: 'rgba(6, 183, 253, 0.32)'
    }
  }
});

pulseCtrl?.stop();
pulseCtrl?.start();
pulseCtrl?.updateData(data);
pulseCtrl?.remove();
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
