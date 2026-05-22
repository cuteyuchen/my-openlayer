/**
 * 共用点位测试数据。
 */
import type { PointData, TwinkleItem } from '../../src'

/** 一组带 level 的点（便于测 PulsePoint colorMap）。 */
export const sampleLevelPoints: PointData[] = [
  { lgtd: 119.78, lttd: 29.89, name: '红色预警', lev: 0 },
  { lgtd: 119.92, lttd: 30.02, name: '橙色预警', lev: 1 },
  { lgtd: 120.05, lttd: 29.95, name: '黄色预警', lev: 2 },
  { lgtd: 119.85, lttd: 30.1, name: '蓝色预警', lev: 3 },
  { lgtd: 120.0, lttd: 29.86, name: '蓝色预警', lev: 3 }
]

/** 用于聚合点位测试，更多更密集的点。 */
export const sampleClusterPoints: PointData[] = Array.from({ length: 60 }).map((_, i) => ({
  lgtd: 119.6 + (i % 12) * 0.04 + Math.random() * 0.01,
  lttd: 29.8 + Math.floor(i / 12) * 0.04 + Math.random() * 0.01,
  name: `点 ${i + 1}`,
  lev: i % 4
}))

/** addDomPoint 用的 TwinkleItem 数据（带 className 用于自定义闪烁样式）。 */
export const sampleTwinkleItems: TwinkleItem[] = [
  { lgtd: 119.8, lttd: 29.95, name: 'A', className: 'twinkle-red' },
  { lgtd: 119.95, lttd: 30.0, name: 'B', className: 'twinkle-orange' },
  { lgtd: 120.05, lttd: 29.92, name: 'C', className: 'twinkle-blue' }
]
