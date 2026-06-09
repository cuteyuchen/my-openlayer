/**
 * addGeoJSON 综合示例数据。
 *
 * 包含混合几何类型（点/线/面）和分组属性，用于演示 addGeoJSON 的各种用法。
 */
import type { MapJSONData } from '../../src'

/** 混合几何类型 FeatureCollection：点、线、面混合。 */
export const mixedGeoJSON: MapJSONData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: '监测站A', level: 'high' },
      geometry: { type: 'Point', coordinates: [119.85, 29.95] }
    },
    {
      type: 'Feature',
      properties: { name: '监测站B', level: 'low' },
      geometry: { type: 'Point', coordinates: [119.95, 30.02] }
    },
    {
      type: 'Feature',
      properties: { name: '主干管线' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [119.78, 29.88],
          [119.88, 29.96],
          [119.98, 30.04]
        ]
      }
    },
    {
      type: 'Feature',
      properties: { name: '预警区域', BASIN: 'demo' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [119.75, 29.9],
            [120.0, 29.9],
            [120.0, 30.08],
            [119.75, 30.08],
            [119.75, 29.9]
          ]
        ]
      }
    }
  ]
}

/** 按风险等级分组的点数据。 */
export const groupedPoints: MapJSONData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: '高风险点1', risk: 'high' },
      geometry: { type: 'Point', coordinates: [119.82, 29.92] }
    },
    {
      type: 'Feature',
      properties: { name: '高风险点2', risk: 'high' },
      geometry: { type: 'Point', coordinates: [119.88, 29.98] }
    },
    {
      type: 'Feature',
      properties: { name: '中风险点1', risk: 'medium' },
      geometry: { type: 'Point', coordinates: [119.92, 29.94] }
    },
    {
      type: 'Feature',
      properties: { name: '低风险点1', risk: 'low' },
      geometry: { type: 'Point', coordinates: [119.96, 30.0] }
    },
    {
      type: 'Feature',
      properties: { name: '低风险点2', risk: 'low' },
      geometry: { type: 'Point', coordinates: [120.0, 29.96] }
    }
  ]
}

/** 多条路线数据，用于 Record 输入演示。 */
export const routesGeoJSON: MapJSONData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: '路线A' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [119.8, 29.9],
          [119.9, 29.95],
          [120.0, 30.0]
        ]
      }
    }
  ]
}

/** 站点数据，用于 Record 输入演示。 */
export const stationsGeoJSON: MapJSONData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: '站点1' },
      geometry: { type: 'Point', coordinates: [119.83, 29.93] }
    },
    {
      type: 'Feature',
      properties: { name: '站点2' },
      geometry: { type: 'Point', coordinates: [119.93, 29.97] }
    }
  ]
}
