<template>
  <div class="demo-layout">
    <header class="demo-header">
      <h2>{{ title }}</h2>
      <p v-if="description" class="demo-desc">{{ description }}</p>
    </header>

    <div class="demo-body">
      <aside class="demo-controls">
        <slot name="controls" />
      </aside>

      <main class="demo-map-wrap">
        <div ref="mapContainer" class="demo-map" />
        <slot name="overlay" />
      </main>
    </div>

    <DemoLogPanel class="demo-log" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DemoLogPanel from './DemoLogPanel.vue'

defineProps<{ title: string; description?: string }>()

const mapContainer = ref<HTMLElement | null>(null)
defineExpose({ mapContainer })
</script>

<style scoped>
.demo-layout {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100%;
  overflow: hidden;
}

.demo-header {
  padding: 12px 20px 8px;
  border-bottom: 1px solid #e6e6e6;
  background: #fafbfc;
}

.demo-header h2 {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2d3d;
}

.demo-desc {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
}

.demo-body {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 0;
}

.demo-controls {
  padding: 12px;
  background: #f5f7fa;
  border-right: 1px solid #e6e6e6;
  overflow-y: auto;
}

.demo-map-wrap {
  position: relative;
  min-width: 0;
  min-height: 0;
}

.demo-map {
  width: 100%;
  height: 100%;
}

.demo-log {
  border-top: 1px solid #e6e6e6;
}
</style>
