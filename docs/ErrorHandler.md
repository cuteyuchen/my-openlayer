# ErrorHandler 错误处理

`ErrorHandler` 类是一个单例工具类，用于统一管理和分发应用程序中的错误。它支持不同的日志级别，并允许注册自定义错误回调。

## 导入

```typescript
import { ErrorHandler, ErrorType, MyOpenLayersError } from 'my-openlayer';
```

## 枚举与类定义

### ErrorType 枚举

定义了系统中可能的错误类型：

| 成员 | 值 | 描述 |
| :--- | :--- | :--- |
| `VALIDATION_ERROR` | `'VALIDATION_ERROR'` | 参数验证错误 |
| `MAP_ERROR` | `'MAP_ERROR'` | 地图相关错误 |
| `LAYER_ERROR` | `'LAYER_ERROR'` | 图层相关错误 |
| `COORDINATE_ERROR` | `'COORDINATE_ERROR'` | 坐标无效错误 |
| `DATA_ERROR` | `'DATA_ERROR'` | 数据格式错误 |
| `COMPONENT_ERROR` | `'COMPONENT_ERROR'` | 组件内部错误 |

### MyOpenLayersError 类

自定义错误类，继承自 `Error`。

| 属性 | 类型 | 描述 |
| :--- | :--- | :--- |
| `message` | `string` | 错误消息 |
| `type` | `ErrorType` | 错误类型 |
| `timestamp` | `Date` | 错误发生的时间戳 |
| `context` | `any` | 错误相关的上下文数据 |

## 方法

### 静态方法

| 方法名 | 参数 | 返回值 | 描述 |
| :--- | :--- | :--- | :--- |
| `getInstance()` | - | `ErrorHandler` | 获取 `ErrorHandler` 的单例实例 |
| `validate(condition, message, context?)` | `condition: boolean`<br>`message: string`<br>`context?: any` | `void` | 验证条件，如果为 `false` 则抛出 `VALIDATION_ERROR` |
| `validateMap(map)` | `map: any` | `void` | 验证地图实例是否存在 |
| `validateCoordinates(longitude, latitude)` | `longitude: number`<br>`latitude: number` | `void` | 验证经纬度坐标是否有效 |
| `validateLayerName(layerName)` | `layerName: string` | `void` | 验证图层名称是否有效 |
| `validateData(data, dataType)` | `data: any`<br>`dataType: string` | `void` | 验证数据是否存在 |
| `safeExecute<T>(fn, errorMessage, errorType?, context?)` | `fn: () => T`<br>`errorMessage: string`<br>`errorType?: ErrorType`<br>`context?: any` | `T` | 安全执行函数，捕获并处理异常 |

### 实例方法

| 方法名 | 参数 | 返回值 | 描述 |
| :--- | :--- | :--- | :--- |
| `setLogLevel(level)` | `level: 'debug' \| 'info' \| 'warn' \| 'error'` | `void` | 设置日志级别 |
| `debug(...args)` | `...args: any[]` | `void` | 输出调试日志 |
| `info(...args)` | `...args: any[]` | `void` | 输出信息日志 |
| `warn(...args)` | `...args: any[]` | `void` | 输出警告日志 |
| `createAndHandleError(message, type, context?)` | `message: string`<br>`type: ErrorType`<br>`context?: any` | `MyOpenLayersError` | 创建并处理错误，通知监听器 |

## 使用示例

### 基本验证

```typescript
import { ErrorHandler } from 'my-openlayer';

function setCenter(longitude: number, latitude: number) {
  // 验证坐标，如果不合法会自动抛出异常
  ErrorHandler.validateCoordinates(longitude, latitude);
  
  // ...设置中心点逻辑
}
```

### 捕获和处理错误

```typescript
import { ErrorHandler, ErrorType } from 'my-openlayer';

try {
  // 可能出错的代码
  throw new Error('Something went wrong');
} catch (error) {
  ErrorHandler.getInstance().createAndHandleError(
    'Operation failed',
    ErrorType.COMPONENT_ERROR,
    { originalError: error }
  );
}
```

### 安全执行函数

```typescript
import { ErrorHandler } from 'my-openlayer';

const result = ErrorHandler.safeExecute(
  () => {
    // 危险操作
    return JSON.parse(someJsonString);
  },
  'Failed to parse JSON',
  ErrorType.DATA_ERROR
);
```
