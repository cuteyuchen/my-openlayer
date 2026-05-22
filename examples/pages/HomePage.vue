<template>
  <div class="home">
    <h1>my-openlayer 示例总览</h1>
    <p class="lead">
      左侧导航按公开类组织，每一页演示该类的所有公开方法，并在底部显示调用日志。
      天地图 token 通过 <code>VITE_TIANDITU_TOKEN</code> 环境变量注入，没配也能跑（仅看不到底图瓦片）。
    </p>

    <section v-for="group in groups" :key="group.key">
      <h2>{{ group.label }}</h2>
      <ul>
        <li v-for="r in group.routes" :key="r.path">
          <RouterLink :to="r.path">{{ r.meta.label }}</RouterLink>
          <span class="blurb"> — {{ r.meta.blurb }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { navRoutes } from '../router'

const groups = computed(() => {
  const order = [
    { key: 'core', label: '核心要素' },
    { key: 'map', label: '地图层' },
    { key: 'interaction', label: '交互' },
    { key: 'projection', label: '投影' }
  ]
  return order.map(g => ({
    ...g,
    routes: navRoutes.filter(r => r.meta.group === g.key)
  }))
})
</script>

<style scoped>
.home {
  padding: 30px 40px;
  overflow-y: auto;
  height: 100%;
  box-sizing: border-box;
}
.home h1 { margin: 0 0 10px; font-size: 22px; }
.lead { color: #4b5563; max-width: 760px; line-height: 1.6; }
.lead code { background: #f1f5f9; padding: 2px 6px; border-radius: 3px; font-size: 13px; }
section { margin-top: 24px; }
section h2 { font-size: 14px; margin: 0 0 8px; color: #1f2d3d; }
ul { padding-left: 20px; margin: 0; }
li { line-height: 2; }
.blurb { color: #6b7280; font-size: 12px; }
a { color: #2563eb; }
</style>
