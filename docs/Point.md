# Point 类

`Point` 类用于在地图上添加和管理点要素，支持普通点、聚合点、DOM 点和 Vue 组件点。

## 构造函数

```typescript
constructor(map: Map)
```

- **map**: OpenLayers 地图实例。

## 接口定义

### PointOptions

继承自 `BaseOptions`, `StyleOptions`, `TextOptions`。

| 属性名 | 类型 | 说明 |
| :--- | :--- | :--- |
| textKey | `string` | 数据中用于显示文本的字段键名 |
| img | `string` | 图标图片的 URL |
| scale | `number` | 图标缩放比例 |
| iconColor | `string` | 图标颜色（用于改变图标色调） |
| layerName | `string` | 图层名称（必填，继承自 BaseOptions） |
| zIndex | `number` | 图层层级 |
| visible | `boolean` | 是否可见 |
| style | `Style \| Style[] \| ((feature: FeatureLike) => Style \| Style[])` | 自定义样式函数 |

### ClusterOptions

继承自 `PointOptions`。

| 属性名 | 类型 | 说明 |
| :--- | :--- | :--- |
| distance | `number` | 聚合距离（像素），默认为 20 |
| minDistance | `number` | 最小聚合距离 |

### PointData

| 属性名 | 类型 | 说明 |
| :--- | :--- | :--- |
| lgtd | `number` | 经度 |
| lttd | `number` | 纬度 |
| [key: string] | `any` | 其他业务数据字段 |

### VueTemplatePointOptions

| 属性名 | 类型 | 说明 |
| :--- | :--- | :--- |
| Template | `any` | Vue 组件模板 |
| lgtd | `number` | 经度 |
| lttd | `number` | 纬度 |
| props | `any` | 传递给组件的 props |
| styleType | `'default' \| 'custom'` | 样式类型 |
| positioning | `string` | 定位方式，如 'bottom-center' |
| stopEvent | `boolean` | 是否阻止事件冒泡 |
| visible | `boolean` | 是否可见 |
| className | `string` | 自定义类名 |
| zIndex | `number` | 层级 |

## 方法

### addPoint

添加普通点图层。

```typescript
addPoint(pointData: PointData[], options: PointOptions): VectorLayer<VectorSource> | null
```

- **pointData**: 点位数据数组。
- **options**: 配置选项。
- **返回值**: 创建的向量图层，如果数据无效返回 `null`。

### addClusterPoint

添加聚合点图层。

```typescript
addClusterPoint(pointData: PointData[], options: ClusterOptions): VectorLayer<VectorSource> | null
```

- **pointData**: 点位数据数组。
- **options**: 聚合配置选项。
- **返回值**: 创建的聚合图层。

### addDomPoint

添加 DOM 元素点（Overlay）。

```typescript
addDomPoint(twinkleList: TwinkleItem[], callback?: Function): {
  anchors: Overlay[],
  remove: () => void,
  setVisible: (visible: boolean) => void
}
```

- **twinkleList**: 包含经纬度和类名的数据列表。
- **callback**: 点击回调函数。
- **返回值**: 控制对象，包含 `remove` 和 `setVisible` 方法。

### addVueTemplatePoint

添加 Vue 组件作为点位。

```typescript
addVueTemplatePoint(pointDataList: PointData[], template: any, options?: VueTemplatePointOptions): {
  setVisible: (visible: boolean) => void,
  setOneVisibleByProp: (propName: string, propValue: any, visible: boolean) => void,
  remove: () => void,
  getPoints: () => VueTemplatePointInstance[]
}
```

- **pointDataList**: 点位数据列表。
- **template**: Vue 组件。
- **options**: 配置选项。
- **返回值**: 控制对象，包含显示/隐藏和移除方法。

## 使用示例

### 添加普通点

```typescript
import { Point } from 'my-openlayers';

const point = new Point(map);
const data = [
  { lgtd: 116.40, lttd: 39.90, name: '北京' },
  { lgtd: 121.47, lttd: 31.23, name: '上海' }
];

point.addPoint(data, {
  layerName: 'cities',
  img: 'path/to/icon.png',
  textKey: 'name',
  scale: 0.8
});
```

### 添加聚合点

```typescript
point.addClusterPoint(data, {
  layerName: 'clusters',
  distance: 40,
  img: 'path/to/cluster-icon.png'
});
```

### 添加 Vue 组件点

```typescript
import MyComponent from './MyComponent.vue';

const ctrl = point.addVueTemplatePoint(data, MyComponent, {
  positioning: 'bottom-center',
  props: { status: 'active' }
});

// 隐藏所有点
ctrl.setVisible(false);
```
