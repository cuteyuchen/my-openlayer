<template>
  <DemoLayout
    ref="layoutRef"
    title="Point"
    description="演示 Point 类的所有公开方法：addPoint / addClusterPoint / addPulsePointLayer / addDomPoint / addVueTemplatePoint，以及统一的 handle.remove() 销毁。"
  >
    <template #controls>
      <div class="group-label">基础</div>
      <button @click="doAddPoint" :disabled="!myOl" class="btn">addPoint</button>
      <button @click="doAddCluster" :disabled="!myOl" class="btn">addClusterPoint</button>
      <div class="group-label">动画</div>
      <button @click="doAddPulse" :disabled="!myOl" class="btn">addPulsePointLayer</button>
      <button @click="togglePulse" :disabled="!pulseHandle" class="btn small">pulse: start/stop</button>
      <div class="group-label">DOM / Vue</div>
      <button @click="doAddDom" :disabled="!myOl" class="btn">addDomPoint</button>
      <button @click="doAddVue" :disabled="!myOl" class="btn">addVueTemplatePoint</button>
      <hr class="sep">
      <button @click="removeAllManual" :disabled="!hasAny" class="btn warn">移除所有 handle</button>
    </template>
  </DemoLayout>

  <!-- DOM 闪烁点的样式必须全局可见（外挂在 OL Overlay 里） -->
  <component is="style" v-once>
    {{ twinkleCss }}
  </component>
</template>

<script setup lang="ts">
import { computed, h, onBeforeUnmount, ref, shallowRef } from 'vue'
import DemoLayout from '../shared/DemoLayout.vue'
import { useDemoMap } from '../shared/useDemoMap'
import { demoLog } from '../shared/useDemoLog'
import { sampleLevelPoints, sampleClusterPoints, sampleTwinkleItems } from '../data/points'
import type { PulsePointLayerHandle } from '../../src'

const PAGE = 'Point'
const layoutRef = ref<InstanceType<typeof DemoLayout> | null>(null)
const containerRef = computed(() => layoutRef.value?.mapContainer ?? null)
const { myOl } = useDemoMap({ containerRef: containerRef as any, pageName: PAGE })

const staticLayer = shallowRef<any>(null)
const clusterLayer = shallowRef<any>(null)
const pulseHandle = shallowRef<PulsePointLayerHandle | null>(null)
const domHandle = shallowRef<{ remove: () => void; setVisible: (v: boolean) => void } | null>(null)
const vueHandle = shallowRef<{ remove: () => void } | null>(null)

const hasAny = computed(() =>
  !!(staticLayer.value || clusterLayer.value || pulseHandle.value || domHandle.value || vueHandle.value)
)

function doAddPoint() {
  if (!myOl.value) return
  staticLayer.value = myOl.value.getPoint().addPoint(sampleLevelPoints, {
    layerName: 'demo-point',
    textKey: 'name',
    textVisible: true
  })
  demoLog.info(PAGE, 'addPoint(data, { layerName: "demo-point", textVisible: true })', {
    count: sampleLevelPoints.length
  })
}

function doAddCluster() {
  if (!myOl.value) return
  clusterLayer.value = myOl.value.getPoint().addClusterPoint(sampleClusterPoints, {
    layerName: 'demo-cluster',
    distance: 40
  })
  demoLog.info(PAGE, 'addClusterPoint(60 points, { distance: 40 })')
}

function doAddPulse() {
  if (!myOl.value) return
  pulseHandle.value = myOl.value.getPoint().addPulsePointLayer(sampleLevelPoints, {
    layerName: 'demo-pulse',
    textKey: 'name',
    textVisible: true,
    pulse: { enabled: true, duration: 2200, radius: [8, 24] }
  })
  demoLog.info(PAGE, 'addPulsePointLayer(data, { pulse: { duration: 2200 } })')
}

let pulseRunning = true
function togglePulse() {
  if (!pulseHandle.value) return
  pulseRunning ? pulseHandle.value.stop() : pulseHandle.value.start()
  pulseRunning = !pulseRunning
  demoLog.info(PAGE, `pulseHandle.${pulseRunning ? 'start' : 'stop'}()`)
}

function doAddDom() {
  if (!myOl.value) return
  domHandle.value = myOl.value.getPoint().addDomPoint(sampleTwinkleItems, item => {
    demoLog.info(PAGE, 'DOM 点位点击', item)
  })
  demoLog.info(PAGE, 'addDomPoint(items, callback)')
}

function doAddVue() {
  if (!myOl.value) return
  const inlineTemplate = {
    props: ['pointData'],
    render() {
      return h('div', { class: 'vue-pin' }, [
        h('span', { class: 'vue-pin-dot' }),
        h('span', { class: 'vue-pin-name' }, (this as any).pointData?.name ?? '')
      ])
    }
  }
  vueHandle.value = myOl.value.getPoint().addVueTemplatePoint(sampleLevelPoints.slice(0, 3), inlineTemplate)
  demoLog.info(PAGE, 'addVueTemplatePoint(data, inlineTemplate)')
}

function removeAllManual() {
  // 演示统一形态：各 handle 都有 remove()
  if (staticLayer.value) {
    myOl.value?.getPoint().destroyAll() // 用 destroyAll 一次性回收 layer 注册表
    staticLayer.value = null
    clusterLayer.value = null
    pulseHandle.value = null
    domHandle.value = null
    vueHandle.value = null
    demoLog.info(PAGE, 'point.destroyAll() — 一次性清理本页所有 handle')
  }
}

onBeforeUnmount(() => {
  // useDemoMap 已经在 onBeforeUnmount 调 myOl.destroy()，这里仅清引用
  staticLayer.value = null
  clusterLayer.value = null
  pulseHandle.value = null
  domHandle.value = null
  vueHandle.value = null
})

const twinkleCss = `
.twinkle-red, .twinkle-orange, .twinkle-blue {
  position: relative;
  width: 14px; height: 14px; border-radius: 50%;
  box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.45);
}
.twinkle-red { background: #ef4444; }
.twinkle-orange { background: #f97316; }
.twinkle-blue { background: #0ea5e9; }
.vue-pin {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px; background: #1f2937; color: #fff;
  border-radius: 12px; font-size: 12px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
}
.vue-pin-dot { width: 6px; height: 6px; border-radius: 50%; background: #38bdf8; }
`
</script>

<style scoped>
.btn { display: block; width: 100%; margin-bottom: 6px; padding: 6px 10px; border: 1px solid #cbd5e1; background: #fff; border-radius: 4px; font-size: 12px; text-align: left; }
.btn:hover:not(:disabled) { background: #f1f5f9; }
.btn.warn { color: #b91c1c; border-color: #fecaca; }
.btn.small { padding: 4px 8px; font-size: 11px; color: #475569; }
.group-label { font-size: 11px; color: #6b7280; margin: 6px 0 4px; text-transform: uppercase; letter-spacing: 0.06em; }
.sep { margin: 10px 0; border: none; border-top: 1px solid #e2e8f0; }
</style>
