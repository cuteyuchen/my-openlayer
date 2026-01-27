# SelectHandler 要素选择类

`SelectHandler` 负责地图要素的交互选择，支持点击、悬停等多种模式，以及编程式选择。

## 核心特性

- **独立渲染机制**：采用独立的 Select 实例渲染选中要素，确保样式完全隔离，互不干扰。
- **静态样式固化**：在选中瞬间计算并固化样式，支持基于原始样式的复杂计算（如 `feature.getStyle()`），彻底避免递归调用风险。
- **多选隔离**：支持不同要素同时应用完全不同的高亮样式。
- **自动清理**：自动管理渲染实例的生命周期，防止内存泄漏。

## 方法

### 交互选择

- **enableSelect(mode: SelectMode, options?: SelectOptions)**: 启用选择交互。
  - `mode`: `'click'` (点击), `'hover'` (悬停), `'ctrl'` (Ctrl+点击)。
  - `options`:
    - `multi`: 是否允许多选。
    - `layerFilter`: 图层过滤器（图层名称数组）。
    - `onSelect`: 选中回调。
    - `onDeselect`: 取消选中回调。
    - `selectStyle`: 选中时的样式。支持 `Style` 对象、数组或函数 `(feature, resolution) => Style`。**推荐使用函数**以实现基于原始样式的动态高亮。

- **disableSelect()**: 禁用选择交互（停止响应用户操作，并清理交互式高亮）。
- **isSelectEnabled()**: 检查是否已启用。

### 编程式选择

- **selectByIds(featureIds: string[], options?)**: 根据 ID 选中要素。
- **selectByProperty(propertyName: string, propertyValue: any, options?)**: 根据属性值选中要素。
- **clearSelection()**: 清除当前所有选中状态（包括交互式和编程式）。
- **getSelectedFeatures()**: 获取当前选中的要素列表（仅包含交互式选择的要素）。

## 使用示例

### 1. 基础用法

```typescript
const selectHandler = map.getSelectHandler();

// 启用点击选择
selectHandler.enableSelect('click', {
  multi: false, // 单选
  layerFilter: ['target-layer'], // 仅选择特定图层的要素
  onSelect: (event) => {
    const feature = event.selected[0];
    console.log('选中要素:', feature.getProperties());
  },
  onDeselect: (event) => {
    console.log('取消选中:', event.deselected);
  },
  // 自定义选中样式（简单对象）
  selectStyle: new Style({
    image: new Circle({
      radius: 8,
      fill: new Fill({ color: 'red' }),
      stroke: new Stroke({ color: 'white', width: 2 })
    })
  })
});
```

### 2. 高级用法：基于原始样式的动态高亮

利用函数式 `selectStyle`，可以在选中时动态获取要素的原始样式，并在此基础上修改（例如只改边框颜色，保留填充）。由于采用了**样式固化**机制，这种写法是安全的。

```typescript
selectHandler.enableSelect('click', {
  selectStyle: (feature, resolution) => {
    // 获取要素的原始样式
    // 注意：feature.getStyle() 可能返回 Style 对象、数组或函数，需要自行处理归一化
    const originStyleLike = feature.getStyle(); 
    let originStyle = originStyleLike;
    
    // 如果原始样式是函数，执行它获取 Style 对象
    if (typeof originStyleLike === 'function') {
      originStyle = originStyleLike(feature, resolution);
    }
    
    // 归一化为数组
    const styles = Array.isArray(originStyle) ? originStyle : [originStyle];
    
    // 克隆并修改样式（例如：将边框改为青色）
    return styles.map(s => {
      const clone = s.clone();
      const stroke = clone.getStroke();
      if (stroke) {
        stroke.setColor('#00FFFF');
        stroke.setWidth(3);
      } else {
        // 如果没有边框，添加一个
        clone.setStroke(new Stroke({ color: '#00FFFF', width: 3 }));
      }
      return clone;
    });
  }
});
```

### 3. 编程式选择（带独立样式）

编程式选择支持传入特定的样式，该样式将独立于主交互样式生效，且支持多要素使用不同样式。

```typescript
// 选中 ID 为 'feature-1' 的要素，并用红色高亮
selectHandler.selectByIds(['feature-1'], {
  selectStyle: new Style({ stroke: new Stroke({ color: 'red', width: 4 }) }),
  fitView: true // 自动定位
});

// 同时选中 ID 为 'feature-2' 的要素，但用蓝色高亮（互不冲突）
selectHandler.selectByIds(['feature-2'], {
  selectStyle: new Style({ stroke: new Stroke({ color: 'blue', width: 4 }) })
});
```

### 4. 禁用与清理

```typescript
// 禁用用户交互（停止响应点击，但保留编程式高亮）
selectHandler.disableSelect();

// 清除所有选择（包括交互式和编程式的高亮）
selectHandler.clearSelection();
```
