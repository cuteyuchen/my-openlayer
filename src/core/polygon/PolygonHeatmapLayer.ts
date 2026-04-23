import Feature from "ol/Feature";
import { Point } from "ol/geom";
import Map from "ol/Map";
import { Heatmap } from "ol/layer";
import VectorSource from "ol/source/Vector";
import type { HeatMapOptions, PointData } from "../../types";
import { ConfigManager, MapTools } from "../map";

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
    const max = Math.max(...pointData.map(item => item[valueKey]));
    pointData.forEach(item => {
      heatmapLayer.getSource()!.addFeature(new Feature({
        geometry: new Point([item.lgtd, item.lttd]),
        weight: item[valueKey] / max
      }));
    });

    return heatmapLayer;
  }
}
