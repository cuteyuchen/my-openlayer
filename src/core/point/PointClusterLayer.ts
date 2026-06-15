import Feature from "ol/Feature";
import Map from "ol/Map";
import { Point as OlPoint } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Cluster } from "ol/source";
import type { ClusterOptions, ClusterPointLayerOptions, PointData } from "../../types";
import ProjectionUtils from "../../utils/ProjectionUtils";
import ValidationUtils from "../../utils/ValidationUtils";
import { ConfigManager } from "../map";
import { createPointFeatureProperties } from "./PointFeatureProperties";

/**
 * 点聚合图层构建器。
 */
export default class PointClusterLayer {
  static create(
    map: Map,
    pointData: PointData[],
    options: ClusterPointLayerOptions,
    createClusterStyle: (options: ClusterOptions, name: string) => any
  ): VectorLayer<VectorSource> {
    const pointFeatureList: Feature[] = [];
    pointData.forEach(item => {
      if (!ValidationUtils.validateCoordinates(item)) {
        return;
      }

      pointFeatureList.push(new Feature({
        ...createPointFeatureProperties(item, options.layerName),
        geometry: new OlPoint(ProjectionUtils.transformCoordinate([item.lgtd, item.lttd], options)),
      }));
    });

    const source = new VectorSource({ features: pointFeatureList });
    const clusterSource = new Cluster({
      distance: options.distance || ConfigManager.DEFAULT_CLUSTER_OPTIONS.distance,
      minDistance: options.minDistance || ConfigManager.DEFAULT_CLUSTER_OPTIONS.minDistance,
      source,
    });

    const clusterLayer = new VectorLayer({
      properties: {
        name: options.layerName,
        layerName: options.layerName
      },
      source: clusterSource,
      style: (feature: Feature) => {
        if (options.style) {
          if (typeof options.style === 'function') {
            return options.style(feature);
          }
          return options.style;
        }
        const rawFeature = feature.get('features')[0];
        const rawData = rawFeature.get('rawData') as PointData | undefined;
        const name = options.textKey ? String(rawData?.[options.textKey] ?? '') : '';
        return createClusterStyle(options, name);
      },
      zIndex: options.zIndex || ConfigManager.DEFAULT_CLUSTER_OPTIONS.zIndex,
    } as any);

    clusterLayer.setVisible(options.visible === undefined ? true : options.visible);
    map.addLayer(clusterLayer);
    return clusterLayer as any;
  }
}
