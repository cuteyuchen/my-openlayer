<template>
  <DemoLayout
    ref="layoutRef"
    title="VueTemplatePoint"
    description="演示直接使用 VueTemplatePoint 类（不通过 Point 包装），把 Vue 组件挂为地图点位，并演示 setVisible / updatePosition / updateProps。"
  >
    <template #controls>
      <button @click="addPoints" :disabled="!myOl || hasPoints" class="btn">addVueTemplatePoint(3 点)</button>
      <button @click="toggleVis" :disabled="!hasPoints" class="btn">setVisible(toggle)</button>
      <button @click="movePoint" :disabled="!hasPoints" class="btn small">第一个点 updatePosition</button>
      <button @click="updateFirst" :disabled="!hasPoints" class="btn small">第一个点 updateProps('label')</button>
      <hr class="sep">
      <button @click="removeAll" :disabled="!hasPoints" class="btn warn">handle.remove()</button>
    </template>
  </DemoLayout>
</template>

<script setup lang="ts">
import { computed, h, ref, shallowRef } from 'vue'
import DemoLayout from '../shared/DemoLayout.vue'
import { useDemoMap } from '../shared/useDemoMap'
import { demoLog } from '../shared/useDemoLog'
import { sampleLevelPoints } from '../data/points'
import type { VueTemplatePointInstance } from '../../src'

const PAGE = 'VueTemplatePoint'
const layoutRef = ref<InstanceType<typeof DemoLayout> | null>(null)
const containerRef = computed(() => layoutRef.value?.mapContainer ?? null)
const { myOl } = useDemoMap({ containerRef: containerRef as any, pageName: PAGE })

interface PinHandle {
  setVisible: (v: boolean) => void
  remove: () => void
  getPoints: () => VueTemplatePointInstance[]
}
const handle = shallowRef<PinHandle | null>(null)
const hasPoints = computed(() => !!handle.value)
let visible = true

const PinTemplate = {
  props: ['pointData', 'label'],
  render() {
    return h('div', { class: 'demo-pin' }, [
      h('div', { class: 'demo-pin-name' }, (this as any).pointData?.name ?? ''),
      h('div', { class: 'demo-pin-label' }, (this as any).label ?? '')
    ])
  }
}

function addPoints() {
  handle.value = myOl.value!.getPoint().addVueTemplatePoint(
    sampleLevelPoints.slice(0, 3),
    PinTemplate,
    { positioning: 'bottom-center' }
  )
  demoLog.info(PAGE, 'addVueTemplatePoint(3 点, template, { positioning: "bottom-center" })')
}

function toggleVis() {
  visible = !visible
  handle.value!.setVisible(visible)
  demoLog.info(PAGE, `setVisible(${visible})`)
}

function movePoint() {
  const first = handle.value!.getPoints()[0]
  first.updatePosition(120.0, 30.05)
  demoLog.info(PAGE, 'firstPoint.updatePosition(120.0, 30.05)')
}

function updateFirst() {
  const first = handle.value!.getPoints()[0]
  first.updateProps({ label: '我被改了！' })
  demoLog.info(PAGE, "firstPoint.updateProps({ label: '我被改了！' })")
}

function removeAll() {
  handle.value!.remove()
  handle.value = null
  demoLog.info(PAGE, 'handle.remove() — 所有 Vue 组件已 unmount')
}
</script>

<style scoped>
.btn { display: block; width: 100%; margin-bottom: 6px; padding: 6px 10px; border: 1px solid #cbd5e1; background: #fff; border-radius: 4px; font-size: 12px; text-align: left; }
.btn:hover:not(:disabled) { background: #f1f5f9; }
.btn.warn { color: #b91c1c; border-color: #fecaca; }
.btn.small { padding: 4px 8px; font-size: 11px; color: #475569; }
.sep { margin: 10px 0; border: none; border-top: 1px solid #e2e8f0; }
</style>

<style>
.demo-pin {
  background: #1f2937;
  color: #fff;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25);
}
.demo-pin-name { font-weight: 600; }
.demo-pin-label { font-size: 11px; color: #93c5fd; }
</style>
