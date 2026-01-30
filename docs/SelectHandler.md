# SelectHandler 类

`SelectHandler` 类用于处理地图上的要素选择交互，支持点击、悬停、Ctrl+点击等多种模式，并支持编程式选择。

## 构造函数

```typescript
constructor(map: Map)
```

- **map**: OpenLayers 地图实例。

## 接口定义

### SelectOptions

| 属性名 | 类型 | 说明 |
| :--- | :--- | :--- |
| multi | `boolean` | 是否支持多选，默认 `false` |
| layerFilter | `string[]` | 图层过滤器，指定可选择的图层名称列表 |
| featureFilter | `(feature: FeatureLike) => boolean` | 要素过滤器函数 |
| hitTolerance | `number` | 点击容差（像素），默认为 0 |
| selectStyle | `Style \| Style[] \| ((feature: FeatureLike) => Style \| Style[])` | 选中要素的样式 |
| onSelect | `(event: SelectCallbackEvent) => void` | 选中要素时的回调函数 |
| onDeselect | `(event: SelectCallbackEvent) => void` | 取消选中要素时的回调函数 |

### ProgrammaticSelectOptions

| 属性名 | 类型 | 说明 |
| :--- | :--- | :--- |
| layerName | `string` | 图层名称，指定在哪个图层中选择要素 |
| selectStyle | `Style \| Style[] \| ((feature: FeatureLike) => Style \| Style[])` | 自定义选中样式（仅作用于此次选择） |
| fitView | `boolean` | 是否定位至选中要素，默认 `false` |
| fitDuration | `number` | 定位动画持续时间（毫秒），默认 500 |
| fitPadding | `number` | 定位时的边距（像素），默认 100 |

### SelectMode

```typescript
type SelectMode = 'click' | 'hover' | 'ctrl';
```

## 方法

### enableSelect

启用要素选择。

```typescript
enableSelect(mode: SelectMode = 'click', options?: SelectOptions): this
```

- **mode**: 选择模式。
- **options**: 配置选项。
- **返回值**: `SelectHandler` 实例，支持链式调用。

### disableSelect

禁用要素选择。

```typescript
disableSelect(): this
```

- **返回值**: `SelectHandler` 实例。

### clearSelection

清除所有选择（包括交互式和编程式）。

```typescript
clearSelection(): this
```

- **返回值**: `SelectHandler` 实例。

### selectByIds

通过要素 ID 编程式选择要素。

```typescript
selectByIds(featureIds: string[], options?: ProgrammaticSelectOptions): this
```

- **featureIds**: 要素 ID 数组。
- **options**: 编程式选择选项。
- **返回值**: `SelectHandler` 实例。

### selectByProperty

通过属性编程式选择要素。

```typescript
selectByProperty(propertyName: string, propertyValue: any, options?: ProgrammaticSelectOptions): this
```

- **propertyName**: 属性名。
- **propertyValue**: 属性值。
- **options**: 编程式选择选项。
- **返回值**: `SelectHandler` 实例。

## 使用示例

### 启用点击选择

```typescript
import { SelectHandler } from 'my-openlayers';

const selectHandler = new SelectHandler(map);

// 启用点击选择，仅针对 'cities' 图层
selectHandler.enableSelect('click', {
  layerFilter: ['cities'],
  onSelect: (event) => {
    console.log('Selected:', event.selected);
  },
  onDeselect: (event) => {
    console.log('Deselected:', event.deselected);
  }
});
```

### 启用悬停高亮

```typescript
selectHandler.enableSelect('hover', {
  selectStyle: new Style({
    stroke: new Stroke({ color: 'yellow', width: 4 })
  })
});
```

### 编程式选择并定位

```typescript
// 选择 ID 为 'beijing' 的要素并自动定位
selectHandler.selectByIds(['beijing'], {
  fitView: true,
  fitPadding: 50
});
```

### 清除选择

```typescript
selectHandler.clearSelection();
```
