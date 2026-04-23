import Feature from "ol/Feature";
import Map from "ol/Map";
import { Point as OlPoint } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Cluster } from "ol/source";
import type { ClusterOptions, PointData } from "../../types";
import ProjectionUtils from "../../utils/ProjectionUtils";
import ValidationUtils from "../../utils/ValidationUtils";
import { ConfigManager } from "../map";

/**
 * 点聚合图层构建器。
 */
export default class PointClusterLayer {
  static create(
    map: Map,
    pointData: PointData[],
    options: ClusterOptions,
    createClusterStyle: (options: ClusterOptions, name: string) => any
  ): VectorLayer<VectorSource> {
    const pointFeatureList: Feature[] = [];
    pointData.forEach(item => {
      if (!ValidationUtils.validateCoordinates(item)) {
        return;
      }

      pointFeatureList.push(new Feature({
        type: options.layerName,
        layerName: options.layerName,
        geometry: new OlPoint(ProjectionUtils.transformCoordinate([item.lgtd, item.lttd], options)),
        name: options.textKey ? item[options.textKey] : '',
        rawData: item,
      }));
    });

    const source = new VectorSource({ features: pointFeatureList });
    const clusterSource = new Cluster({
      distance: options.distance || ConfigManager.DEFAULT_CLUSTER_OPTIONS.distance,
      minDistance: options.minDistance || ConfigManager.DEFAULT_CLUSTER_OPTIONS.minDistance,
      source,
    });

    const clusterLayer = new VectorLayer({
      layerName: options.layerName,
      source: clusterSource,
      style: (feature: any) => {
        if (options.style) {
          if (typeof options.style === 'function') {
            return options.style(feature);
          }
          return options.style;
        }
        const name = feature.get('features')[0].get('name');
        return createClusterStyle(options, name);
      },
      zIndex: options.zIndex || ConfigManager.DEFAULT_CLUSTER_OPTIONS.zIndex,
    } as any);

    clusterLayer.setVisible(options.visible === undefined ? true : options.visible);
    map.addLayer(clusterLayer);
    return clusterLayer as any;
  }
}
