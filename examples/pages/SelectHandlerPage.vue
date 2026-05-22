<template>
  <DemoLayout
    ref="layoutRef"
    title="SelectHandler"
    description="演示 SelectHandler：click / hover / ctrl 三种模式，以及编程式 selectByIds / selectByProperty。先加一组面再启用选择。"
  >
    <template #controls>
      <button @click="addPolys" :disabled="!myOl" class="btn">加 2 个面作为可选目标</button>
      <hr class="sep">
      <div class="group-label">交互模式</div>
      <button @click="enable('click')" :disabled="!myOl" class="btn">enableSelect('click')</button>
      <button @click="enable('hover')" :disabled="!myOl" class="btn">enableSelect('hover')</button>
      <button @click="enable('ctrl')" :disabled="!myOl" class="btn">enableSelect('ctrl')</button>
      <button @click="disable" :disabled="!myOl" class="btn warn small">disableSelect</button>
      <div class="group-label">编程式</div>
      <button @click="selectByProp" :disabled="!myOl" class="btn small">selectByProperty('BASIN', 'north')</button>
      <button @click="clear" :disabled="!myOl" class="btn small">clearSelection</button>
    </template>
  </DemoLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import DemoLayout from '../shared/DemoLayout.vue'
import { useDemoMap } from '../shared/useDemoMap'
import { demoLog } from '../shared/useDemoLog'
import { sampleTwoPolygons } from '../data/polygons'
import type { SelectMode } from '../../src'

const PAGE = 'SelectHandler'
const layoutRef = ref<InstanceType<typeof DemoLayout> | null>(null)
const containerRef = computed(() => layoutRef.value?.mapContainer ?? null)
const { myOl } = useDemoMap({ containerRef: containerRef as any, pageName: PAGE })

function addPolys() {
  myOl.value!.getPolygon().addPolygon(sampleTwoPolygons, {
    layerName: 'select-targets',
    textKey: 'name',
    textVisible: true,
    fillColor: 'rgba(59,130,246,0.25)',
    strokeColor: '#2563eb',
    strokeWidth: 2
  })
  demoLog.info(PAGE, '加载 2 个可选面：layerName="select-targets"')
}

function enable(mode: SelectMode) {
  myOl.value!.getSelectHandler().enableSelect(mode, {
    layerFilter: ['select-targets'],
    onSelect: e => demoLog.info(PAGE, `onSelect ← ${e.selected.length} feature(s)`, e.selected.map(f => f.get('name')))
  })
  demoLog.info(PAGE, `enableSelect('${mode}', { layerFilter: ['select-targets'] })`)
}

function disable() {
  myOl.value!.getSelectHandler().disableSelect()
  demoLog.info(PAGE, 'disableSelect()')
}

function selectByProp() {
  myOl.value!.getSelectHandler().selectByProperty('BASIN', 'north', { fitView: true, fitDuration: 600 })
  demoLog.info(PAGE, "selectByProperty('BASIN', 'north', { fitView: true })")
}

function clear() {
  myOl.value!.getSelectHandler().clearSelection()
  demoLog.info(PAGE, 'clearSelection()')
}
</script>

<style scoped>
.btn { display: block; width: 100%; margin-bottom: 6px; padding: 6px 10px; border: 1px solid #cbd5e1; background: #fff; border-radius: 4px; font-size: 12px; text-align: left; }
.btn:hover:not(:disabled) { background: #f1f5f9; }
.btn.warn { color: #b91c1c; border-color: #fecaca; }
.btn.small { padding: 4px 8px; font-size: 11px; color: #475569; }
.group-label { font-size: 11px; color: #6b7280; margin: 6px 0 4px; text-transform: uppercase; letter-spacing: 0.06em; }
.sep { margin: 10px 0; border: none; border-top: 1px solid #e2e8f0; }
</style>
