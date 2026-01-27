# ErrorHandler 错误处理类

`ErrorHandler` 是一个单例类，提供全局的错误捕获、日志记录和回调分发机制。

## 方法

- **getInstance()**: 获取单例实例。
- **addErrorCallback(callback)**: 添加全局错误监听回调。
- **handleError(error: MyOpenLayersError)**: 手动触发错误处理。
- **validate(condition, message, context)**: 断言验证，失败则抛出错误。
- **setEnabled(enabled: boolean)**: 启用/禁用日志。
- **setLogLevel(level)**: 设置日志级别 (`debug`, `info`, `warn`, `error`)。

## 静态验证方法

- **validateMap(map)**: 验证地图实例。
- **validateCoordinates(lng, lat)**: 验证经纬度有效性。
- **validateLayerName(name)**: 验证图层名称。

## 使用示例

```typescript
import { ErrorHandler, MyOpenLayersError } from 'my-openlayer';

// 1. 获取实例
const errorHandler = ErrorHandler.getInstance();

// 2. 注册全局错误监听
errorHandler.addErrorCallback((error) => {
  console.error('地图组件发生错误:', error.message);
  // 上报错误监控系统
});

// 3. 手动验证数据
try {
  ErrorHandler.validateCoordinates(200, 0); // 将抛出错误，因为经度超出范围
} catch (e) {
  // 处理验证错误
}

// 4. 手动触发错误
errorHandler.handleError(
  new MyOpenLayersError('自定义错误消息', 'CUSTOM_ERROR', { detail: '...' })
);
```
