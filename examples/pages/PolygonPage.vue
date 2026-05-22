<template>
  <DemoLayout
    ref="layoutRef"
    title="Polygon"
    description="演示 Polygon 类全套方法：addPolygon / addBorderPolygon / addMaskLayer / addHeatmap / addImageLayer / setOutLayer / updateFeatureColor。"
  >
    <template #controls>
      <button @click="doAdd" :disabled="!myOl" class="btn">addPolygon</button>
      <button @click="doBorder" :disabled="!myOl" class="btn">addBorderPolygon</button>
      <button @click="doMask" :disabled="!myOl" class="btn">addMaskLayer</button>
      <button @click="doHeatmap" :disabled="!myOl" class="btn">addHeatmap</button>
      <button @click="doImage" :disabled="!myOl" class="btn">addImageLayer</button>
      <button @click="doOutLayer" :disabled="!myOl" class="btn">setOutLayer</button>
      <hr class="sep">
      <button @click="recolor" :disabled="!myOl" class="btn">updateFeatureColor</button>
      <button @click="destroyAll" :disabled="!myOl" class="btn warn">polygon.destroyAll</button>
    </template>
  </DemoLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import DemoLayout from '../shared/DemoLayout.vue'
import { useDemoMap } from '../shared/useDemoMap'
import { demoLog } from '../shared/useDemoLog'
import { sampleRectPolygon, sampleTwoPolygons } from '../data/polygons'
import { sampleClusterPoints } from '../data/points'

const PAGE = 'Polygon'
const layoutRef = ref<InstanceType<typeof DemoLayout> | null>(null)
const containerRef = computed(() => layoutRef.value?.mapContainer ?? null)
const { myOl } = useDemoMap({ containerRef: containerRef as any, pageName: PAGE })

function doAdd() {
  myOl.value!.getPolygon().addPolygon(sampleTwoPolygons, {
    layerName: 'demo-poly',
    textKey: 'name',
    textVisible: true,
    fillColor: 'rgba(59,130,246,0.25)',
    strokeColor: '#2563eb',
    strokeWidth: 2
  })
  demoLog.info(PAGE, 'addPolygon(2 polys, { textVisible: true })')
}

function doBorder() {
  myOl.value!.getPolygon().addBorderPolygon(sampleRectPolygon, {
    layerName: 'demo-border',
    strokeColor: '#10b981',
    strokeWidth: 3
  })
  demoLog.info(PAGE, 'addBorderPolygon(rect)')
}

function doMask() {
  myOl.value!.getPolygon().addMaskLayer(sampleRectPolygon, {
    layerName: 'demo-mask',
    fillColor: 'rgba(0, 0, 0, 0.45)'
  })
  demoLog.info(PAGE, 'addMaskLayer(rect, { fillColor: rgba(0,0,0,0.45) })')
}

function doHeatmap() {
  myOl.value!.getPolygon().addHeatmap(sampleClusterPoints, {
    layerName: 'demo-heat',
    radius: 16,
    blur: 24,
    // 数据里没有默认的 'value' 字段，显式指定用 lev 作为权重源
    valueKey: 'lev',
    zIndex: 30
  })
  demoLog.info(PAGE, 'addHeatmap(60 points, { radius:16, blur:24, valueKey: "lev" })')
}

function doImage() {
  // ImageLayerData 字段叫 img（不是 url）
  myOl.value!.getPolygon().addImageLayer(
    { img: '/examples/assets/demo.png', extent: [119.7, 29.82, 120.1, 30.12] },
    { layerName: 'demo-image', opacity: 0.7, zIndex: 25 }
  )
  demoLog.info(PAGE, 'addImageLayer({ img: "demo.png", extent }, { opacity: 0.7 })')
}

function doOutLayer() {
  myOl.value!.getPolygon().setOutLayer(sampleRectPolygon, {
    layerName: 'demo-out',
    fillColor: 'rgba(0, 0, 0, 0.35)'
  })
  demoLog.info(PAGE, 'setOutLayer(rect) — 反向蒙版')
}

function recolor() {
  // colorObj 的 key 会和每个 feature 的 textKey 属性值匹配（用来按属性着色）
  myOl.value!.getPolygon().updateFeatureColor(
    'demo-poly',
    { north: 'rgba(239,68,68,0.55)', south: 'rgba(250,204,21,0.55)' },
    { textKey: 'BASIN', textVisible: true }
  )
  demoLog.info(PAGE, 'updateFeatureColor("demo-poly", colorMap, { textKey: "BASIN" })')
}

function destroyAll() {
  myOl.value!.getPolygon().destroyAll()
  demoLog.info(PAGE, 'polygon.destroyAll() — 一次性回收本页所有图层')
}
</script>

<style scoped>
.btn { display: block; width: 100%; margin-bottom: 6px; padding: 6px 10px; border: 1px solid #cbd5e1; background: #fff; border-radius: 4px; font-size: 12px; text-align: left; }
.btn:hover:not(:disabled) { background: #f1f5f9; }
.btn.warn { color: #b91c1c; border-color: #fecaca; }
.sep { margin: 10px 0; border: none; border-top: 1px solid #e2e8f0; }
</style>
