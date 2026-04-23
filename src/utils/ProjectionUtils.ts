import { transform } from 'ol/proj';

/**
 * 可携带投影参数的配置对象。
 */
export interface ProjectionOptionLike {
  dataProjection?: string;
  featureProjection?: string;
  /**
   * @deprecated 新项目请使用 dataProjection / featureProjection。
   */
  projectionOptOptions?: {
    dataProjection?: string;
    featureProjection?: string;
    [key: string]: unknown;
  };
}

/**
 * 投影处理工具，统一显式字段与旧 projectionOptOptions 的兼容逻辑。
 */
export class ProjectionUtils {
  /**
   * 生成 GeoJSON 读取投影参数。显式字段优先于旧 projectionOptOptions。
   */
  static getGeoJSONReadOptions(options?: ProjectionOptionLike): Record<string, unknown> {
    const legacyOptions = options?.projectionOptOptions ?? {};
    const readOptions: Record<string, unknown> = { ...legacyOptions };

    if (options?.dataProjection) {
      readOptions.dataProjection = options.dataProjection;
    }

    if (options?.featureProjection) {
      readOptions.featureProjection = options.featureProjection;
    }

    return readOptions;
  }

  /**
   * 将输入坐标转换到目标要素投影。未传目标投影时保持原坐标。
   */
  static transformCoordinate(coordinate: number[], options?: ProjectionOptionLike): number[] {
    const featureProjection = options?.featureProjection ?? options?.projectionOptOptions?.featureProjection;
    if (!featureProjection) {
      return coordinate;
    }

    const dataProjection = options?.dataProjection ?? options?.projectionOptOptions?.dataProjection ?? 'EPSG:4326';
    if (dataProjection === featureProjection) {
      return coordinate;
    }

    return transform(coordinate, dataProjection, featureProjection);
  }
}
