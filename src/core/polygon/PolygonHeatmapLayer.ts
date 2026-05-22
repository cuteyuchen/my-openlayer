import Feature from "ol/Feature";
import { Point } from "ol/geom";
import Map from "ol/Map";
import { Heatmap } from "ol/layer";
import VectorSource from "ol/source/Vector";
import type { HeatMapOptions, PointData } from "../../types";
import { ConfigManager, MapTools } from "../map";
import { ErrorHandler } from "../../utils/ErrorHandler";

/**
 * 面热力图辅助类。
 */
export default class PolygonHeatmapLayer {
  static addHeatmap(map: Map, pointData: PointData[], options?: HeatMapOptions) {
    if (options?.layerName) {
      new MapTools(map).removeLayer(options.layerName);
    }

    const mergedOptions: HeatMapOptions = {
      ...ConfigManager.DEFAULT_HEATMAP_OPTIONS,
      ...options
    };

    const heatmapLayer = new Heatmap({
      source: new VectorSource(),
      weight: (feature: Feature) => feature.get('weight'),
      blur: mergedOptions.blur ?? ConfigManager.DEFAULT_HEATMAP_OPTIONS.blur,
      radius: mergedOptions.radius ?? ConfigManager.DEFAULT_HEATMAP_OPTIONS.radius,
      zIndex: mergedOptions.zIndex ?? ConfigManager.DEFAULT_HEATMAP_OPTIONS.zIndex,
      opacity: mergedOptions.opacity ?? ConfigManager.DEFAULT_HEATMAP_OPTIONS.opacity
    });

    if (mergedOptions.layerName) {
      heatmapLayer.set('layerName', mergedOptions.layerName);
    }

    map.addLayer(heatmapLayer);

    const valueKey = mergedOptions.valueKey || ConfigManager.DEFAULT_HEATMAP_VALUE_KEY;
    // 计算归一化最大值。当数据里没有 valueKey 或值全为非数字时，max 是 NaN/-Infinity，
    // 会导致 weight = value/max = NaN，OL 热力图整层不渲染。
    // 此时回退到等权重 1（让用户至少看到热力图，再去补 valueKey）。
    const numericValues = pointData
      .map(item => Number(item[valueKey]))
      .filter(v => Number.isFinite(v));
    const max = numericValues.length > 0 ? Math.max(...numericValues) : 0;
    const useFallbackWeight = max <= 0;
    if (useFallbackWeight) {
      ErrorHandler.getInstance().warn(
        `[Heatmap] 数据中未找到有效的 "${valueKey}" 字段，已回退为等权重渲染。请通过 options.valueKey 指定正确字段。`
      );
    }
    pointData.forEach(item => {
      const raw = Number(item[valueKey]);
      const weight = useFallbackWeight || !Number.isFinite(raw) ? 1 : raw / max;
      heatmapLayer.getSource()!.addFeature(new Feature({
        geometry: new Point([item.lgtd, item.lttd]),
        weight
      }));
    });

    return heatmapLayer;
  }
}
