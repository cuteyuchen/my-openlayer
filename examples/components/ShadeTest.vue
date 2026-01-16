<template>
  <div class="shade-test-container">
    <div class="component-toolbar">
      <button @click="testShade">测试遮罩(Polygon.setOutLayer)</button>
    </div>
    <div ref="mapContainer" class="map-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, shallowRef } from 'vue'
import { MyOl, Polygon } from '../../src/index'
import { MapJSONData } from '../../src/types'
import boundaryData from '../json/boundary.json'

const mapContainer = ref<HTMLElement | null>(null)
const myOlInstance = shallowRef<MyOl | null>(null)
const polygonHandler = ref<Polygon | null>(null)

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
  polygonHandler.value = new Polygon(newMyOl.map)
}

const testShade = () => {
  // 重置地图状态
  if (mapContainer.value) {
     // 简单的方式是销毁重建，或者清理图层
     // 这里我们选择重建地图以确保干净的环境，或者也可以只是清理图层
     // 但为了符合“重置”的语义，我们重新初始化
     initMap(mapContainer.value)
     
     // 必须等到 map 初始化完成（同步的）
     runShadeTest()
  }
}

const runShadeTest = () => {
  if (!polygonHandler.value) return
  
  console.log('Testing setOutLayer with multi-feature GeoJSON...')
  
  polygonHandler.value.setOutLayer(boundaryData as MapJSONData, {
    extent: true,
    fillColor: 'rgba(0, 0, 0, 0.5)',
    strokeWidth: 2,
    strokeColor: '#0099ff',
    zIndex: 99
  })
}
</script>

<style scoped>
.shade-test-container {
  width: 100%;
  height: 100%;
  position: relative;
}
button {
  padding: 5px 15px;
  cursor: pointer;
}
</style>
