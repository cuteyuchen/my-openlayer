<template>
  <div id="app">
    <div class="toolbar">
      <button @click="measureDistance">测距</button>
      <button @click="measureArea">测面</button>
      <button @click="clearMeasure">清除测量</button>
      <div class="divider"></div>
      <button @click="testShade">测试遮罩(Polygon.setOutLayer)</button>
      <button @click="testClip">测试裁剪(MapTools.setMapClip)</button>
      <button @click="resetMap">重置地图</button>
    </div>
    <div id="map" class="map"></div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { MyOl, MeasureHandler, Polygon, MapTools } from '../src/index'
import boundaryData from './json/boundary.json'

const myOl = ref(null)
const measureHandler = ref(null)
const polygonHandler = ref(null)
let currentClipLayer = null

// 使用 import.meta.env 获取 token
const tiandituToken = import.meta.env.VITE_TIANDITU_TOKEN || 'YOUR_TIANDITU_TOKEN_HERE'

onMounted(() => {
  initMap()
})

const initMap = () => {
  // 初始化地图
  myOl.value = new MyOl('map', {
    token: tiandituToken,
    center: [115.534629, 38.929090],
    zoom: 8, // 调整缩放级别以便看到更大的区域
    annotation: true, // 启用注记
    mapClipData: boundaryData
  })

  // 初始化测量工具
  measureHandler.value = new MeasureHandler(myOl.value.map)
  
  // 初始化 Polygon 工具
  polygonHandler.value = new Polygon(myOl.value.map)
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

// 测试遮罩功能 (setOutLayer)
const testShade = () => {
  if (!polygonHandler.value) return
  
  // 清除之前的效果
  resetMap()
  
  console.log('Testing setOutLayer with multi-feature GeoJSON...')
  
  polygonHandler.value.setOutLayer(boundaryData, {
    extent: true,
    fillColor: 'rgba(0, 0, 0, 0.5)',
    strokeWidth: 2,
    strokeColor: '#0099ff',
    zIndex: 99
  })
}

// 测试裁剪功能 (setMapClip)
const testClip = () => {
  if (!myOl.value || !myOl.value.map) return
  
  // 清除之前的效果
  resetMap()
  
  console.log('Testing setMapClip with multi-feature GeoJSON...')
  
  // 获取底图图层（通常是第一个图层，天地图矢量底图）
  const layers = myOl.value.map.getLayers().getArray()
  const baseLayer = layers[0] 
  
  if (baseLayer) {
    // 应用裁剪
    MapTools.setMapClip(baseLayer, boundaryData)
    
    // 调整视图以适应裁剪区域
    // 注意：MapTools.setMapClip 内部已经尝试设置 extent，但我们手动再 fit 一下确保视觉效果
    // 由于 setMapClip 返回的是 layer，我们需要自己计算 extent 来 fit view
    // 这里简单地重新利用 Polygon 工具里的逻辑或者直接读取 GeoJSON 的 extent
    // 为了简单起见，我们暂时手动设置一个近似的 center/zoom 或者让 setMapClip 内部生效
    
    // 强制刷新地图以触发 postrender
    myOl.value.map.render()
  }
}

const resetMap = () => {
  // 重新初始化地图以清除所有副作用（裁剪、遮罩等）
  // 实际项目中应该有更优雅的清理方法，但为了演示方便，直接重建
  document.getElementById('map').innerHTML = ''
  initMap()
}

</script>

<style>
.map {
  width: 100%;
  height: 100%;
}
.toolbar {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
  background: white;
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
}
.toolbar button {
  margin-left: 10px;
  padding: 5px 15px;
  cursor: pointer;
}
.toolbar button:first-child {
  margin-left: 0;
}
.divider {
  width: 1px;
  height: 20px;
  background-color: #ccc;
  margin: 0 15px;
}
</style>