<template>
  <div id="app">
    <div class="toolbar">
      <button @click="measureDistance">测距</button>
      <button @click="measureArea">测面</button>
      <button @click="clearMeasure">清除测量</button>
      <div class="divider"></div>
      <button @click="testShade">测试遮罩(Polygon.setOutLayer)</button>
      <button @click="testTwinkle">测试闪烁点</button>
      <button @click="hideTwinkle">隐藏闪烁点</button>
      <button @click="removeTwinkle">删除闪烁点</button>
      <button @click="testClip">测试裁剪(MapTools.setMapClip)</button>
      <button @click="resetMap">重置地图</button>
    </div>
    <div id="map" class="map"></div>
    <!-- 闪烁点锚点元素 -->
    <!-- <div id="twinkle-anchor" style="display: none;"></div> -->
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { MyOl, MeasureHandler, Polygon, MapTools } from '../src/index'
import { MapJSONData } from '../src/types'

import boundaryData from './json/boundary.json'

let myOl: MyOl|null = null
const measureHandler = ref(null)
let polygonHandler: Polygon|null = null
let currentClipLayer = null

// 使用 import.meta.env 获取 token
const tiandituToken = import.meta.env.VITE_TIANDITU_TOKEN || 'YOUR_TIANDITU_TOKEN_HERE'

onMounted(() => {
  initMap()
})

const initMap = () => {
  // 初始化地图
  myOl = new MyOl('map', {
    token: tiandituToken,
    center: [115.534629, 38.929090],
    zoom: 8, // 调整缩放级别以便看到更大的区域
    annotation: true, // 启用注记
    mapClipData: boundaryData as MapJSONData
  })

  // 初始化测量工具
  measureHandler.value = new MeasureHandler(myOl.map)
  
  // 初始化 Polygon 工具
  polygonHandler = new Polygon(myOl.map)
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
  if (!polygonHandler) return
  
  // 清除之前的效果
  resetMap()
  
  console.log('Testing setOutLayer with multi-feature GeoJSON...')
  
  polygonHandler.setOutLayer(boundaryData as MapJSONData, {
    extent: true,
    fillColor: 'rgba(0, 0, 0, 0.5)',
    strokeWidth: 2,
    strokeColor: '#0099ff',
    zIndex: 99
  })
}

// 测试裁剪功能 (setMapClip)
const testClip = () => {
  if (!myOl || !myOl.map) return
  
  // 清除之前的效果
  resetMap()
  
  console.log('Testing setMapClip with multi-feature GeoJSON...')
  
  // 获取底图图层（通常是第一个图层，天地图矢量底图）
  const layers = myOl.map.getLayers().getArray()
  const baseLayer = layers[0] 
  
  if (baseLayer) {
    // 应用裁剪
    MapTools.setMapClip(baseLayer, boundaryData as MapJSONData)
    
    // 调整视图以适应裁剪区域
    // 注意：MapTools.setMapClip 内部已经尝试设置 extent，但我们手动再 fit 一下确保视觉效果
    // 由于 setMapClip 返回的是 layer，我们需要自己计算 extent 来 fit view
    // 这里简单地重新利用 Polygon 工具里的逻辑或者直接读取 GeoJSON 的 extent
    // 为了简单起见，我们暂时手动设置一个近似的 center/zoom 或者让 setMapClip 内部生效
    
    // 强制刷新地图以触发 postrender
    myOl.map.render()
  }
}

// 测试闪烁点功能
let twinkleAnchor: any = undefined
const testTwinkle = () => {
  if (!myOl) return

  // 清除之前的效果
  // resetMap() // 不重置，以便看到叠加效果

  const point = myOl.getPoint()
  const center = myOl.map.getView().getCenter()
  
  const twinkleData = [
    { lgtd: center[0], lttd: center[1], className: 'twinkle-point' },
    { lgtd: center[0] + 0.1, lttd: center[1] + 0.1, className: 'twinkle-point' }
  ]

  console.log('Adding twinkle layer...', twinkleData)

  twinkleAnchor = point.addDomPoint( twinkleData, (item) => {
    console.log('Twinkle point clicked:', item)
    alert('Clicked twinkle point at: ' + item.lgtd + ',' + item.lttd)
  })
  
  console.log('Twinkle layer added', twinkleAnchor)
}

const twinkleVisible = ref(true)
// 隐藏闪烁点功能
const hideTwinkle = () => {
  if (!myOl) return
  
  console.log('Hiding twinkle layer...')

  twinkleAnchor.setVisible(!twinkleVisible.value)
  twinkleVisible.value = !twinkleVisible.value  
  
  console.log('Twinkle layer hidden', twinkleAnchor)
}



// 删除闪烁点功能
const removeTwinkle = () => {
  if (!myOl) return

  console.log('Removing twinkle layer...')

 twinkleAnchor.remove()
  
  console.log('Twinkle layer removed', twinkleAnchor)
}



const resetMap = () => {
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

@keyframes twinkle-animation {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(2); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}

.twinkle-point {
  width: 20px;
  height: 20px;
  background-color: red;
  border-radius: 50%;
  animation: twinkle-animation 1s infinite;
  cursor: pointer;
  border: 2px solid white;
}
</style>