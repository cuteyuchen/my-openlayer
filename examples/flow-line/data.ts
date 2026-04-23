import type { MapJSONData } from '../../src';

/**
 * 普通 LineString 示例数据。
 */
export const singleLineData: MapJSONData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        name: '主干流'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [119.72, 29.88],
          [119.84, 29.95],
          [119.96, 30.02]
        ]
      }
    }
  ]
};

/**
 * LineString 与 MultiLineString 混合示例数据。
 */
export const mixedFlowLineData: MapJSONData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        name: '主河道'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [119.75, 29.9],
          [119.86, 29.98],
          [119.98, 30.04]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: '支流组'
      },
      geometry: {
        type: 'MultiLineString',
        coordinates: [
          [
            [119.8, 29.84],
            [119.9, 29.9],
            [120.02, 29.97]
          ],
          [
            [119.82, 30.05],
            [119.92, 30.0],
            [120.03, 29.94]
          ]
        ]
      }
    }
  ]
};
