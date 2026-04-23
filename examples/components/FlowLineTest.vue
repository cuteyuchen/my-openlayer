<template>
  <div class="flow-line-container">
    <div class="component-toolbar flow-line-toolbar">
      <button @click="startFlowLine">开始</button>
      <button @click="pauseFlowLine">暂停</button>
      <button @click="resumeFlowLine">继续</button>
      <button @click="stopFlowLine">停止</button>
      <button @click="updateFlowLine">更新数据</button>
      <button @click="removeFlowLine">移除</button>
    </div>

    <div class="flow-line-status">
      <strong>Line.addFlowLine 示例</strong>
      <span>当前状态：{{ statusText }}</span>
      <span>当前数据：{{ currentDataLabel }}</span>
    </div>

    <div ref="mapContainer" class="map-container"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { MyOl } from '../../src'
import type { FlowLineLayerHandle, MyOl as MyOlType } from '../../src'
import { mixedFlowLineData, singleLineData } from '../flow-line/data'

/***********************地图实例与状态*********************/
const mapContainer = ref<HTMLElement | null>(null)
const myOlInstance = shallowRef<MyOlType | null>(null)
const flowHandle = shallowRef<FlowLineLayerHandle | null>(null)
const visibleDataMode = ref<'single' | 'mixed'>('mixed')
const playingState = ref<'idle' | 'running' | 'paused' | 'stopped'>('idle')

/***********************基础配置*********************/
const tiandituToken = (import.meta as any).env?.VITE_TIANDITU_TOKEN || 'YOUR_TIANDITU_TOKEN_HERE'
const center: [number, number] = [119.9, 29.98]

/***********************计算属性*********************/
const currentDataLabel = computed(() => {
  return visibleDataMode.value === 'mixed' ? 'LineString + MultiLineString' : 'LineString'
})

const statusText = computed(() => {
  switch (playingState.value) {
    case 'running':
      return '播放中'
    case 'paused':
      return '已暂停'
    case 'stopped':
      return '已停止'
    default:
      return '未创建'
  }
})

/***********************生命周期*********************/
onMounted(() => {
  if (!mapContainer.value) {
    return
  }

  myOlInstance.value = new MyOl(mapContainer.value, {
    token: tiandituToken,
    center,
    zoom: 10,
    annotation: true
  })

  startFlowLine()
})

onBeforeUnmount(() => {
  removeFlowLine()
})

/***********************业务方法*********************/
function getCurrentData() {
  return visibleDataMode.value === 'mixed' ? mixedFlowLineData : singleLineData
}

function startFlowLine() {
  const myOl = myOlInstance.value
  if (!myOl) {
    return
  }

  const handle = flowHandle.value
  if (!handle) {
    flowHandle.value = myOl.getLine().addFlowLine(getCurrentData(), {
      layerName: 'flow-line-demo',
      animationMode: 'icon+dash',
      strokeColor: '#19b1ff',
      strokeWidth: 3,
      lineDash: [18, 12],
      flowSymbol: {
        // src: '/symbols/boat.svg',
        scale: 0.9,
        color: '#19b1ff',
        rotateWithView: true,
        count: 2,
        spacing: 0.2
      },
      duration: 3600,
      showBaseLine: true,
      zIndex: 40
    })
  } else {
    handle.start()
  }

  if (flowHandle.value) {
    playingState.value = 'running'
  }
}

function pauseFlowLine() {
  flowHandle.value?.pause()
  if (flowHandle.value) {
    playingState.value = 'paused'
  }
}

function resumeFlowLine() {
  flowHandle.value?.resume()
  if (flowHandle.value) {
    playingState.value = 'running'
  }
}

function stopFlowLine() {
  flowHandle.value?.stop()
  if (flowHandle.value) {
    playingState.value = 'stopped'
  }
}

function updateFlowLine() {
  const handle = flowHandle.value
  if (!handle) {
    return
  }

  visibleDataMode.value = visibleDataMode.value === 'mixed' ? 'single' : 'mixed'
  handle.updateData(getCurrentData())
}

function removeFlowLine() {
  flowHandle.value?.remove()
  flowHandle.value = null
  playingState.value = 'idle'
}
</script>

<style scoped>
.flow-line-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.flow-line-toolbar {
  flex-wrap: wrap;
  max-width: 620px;
}

.flow-line-toolbar button {
  padding: 6px 12px;
  cursor: pointer;
}

.flow-line-status {
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
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(25, 177, 255, 0.3);
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
  font-size: 13px;
}
</style>
