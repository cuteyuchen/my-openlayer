# MyOl 核心类

`MyOl` 是地图组件库的入口类，负责初始化地图实例并提供对各个功能模块的访问入口。

## 构造函数

```typescript
new MyOl(id: string | HTMLElement, options?: MapInitType)
```

- **id**: 地图容器的 ID 或 DOM 元素。
- **options**: 地图初始化配置项。

## 方法

### 模块获取

- **getPoint()**: 获取点要素操作实例 `Point`。
- **getLine()**: 获取线要素操作实例 `Line`。
- **getPolygon()**: 获取面要素操作实例 `Polygon`。
- **getMapBaseLayers()**: 获取底图管理实例 `MapBaseLayers`。
- **getTools()**: 获取地图工具实例 `MapTools`。
- **getSelectHandler()**: 获取要素选择实例 `SelectHandler`。
- **getEventManager()**: 获取事件管理实例 `EventManager`。
- **getErrorHandler()**: 获取错误处理实例 `ErrorHandler`。
- **getConfigManager()**: 获取配置管理实例 `ConfigManager`。

### 地图操作

- **locationAction(longitude: number, latitude: number, zoom?: number, duration?: number)**: 地图定位到指定坐标。
- **resetPosition(duration?: number)**: 重置地图位置到初始中心点。
- **destroy()**: 销毁地图实例及相关资源。

### 静态方法

- **createView(options: MapInitType)**: 创建地图视图。

## 使用示例

```typescript
import MyOl, { MapInitType } from 'my-openlayer';

// 1. 定义配置
const options: MapInitType = {
  center: [119.81, 29.969],
  zoom: 10,
  minZoom: 3,
  maxZoom: 18,
  token: '您的天地图Token', // 可选，用于加载天地图
  annotation: true // 是否显示注记
};

// 2. 初始化地图
const map = new MyOl('map-container', options);

// 3. 获取功能模块
const pointModule = map.getPoint();
const lineModule = map.getLine();

// 4. 地图操作
map.locationAction(120.15, 30.28, 12); // 定位到杭州
```
