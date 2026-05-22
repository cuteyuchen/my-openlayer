/**
 * useDemoLog：跨页面的统一日志通道。
 *
 * 所有 demo 调用 demoLog.info / .warn / .error 推送一条记录，DemoLogPanel
 * 订阅显示。日志保存在内存数组里，跨路由保留。
 */
import { reactive, readonly } from 'vue'

export type DemoLogLevel = 'info' | 'warn' | 'error'

export interface DemoLogEntry {
  id: number
  ts: number
  level: DemoLogLevel
  page: string
  message: string
  detail?: unknown
}

const state = reactive({ entries: [] as DemoLogEntry[], counter: 0 })

function push(level: DemoLogLevel, page: string, message: string, detail?: unknown) {
  state.counter += 1
  state.entries.unshift({
    id: state.counter,
    ts: Date.now(),
    level,
    page,
    message,
    detail
  })
  // 限制到 200 条避免内存暴涨
  if (state.entries.length > 200) {
    state.entries.length = 200
  }
}

export const demoLog = {
  info(page: string, message: string, detail?: unknown) {
    push('info', page, message, detail)
  },
  warn(page: string, message: string, detail?: unknown) {
    push('warn', page, message, detail)
  },
  error(page: string, message: string, detail?: unknown) {
    push('error', page, message, detail)
    // 同时镜像到 console 方便 devtools 看堆栈
    console.error(`[${page}] ${message}`, detail)
  },
  clear() {
    state.entries.length = 0
  }
}

/** 给组件用的只读状态。 */
export function useDemoLog() {
  return { entries: readonly(state.entries), clear: demoLog.clear }
}
