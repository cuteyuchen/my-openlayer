<template>
  <div class="twinkle-test-container">
    <div class="component-toolbar">
      <button @click="testTwinkle">测试闪烁点</button>
      <button @click="hideTwinkle">隐藏闪烁点</button>
      <button @click="removeTwinkle">删除闪烁点</button>
    </div>
    <div ref="mapContainer" class="map-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, shallowRef } from 'vue'
import { MyOl } from '../../src/index'

const mapContainer = ref<HTMLElement | null>(null)
const myOlInstance = shallowRef<MyOl | null>(null)
const twinkleAnchor = ref<any>(undefined)
const twinkleVisible = ref(true)

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

const testTwinkle = () => {
  if (!myOlInstance.value || !myOlInstance.value.map) return

  const point = myOlInstance.value.getPoint()
  const center = myOlInstance.value.map.getView().getCenter()
  
  const twinkleData = [
    { lgtd: center[0], lttd: center[1], className: 'twinkle-point' },
    { lgtd: center[0] + 0.1, lttd: center[1] + 0.1, className: 'twinkle-point' }
  ]

  console.log('Adding twinkle layer...', twinkleData)

  twinkleAnchor.value = point.addDomPoint(twinkleData, (item: any) => {
    console.log('Twinkle point clicked:', item)
    alert('Clicked twinkle point at: ' + item.lgtd + ',' + item.lttd)
  })
  
  console.log('Twinkle layer added', twinkleAnchor.value)
}

const hideTwinkle = () => {
  if (!myOlInstance.value || !twinkleAnchor.value) return
  
  console.log('Hiding twinkle layer...')

  twinkleAnchor.value.setVisible(!twinkleVisible.value)
  twinkleVisible.value = !twinkleVisible.value  
  
  console.log('Twinkle layer hidden', twinkleAnchor.value)
}

const removeTwinkle = () => {
  if (!myOlInstance.value || !twinkleAnchor.value) return

  console.log('Removing twinkle layer...')

  twinkleAnchor.value.remove()
  twinkleAnchor.value = undefined
  
  console.log('Twinkle layer removed')
}
</script>

<style>
/* Global style needed for the dom point class if it's appended to body or map container, 
   but usually scoped style works if it's inside the component. 
   However, addDomPoint likely creates elements outside this component's template.
   So we use non-scoped style or :global()
*/
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
  position: absolute; /* Usually required for overlays */
}
</style>

<style scoped>
.twinkle-test-container {
  width: 100%;
  height: 100%;
  position: relative;
}
button {
  padding: 5px 15px;
  cursor: pointer;
}
</style>
