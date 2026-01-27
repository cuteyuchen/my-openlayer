# Line 线要素类

`Line` 类用于在地图上绘制线要素，支持 GeoJSON 数据加载。

## 方法

- **addLine(data: MapJSONData, options?: LineOptions)**: 添加线要素图层。
  - `data`: GeoJSON 格式的数据。
  - `options`: 配置项，支持 `strokeColor` (颜色), `strokeWidth` (宽度), `lineDash` (虚线) 等。

- **addLineByUrl(url: string, options?: LineOptions)**: 从 URL 加载并添加线要素图层。

- **removeLineLayer(layerName: string)**: 根据图层名称移除线图层。

## 使用示例

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
      properties: { name: '线路1' }
    }
  ]
};

// 1. 添加线图层
lineModule.addLine(lineData, {
  layerName: 'my-line-layer',
  strokeColor: '#ff0000',
  strokeWidth: 4,
  lineDash: [10, 10], // 虚线样式
  zIndex: 10
});

// 2. 从 URL 加载
lineModule.addLineByUrl('http://example.com/lines.json', {
  layerName: 'url-line-layer',
  strokeColor: 'blue'
});

// 3. 移除图层
lineModule.removeLineLayer('my-line-layer');
```
