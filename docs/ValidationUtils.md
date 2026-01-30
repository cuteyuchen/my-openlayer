# ValidationUtils 验证工具

`ValidationUtils` 提供了一系列静态方法，用于验证地图操作中的各种参数和数据，确保数据的完整性和类型正确性。

## 导入

```typescript
import { ValidationUtils } from 'my-openlayer';
```

## 静态方法

### 坐标验证

| 方法名 | 参数 | 返回值 | 描述 |
| :--- | :--- | :--- | :--- |
| `isValidCoordinate(longitude, latitude)` | `longitude: number`<br>`latitude: number` | `boolean` | 验证经纬度坐标是否有效（数字且在合法范围内） |
| `validateCoordinate(longitude, latitude)` | `longitude: number`<br>`latitude: number` | `void` | 验证经纬度，无效时抛出异常 |

### 数据验证

| 方法名 | 参数 | 返回值 | 描述 |
| :--- | :--- | :--- | :--- |
| `validatePointData(pointData)` | `pointData: any[]` | `boolean` | 验证点位数据数组是否有效 |
| `validateOptions(options)` | `options: any` | `boolean` | 验证配置选项是否为对象 |
| `validateMaskData(data)` | `data: any` | `void` | 验证遮罩数据，无效时抛出异常 |

### 对象/实例验证

| 方法名 | 参数 | 返回值 | 描述 |
| :--- | :--- | :--- | :--- |
| `validateMapInstance(map)` | `map: any` | `void` | 验证 OpenLayers 地图实例是否存在 |
| `validateElementId(id)` | `id: string` | `boolean` | 验证 DOM 元素 ID 是否存在 |
| `validateVueParams(pointInfoList, template, Vue)` | `pointInfoList: any[]`<br>`template: any`<br>`Vue: any` | `boolean` | 验证 Vue 组件相关参数 |

### 通用验证

| 方法名 | 参数 | 返回值 | 描述 |
| :--- | :--- | :--- | :--- |
| `validateRequired(value, message)` | `value: any`<br>`message: string` | `void` | 验证值是否存在，否则抛出带消息的异常 |
| `validateType(value, expectedType, message)` | `value: any`<br>`expectedType: string`<br>`message: string` | `void` | 验证值类型，否则抛出带消息的异常 |

## 使用示例

### 验证坐标

```typescript
import { ValidationUtils } from 'my-openlayer';

const lng = 120.5;
const lat = 30.5;

if (ValidationUtils.isValidCoordinate(lng, lat)) {
  // 坐标有效，执行操作
  map.getView().setCenter([lng, lat]);
} else {
  console.error('Invalid coordinates');
}
```

### 验证必填参数

```typescript
function initLayer(map, options) {
  try {
    ValidationUtils.validateMapInstance(map);
    ValidationUtils.validateRequired(options, 'Options are required');
    
    // 初始化图层
  } catch (error) {
    console.error('Initialization failed:', error.message);
  }
}
```

### 验证 Vue 组件参数

```typescript
if (ValidationUtils.validateVueParams(points, MyComponent, Vue)) {
  // 创建 Vue 覆盖物
  new VueTemplatePoint(map).addVueTemplatePoint(points, MyComponent);
}
```
