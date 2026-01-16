<template>
  <div class="measure-tool-container">
    <div class="component-toolbar">
      <button @click="measureDistance">测距</button>
      <button @click="measureArea">测面</button>
      <button @click="clearMeasure">清除测量</button>
    </div>
    <div ref="mapContainer" class="map-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, shallowRef } from 'vue'
import { MyOl, MeasureHandler } from '../../src/index'

const mapContainer = ref<HTMLElement | null>(null)
const myOlInstance = shallowRef<MyOl | null>(null)
const measureHandler = ref<MeasureHandler | null>(null)

// 使用 import.meta.env 获取 token
const tiandituToken = (import.meta as any).env?.VITE_TIANDITU_TOKEN || 'YOUR_TIANDITU_TOKEN_HERE'

onMounted(() => {
  if (mapContainer.value) {
    initMap(mapContainer.value)
  }
})

const initMap = (target: HTMLElement) => {
  const newMyOl = new MyOl(target, {
    token: tiandituToken,
    center: [109.030378, 33.944369],
    zoom: 8,
    annotation: true,
  })
  myOlInstance.value = newMyOl
  measureHandler.value = new MeasureHandler(newMyOl.map)
}

const measureDistance = () => {
  if (measureHandler.value) {
    measureHandler.value.start('LineString')
  }
}

const measureArea = () => {
  if (measureHandler.value) {
    measureHandler.value.start('Polygon')
  }
}

const clearMeasure = () => {
  if (measureHandler.value) {
    measureHandler.value.clean()
  }
}
</script>

<style scoped>
.measure-tool-container {
  width: 100%;
  height: 100%;
  position: relative;
}

button {
  padding: 5px 15px;
  cursor: pointer;
}
</style>
