<template>
  <DemoLayout
    ref="layoutRef"
    title="Line"
    description="演示 Line 类的静态线、流动线、URL 加载与 FlowLineLayerHandle 的 start/pause/resume/stop/updateData。"
  >
    <template #controls>
      <div class="group-label">静态线</div>
      <button @click="doAddLine" :disabled="!myOl" class="btn">addLine</button>
      <button @click="removeLine" :disabled="!staticLineLayer" class="btn warn small">removeLineLayer</button>

      <div class="group-label">流动线</div>
      <button @click="doAddFlow" :disabled="!myOl" class="btn">addFlowLine (icon+dash)</button>
      <button @click="flowHandle?.pause()" :disabled="!flowHandle" class="btn small">pause</button>
      <button @click="flowHandle?.resume()" :disabled="!flowHandle" class="btn small">resume</button>
      <button @click="flowHandle?.stop()" :disabled="!flowHandle" class="btn small">stop</button>
      <button @click="flowHandle?.start()" :disabled="!flowHandle" class="btn small">start</button>
      <button @click="toggleData" :disabled="!flowHandle" class="btn small">updateData (mixed/single)</button>
      <button @click="removeFlow" :disabled="!flowHandle" class="btn warn small">handle.remove()</button>
    </template>
  </DemoLayout>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import DemoLayout from '../shared/DemoLayout.vue'
import { useDemoMap } from '../shared/useDemoMap'
import { demoLog } from '../shared/useDemoLog'
import { sampleLineString, sampleMultiLineString } from '../data/lines'
import type { FlowLineLayerHandle } from '../../src'

const PAGE = 'Line'
const layoutRef = ref<InstanceType<typeof DemoLayout> | null>(null)
const containerRef = computed(() => layoutRef.value?.mapContainer ?? null)
const { myOl } = useDemoMap({ containerRef: containerRef as any, pageName: PAGE })

const staticLineLayer = shallowRef<any>(null)
const flowHandle = shallowRef<FlowLineLayerHandle | null>(null)
const usingMixed = ref(true)

function doAddLine() {
  if (!myOl.value) return
  staticLineLayer.value = myOl.value.getLine().addLine(sampleLineString, {
    layerName: 'demo-static-line',
    strokeColor: 'rgba(59,130,246,1)',
    strokeWidth: 3
  })
  demoLog.info(PAGE, 'addLine(geojson, { layerName: "demo-static-line" })')
}

function removeLine() {
  if (!myOl.value || !staticLineLayer.value) return
  myOl.value.getLine().removeLineLayer('demo-static-line')
  staticLineLayer.value = null
  demoLog.info(PAGE, 'removeLineLayer("demo-static-line")')
}

function doAddFlow() {
  if (!myOl.value || flowHandle.value) return
  flowHandle.value = myOl.value.getLine().addFlowLine(sampleMultiLineString, {
    layerName: 'demo-flow',
    animationMode: 'icon+dash',
    strokeColor: '#19b1ff',
    strokeWidth: 4,
    duration: 3600,
    showBaseLine: true,
    flowSymbol: { scale: 0.9, color: '#19b1ff', count: 2, spacing: 0.2 }
  })
  demoLog.info(PAGE, 'addFlowLine(data, { animationMode: "icon+dash", duration: 3600 }) → handle')
}

function toggleData() {
  if (!flowHandle.value) return
  usingMixed.value = !usingMixed.value
  flowHandle.value.updateData(usingMixed.value ? sampleMultiLineString : sampleLineString)
  demoLog.info(PAGE, `handle.updateData(${usingMixed.value ? 'mixed' : 'single'})`)
}

function removeFlow() {
  flowHandle.value?.remove()
  flowHandle.value = null
  demoLog.info(PAGE, 'handle.remove() — rAF / postrender 已停')
}
</script>

<style scoped>
.btn { display: block; width: 100%; margin-bottom: 6px; padding: 6px 10px; border: 1px solid #cbd5e1; background: #fff; border-radius: 4px; font-size: 12px; text-align: left; }
.btn:hover:not(:disabled) { background: #f1f5f9; }
.btn.warn { color: #b91c1c; border-color: #fecaca; }
.btn.small { padding: 4px 8px; font-size: 11px; color: #475569; }
.group-label { font-size: 11px; color: #6b7280; margin: 6px 0 4px; text-transform: uppercase; letter-spacing: 0.06em; }
</style>
