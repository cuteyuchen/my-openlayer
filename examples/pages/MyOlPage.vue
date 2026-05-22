<template>
  <DemoLayout
    ref="layoutRef"
    title="MyOl"
    description="演示 MyOl 自身的 lifecycle：构造 → destroy → 重建，并展示 6 个 getter 模块的懒加载。"
  >
    <template #controls>
      <button @click="rebuild" class="btn">重建地图</button>
      <button @click="destroyOnly" :disabled="!myOl" class="btn warn">手动 destroy</button>
      <button @click="locate" :disabled="!myOl" class="btn">飞到杭州市</button>
      <button @click="resetPos" :disabled="!myOl" class="btn">回到初始位置</button>

      <hr class="sep">

      <button v-for="g in moduleGetters" :key="g.name" @click="g.fn" :disabled="!myOl" class="btn small">
        {{ g.name }}()
      </button>
    </template>
  </DemoLayout>
</template>

<script setup lang="ts">
import { onMounted, ref, shallowRef, nextTick, onBeforeUnmount } from 'vue'
import { MyOl } from '../../src'
import type { MyOl as MyOlType } from '../../src'
import DemoLayout from '../shared/DemoLayout.vue'
import { demoLog } from '../shared/useDemoLog'
import { getDemoTiandituToken } from '../shared/demoEnv'

const PAGE = 'MyOl'
const layoutRef = ref<InstanceType<typeof DemoLayout> | null>(null)
const myOl = shallowRef<MyOlType | null>(null)

const tiandituToken = getDemoTiandituToken()

function build() {
  const container = layoutRef.value?.mapContainer
  if (!container) {
    demoLog.error(PAGE, 'container 还未挂载')
    return
  }
  try {
    myOl.value = new MyOl(container, {
      ...(tiandituToken ? { token: tiandituToken } : {}),
      center: [119.9, 29.98],
      zoom: 9,
      annotation: !!tiandituToken
    })
    // 默认切到影像底图，跟其他 demo 页保持一致
    try { myOl.value.getMapBaseLayers().switchBaseLayer('img_c') } catch { /* token 缺失时静默 */ }
    demoLog.info(PAGE, 'new MyOl(container, { center:[119.9,29.98], zoom:9 }) → switchBaseLayer("img_c")')
  } catch (err) {
    demoLog.error(PAGE, '构造失败', err)
  }
}

function destroyOnly() {
  if (!myOl.value) return
  try {
    myOl.value.destroy()
    demoLog.info(PAGE, 'myOl.destroy() — 子模块已级联清理')
  } catch (err) {
    demoLog.error(PAGE, 'destroy 失败', err)
  }
  myOl.value = null
}

async function rebuild() {
  if (myOl.value) destroyOnly()
  await nextTick()
  build()
}

function locate() {
  if (!myOl.value) return
  myOl.value.locationAction(120.18, 30.25, 12, 1500)
  demoLog.info(PAGE, 'locationAction(120.18, 30.25, 12, 1500)')
}

function resetPos() {
  if (!myOl.value) return
  myOl.value.resetPosition(1500)
  demoLog.info(PAGE, 'resetPosition(1500)')
}

const moduleGetters = [
  { name: 'getPoint', fn: () => log('getPoint', myOl.value!.getPoint()) },
  { name: 'getLine', fn: () => log('getLine', myOl.value!.getLine()) },
  { name: 'getPolygon', fn: () => log('getPolygon', myOl.value!.getPolygon()) },
  { name: 'getTools', fn: () => log('getTools', myOl.value!.getTools()) },
  { name: 'getMapBaseLayers', fn: () => log('getMapBaseLayers', myOl.value!.getMapBaseLayers()) },
  { name: 'getSelectHandler', fn: () => log('getSelectHandler', myOl.value!.getSelectHandler()) },
  { name: 'getEventManager', fn: () => log('getEventManager', myOl.value!.getEventManager()) }
]

function log(name: string, instance: any) {
  demoLog.info(PAGE, `${name}() → ${instance?.constructor?.name}`)
}

onMounted(() => nextTick(build))
onBeforeUnmount(() => {
  if (myOl.value) {
    try { myOl.value.destroy() } catch { /* ignore */ }
    myOl.value = null
  }
})
</script>

<style scoped>
.btn { display: block; width: 100%; margin-bottom: 6px; padding: 6px 10px; border: 1px solid #cbd5e1; background: #fff; border-radius: 4px; font-size: 12px; text-align: left; }
.btn:hover { background: #f1f5f9; }
.btn.warn { color: #b91c1c; border-color: #fecaca; }
.btn.small { font-size: 11px; padding: 4px 8px; color: #475569; }
.sep { margin: 10px 0; border: none; border-top: 1px solid #e2e8f0; }
</style>
