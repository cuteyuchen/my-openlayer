/**
 * P1-1：统一图层句柄接口。
 *
 * 真实图层类 add* 方法在 3.0 之后都返回符合 LayerHandle 的对象，
 * 用户记一次 `{ layer, remove, setVisible }` 就能跨 Point / Line / Polygon 通用。
 *
 * 动画句柄（流动线、闪烁点）扩展为 AnimatedLayerHandle，额外暴露 start/stop。
 * Overlay / Vue 组件点这类非图层控制对象使用 ControlHandle，通过 target 暴露控制目标。
 */
import type BaseLayer from "ol/layer/Base";

export interface LayerHandle<L extends BaseLayer = BaseLayer> {
  /** 实际的 OL 图层实例。 */
  readonly layer: L;

  /** 从地图移除此图层，停止所有动画与监听。可安全多次调用。 */
  remove(): void;

  /** 切换图层可见性。 */
  setVisible(visible: boolean): void;
}

export interface AnimatedLayerHandle<L extends BaseLayer = BaseLayer> extends LayerHandle<L> {
  start(): void;
  stop(): void;
  pause?(): void;
  resume?(): void;
  /** 更新底层数据（数据形态因实现而异）。 */
  updateData?(data: unknown): void;
}

export interface ControlHandle<T = unknown> {
  /** 非 OL 图层控制目标，例如 Overlay[] 或 VueTemplatePointInstance[]。 */
  readonly target: T;

  /** 移除控制目标。可安全多次调用。 */
  remove(): void;

  /** 切换控制目标可见性。 */
  setVisible(visible: boolean): void;
}
