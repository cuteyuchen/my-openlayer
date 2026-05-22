<template>
  <DemoLayout
    ref="layoutRef"
    title="MapTools"
    description="演示 MapTools：图层裁剪、按 layerName 查询/移除、定位、fit。"
  >
    <template #controls>
      <button @click="addRefPolygon" :disabled="!myOl" class="btn">先加一个示例面（参考）</button>
      <button @click="clipMap" :disabled="!myOl" class="btn">clipMap → 用面裁剪整张地图</button>
      <button @click="clipBaseOnly" :disabled="!myOl" class="btn small">setMapClip → 仅裁当前底图</button>
      <hr class="sep">
      <button @click="locate" :disabled="!myOl" class="btn">locationAction(120.18, 30.25, 12)</button>
      <button @click="fitToRef" :disabled="!myOl" class="btn">fitToLayers('demo-ref')</button>
      <hr class="sep">
      <button @click="setVis(false)" :disabled="!myOl" class="btn small">setLayerVisible('demo-ref', false)</button>
      <button @click="setVis(true)" :disabled="!myOl" class="btn small">setLayerVisible('demo-ref', true)</button>
      <button @click="removeRef" :disabled="!myOl" class="btn warn small">removeLayer('demo-ref')</button>
    </template>
  </DemoLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { MapTools } from '../../src'
import DemoLayout from '../shared/DemoLayout.vue'
import { useDemoMap } from '../shared/useDemoMap'
import { demoLog } from '../shared/useDemoLog'
import { sampleRectPolygon } from '../data/polygons'

const PAGE = 'MapTools'
const layoutRef = ref<InstanceType<typeof DemoLayout> | null>(null)
const containerRef = computed(() => layoutRef.value?.mapContainer ?? null)
const { myOl } = useDemoMap({ containerRef: containerRef as any, pageName: PAGE })

function addRefPolygon() {
  myOl.value!.getPolygon().addPolygon(sampleRectPolygon, {
    layerName: 'demo-ref',
    fillColor: 'rgba(59,130,246,0.18)',
    strokeColor: '#2563eb',
    strokeWidth: 2
  })
  demoLog.info(PAGE, '在地图上加了一个 layerName="demo-ref" 的参考面')
}

function clipMap() {
  // clipMap 会循环 map 上的所有 layer 调 setMapClip，达到全图裁剪效果
  myOl.value!.getTools().clipMap(sampleRectPolygon)
  demoLog.info(PAGE, 'tools.clipMap(geojson) — 已裁剪所有图层')
}

function clipBaseOnly() {
  // setMapClip 只裁单层。MapBaseLayers.getCurrentBaseLayers() 拿到当前可见底图。
  const baseLayers = myOl.value!.getMapBaseLayers().getCurrentBaseLayers()
  if (baseLayers.length === 0) {
    demoLog.warn(PAGE, '没找到底图（未配置 token？）')
    return
  }
  baseLayers.forEach(layer => MapTools.setMapClip(layer, sampleRectPolygon))
  demoLog.info(PAGE, `MapTools.setMapClip(currentBaseLayers, geojson) × ${baseLayers.length}`)
}

function locate() {
  myOl.value!.getTools().locationAction(120.18, 30.25, 12, 1500)
  demoLog.info(PAGE, 'tools.locationAction(120.18, 30.25, 12, 1500)')
}

function fitToRef() {
  // fitToLayers 的 padding 必须是 [top, right, bottom, left] 数组，传 number 会让 OL 视图错位
  myOl.value!.getTools().fitToLayers(['demo-ref'], {
    duration: 800,
    padding: [60, 60, 60, 60],
    maxZoom: 12
  })
  demoLog.info(PAGE, 'tools.fitToLayers(["demo-ref"], { padding: [60,60,60,60], maxZoom: 12 })')
}

function setVis(v: boolean) {
  myOl.value!.getTools().setLayerVisible('demo-ref', v)
  demoLog.info(PAGE, `tools.setLayerVisible('demo-ref', ${v})`)
}

function removeRef() {
  myOl.value!.getTools().removeLayer('demo-ref')
  demoLog.info(PAGE, 'tools.removeLayer("demo-ref")')
}
</script>

<style scoped>
.btn { display: block; width: 100%; margin-bottom: 6px; padding: 6px 10px; border: 1px solid #cbd5e1; background: #fff; border-radius: 4px; font-size: 12px; text-align: left; }
.btn:hover:not(:disabled) { background: #f1f5f9; }
.btn.warn { color: #b91c1c; border-color: #fecaca; }
.btn.small { padding: 4px 8px; font-size: 11px; color: #475569; }
.sep { margin: 10px 0; border: none; border-top: 1px solid #e2e8f0; }
</style>
