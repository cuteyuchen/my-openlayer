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
import TileLayer from 'ol/layer/Tile'
import boundaryData from '../json/boundary.json'

/***********************状态*********************/
const mapContainer = ref<HTMLElement | null>(null)
const myOlInstance = shallowRef<MyOl | null>(null)

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
}

/***********************测试动作*********************/
const testClip = () => {
  if (mapContainer.value) {
    initMap(mapContainer.value)
    runClipTest(myOlInstance.value?.map)
  }
}

const runClipTest = (map: any) => {
  if (!map) return

  console.log('Testing setMapClip with multi-feature GeoJSON...')

  const visibleTileLayers = map
    .getLayers()
    .getArray()
    .filter((layer: any) => layer instanceof TileLayer && layer.getVisible())

  visibleTileLayers.forEach((layer: any) => {
    MapTools.setMapClip(layer, boundaryData as MapJSONData)
  })

  MapTools.fitByData(map, boundaryData as MapJSONData, {
    duration: 500,
    maxZoom: 9,
    padding: [80, 80, 80, 80]
  })

  map.render()
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
