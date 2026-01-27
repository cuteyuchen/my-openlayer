# ValidationUtils 验证工具类

`ValidationUtils` 提供了一系列静态方法用于参数校验。

## 方法

- **isValidCoordinate(lng, lat)**: 检查坐标是否有效（数字且在范围内）。
- **validateLngLat(lng, lat)**: 简化的经纬度检查。
- **validateLayerName(name)**: 验证图层名称非空。
- **validateGeoJSONData(data)**: 验证 GeoJSON 数据格式。
- **isValidColor(color)**: 验证颜色字符串格式。
- **validateVueParams(...)**: 验证 Vue 组件点位所需的参数。

## 使用示例

```typescript
import { ValidationUtils } from 'my-openlayer';

// 1. 验证坐标
const lng = 120.1;
const lat = 30.2;

if (ValidationUtils.isValidCoordinate(lng, lat)) {
  console.log('坐标有效');
} else {
  console.error('坐标无效');
}

// 2. 验证颜色
if (ValidationUtils.isValidColor('#ff0000')) {
  // ...
}

// 3. 验证 GeoJSON
if (ValidationUtils.validateGeoJSONData(jsonData)) {
  // 安全地加载数据
}
```
