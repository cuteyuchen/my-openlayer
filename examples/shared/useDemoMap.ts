/**
 * useDemoMap：所有 demo 页面共用的地图实例 lifecycle 管理。
 *
 * - 自动在 onMounted 时根据 containerRef 创建 MyOl
 * - 自动在 onBeforeUnmount 时调用 myOl.destroy()
 * - 暴露 reactive map / myOl 状态供页面绑定按钮
 * - 通过 demoLog 自动记录 lifecycle
 * - 默认切换到影像底图（img_c），让 demo 视觉更清晰
 */
import { onBeforeUnmount, onMounted, ref, shallowRef, type Ref } from 'vue'
import { MyOl } from '../../src'
import type { MyOl as MyOlType, MapInitType, TiandituType } from '../../src'
import { demoLog } from './useDemoLog'

export interface UseDemoMapOptions extends Partial<MapInitType> {
  /** 容器 ref，必填。模板里挂到 <div ref="..." />。 */
  containerRef: Ref<HTMLElement | null>
  /** 页面标识，用于日志区分。 */
  pageName: string
  /**
   * 初始底图类型，默认 'img_c'（影像图）。传 null 则保持库默认（矢量图）。
   */
  baseLayer?: TiandituType | null
}

export function useDemoMap(options: UseDemoMapOptions) {
  const myOl = shallowRef<MyOlType | null>(null)
  const ready = ref(false)

  // 天地图 token 从环境变量取，没配置就用占位符（地图仍可生成，但底图不显示）
  const tiandituToken =
    (import.meta as any).env?.VITE_TIANDITU_TOKEN || 'YOUR_TIANDITU_TOKEN_HERE'

  onMounted(() => {
    if (!options.containerRef.value) {
      demoLog.error(options.pageName, 'mount 时 container 仍为 null')
      return
    }

    const { containerRef, pageName, baseLayer = 'img_c', ...rest } = options
    try {
      myOl.value = new MyOl(containerRef.value, {
        token: tiandituToken,
        center: [119.9, 29.98],
        zoom: 9,
        annotation: true,
        ...rest
      })
      // 默认切到影像底图（demos 在影像下视觉对比更清晰）
      if (baseLayer) {
        try {
          myOl.value.getMapBaseLayers().switchBaseLayer(baseLayer)
        } catch (err) {
          demoLog.warn(pageName, `switchBaseLayer('${baseLayer}') 失败，保持库默认底图`, err)
        }
      }
      ready.value = true
      demoLog.info(pageName, 'new MyOl(container, options)', {
        center: rest.center ?? [119.9, 29.98],
        zoom: rest.zoom ?? 9,
        baseLayer: baseLayer ?? '(默认)'
      })
    } catch (err) {
      demoLog.error(pageName, 'MyOl 构造失败', err)
    }
  })

  onBeforeUnmount(() => {
    if (myOl.value) {
      try {
        myOl.value.destroy()
        demoLog.info(options.pageName, 'myOl.destroy() — 离开页面前清理')
      } catch (err) {
        demoLog.error(options.pageName, 'destroy 失败', err)
      }
    }
    myOl.value = null
    ready.value = false
  })

  return { myOl, ready }
}
