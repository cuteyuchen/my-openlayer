# OpenLayers 6.x 到 10.x 迁移指南

本指南帮助您从 my-openlayer v1.x.x (OpenLayers 6.15.1) 迁移到 v2.x.x (OpenLayers 10.6.1+)。

## 📋 迁移概览

### 版本对比

| 项目 | ol6-legacy 分支 | main 分支 |
|------|----------------|----------|
| **项目版本** | 1.x.x | 2.x.x |
| **OpenLayers** | 6.15.1 | 10.6.1+ |
| **Node.js** | 16+ | 18+ |
| **TypeScript** | 4.x+ | 5.x+ |

### 主要变更

- ✅ **API 兼容性**: 核心 API 保持向后兼容
- ✅ **类型安全**: 改进的 TypeScript 类型定义
- ✅ **性能提升**: OpenLayers 10.x 性能优化
- ⚠️ **依赖更新**: 部分依赖包版本要求提升
- ⚠️ **模块导入**: 部分内部模块导入方式调整

## 🚀 快速迁移步骤

### 1. 更新依赖

```bash
# 卸载旧版本
npm uninstall my-openlayer

# 安装新版本
npm install my-openlayer@latest

# 更新相关依赖
npm install ol@^10.6.1 proj4@^2.7.5 @turf/turf@^7.2.0
```

### 2. 检查 package.json

```json
{
  "dependencies": {
    "my-openlayer": "^2.0.0",
    "ol": "^10.6.1",
    "proj4": "^2.7.5",
    "@turf/turf": "^7.2.0"
  }
}
```

### 3. 代码迁移检查

大多数情况下，您的代码无需修改：

```typescript
// ✅ 这些代码在两个版本中都能正常工作
import MyOl, { MapInitType, PointOptions } from 'my-openlayer';

const map = new MyOl('map-container', {
  center: [119.81, 29.969],
  zoom: 10,
  token: 'your-token'
});

const point = map.getPoint();
point.addPoint(pointData, pointOptions);
```

## 🔍 详细迁移指南

### API 变更

#### 1. 核心 API (无变更)

```typescript
// ✅ 完全兼容 - 无需修改
const map = new MyOl(target, config);
const point = map.getPoint();
const line = map.getLine();
const polygon = map.getPolygon();
const tools = map.getTools();
```

#### 2. 类型定义 (改进)

```typescript
// v1.x.x (ol6-legacy)
interface PointOptions {
  layerName: string;
  nameKey?: string;
  // ...
}

// v2.x.x (main) - 类型更严格
interface PointOptions {
  layerName: string;
  textKey?: string; // 重命名：nameKey -> textKey
  // 更完整的类型定义
}
```

#### 3. 错误处理 (增强)

```typescript
// v2.x.x 新增统一错误处理
import { ErrorHandler } from 'my-openlayer';

try {
  map.getPoint().addPoint(data, options);
} catch (error) {
  ErrorHandler.handle(error, 'Point operation failed');
}
```

### 依赖变更

#### OpenLayers 内部变更

```typescript
// v1.x.x - 可能的内部导入
import VectorLayer from 'ol/layer/Vector';

// v2.x.x - 类型泛型改进
import VectorLayer from 'ol/layer/Vector';
import type { Feature } from 'ol';
import type { Geometry } from 'ol/geom';

// 现在支持更好的类型推断
const layer = new VectorLayer<Feature<Geometry>>();
```

### 配置迁移

#### 环境变量 (无变更)

```bash
# .env 文件保持不变
VUE_APP_TIANDITU_TOKEN=your_token
VUE_APP_MAP_CENTER_LON=119.81
VUE_APP_MAP_CENTER_LAT=29.969
```

#### 构建配置

```javascript
// vite.config.js / webpack.config.js
// 可能需要更新 TypeScript 配置
{
  "compilerOptions": {
    "target": "ES2020", // 从 ES2018 升级
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "node"
  }
}
```

## ⚠️ 潜在问题与解决方案

### 1. TypeScript 类型错误

**问题**: 升级后出现类型错误

```typescript
// 可能的错误
Property 'nameKey' does not exist on type 'PointOptions'
```

**解决方案**:

```typescript
// 更新属性名
const options: PointOptions = {
  layerName: 'test',
  textKey: 'name', // nameKey -> textKey
  // ...
};
```

### 2. 构建错误

**问题**: 构建时出现模块解析错误

**解决方案**:

```bash
# 清理缓存
npm run clean
rm -rf node_modules package-lock.json
npm install

# 重新构建
npm run build
```

### 3. 运行时错误

**问题**: 地图初始化失败

**解决方案**:

```typescript
// 检查配置对象
const config: MapInitType = {
  center: [119.81, 29.969],
  zoom: 10,
  token: process.env.VUE_APP_TIANDITU_TOKEN,
  // 确保所有必需属性都存在
};
```

## 🧪 测试迁移

### 1. 单元测试

```typescript
// 测试核心功能
describe('Migration Test', () => {
  it('should create map instance', () => {
    const map = new MyOl('test-container', config);
    expect(map).toBeDefined();
  });

  it('should add points', () => {
    const point = map.getPoint();
    expect(() => {
      point.addPoint(testData, testOptions);
    }).not.toThrow();
  });
});
```

### 2. 集成测试

```typescript
// 测试完整工作流
const testWorkflow = async () => {
  // 1. 初始化地图
  const map = new MyOl('map', config);
  
  // 2. 添加图层
  const baseLayers = map.getMapBaseLayers();
  baseLayers.switchBaseLayer('vec_c');
  
  // 3. 添加要素
  const point = map.getPoint();
  point.addPoint(pointData, pointOptions);
  
  // 4. 验证结果
  const layers = map.getTools().getAllLayers();
  expect(layers.length).toBeGreaterThan(0);
};
```

## 📈 性能优化建议

### 1. 利用新特性

```typescript
// v2.x.x 支持更好的懒加载
import { MyOl } from 'my-openlayer';

// 按需加载功能模块
const loadMapTools = async () => {
  const { MapTools } = await import('my-openlayer/tools');
  return new MapTools();
};
```

### 2. 内存管理

```typescript
// 更好的资源清理
class MapManager {
  private map: MyOl;
  
  destroy() {
    // v2.x.x 提供更完善的清理方法
    this.map.getTools().clearAllLayers();
    this.map = null;
  }
}
```

## 🔄 回滚策略

如果迁移过程中遇到问题，可以快速回滚：

```bash
# 回滚到 ol6-legacy 版本
npm uninstall my-openlayer
npm install my-openlayer@^1.0.0

# 恢复相关依赖
npm install ol@^6.15.1
```

## 📞 获取帮助

### 迁移支持

- 📖 [API 文档](./docs/api.md)
- 🐛 [问题反馈](https://github.com/your-repo/issues)
- 💬 [讨论区](https://github.com/your-repo/discussions)
- 📧 技术支持: support@example.com

### 常见问题

**Q: 迁移需要多长时间？**
A: 大多数项目可以在 1-2 小时内完成迁移，主要时间花在测试验证上。

**Q: 是否必须立即迁移？**
A: 不是必须的。ol6-legacy 分支会继续维护，但建议新项目使用 main 分支。

**Q: 迁移后性能会有提升吗？**
A: 是的，OpenLayers 10.x 在渲染性能和内存使用方面都有显著改进。

---

**建议**: 在生产环境部署前，请在测试环境中充分验证迁移结果。