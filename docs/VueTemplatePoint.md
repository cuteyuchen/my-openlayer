# VueTemplatePoint Vue 组件点位类

`VueTemplatePoint` 允许将 Vue 组件直接渲染为地图上的点位覆盖物（Overlay），支持 Vue 2 和 Vue 3。

## 方法

- **addVueTemplatePoint(pointDataList: any[], template: any, options?)**: 添加 Vue 组件点位。
  - `pointDataList`: 点位数据列表。
  - `template`: Vue 组件对象。
  - `options`:
    - `positioning`: 覆盖物定位点（如 `'center-center'`）。
    - `stopEvent`: 是否阻止事件冒泡。

### 返回值

该方法返回一个控制对象，包含以下方法：

- **setVisible(visible: boolean)**: 设置所有点位的可见性。
- **setOneVisibleByProp(propName: string, propValue: any, visible: boolean)**: 根据属性值控制特定点位的可见性。
- **remove()**: 移除所有点位并销毁组件实例。
- **getPoints()**: 获取底层点位实例列表。

## 使用示例

### Vue 3 示例

```typescript
import { MyOl } from 'my-openlayer';
import MyPopup from './MyPopup.vue'; // 你的 Vue 组件

const pointData = [
  { lgtd: 120.1, lttd: 30.2, title: '位置1', status: 'normal' },
  { lgtd: 120.2, lttd: 30.3, title: '位置2', status: 'warning' }
];

// 添加组件点位
const vuePoints = map.getPoint().addVueTemplatePoint(
  pointData,
  MyPopup,
  {
    positioning: 'bottom-center',
    stopEvent: true // 允许点击组件交互
  }
);

// 控制显示隐藏
vuePoints.setVisible(false);

// 根据属性控制
vuePoints.setOneVisibleByProp('status', 'warning', true);

// 移除
// vuePoints.remove();
```

### Vue 组件编写规范 (MyPopup.vue)

组件会接收 `pointData` 作为 props。

```vue
<template>
  <div class="popup">
    <h3>{{ pointData.title }}</h3>
    <p>状态: {{ pointData.status }}</p>
  </div>
</template>

<script setup>
defineProps({
  pointData: {
    type: Object,
    required: true
  }
});
</script>

<style scoped>
.popup {
  background: white;
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
}
</style>
```
