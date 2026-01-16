<template>
  <div class="clip-test-container">
    <div class="component-toolbar">
      <button @click="testClip">测试裁剪(MapTools.setMapClip)</button>
    </div>
    <div ref="mapContainer" class="map-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, shallowRef } from 'vue'
import { MyOl, MapTools } from '../../src/index'
import { MapJSONData } from '../../src/types'
import boundaryData from '../json/boundary.json'

const mapContainer = ref<HTMLElement | null>(null)
const myOlInstance = shallowRef<MyOl | null>(null)

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
}

const testClip = () => {
  if (mapContainer.value) {
     // 重置地图
     initMap(mapContainer.value)
     
     // 运行测试
     runClipTest(myOlInstance.value?.map)
  }
}

const runClipTest = (map: any) => {
  if (!map) return

  console.log('Testing setMapClip with multi-feature GeoJSON...')
  
  // 获取底图图层（通常是第一个图层，天地图矢量底图）
  const layers = map.getLayers().getArray()
  const baseLayer = layers[0] 
  
  if (baseLayer) {
    // 应用裁剪
    MapTools.setMapClip(baseLayer, boundaryData as MapJSONData)
    
    // 强制刷新地图以触发 postrender
    map.render()
  }
}
</script>

<style scoped>
.clip-test-container {
  width: 100%;
  height: 100%;
  position: relative;
}
button {
  padding: 5px 15px;
  cursor: pointer;
}
</style>
