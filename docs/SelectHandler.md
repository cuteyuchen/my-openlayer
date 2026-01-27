# SelectHandler 要素选择类

`SelectHandler` 负责地图要素的交互选择，支持点击、悬停等多种模式，以及编程式选择。

## 方法

### 交互选择

- **enableSelect(mode: SelectMode, options?: SelectOptions)**: 启用选择交互。
  - `mode`: `'click'` (点击), `'hover'` (悬停), `'ctrl'` (Ctrl+点击)。
  - `options`:
    - `multi`: 是否允许多选。
    - `layerFilter`: 图层过滤器（图层名称数组）。
    - `onSelect`: 选中回调。
    - `onDeselect`: 取消选中回调。
    - `selectStyle`: 选中时的样式。

- **disableSelect()**: 禁用选择交互。
- **isSelectEnabled()**: 检查是否已启用。

### 编程式选择

- **selectByIds(featureIds: string[], options?)**: 根据 ID 选中要素。
- **selectByProperty(propertyName: string, propertyValue: any, options?)**: 根据属性值选中要素。
- **clearSelection()**: 清除当前所有选中状态。
- **getSelectedFeatures()**: 获取当前选中的要素列表。

## 使用示例

```typescript
const selectHandler = map.getSelectHandler();

// 1. 启用点击选择
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
  // 自定义选中样式
  selectStyle: new Style({
    image: new Circle({
      radius: 8,
      fill: new Fill({ color: 'red' }),
      stroke: new Stroke({ color: 'white', width: 2 })
    })
  })
});

// 2. 编程式选择（例如在列表中点击条目，高亮地图要素）
selectHandler.selectByProperty('id', 'feature-123');

// 3. 禁用选择
// selectHandler.disableSelect();
```
