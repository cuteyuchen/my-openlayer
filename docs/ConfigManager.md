# ConfigManager 配置管理类

`ConfigManager` 用于统一管理库的默认配置项，提供配置合并和 ID 生成工具。

## 静态属性 (默认配置)

- **DEFAULT_POINT_OPTIONS**: 默认点位配置。
- **DEFAULT_LINE_OPTIONS**: 默认线要素配置。
- **DEFAULT_POLYGON_OPTIONS**: 默认面要素配置。
- **DEFAULT_CLUSTER_OPTIONS**: 默认聚合配置。
- **DEFAULT_HEATMAP_OPTIONS**: 默认热力图配置。
- **DEFAULT_IMAGE_OPTIONS**: 默认图片图层配置。
- **DEFAULT_MASK_OPTIONS**: 默认遮罩配置。
- **TIANDITU_CONFIG**: 天地图服务配置。

## 静态方法

- **mergeOptions<T>(defaultOptions: T, userOptions?: Partial<T>)**: 合并用户配置与默认配置。
- **generateId(prefix?: string)**: 生成带前缀的唯一 ID。
- **deepClone<T>(obj: T)**: 深度克隆对象。

## 使用示例

```typescript
import { ConfigManager, PointOptions } from 'my-openlayer';

// 1. 合并用户配置与默认配置
const userOptions: PointOptions = {
  layerName: 'my-points',
  visible: true
};

const finalOptions = ConfigManager.mergeOptions(
  ConfigManager.DEFAULT_POINT_OPTIONS,
  userOptions
);

// 2. 生成唯一 ID
const pointId = ConfigManager.generateId('point'); // 例如: point_169...
```
