<template>
  <DemoLayout
    ref="layoutRef"
    title="addGeoJSON"
    description="演示 MyOl.addGeoJSON 综合方法：自动识别点/线/面几何类型、按属性分组、数组/Record 输入、styleByProperties 样式回调、统一句柄操作。"
  >
    <template #controls>
      <div class="group-label">基础</div>
      <button @click="doMixed" :disabled="!myOl" class="btn">混合 FC（点+线+面）</button>
      <button @click="doGroupBy" :disabled="!myOl" class="btn">groupBy 分组</button>

      <div class="group-label">输入形态</div>
      <button @click="doArrayInput" :disabled="!myOl" class="btn">数组输入 + 数组 layerName</button>
      <button @click="doRecordInput" :disabled="!myOl" class="btn">Record 输入 + 对象 layerName</button>

      <div class="group-label">高级</div>
      <button @click="doStyleByProps" :disabled="!myOl" class="btn">styleByProperties 样式回调</button>

      <hr class="sep">
      <div class="group-label">句柄操作</div>
      <button @click="toggleVisible" :disabled="!handle" class="btn small">
        setVisible({{ visible ? 'false' : 'true' }})
      </button>
      <button @click="doRemoveGroup('high')" :disabled="!handle?.groups?.high" class="btn warn small">
        removeGroup('high')
      </button>
      <button @click="doRemove" :disabled="!handle" class="btn warn">handle.remove() 全部移除</button>
    </template>
  </DemoLayout>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import DemoLayout from '../shared/DemoLayout.vue'
import { useDemoMap } from '../shared/useDemoMap'
import { demoLog } from '../shared/useDemoLog'
import { mixedGeoJSON, groupedPoints, routesGeoJSON, stationsGeoJSON } from '../data/geojson'
import type { GeoJSONRenderHandle } from '../../src'

const PAGE = 'addGeoJSON'
const layoutRef = ref<InstanceType<typeof DemoLayout> | null>(null)
const containerRef = computed(() => layoutRef.value?.mapContainer ?? null)
const { myOl } = useDemoMap({ containerRef: containerRef as any, pageName: PAGE })

const handle = shallowRef<GeoJSONRenderHandle | null>(null)
const visible = ref(true)

/** 清理已有 handle */
function cleanup() {
  if (handle.value) {
    handle.value.remove()
    handle.value = null
  }
  visible.value = true
}

/** 混合 FeatureCollection：自动按几何类型创建点/线/面图层 */
function doMixed() {
  if (!myOl.value) return
  cleanup()
  handle.value = myOl.value.addGeoJSON(mixedGeoJSON, {
    layerName: 'mixed',
    point: { textKey: 'name', textVisible: true },
    line: { strokeColor: '#3b82f6', strokeWidth: 3 },
    polygon: { fillColor: 'rgba(239,68,68,0.15)', strokeColor: '#ef4444' }
  })
  demoLog.info(PAGE, 'addGeoJSON(mixedFC, { layerName: "mixed" })', {
    groups: Object.keys(handle.value.groups),
    handleCount: handle.value.handles.length
  })
}

/** groupBy 字符串：按 properties.risk 分组 */
function doGroupBy() {
  if (!myOl.value) return
  cleanup()
  handle.value = myOl.value.addGeoJSON(groupedPoints, {
    layerName: 'risk',
    groupBy: 'risk',
    point: { textKey: 'name', textVisible: true }
  })
  demoLog.info(PAGE, 'addGeoJSON(groupedPoints, { groupBy: "risk" })', {
    groups: Object.keys(handle.value.groups)
  })
}

/** 数组输入 + 数组 layerName */
function doArrayInput() {
  if (!myOl.value) return
  cleanup()
  handle.value = myOl.value.addGeoJSON(
    [groupedPoints, routesGeoJSON],
    {
      layerName: ['站点', '路线'],
      point: { textKey: 'name', textVisible: true },
      line: { strokeColor: '#10b981', strokeWidth: 3 }
    }
  )
  demoLog.info(PAGE, 'addGeoJSON([points, routes], { layerName: ["站点", "路线"] })', {
    handleCount: handle.value.handles.length
  })
}

/** Record 输入 + 对象 layerName */
function doRecordInput() {
  if (!myOl.value) return
  cleanup()
  handle.value = myOl.value.addGeoJSON(
    { stations: stationsGeoJSON, routes: routesGeoJSON },
    {
      layerName: { stations: '监测站', routes: '管线' },
      point: { textKey: 'name', textVisible: true },
      line: { strokeColor: '#8b5cf6', strokeWidth: 3 }
    }
  )
  demoLog.info(PAGE, 'addGeoJSON({ stations, routes }, { layerName: { stations: "监测站", routes: "管线" } })', {
    handleCount: handle.value.handles.length
  })
}

/** styleByProperties：按 feature properties 返回不同样式 */
function doStyleByProps() {
  if (!myOl.value) return
  cleanup()
  handle.value = myOl.value.addGeoJSON(groupedPoints, {
    layerName: 'styled',
    groupBy: 'risk',
    point: {
      textKey: 'name',
      textVisible: true,
      styleByProperties: (props) => {
        const risk = props.risk as string
        const colorMap: Record<string, string> = {
          high: '#ef4444',
          medium: '#f97316',
          low: '#22c55e'
        }
        return {
          circleColor: colorMap[risk] ?? '#6b7280',
          circleRadius: risk === 'high' ? 10 : 6
        }
      }
    }
  })
  demoLog.info(PAGE, 'addGeoJSON(groupedPoints, { styleByProperties: risk → color })', {
    groups: Object.keys(handle.value.groups)
  })
}

/** 切换全部图层可见性 */
function toggleVisible() {
  if (!handle.value) return
  visible.value = !visible.value
  handle.value.setVisible(visible.value)
  demoLog.info(PAGE, `handle.setVisible(${visible.value})`)
}

/** 移除指定分组 */
function doRemoveGroup(key: string) {
  if (!handle.value) return
  handle.value.removeGroup(key)
  demoLog.info(PAGE, `handle.removeGroup("${key}")`)
}

/** 移除全部 */
function doRemove() {
  if (!handle.value) return
  handle.value.remove()
  handle.value = null
  visible.value = true
  demoLog.info(PAGE, 'handle.remove() — 全部图层已移除')
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
