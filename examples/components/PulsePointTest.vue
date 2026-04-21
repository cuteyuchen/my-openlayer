<template>
  <div class="pulse-test-container">
    <div class="component-toolbar pulse-toolbar">
      <button @click="addPulsePoints">添加 {{ pointCount }} 个闪烁点</button>
      <button @click="stopPulse">暂停动画</button>
      <button @click="startPulse">继续动画</button>
      <button @click="toggleVisible">{{ visible ? '隐藏图层' : '显示图层' }}</button>
      <button @click="updatePulsePoints">更新点位</button>
      <button @click="removePulsePoints">删除图层</button>
    </div>

    <div class="status-card">
      <strong>addPulsePointLayer 性能示例</strong>
      <span>当前点数：{{ currentPointTotal }}</span>
      <span>图层状态：{{ layerState }}</span>
    </div>

    <div ref="mapContainer" class="map-container"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import type { PointData, PulsePointLayerHandle } from '../../src/index'
import { MyOl } from '../../src/index'

const mapContainer = ref<HTMLElement | null>(null)
const myOlInstance = shallowRef<MyOl | null>(null)
const pulseHandle = shallowRef<PulsePointLayerHandle | null>(null)
const visible = ref(true)
const running = ref(false)
const currentPointTotal = ref(0)
const pointCount = ref(180)

const tiandituToken = (import.meta as any).env?.VITE_TIANDITU_TOKEN || 'YOUR_TIANDITU_TOKEN_HERE'
const center: [number, number] = [119.81, 29.969]

const layerState = computed(() => {
  if (!pulseHandle.value) return '未创建'
  if (!visible.value) return '已隐藏'
  return running.value ? '动画运行中' : '动画已暂停'
})

onMounted(() => {
  if (mapContainer.value) {
    initMap(mapContainer.value)
  }
})

onBeforeUnmount(() => {
  removePulsePoints()
})

function initMap(target: HTMLElement) {
  const newMyOl = new MyOl(target, {
    token: tiandituToken,
    center,
    zoom: 10,
    annotation: true,
  })
  myOlInstance.value = newMyOl
}

function createMockVillagePoints(count: number, seedOffset = 0): PointData[] {
  return Array.from({ length: count }, (_, index) => {
    const ring = Math.floor(index / 36) + 1
    const angle = ((index % 36) / 36) * Math.PI * 2 + seedOffset
    const jitter = ((index * 9301 + 49297) % 233280) / 233280
    const distance = 0.025 * ring + jitter * 0.018

    return {
      lgtd: center[0] + Math.cos(angle) * distance,
      lttd: center[1] + Math.sin(angle) * distance * 0.72,
      lev: index % 4,
      stnm: `村庄-${index + 1}`,
    }
  })
}

function addPulsePoints() {
  const myOl = myOlInstance.value
  if (!myOl) return

  removePulsePoints()
  const data = createMockVillagePoints(pointCount.value)
  pulseHandle.value = myOl.getPoint().addPulsePointLayer(data, {
    layerName: 'pulseVillageLayer',
    zIndex: 30,
    levelKey: 'lev',
    textKey: 'stnm',
    img: '/village-pulse.svg',
    scale: 0.82,
    pulse: {
      enabled: true,
      duration: 2400,
      radius: [8, 28],
      frameCount: 28,
      colorMap: {
        0: 'rgba(255, 48, 54, 0.48)',
        1: 'rgba(255, 136, 0, 0.45)',
        2: 'rgba(253, 216, 46, 0.4)',
        3: 'rgba(6, 183, 253, 0.32)',
      },
    },
    textVisible: true,
    textFont: '12px Calibri, sans-serif',
    textFillColor: '#ffffff',
    textStrokeColor: 'rgba(0, 0, 0, 0.85)',
    textStrokeWidth: 3,
    textOffsetY: 24,
  })
  currentPointTotal.value = data.length
  visible.value = true
  running.value = !!pulseHandle.value
}

function stopPulse() {
  pulseHandle.value?.stop()
  running.value = false
}

function startPulse() {
  pulseHandle.value?.start()
  running.value = !!pulseHandle.value
}

function toggleVisible() {
  if (!pulseHandle.value) return
  visible.value = !visible.value
  pulseHandle.value.setVisible(visible.value)
}

function updatePulsePoints() {
  if (!pulseHandle.value) return
  const nextCount = pointCount.value === 180 ? 60 : 180
  pointCount.value = nextCount
  const data = createMockVillagePoints(nextCount, Math.PI / 10)
  pulseHandle.value.updateData(data)
  currentPointTotal.value = data.length
}

function removePulsePoints() {
  pulseHandle.value?.remove()
  pulseHandle.value = null
  currentPointTotal.value = 0
  visible.value = true
  running.value = false
}
</script>

<style scoped>
.pulse-test-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.pulse-toolbar {
  flex-wrap: wrap;
  max-width: 640px;
}

.pulse-toolbar button {
  padding: 6px 12px;
  cursor: pointer;
}

.status-card {
  position: absolute;
  left: 20px;
  bottom: 20px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 220px;
  padding: 12px 14px;
  color: #1f2d3d;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(24, 144, 255, 0.28);
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
  font-size: 13px;
}
</style>
