import Feature from "ol/Feature";
import GeoJSON from "ol/format/GeoJSON";
import { Geometry, LinearRing } from "ol/geom";
import Map from "ol/Map";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, Stroke, Style } from "ol/style";
import { fromExtent } from "ol/geom/Polygon";
import type { MapJSONData, MaskLayerOptions } from "../../types";
import { ErrorHandler } from "../../utils/ErrorHandler";
import ValidationUtils from "../../utils/ValidationUtils";
import { ConfigManager } from "../map";

/**
 * 面遮罩图层辅助类。
 */
export default class PolygonMaskLayer {
  static setOutLayer(map: Map, data: MapJSONData, options?: {
    layerName?: string;
    extent?: any;
    fillColor?: string;
    strokeWidth?: number;
    strokeColor?: string;
    zIndex?: number;
  }) {
    function getCoordsGroup(geom: any) {
      let group: any[] = [];
      const geomType = geom.getType();
      if (geomType === 'LineString') {
        group.push(geom.getCoordinates());
      } else if (geomType === 'MultiLineString' || geomType === 'Polygon') {
        group = geom.getCoordinates();
      } else if (geomType === 'MultiPolygon') {
        geom.getPolygons().forEach((poly: any) => {
          group = group.concat(poly.getCoordinates());
        });
      } else {
        ErrorHandler.getInstance().warn('暂时不支持的类型');
      }
      return group;
    }

    function erase(geometries: Geometry[], view: any) {
      let allParts: any[] = [];
      geometries.forEach(geom => {
        const parts = getCoordsGroup(geom);
        if (parts && parts.length > 0) {
          allParts = allParts.concat(parts);
        }
      });
      if (allParts.length === 0) {
        return null;
      }

      const extent = view.getProjection().getExtent();
      const polygonRing = fromExtent(extent);
      allParts.forEach(item => {
        polygonRing.appendLinearRing(new LinearRing(item));
      });
      return polygonRing;
    }

    const shadeStyle = new Style({
      fill: new Fill({ color: options?.fillColor ?? 'rgba(0,27,59,0.8)' }),
      stroke: new Stroke({
        width: options?.strokeWidth ?? 1,
        color: options?.strokeColor ?? 'rgba(0,27,59,0.8)'
      })
    });

    const vtSource = new VectorSource();
    const vtLayer = new VectorLayer({
      source: vtSource,
      style: shadeStyle,
      zIndex: options?.zIndex ?? 12
    });
    vtLayer.set('layerName', options?.layerName ?? 'outLayer');

    const features = new GeoJSON().readFeatures(data);
    const geometries: Geometry[] = [];
    features.forEach(feature => {
      const geometry = feature.getGeometry();
      if (geometry) {
        geometries.push(geometry);
      }
    });

    if (geometries.length > 0) {
      const polygon = erase(geometries, map.getView());
      if (polygon) {
        vtSource.addFeature(new Feature({ geometry: polygon }));
      }
    }

    map.addLayer(vtLayer);
    return vtLayer;
  }

  static addMaskLayer(map: Map, data: any, options?: MaskLayerOptions): VectorLayer<VectorSource> {
    ValidationUtils.validateMaskData(data);
    const mergedOptions: MaskLayerOptions = {
      ...ConfigManager.DEFAULT_MASK_OPTIONS,
      ...options
    };

    const features = new GeoJSON().readFeatures(data);
    const maskLayer = new VectorLayer({
      source: new VectorSource({ features }),
      style: new Style({
        fill: new Fill({ color: mergedOptions.fillColor! }),
        stroke: mergedOptions.strokeColor ? new Stroke({
          color: mergedOptions.strokeColor,
          width: mergedOptions.strokeWidth || 1
        }) : undefined
      }),
      opacity: mergedOptions.opacity!,
      visible: mergedOptions.visible!
    });
    maskLayer.set('layerName', mergedOptions.layerName);
    map.addLayer(maskLayer);
    return maskLayer;
  }
}
