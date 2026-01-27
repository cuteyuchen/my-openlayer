# Point 点要素类

`Point` 类用于在地图上添加和管理点位要素，支持普通点位、聚合点位、DOM 点位和 Vue 组件点位。

## 方法

### 普通点位

- **addPoint(pointData: PointData[], options: PointOptions)**: 添加普通点位图层。
  - `pointData`: 点位数据数组，需包含 `lgtd` (经度) 和 `lttd` (纬度)。
  - `options`: 配置项，包括图标 `img`、文本 `textKey` 等。

### 聚合点位

- **addClusterPoint(pointData: PointData[], options: ClusterOptions)**: 添加聚合点位图层。
  - 会根据地图缩放级别自动聚合临近的点位。
  - `options.distance`: 聚合距离。

### DOM 与组件点位

- **addVueTemplatePoint(pointDataList: PointData[], template: any, options?)**: 添加 Vue 组件点位（推荐）。
  - 返回控制对象，包含 `setVisible`, `remove`, `getPoints` 等方法。
- **addDomPoint(twinkleList: TwinkleItem[], callback?)**: 添加原生 DOM 点位（底层实现）。

### 其他

- **locationAction(lgtd: number, lttd: number, zoom?: number, duration?: number)**: 定位到指定点。

## 使用示例

```typescript
const pointModule = map.getPoint();

// 1. 添加普通点位
const points = [
  { lgtd: 119.81, lttd: 29.969, name: '点A', type: 'station' },
  { lgtd: 119.82, lttd: 29.970, name: '点B', type: 'station' }
];

pointModule.addPoint(points, {
  layerName: 'station-layer',
  img: 'path/to/icon.png', // 图标路径
  scale: 0.8,
  textKey: 'name', // 显示 'name' 字段作为标注
  textFillColor: '#000',
  textOffsetY: 25
});

// 2. 添加聚合点位
pointModule.addClusterPoint(points, {
  layerName: 'cluster-layer',
  distance: 40, // 聚合像素距离
  img: 'path/to/cluster-icon.png'
});

// 3. 定位
pointModule.locationAction(119.81, 29.969, 15);
```
