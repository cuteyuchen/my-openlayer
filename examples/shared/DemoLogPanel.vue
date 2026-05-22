<template>
  <div class="log-panel" :class="{ collapsed: !expanded }">
    <header class="log-header" @click="expanded = !expanded">
      <span class="log-title">调用日志 ({{ entries.length }})</span>
      <button class="log-clear" @click.stop="clear" :disabled="entries.length === 0">清空</button>
      <span class="log-toggle">{{ expanded ? '▼' : '▲' }}</span>
    </header>
    <ul v-if="expanded" class="log-list">
      <li v-for="e in entries" :key="e.id" :class="`log-item log-${e.level}`">
        <span class="log-ts">{{ formatTs(e.ts) }}</span>
        <span class="log-page">[{{ e.page }}]</span>
        <span class="log-msg">{{ e.message }}</span>
        <pre v-if="e.detail !== undefined" class="log-detail">{{ formatDetail(e.detail) }}</pre>
      </li>
      <li v-if="entries.length === 0" class="log-empty">暂无调用记录</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDemoLog } from './useDemoLog'

const { entries, clear } = useDemoLog()
const expanded = ref(true)

function formatTs(ts: number) {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function formatDetail(detail: unknown) {
  if (detail instanceof Error) return `${detail.name}: ${detail.message}`
  try {
    return JSON.stringify(detail, replacer, 2)
  } catch {
    return String(detail)
  }
}

function replacer(_key: string, value: unknown): unknown {
  if (value && typeof value === 'object' && value.constructor?.name) {
    const ctor = value.constructor.name
    // 跳过 OL 的大对象，避免 JSON 爆炸
    if (['_Map', '_VectorLayer', '_VectorSource', '_Feature', '_Style', '_Icon'].includes(ctor)) {
      return `<${ctor.slice(1)}>`
    }
  }
  return value
}
</script>

<style scoped>
.log-panel {
  display: flex;
  flex-direction: column;
  background: #1f2d3d;
  color: #d4d8df;
  font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace;
  font-size: 12px;
  max-height: 240px;
  transition: max-height 0.2s;
}
.log-panel.collapsed {
  max-height: 32px;
}
.log-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px;
  background: #0f172a;
  cursor: pointer;
  user-select: none;
}
.log-title { flex: 1; font-weight: 600; }
.log-clear {
  background: transparent;
  border: 1px solid #475569;
  color: #d4d8df;
  padding: 2px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
}
.log-clear:disabled { opacity: 0.5; cursor: not-allowed; }
.log-toggle { color: #94a3b8; }
.log-list {
  flex: 1;
  margin: 0;
  padding: 4px 8px 8px;
  list-style: none;
  overflow-y: auto;
}
.log-item {
  padding: 4px 4px;
  border-bottom: 1px dashed #334155;
  line-height: 1.4;
}
.log-ts { color: #64748b; margin-right: 6px; }
.log-page { color: #60a5fa; margin-right: 6px; }
.log-info .log-msg { color: #d4d8df; }
.log-warn .log-msg { color: #facc15; }
.log-error .log-msg { color: #f87171; }
.log-detail {
  margin: 4px 0 0;
  padding: 4px 6px;
  background: #0f172a;
  border-radius: 3px;
  white-space: pre-wrap;
  word-break: break-all;
  color: #94a3b8;
  font-size: 11px;
}
.log-empty {
  padding: 16px;
  text-align: center;
  color: #64748b;
  list-style: none;
}
</style>
