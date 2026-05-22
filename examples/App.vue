<template>
  <div id="app-shell">
    <aside class="nav">
      <div class="nav-title">my-openlayer 示例</div>
      <div v-for="group in groupedRoutes" :key="group.key" class="nav-group">
        <div class="nav-group-label">{{ group.label }}</div>
        <RouterLink
          v-for="route in group.routes"
          :key="route.path"
          :to="route.path"
          class="nav-link"
          active-class="active"
          exact-active-class="active"
        >
          <span class="nav-link-name">{{ route.meta.label }}</span>
          <span class="nav-link-blurb">{{ route.meta.blurb }}</span>
        </RouterLink>
      </div>
    </aside>

    <main class="content">
      <RouterView v-slot="{ Component }">
        <component :is="Component" />
      </RouterView>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { navRoutes } from './router'

const groupedRoutes = computed(() => {
  const order: { key: string; label: string }[] = [
    { key: 'overview', label: '总览' },
    { key: 'core', label: '核心' },
    { key: 'map', label: '地图' },
    { key: 'interaction', label: '交互' },
    { key: 'projection', label: '投影' }
  ]
  return order.map(g => ({
    ...g,
    routes: navRoutes.filter(r => r.meta.group === g.key)
  }))
})
</script>

<style>
html, body, #app, #app-shell {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
}

#app-shell {
  display: grid;
  grid-template-columns: 220px 1fr;
  height: 100%;
}

.nav {
  background: #1e293b;
  color: #cbd5e1;
  overflow-y: auto;
  padding: 14px 0;
}

.nav-title {
  padding: 0 16px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #f8fafc;
  border-bottom: 1px solid #334155;
}

.nav-group {
  padding: 10px 0 6px;
}

.nav-group-label {
  padding: 4px 16px;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #94a3b8;
}

.nav-link {
  display: block;
  padding: 8px 16px;
  text-decoration: none;
  color: #cbd5e1;
  line-height: 1.3;
}

.nav-link:hover {
  background: #334155;
  color: #f8fafc;
}

.nav-link.active {
  background: #3b82f6;
  color: #f8fafc;
}

.nav-link-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
}

.nav-link-blurb {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.nav-link.active .nav-link-blurb {
  color: #dbeafe;
}

.content {
  position: relative;
  overflow: hidden;
}

button {
  cursor: pointer;
}
button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
