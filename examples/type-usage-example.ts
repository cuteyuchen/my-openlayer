/**
 * 类型使用示例 - 展示如何使用重构后的类型接口
 */

import { 
  BaseOptions, 
  StyleOptions, 
  TextOptions,
  PointOptions, 
  LineOptions, 
  PolygonOptions,
  ClusterOptions,
  OptionsType // 兼容性类型
} from '../src/types';

// 1. 基础选项示例
const baseConfig: BaseOptions = {
  layerName: 'example-layer',
  zIndex: 10,
  visible: true,
  opacity: 0.8,
  fitView: true
};

// 2. 样式选项示例
const styleConfig: StyleOptions = {
  strokeColor: '#ff0000',
  strokeWidth: 2,
  fillColor: 'rgba(255, 0, 0, 0.3)',
  lineDash: [5, 5]
};

// 3. 文本选项示例
const textConfig: TextOptions = {
  textVisible: true,
  textFont: '14px Arial',
  textFillColor: '#000000',
  textStrokeColor: '#ffffff',
  textStrokeWidth: 2,
  textCallBack: (feature) => feature.get('name') || '未命名'
};

// 4. 点位选项示例
const pointConfig: PointOptions = {
  ...baseConfig,
  ...styleConfig,
  ...textConfig,
  nameKey: 'name',
  img: '/icons/marker.png',
  scale: 1.2,
  hasImg: true,
  iconColor: '#0066cc'
};

// 5. 线条选项示例
const lineConfig: LineOptions = {
  ...baseConfig,
  ...styleConfig,
  ...textConfig,
  type: 'highway'
};

// 6. 多边形选项示例
const polygonConfig: PolygonOptions = {
  ...baseConfig,
  ...styleConfig,
  ...textConfig,
  nameKey: 'region_name',
  mask: false
};

// 7. 聚合选项示例
const clusterConfig: ClusterOptions = {
  ...pointConfig,
  distance: 50,
  minDistance: 20
};

// 8. 兼容性使用示例（保持向后兼容）
const legacyConfig: OptionsType = {
  layerName: 'legacy-layer',
  strokeColor: '#00ff00',
  fillColor: 'rgba(0, 255, 0, 0.3)',
  textVisible: true,
  nameKey: 'title'
};

// 9. 组合使用示例
function createLayerConfig(type: 'point' | 'line' | 'polygon'): BaseOptions & StyleOptions {
  const base: BaseOptions = {
    layerName: `${type}-layer`,
    zIndex: 1,
    visible: true
  };
  
  const style: StyleOptions = {
    strokeColor: type === 'point' ? '#ff0000' : type === 'line' ? '#00ff00' : '#0000ff',
    strokeWidth: 2,
    fillColor: `rgba(${type === 'point' ? '255,0,0' : type === 'line' ? '0,255,0' : '0,0,255'}, 0.3)`
  };
  
  return { ...base, ...style };
}

// 10. 类型安全的配置函数
function validatePointConfig(config: PointOptions): boolean {
  return !!(config.layerName && config.zIndex !== undefined);
}

function validateLineConfig(config: LineOptions): boolean {
  return !!(config.layerName && config.strokeColor);
}

function validatePolygonConfig(config: PolygonOptions): boolean {
  return !!(config.layerName && (config.strokeColor || config.fillColor));
}

// 使用示例
console.log('Point config valid:', validatePointConfig(pointConfig));
console.log('Line config valid:', validateLineConfig(lineConfig));
console.log('Polygon config valid:', validatePolygonConfig(polygonConfig));

export {
  baseConfig,
  styleConfig,
  textConfig,
  pointConfig,
  lineConfig,
  polygonConfig,
  clusterConfig,
  legacyConfig,
  createLayerConfig,
  validatePointConfig,
  validateLineConfig,
  validatePolygonConfig
};