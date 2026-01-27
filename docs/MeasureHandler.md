# MeasureHandler 测量工具类

`MeasureHandler` 提供在地图上进行距离和面积测量的功能。

## 方法

- **start(type: 'LineString' | 'Polygon')**: 开始测量。
  - `'LineString'`: 测量距离（单位：m/km）。
  - `'Polygon'`: 测量面积（单位：m²/km²）。
- **end()**: 结束当前的绘制测量操作。
- **clean()**: 清除所有测量结果和绘制的图形。
- **destory()**: 销毁测量工具，释放资源。

## 交互说明

- 单击开始绘制。
- 双击结束绘制。
- 移动鼠标会显示实时测量提示。

## 使用示例

```typescript
import { MeasureHandler } from 'my-openlayer';

// 实例化测量工具（需要传入原生 ol.Map 对象）
const measure = new MeasureHandler(map.map);

// 1. 开始测距
document.getElementById('measure-dist-btn').onclick = () => {
  measure.start('LineString');
};

// 2. 开始测面
document.getElementById('measure-area-btn').onclick = () => {
  measure.start('Polygon');
};

// 3. 结束测量（停止绘制，保留图形）
document.getElementById('end-btn').onclick = () => {
  measure.end();
};

// 4. 清除结果（移除图形和提示）
document.getElementById('clear-btn').onclick = () => {
  measure.clean();
};
```
