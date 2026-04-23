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
import { MyOl, Polygon, MapTools } from '../../src/index'
import { MapJSONData } from '../../src'
import boundaryData from '../json/boundary.json'

/***********************状态*********************/
const mapContainer = ref<HTMLElement | null>(null)
const myOlInstance = shallowRef<MyOl | null>(null)
const polygonHandler = ref<Polygon | null>(null)

// 使用 import.meta.env 获取 token
const tiandituToken = (import.meta as any).env?.VITE_TIANDITU_TOKEN || 'YOUR_TIANDITU_TOKEN_HERE'

/***********************生命周期*********************/
onMounted(() => {
  if (mapContainer.value) {
    initMap(mapContainer.value)
  }
})

/***********************地图初始化*********************/
const initMap = (target: HTMLElement) => {
  myOlInstance.value?.destroy()

  const newMyOl = new MyOl(target, {
    token: tiandituToken,
    center: [115.909656812607, 38.86535161266765],
    zoom: 8,
    annotation: true,
  })
  myOlInstance.value = newMyOl
  polygonHandler.value = new Polygon(newMyOl.map)
}

/***********************测试动作*********************/
const testShade = () => {
  if (mapContainer.value) {
    initMap(mapContainer.value)
    runShadeTest()
  }
}

const runShadeTest = () => {
  if (!polygonHandler.value || !myOlInstance.value) return

  console.log('Testing setOutLayer with multi-feature GeoJSON...')

  MapTools.removeLayer(myOlInstance.value.map, 'shade-test-out-layer')
  polygonHandler.value.setOutLayer(boundaryData as MapJSONData, {
    layerName: 'shade-test-out-layer',
    extent: true,
    fillColor: 'rgba(0, 0, 0, 0.5)',
    strokeWidth: 2,
    strokeColor: '#0099ff',
    zIndex: 99
  })

  MapTools.fitByData(myOlInstance.value.map, boundaryData as MapJSONData, {
    duration: 500,
    maxZoom: 9,
    padding: [80, 80, 80, 80]
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
