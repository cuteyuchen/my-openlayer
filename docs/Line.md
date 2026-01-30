# Line 线要素类

`Line` 类用于在地图上绘制线要素，支持 GeoJSON 数据加载、自定义样式和图层管理。

## 构造函数

```typescript
const line = new Line(map: Map);
```

- **map**: OpenLayers 地图实例。

## 接口定义

### LineOptions

配置线图层的样式、属性和行为。继承自 `BaseOptions`, `StyleOptions`, `TextOptions`。

| 属性 | 类型 | 说明 |
| :--- | :--- | :--- |
| **基础配置** | | |
| `layerName` | `string` | 图层名称，用于唯一标识和管理图层 |
| `zIndex` | `number` | 图层层级，默认自动处理 |
| `visible` | `boolean` | 图层是否可见，默认 `true` |
| `opacity` | `number` | 图层透明度 (0-1) |
| `fitView` | `boolean` | 添加要素后是否自动缩放视图以适应要素范围 |
| **样式配置** | | |
| `strokeColor` | `string` \| `number[]` | 线条颜色，如 `'#ff0000'` 或 `[255, 0, 0, 1]` |
| `strokeWidth` | `number` | 线条宽度（像素） |
| `lineDash` | `number[]` | 虚线模式，如 `[10, 10]` 表示 10px 实线 10px 间隔 |
| `lineDashOffset` | `number` | 虚线偏移量 |
| `style` | `Style` \| `Function` | 自定义 OpenLayers 样式或样式函数 |
| **文本标注** | | |
| `textVisible` | `boolean` | 是否显示文本标注 |
| `textCallBack` | `(feature) => string` | 获取文本内容的回调函数 |
| `textFont` | `string` | 字体样式，默认 `'12px sans-serif'` |
| `textFillColor` | `string` | 文本填充颜色 |
| `textStrokeColor` | `string` | 文本描边颜色 |
| `textStrokeWidth` | `number` | 文本描边宽度 |
| `textOffsetY` | `number` | 文本 Y 轴偏移量 |
| **其他** | | |
| `type` | `string` | 线条类型标识，会写入 Feature 的属性中 |

### MapJSONData (GeoJSON)

标准的 GeoJSON 格式数据结构。

```typescript
interface MapJSONData {
  type: string;        // 通常为 "FeatureCollection"
  name?: string;       // 数据集名称
  features: FeatureData[]; // 要素数组
}

interface FeatureData {
  type: string;        // "Feature"
  properties: any;     // 属性对象
  geometry: {
    type: "LineString" | "MultiLineString";
    coordinates: number[][] | number[][][];
  };
}
```

## 方法

### addLine

添加线要素图层。

```typescript
addLine(data: MapJSONData, options?: LineOptions): VectorLayer<VectorSource>
```

| 参数 | 类型 | 说明 |
| :--- | :--- | :--- |
| `data` | `MapJSONData` | GeoJSON 格式的线数据 |
| `options` | `LineOptions` | 图层配置项 |

**返回**: 创建的 `VectorLayer` 实例。

### addLineByUrl

从 URL 加载并添加线要素图层。

```typescript
addLineByUrl(url: string, options?: LineOptions): VectorLayer<VectorSource>
```

| 参数 | 类型 | 说明 |
| :--- | :--- | :--- |
| `url` | `string` | GeoJSON 数据的 URL 地址 |
| `options` | `LineOptions` | 图层配置项 |

**返回**: 创建的 `VectorLayer` 实例。

### removeLineLayer

根据图层名称移除线图层。

```typescript
removeLineLayer(layerName: string): void
```

| 参数 | 类型 | 说明 |
| :--- | :--- | :--- |
| `layerName` | `string` | 要移除的图层名称 |

## 使用示例

### 基础用法

```typescript
const lineModule = map.getLine();

// GeoJSON 数据
const lineData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [[119.8, 29.9], [119.9, 30.0]]
      },
      properties: { name: '线路1', status: 'active' }
    }
  ]
};

// 添加红色实线
lineModule.addLine(lineData, {
  layerName: 'base-line',
  strokeColor: '#ff0000',
  strokeWidth: 3,
  fitView: true
});
```

### 虚线与标注

```typescript
lineModule.addLine(lineData, {
  layerName: 'dash-line',
  strokeColor: '#0000ff',
  strokeWidth: 2,
  lineDash: [10, 5], // 10px实线，5px间隔
  textVisible: true,
  textFillColor: '#000',
  textStrokeColor: '#fff',
  textStrokeWidth: 2,
  // 动态获取显示的文本
  textCallBack: (feature) => feature.get('name')
});
```

### 自定义样式函数

```typescript
import { Style, Stroke } from 'ol/style';

lineModule.addLine(lineData, {
  layerName: 'custom-style-line',
  // 根据属性动态设置颜色
  style: (feature) => {
    const status = feature.get('properties').status;
    const color = status === 'active' ? 'green' : 'gray';
    
    return new Style({
      stroke: new Stroke({
        color: color,
        width: 4
      })
    });
  }
});
```

### 从接口加载

```typescript
lineModule.addLineByUrl('/api/lines/all.json', {
  layerName: 'api-lines',
  strokeColor: 'orange',
  strokeWidth: 2
});
```
