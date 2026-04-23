# Line 线要素类

`Line` 类用于在地图上管理静态线和流动线，支持 GeoJSON 数据加载、自定义样式、图层管理以及沿线运动符号 / 流光动画。

## 构造函数

```typescript
const line = new Line(map: Map);
```

## 核心类型

### LineOptions

静态线配置，继承自 `BaseOptions`、`StyleOptions`、`TextOptions`。

| 属性 | 类型 | 说明 |
| :--- | :--- | :--- |
| `layerName` | `string` | 图层名称 |
| `strokeColor` | `string \| number[]` | 线颜色 |
| `strokeWidth` | `number` | 线宽 |
| `lineDash` | `number[]` | 虚线样式 |
| `lineDashOffset` | `number` | 虚线偏移 |
| `style` | `Style \| Style[] \| (feature) => Style \| Style[]` | 自定义静态线样式 |
| `dataProjection` | `string` | 输入数据投影 |
| `featureProjection` | `string` | 要素投影 |
| `projectionOptOptions` | `any` | 旧版投影参数，兼容保留 |

### FlowLineOptions

流动线配置，继承 `LineOptions`。

| 属性 | 类型 | 说明 |
| :--- | :--- | :--- |
| `loop` | `boolean` | 是否循环播放，默认 `true` |
| `autoStart` | `boolean` | 创建后是否自动开始，默认 `true` |
| `duration` | `number` | 单轮动画时长，默认 `4000` |
| `speed` | `number` | 动画速度倍率，小于等于 `0` 时回退为 `1` |
| `showBaseLine` | `boolean` | 是否显示基础静态线，默认 `true` |
| `animationMode` | `'icon' \| 'dash' \| 'icon+dash'` | 动画模式 |
| `flowSymbol` | `{ src?: string; scale?: number; color?: string; rotateWithView?: boolean; count?: number; spacing?: number }` | 沿线运动符号配置 |

### FlowLineLayerHandle

```typescript
interface FlowLineLayerHandle {
  layer: VectorLayer<VectorSource>
  animationLayer: VectorLayer<VectorSource>
  start: () => void
  pause: () => void
  resume: () => void
  stop: () => void
  setVisible: (visible: boolean) => void
  updateData: (data: MapJSONData) => void
  remove: () => void
}
```

- `layer` 始终是基础线图层。
- `animationLayer` 始终是动画图层。
- 即使 `showBaseLine: false`，handle 结构也保持完整。

## 公开方法

### addLine

```typescript
addLine(data: MapJSONData, options?: LineOptions): VectorLayer<VectorSource>
```

添加静态线图层。

### addLineByUrl

```typescript
addLineByUrl(url: string, options?: LineOptions): VectorLayer<VectorSource>
```

从 URL 加载并添加静态线图层。

### removeLineLayer

```typescript
removeLineLayer(layerName: string): void
```

移除静态线图层。

## 流动线 / 动态图标线

### addFlowLine

```typescript
addFlowLine(data: MapJSONData, options?: FlowLineOptions): FlowLineLayerHandle | null
```

支持 `LineString` 和 `MultiLineString`。`MultiLineString` 会在内部拆解后参与动画。
`flowSymbol.src` 不限于箭头，可以是船、车、粒子、标记等任意沿线运动符号；未传时内部会使用默认矢量 moving symbol。

### addFlowLineByUrl

```typescript
addFlowLineByUrl(url: string, options?: FlowLineOptions): Promise<FlowLineLayerHandle | null>
```

从 URL 加载 GeoJSON 后创建流动线。网络失败、JSON 解析失败、数据结构非法时返回 `null`。

### removeFlowLineLayer

```typescript
removeFlowLineLayer(layerName: string): void
```

按图层名移除流动线的基础图层与动画图层。

## 使用示例

### 基础静态线

```typescript
const lineModule = map.getLine();

lineModule.addLine(lineData, {
  layerName: 'base-line',
  strokeColor: '#ff0000',
  strokeWidth: 3
});
```

### 流动线基础用法

```typescript
const lineModule = map.getLine();
const flow = lineModule.addFlowLine(lineData, {
  layerName: 'river-flow',
  animationMode: 'icon+dash',
  strokeColor: '#19b1ff',
  strokeWidth: 3,
  lineDash: [18, 12],
  flowSymbol: {
    src: '/symbols/boat.svg',
    scale: 0.9,
    color: '#19b1ff',
    rotateWithView: true,
    count: 2,
    spacing: 0.2
  },
  duration: 3600
});
```

### pause / resume / remove

```typescript
flow?.pause();
flow?.resume();
flow?.stop();
flow?.remove();
```

### updateData

```typescript
flow?.updateData({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: '支流' },
      geometry: {
        type: 'MultiLineString',
        coordinates: [
          [[119.8, 29.9], [119.9, 30.0]],
          [[119.82, 30.02], [119.95, 30.06]]
        ]
      }
    }
  ]
});
```

### 显式投影字段示例

```typescript
lineModule.addFlowLine(projectedLineData, {
  layerName: 'projected-flow',
  animationMode: 'icon+dash',
  dataProjection: 'EPSG:4490',
  featureProjection: 'EPSG:3857',
  flowSymbol: {
    src: '/symbols/ship.svg',
    scale: 1,
    count: 1,
    spacing: 0.15
  }
});
```

默认输入按经纬度 GeoJSON 处理；如果地图使用其他投影，建议显式传入 `dataProjection` / `featureProjection`。

## 样式兼容说明

- `strokeColor`、`strokeWidth`、`lineDash`、`lineDashOffset`、`style` 继续兼容。
- 当传入 `style` 时，它只控制基础线图层，不直接控制 moving symbol。
- `animationMode: 'dash'` 未传虚线参数时，内部会补默认虚线样式，确保流光可见。
- `animationMode: 'icon+dash'` 会同时渲染：
  - 基础线图层
  - 动画虚线图层
  - `postrender` moving symbol 动画

## 与旧版 projectionOptOptions 的关系

- 新项目推荐使用 `dataProjection` / `featureProjection`。
- `projectionOptOptions` 仅用于兼容旧代码，不再作为主入口。
- 当两者同时存在时，显式字段 `dataProjection` / `featureProjection` 优先级更高。
