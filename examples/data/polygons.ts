/**
 * 共用面要素测试数据。
 */
import type { MapJSONData } from '../../src'

/** 一个简单矩形面，覆盖示例区域。 */
export const sampleRectPolygon: MapJSONData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: '示例区域', BASIN: 'demo' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [119.7, 29.82],
            [120.1, 29.82],
            [120.1, 30.12],
            [119.7, 30.12],
            [119.7, 29.82]
          ]
        ]
      }
    }
  ]
}

/** 两个相邻的小面，可用于演示按属性着色。 */
export const sampleTwoPolygons: MapJSONData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: '北区', BASIN: 'north', level: '0' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [119.75, 29.95],
            [119.95, 29.95],
            [119.95, 30.1],
            [119.75, 30.1],
            [119.75, 29.95]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      properties: { name: '南区', BASIN: 'south', level: '2' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [119.75, 29.82],
            [119.95, 29.82],
            [119.95, 29.95],
            [119.75, 29.95],
            [119.75, 29.82]
          ]
        ]
      }
    }
  ]
}
