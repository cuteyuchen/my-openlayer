<template>
  <DemoLayout
    ref="layoutRef"
    title="ProjectionManager"
    description="演示 ProjectionManager：内置 EPSG 常量、运行时注册自定义 EPSG、查询 OL Projection。"
  >
    <template #controls>
      <button @click="logBuiltins" class="btn">查看内置 PROJECTIONS</button>
      <button @click="logRegistered" class="btn">查询 EPSG:4490 注册状态</button>
      <hr class="sep">
      <button @click="registerCustom" class="btn">register EPSG:4528 (CGCS2000 / 3-degree GK 120E)</button>
      <button @click="logAfterRegister" :disabled="!customRegistered" class="btn small">查询 EPSG:4528</button>
    </template>
  </DemoLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { get as olProjGetProjection } from 'ol/proj'
import { PROJECTIONS, ProjectionManager } from '../../src'
import DemoLayout from '../shared/DemoLayout.vue'
import { useDemoMap } from '../shared/useDemoMap'
import { demoLog } from '../shared/useDemoLog'

const PAGE = 'ProjectionManager'
const layoutRef = ref<InstanceType<typeof DemoLayout> | null>(null)
const containerRef = computed(() => layoutRef.value?.mapContainer ?? null)
const { myOl } = useDemoMap({ containerRef: containerRef as any, pageName: PAGE })

const customRegistered = ref(false)

function logBuiltins() {
  demoLog.info(PAGE, 'PROJECTIONS', PROJECTIONS)
}

function logRegistered() {
  const p = olProjGetProjection(PROJECTIONS.CGCS2000)
  demoLog.info(PAGE, 'olProj.get(EPSG:4490)', {
    code: p?.getCode(),
    units: p?.getUnits(),
    extent: p?.getExtent(),
    worldExtent: p?.getWorldExtent()
  })
}

function registerCustom() {
  ProjectionManager.register({
    code: 'EPSG:4528',
    def: '+proj=tmerc +lat_0=0 +lon_0=120 +k=1 +x_0=40500000 +y_0=0 +ellps=GRS80 +units=m +no_defs'
  })
  customRegistered.value = true
  demoLog.info(PAGE, "ProjectionManager.register({ code: 'EPSG:4528', def: ... })")
}

function logAfterRegister() {
  const p = olProjGetProjection('EPSG:4528')
  demoLog.info(PAGE, 'olProj.get(EPSG:4528)', {
    code: p?.getCode(),
    units: p?.getUnits(),
    extent: p?.getExtent()
  })
}
</script>

<style scoped>
.btn { display: block; width: 100%; margin-bottom: 6px; padding: 6px 10px; border: 1px solid #cbd5e1; background: #fff; border-radius: 4px; font-size: 12px; text-align: left; }
.btn:hover:not(:disabled) { background: #f1f5f9; }
.btn.small { padding: 4px 8px; font-size: 11px; color: #475569; }
.sep { margin: 10px 0; border: none; border-top: 1px solid #e2e8f0; }
</style>
