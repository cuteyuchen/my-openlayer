import type { PointData } from "../../types";

/** *********************点 Feature 属性构建*********************/

/**
 * 构建写入 OpenLayers Feature 顶层的点属性。
 *
 * lgtd / lttd 只用于几何坐标，不作为业务属性平铺；rawData 保留给旧代码兼容，
 * 新代码应优先通过 feature.get('字段名') 或 feature.getProperties() 读取业务字段。
 */
export function createPointFeatureProperties(item: PointData, layerName?: string): Record<string, unknown> {
  const businessProperties: Record<string, unknown> = {};
  Object.keys(item).forEach(key => {
    if (key !== 'lgtd' && key !== 'lttd') {
      businessProperties[key] = item[key];
    }
  });

  return {
    ...businessProperties,
    rawData: item,
    type: layerName,
    layerName,
  };
}
