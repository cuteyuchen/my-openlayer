<template>
  <DemoLayout
    ref="layoutRef"
    title="EventManager"
    description="演示 EventManager 的所有事件类型：click / dblclick / hover / moveend / zoomend / rendercomplete / error 与 once / filter 选项。"
  >
    <template #controls>
      <button v-for="t in eventTypes" :key="t" @click="toggle(t)" :class="['btn', listenerIds[t] ? 'btn-on' : '']">
        {{ listenerIds[t] ? '✓' : '○' }} on('{{ t }}')
      </button>
      <hr class="sep">
      <button @click="onceClick" class="btn small">on('click', { once: true })</button>
      <button @click="filteredClick" class="btn small">on('click', { filter })</button>
      <button @click="clearAll" class="btn warn small">offAll()</button>
    </template>
  </DemoLayout>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import DemoLayout from '../shared/DemoLayout.vue'
import { useDemoMap } from '../shared/useDemoMap'
import { demoLog } from '../shared/useDemoLog'
import type { MapEventType } from '../../src'

const PAGE = 'EventManager'
const layoutRef = ref<InstanceType<typeof DemoLayout> | null>(null)
const containerRef = computed(() => layoutRef.value?.mapContainer ?? null)
const { myOl } = useDemoMap({ containerRef: containerRef as any, pageName: PAGE })

const eventTypes: MapEventType[] = ['click', 'dblclick', 'hover', 'moveend', 'zoomend', 'rendercomplete', 'error']
const listenerIds = reactive<Record<string, string | null>>({})

function toggle(type: MapEventType) {
  const em = myOl.value!.getEventManager()
  if (listenerIds[type]) {
    em.off(listenerIds[type]!)
    demoLog.info(PAGE, `off('${type}', id=${listenerIds[type]})`)
    listenerIds[type] = null
    return
  }
  const id = em.on(type, e => {
    demoLog.info(PAGE, `[${type}]`, { coordinate: e.coordinate, zoom: e.zoom })
  })
  listenerIds[type] = id
  demoLog.info(PAGE, `on('${type}') → id=${id}`)
}

function onceClick() {
  const id = myOl.value!.getEventManager().on('click', e => {
    demoLog.info(PAGE, 'once click 触发后自动解绑', e.coordinate)
  }, { once: true })
  demoLog.info(PAGE, `on('click', { once: true }) → id=${id}`)
}

function filteredClick() {
  const id = myOl.value!.getEventManager().on('click', e => {
    demoLog.info(PAGE, '只在 lng > 120 时触发', e.coordinate)
  }, {
    filter: e => Array.isArray(e.coordinate) && e.coordinate[0] > 120
  })
  demoLog.info(PAGE, `on('click', { filter: lng>120 }) → id=${id}`)
}

function clearAll() {
  for (const t of eventTypes) {
    if (listenerIds[t]) {
      myOl.value!.getEventManager().off(listenerIds[t]!)
      listenerIds[t] = null
    }
  }
  demoLog.info(PAGE, '已 off 所有当前注册的监听')
}
</script>

<style scoped>
.btn { display: block; width: 100%; margin-bottom: 6px; padding: 6px 10px; border: 1px solid #cbd5e1; background: #fff; border-radius: 4px; font-size: 12px; text-align: left; font-family: ui-monospace, monospace; }
.btn:hover:not(:disabled) { background: #f1f5f9; }
.btn.warn { color: #b91c1c; border-color: #fecaca; }
.btn.small { padding: 4px 8px; font-size: 11px; color: #475569; }
.btn-on { background: #dbeafe; border-color: #93c5fd; color: #1e40af; }
.sep { margin: 10px 0; border: none; border-top: 1px solid #e2e8f0; }
</style>
