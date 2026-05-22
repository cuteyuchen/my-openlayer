<template>
  <DemoLayout
    ref="layoutRef"
    title="MapBaseLayers"
    description="演示底图切换、注记控制、addGeoServerLayer / addAnnotationLayer / 状态查询。需要 token 才能看到天地图瓦片。"
  >
    <template #controls>
      <div class="group-label">底图切换</div>
      <button @click="switchBase('vec_c')" :disabled="!myOl" class="btn">switchBaseLayer('vec_c')</button>
      <button @click="switchBase('img_c')" :disabled="!myOl" class="btn">switchBaseLayer('img_c')</button>
      <button @click="switchBase('ter_c')" :disabled="!myOl" class="btn">switchBaseLayer('ter_c')</button>

      <div class="group-label">注记</div>
      <button @click="toggleAnno" :disabled="!myOl" class="btn">setAnnotationVisible(toggle)</button>
      <button @click="switchAnno('cva_c')" :disabled="!myOl" class="btn small">switchAnnotationLayer('cva_c')</button>
      <button @click="switchAnno('cia_c')" :disabled="!myOl" class="btn small">switchAnnotationLayer('cia_c')</button>

      <div class="group-label">状态查询</div>
      <button @click="logStatus" :disabled="!myOl" class="btn small">getCurrentBaseLayerType / Annotation</button>
      <button @click="logStats" :disabled="!myOl" class="btn small">getLayerStats</button>
    </template>
  </DemoLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import DemoLayout from '../shared/DemoLayout.vue'
import { useDemoMap } from '../shared/useDemoMap'
import { demoLog } from '../shared/useDemoLog'
import type { TiandituType, AnnotationType } from '../../src'

const PAGE = 'MapBaseLayers'
const layoutRef = ref<InstanceType<typeof DemoLayout> | null>(null)
const containerRef = computed(() => layoutRef.value?.mapContainer ?? null)
// 这一页本身就是演示底图切换，保留库默认（矢量图）作为初始值
const { myOl } = useDemoMap({ containerRef: containerRef as any, pageName: PAGE, baseLayer: null })

let annoVisible = true

function switchBase(t: TiandituType) {
  myOl.value!.getMapBaseLayers().switchBaseLayer(t)
  demoLog.info(PAGE, `switchBaseLayer('${t}')`)
}

function toggleAnno() {
  annoVisible = !annoVisible
  myOl.value!.getMapBaseLayers().setAnnotationVisible(annoVisible)
  demoLog.info(PAGE, `setAnnotationVisible(${annoVisible})`)
}

function switchAnno(t: AnnotationType) {
  myOl.value!.getMapBaseLayers().switchAnnotationLayer(t)
  demoLog.info(PAGE, `switchAnnotationLayer('${t}')`)
}

function logStatus() {
  const b = myOl.value!.getMapBaseLayers()
  demoLog.info(PAGE, '查询状态', {
    currentBaseLayerType: b.getCurrentBaseLayerType(),
    currentAnnotationType: b.getCurrentAnnotationType(),
    isAnnotationVisible: b.isAnnotationVisible()
  })
}

function logStats() {
  const b = myOl.value!.getMapBaseLayers()
  demoLog.info(PAGE, 'getLayerStats / getAvailableLayerTypes', {
    stats: b.getLayerStats(),
    types: b.getAvailableLayerTypes()
  })
}
</script>

<style scoped>
.btn { display: block; width: 100%; margin-bottom: 6px; padding: 6px 10px; border: 1px solid #cbd5e1; background: #fff; border-radius: 4px; font-size: 12px; text-align: left; }
.btn:hover:not(:disabled) { background: #f1f5f9; }
.btn.small { padding: 4px 8px; font-size: 11px; color: #475569; }
.group-label { font-size: 11px; color: #6b7280; margin: 6px 0 4px; text-transform: uppercase; letter-spacing: 0.06em; }
</style>
