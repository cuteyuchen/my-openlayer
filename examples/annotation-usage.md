# 注记图层功能使用说明

## 概述

新版本的 MapBaseLayers 类提供了更灵活的注记图层管理功能。注记图层不再与底图图层绑定，而是作为独立的图层进行管理，支持动态切换注记类型和控制显示状态。

## 主要特性

- **独立管理**：注记图层不再与基本图层绑定，可以独立控制
- **默认注记**：当 `annotation: true` 时，默认加载 `cia_c`（影像注记）
- **灵活切换**：支持在 `cva_c`、`cia_c`、`cta_c` 三种注记类型间切换
- **显示控制**：可以独立控制注记图层的显示/隐藏
- **状态查询**：提供方法查询当前注记类型和可见状态
- **正确层级**：注记图层始终显示在基本图层之上
- **剪切支持**：注记图层支持地图剪切处理
- **自动调整**：切换底图时注记层级自动调整

## 主要变更

### 1. 注记图层独立管理
- 注记图层不再添加到 `layers` 对象中
- 注记图层作为独立的图层实例进行管理
- 支持独立控制注记图层的显示/隐藏

### 2. 默认注记类型
- 当 `annotation: true` 时，默认加载 `cia_c`（影像注记）
- 注记图层默认为可见状态

### 3. 新增方法
- `switchAnnotationLayer()` - 切换注记类型
- `getCurrentAnnotationType()` - 获取当前注记类型
- `setAnnotationVisible()` - 设置注记可见性
- `isAnnotationVisible()` - 检查注记是否可见

## 使用方法

### 基本初始化

```javascript
import MyOl from 'my-openlayer';

const myOl = new MyOl({
    target: 'map',
    center: [116.397, 39.909],
    zoom: 10,
    layers: {
        vec_c: [],
        img_c: [],
        ter_c: []
    },
    token: 'YOUR_TIANDITU_TOKEN',
    annotation: true // 启用注记功能
});

// 获取底图管理器
const mapBaseLayers = myOl.getMapBaseLayers();
```

### 切换注记类型

```javascript
// 切换到矢量注记
mapBaseLayers.switchAnnotationLayer('cva_c');

// 切换到影像注记
mapBaseLayers.switchAnnotationLayer('cia_c');

// 切换到地形注记
mapBaseLayers.switchAnnotationLayer('cta_c');
```

### 控制注记显示

```javascript
// 隐藏注记
mapBaseLayers.setAnnotationVisible(false);

// 显示注记
mapBaseLayers.setAnnotationVisible(true);

// 检查注记是否可见
const isVisible = mapBaseLayers.isAnnotationVisible();
console.log('注记可见:', isVisible);
```

### 获取当前注记信息

```javascript
// 获取当前注记类型
const currentType = mapBaseLayers.getCurrentAnnotationType();
console.log('当前注记类型:', currentType);
```

## 注记类型说明

| 注记类型 | 说明 | 适用底图 |
|---------|------|----------|
| `cva_c` | 矢量注记 | 矢量底图 (vec_c) |
| `cia_c` | 影像注记 | 影像底图 (img_c) |
| `cta_c` | 地形注记 | 地形底图 (ter_c) |

## 完整示例

```javascript
import MyOl from 'my-openlayer';

class MapController {
    constructor() {
        this.initMap();
        this.bindEvents();
    }
    
    initMap() {
        this.myOl = new MyOl({
            target: 'map',
            center: [116.397, 39.909],
            zoom: 10,
            layers: {
                vec_c: [],
                img_c: [],
                ter_c: []
            },
            token: 'YOUR_TIANDITU_TOKEN',
            annotation: true
        });
        
        this.mapBaseLayers = this.myOl.getMapBaseLayers();
        
        // 设置默认底图为影像底图
        this.mapBaseLayers.switchBaseLayer('img_c');
    }
    
    bindEvents() {
        // 底图切换
        document.getElementById('vec-btn').onclick = () => {
            this.mapBaseLayers.switchBaseLayer('vec_c');
            this.mapBaseLayers.switchAnnotationLayer('cva_c');
        };
        
        document.getElementById('img-btn').onclick = () => {
            this.mapBaseLayers.switchBaseLayer('img_c');
            this.mapBaseLayers.switchAnnotationLayer('cia_c');
        };
        
        document.getElementById('ter-btn').onclick = () => {
            this.mapBaseLayers.switchBaseLayer('ter_c');
            this.mapBaseLayers.switchAnnotationLayer('cta_c');
        };
        
        // 注记显示控制
        document.getElementById('toggle-annotation').onclick = () => {
            const isVisible = this.mapBaseLayers.isAnnotationVisible();
            this.mapBaseLayers.setAnnotationVisible(!isVisible);
        };
    }
}

// 初始化地图控制器
new MapController();
```

## 错误处理

```javascript
try {
    // 切换注记类型
    mapBaseLayers.switchAnnotationLayer('cia_c');
} catch (error) {
    console.error('切换注记失败:', error.message);
}
```

## 技术细节

### 层级管理
- 注记图层的 zIndex 始终设置为 `baseZIndex + ANNOTATION_ZINDEX_OFFSET`
- 切换底图时会自动调整注记图层的层级，确保始终在基本图层之上
- `ANNOTATION_ZINDEX_OFFSET` 默认值为 1，可确保注记在底图之上显示

### 剪切处理
- 注记图层会自动应用与基本图层相同的剪切处理
- 如果配置了 `mapClip` 和 `mapClipData`，注记图层会被相应剪切
- 剪切处理通过 `processLayer` 方法统一处理

## 注意事项

1. **Token 必需**: 使用注记功能需要有效的天地图 token
2. **启用注记**: 初始化时需要设置 `annotation: true`
3. **类型匹配**: 建议注记类型与底图类型保持一致以获得最佳显示效果
4. **资源清理**: 调用 `clearAllLayers()` 或 `destroy()` 时会自动清理注记图层
5. **层级保证**: 系统会自动维护注记图层在基本图层之上的层级关系
6. **剪切同步**: 注记图层会自动应用与基本图层相同的剪切设置

## 兼容性

- 向后兼容原有的注记功能
- 静态方法 `addAnnotationLayer()` 和 `createAnnotationLayer()` 仍然可用
- 原有的 `getAnnotationLayer()` 方法已标记为废弃，建议使用 `createAnnotationLayer()`