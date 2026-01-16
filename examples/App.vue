<template>
  <div id="app">
    <div class="sidebar">
      <div class="title">OpenLayers Examples</div>
      <button 
        v-for="(comp, key) in components" 
        :key="key"
        @click="currentComp = key" 
        :class="{ active: currentComp === key }"
      >
        {{ getLabel(key) }}
      </button>
    </div>
    <div class="content">
      <component :is="components[currentComp]" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MeasureTool from './components/MeasureTool.vue'
import ShadeTest from './components/ShadeTest.vue'
import TwinkleTest from './components/TwinkleTest.vue'
import ClipTest from './components/ClipTest.vue'
import LargePolygonTest from './components/LargePolygonTest.vue'

const currentComp = ref('MeasureTool')

const components: Record<string, any> = {
  MeasureTool,
  ShadeTest,
  TwinkleTest,
  ClipTest,
  LargePolygonTest
}

const getLabel = (key: string) => {
  const labels: Record<string, string> = {
    MeasureTool: '测量工具',
    ShadeTest: '遮罩测试',
    TwinkleTest: '闪烁点测试',
    ClipTest: '裁剪测试',
    LargePolygonTest: '大文件面测试'
  }
  return labels[key] || key
}
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100%;
  display: flex;
}

.sidebar {
  width: 200px;
  background-color: #f5f5f5;
  border-right: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  padding: 10px;
  box-sizing: border-box;
}

.sidebar .title {
  font-weight: bold;
  margin-bottom: 20px;
  text-align: center;
}

.sidebar button {
  padding: 10px;
  margin-bottom: 5px;
  cursor: pointer;
  border: 1px solid #ccc;
  background: white;
  border-radius: 4px;
  text-align: left;
}

.sidebar button:hover {
  background-color: #e6f7ff;
}

.sidebar button.active {
  background-color: #1890ff;
  color: white;
  border-color: #1890ff;
}

.content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

/* Common map style for components */
.map-container {
  width: 100%;
  height: 100%;
}

.component-toolbar {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
  background: white;
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  display: flex;
  gap: 10px;
}
</style>