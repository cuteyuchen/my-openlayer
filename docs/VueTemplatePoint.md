# VueTemplatePoint Vue 组件点位类

`VueTemplatePoint` 允许将 Vue 组件直接渲染为地图上的点位覆盖物（Overlay），支持 Vue 2 和 Vue 3。它通过创建 Overlay 并将 Vue 组件挂载到 Overlay 的 DOM 元素中来实现。

## 构造函数

```typescript
constructor(map: Map)
```

- **参数**:
  - `map` (Map): OpenLayers 地图实例。

## 接口定义

### VueTemplatePointOptions

配置 Vue 模版点位的选项接口。

| 属性 | 类型 | 必填 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| Template | `any` | 是 | - | Vue 组件模版对象。 |
| lgtd | `number` | 是 | - | 经度。 |
| lttd | `number` | 是 | - | 纬度。 |
| props | `Record<string, any>` | 否 | - | 传递给组件的 props。 |
| positioning | `string` | 否 | `'center-center'` | 覆盖物相对于位置的锚点。可选值见 OpenLayers Overlay positioning。 |
| stopEvent | `boolean` | 否 | `false` | 是否阻止地图事件冒泡。 |
| zIndex | `number` | 否 | - | DOM 元素的 z-index。 |
| className | `string` | 否 | - | DOM 元素的 CSS 类名。 |
| visible | `boolean` | 否 | `true` | 初始可见性。 |

## 方法

### addVueTemplatePoint

添加一组 Vue 组件点位。

```typescript
addVueTemplatePoint(
  pointDataList: any[], 
  template: any, 
  options?: {
    positioning?: string,
    stopEvent?: boolean
  }
): VueTemplatePointController
```

- **参数**:
  - `pointDataList` (any[]): 点位数据列表。列表中的每个对象都必须包含 `lgtd` (经度) 和 `lttd` (纬度) 属性。
  - `template` (any): Vue 组件对象。
  - `options` (Object): 可选配置。
    - `positioning`: 覆盖物定位点（如 `'center-center'`, `'bottom-center'` 等）。
    - `stopEvent`: 是否阻止事件冒泡（默认 `false`）。

- **返回值**:
  返回一个控制对象 `VueTemplatePointController`，用于批量管理这组点位。

### VueTemplatePointController 接口

`addVueTemplatePoint` 返回的对象包含以下方法：

| 方法 | 描述 |
| :--- | :--- |
| `setVisible(visible: boolean): void` | 设置该组所有点位的可见性。 |
| `setOneVisibleByProp(propName: string, propValue: any, visible: boolean): void` | 根据点位数据中的属性值控制特定点位的可见性。 |
| `remove(): void` | 移除该组所有点位并销毁组件实例。 |
| `getPoints(): VueTemplatePointInstance[]` | 获取该组创建的所有底层点位实例列表。 |

### getPointById

根据 ID 获取单个点位实例。

```typescript
getPointById(id: string): VueTemplatePointInstance | undefined
```

### getAllPoints

获取所有管理的点位实例。

```typescript
getAllPoints(): VueTemplatePointInstance[]
```

### removeAllPoints

移除并销毁所有点位。

```typescript
removeAllPoints(): void
```

### getPointCount

获取当前管理的点位数量。

```typescript
getPointCount(): number
```

## VueTemplatePointInstance 实例方法

单个点位实例 (`VueTemplatePointInstance`) 提供的操作方法：

| 方法 | 描述 |
| :--- | :--- |
| `setVisible(visible: boolean): void` | 设置当前点位可见性。 |
| `isVisible(): boolean` | 获取当前可见性状态。 |
| `updatePosition(lgtd: number, lttd: number): void` | 更新点位经纬度位置。 |
| `getPosition(): number[]` | 获取当前位置 `[lgtd, lttd]`。 |
| `updateProps(newProps: Record<string, any>): void` | 更新传递给组件的 props。 |
| `setStyle(styles: Partial<CSSStyleDeclaration>): void` | 设置 DOM 元素的 CSS 样式。 |
| `addClass(className: string): void` | 添加 CSS 类名。 |
| `removeClass(className: string): void` | 移除 CSS 类名。 |
| `remove(): void` | 移除并销毁当前点位。 |
| `getId(): string` | 获取点位唯一 ID。 |
| `getDomElement(): HTMLElement` | 获取点位对应的 DOM 元素。 |

## 使用示例

### Vue 3 示例

```typescript
import { MyOl } from 'my-openlayer';
import MyPopup from './MyPopup.vue'; // 你的 Vue 组件

const map = new MyOl('map-container');
const vuePointManager = map.getPoint();

const pointData = [
  { lgtd: 120.1, lttd: 30.2, title: '位置1', status: 'normal' },
  { lgtd: 120.2, lttd: 30.3, title: '位置2', status: 'warning' }
];

// 1. 添加组件点位
const pointsController = vuePointManager.addVueTemplatePoint(
  pointData,
  MyPopup,
  {
    positioning: 'bottom-center',
    stopEvent: true // 允许点击组件交互，阻止地图点击事件
  }
);

// 2. 批量控制显示隐藏
pointsController.setVisible(false);

// 3. 根据属性控制特定点位
pointsController.setOneVisibleByProp('status', 'warning', true);

// 4. 获取单个实例进行精细控制
const instances = pointsController.getPoints();
if (instances.length > 0) {
  const firstPoint = instances[0];
  
  // 更新位置
  firstPoint.updatePosition(120.15, 30.25);
  
  // 更新 Props
  firstPoint.updateProps({
    pointData: { ...pointData[0], title: '更新后的标题' }
  });
  
  // 添加样式类
  firstPoint.addClass('highlight-point');
}

// 5. 移除这组点位
// pointsController.remove();
```

### Vue 组件编写规范 (MyPopup.vue)

组件会接收 `pointData` 作为 props，内容为传入 `pointDataList` 中的对应数据项。

```vue
<template>
  <div class="popup" :class="pointData.status">
    <h3>{{ pointData.title }}</h3>
    <p>状态: {{ pointData.status }}</p>
    <button @click="handleClick">详情</button>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  pointData: {
    type: Object,
    required: true
  }
});

const handleClick = () => {
  console.log('Clicked point:', props.pointData.title);
};
</script>

<style scoped>
.popup {
  background: white;
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  min-width: 150px;
  transform: translate(-50%, -100%); /* 配合 bottom-center 定位 */
}
.popup.warning {
  border: 2px solid orange;
}
</style>
```
