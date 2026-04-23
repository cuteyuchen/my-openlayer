import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import { LineString, MultiLineString } from 'ol/geom';
import { ErrorHandler } from '../../utils/ErrorHandler';
import ProjectionUtils from '../../utils/ProjectionUtils';
import type { FlowLineOptions, MapJSONData } from '../../types';

/**
 * 线要素工厂
 * 负责流动线数据标准化、过滤与克隆。
 */
export default class LineFeatureFactory {
  /**
   * 标准化线要素，兼容 FeatureCollection / Feature / LineString / MultiLineString。
   */
  static normalizeLineFeatures(data: unknown, options: FlowLineOptions): Feature<LineString>[] {
    if (!data) {
      ErrorHandler.getInstance().error('[LineFeatureFactory] 流动线数据不能为空');
      return [];
    }

    try {
      const readOptions = ProjectionUtils.getGeoJSONReadOptions(options);
      const features = new GeoJSON().readFeatures(data as any, readOptions);
      const normalizedFeatures: Feature<LineString>[] = [];

      features.forEach(feature => {
        const geometry = feature.getGeometry();
        if (!geometry) {
          return;
        }

        const properties = { ...feature.getProperties() };
        delete properties.geometry;

        if (geometry instanceof LineString) {
          if (geometry.getCoordinates().length >= 2) {
            normalizedFeatures.push(new Feature({
              ...properties,
              geometry: geometry.clone()
            }) as Feature<LineString>);
          }
          return;
        }

        if (geometry instanceof MultiLineString) {
          geometry.getLineStrings().forEach((lineString, index) => {
            if (lineString.getCoordinates().length < 2) {
              return;
            }

            normalizedFeatures.push(new Feature({
              ...properties,
              __segmentIndex: index,
              geometry: lineString.clone()
            }) as Feature<LineString>);
          });
        }
      });

      if (normalizedFeatures.length === 0) {
        ErrorHandler.getInstance().error('[LineFeatureFactory] 未找到可用于流动线动画的线要素');
      }

      return normalizedFeatures;
    } catch (error) {
      ErrorHandler.getInstance().error('[LineFeatureFactory] 标准化流动线数据失败:', error);
      return [];
    }
  }

  /**
   * 克隆线要素，用于基础线与动画线共用独立 source。
   */
  static cloneLineFeatures(features: Feature<LineString>[]): Feature<LineString>[] {
    return features.map(feature => {
      const properties = { ...feature.getProperties() };
      delete properties.geometry;
      return new Feature({
        ...properties,
        geometry: feature.getGeometry()?.clone()
      }) as Feature<LineString>;
    });
  }
}
