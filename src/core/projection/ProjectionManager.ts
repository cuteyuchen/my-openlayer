/**
 * 投影管理器
 *
 * 集中管理所有投影注册与解析逻辑，对外暴露内置常量（EPSG:4326 / 4490 / 4549）以及
 * 自定义投影注册入口。MyOl 内部委托此类初始化投影，使用户也可以在 MyOl 实例之外
 * 主动注册新的 EPSG。
 */
import proj4 from "proj4";
import { register as olProj4Register } from "ol/proj/proj4";
import {
  Projection as olProjProjection,
  addProjection as olProjAddProjection,
  get as olProjGetProjection
} from "ol/proj";
import type { Units } from "ol/proj/Units";
import type { MapInitType } from "../../types";

/**
 * 项目内置 EPSG 编码。
 */
export const PROJECTIONS = {
  WGS84: "EPSG:4326",
  CGCS2000: "EPSG:4490",
  CGCS2000_3_DEGREE: "EPSG:4549"
} as const;

/**
 * 内置 EPSG 的 proj4 定义字符串。
 */
const PROJECTION_DEFINITIONS = {
  [PROJECTIONS.WGS84]:
    "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees",
  [PROJECTIONS.CGCS2000]: "+proj=longlat +ellps=GRS80 +no_defs",
  [PROJECTIONS.CGCS2000_3_DEGREE]:
    "+proj=tmerc +lat_0=0 +lon_0=120 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs"
} as const;

/**
 * 自定义投影注册元数据。
 */
export interface CustomProjectionRegistration {
  /** EPSG 编码，例如 "EPSG:4528" */
  code: string;
  /** proj4 定义字符串 */
  def: string;
  /** 投影范围 [minX, minY, maxX, maxY] */
  extent?: number[];
  /** 世界范围 [minX, minY, maxX, maxY] */
  worldExtent?: number[];
  /** OL 投影单位（degrees / m / ft 等），未提供时从 proj4 定义自动推导 */
  units?: Units;
}

export default class ProjectionManager {
  /** 项目内置 EPSG 编码常量。 */
  static readonly PROJECTIONS = PROJECTIONS;

  /** 默认投影 = EPSG:4490 (CGCS2000)。 */
  static readonly DEFAULT_PROJECTION = PROJECTIONS.CGCS2000;

  /**
   * 注册内置投影 + 应用 options.projection 自定义投影。
   *
   * 幂等：重复调用安全。被 MyOl 构造函数和 MyOl.createView 都会调，外部一般无需直接调用。
   */
  static initialize(options?: MapInitType): void {
    ProjectionManager.ensureProj4Definition(
      PROJECTIONS.WGS84,
      PROJECTION_DEFINITIONS[PROJECTIONS.WGS84]
    );
    ProjectionManager.ensureProj4Definition(
      PROJECTIONS.CGCS2000,
      PROJECTION_DEFINITIONS[PROJECTIONS.CGCS2000]
    );
    ProjectionManager.ensureProj4Definition(
      PROJECTIONS.CGCS2000_3_DEGREE,
      PROJECTION_DEFINITIONS[PROJECTIONS.CGCS2000_3_DEGREE]
    );

    // 用户自定义投影的 proj4 定义优先注入
    if (options?.projection?.code && options.projection.def) {
      proj4.defs(options.projection.code, options.projection.def);
    }

    // 注入 proj4 → OpenLayers
    olProj4Register(proj4);

    // 注册 CGCS2000 OL Projection（带 degrees 单位）
    olProjAddProjection(
      new olProjProjection({
        code: PROJECTIONS.CGCS2000,
        extent: [-180, -90, 180, 90],
        worldExtent: [-180, -90, 180, 90],
        units: "degrees"
      })
    );

    if (options?.projection?.code) {
      ProjectionManager.applyCustomProjectionMetadata(options.projection);
    }
  }

  /**
   * 注册一个任意 EPSG 投影到 proj4 + OL。
   *
   * 这是 MyOl 之外的便利入口。units 未提供时由 proj4 自动推导。
   */
  static register(registration: CustomProjectionRegistration): void {
    const { code, def, extent, worldExtent, units } = registration;
    ProjectionManager.ensureProj4Definition(code, def);
    olProj4Register(proj4);
    ProjectionManager.applyCustomProjectionMetadata({
      code,
      def,
      extent,
      worldExtent,
      units
    });
  }

  /**
   * 解析视图投影，优先复用已注册投影，避免丢失 proj4 推导的单位信息。
   *
   * 仅当 options 显式覆盖 extent / worldExtent / units 之一时才新建 Projection 实例。
   */
  static resolveViewProjection(options: MapInitType, code: string): olProjProjection {
    const registeredProjection = olProjGetProjection(code);

    if (
      registeredProjection
      && !options.projection?.extent
      && !options.projection?.worldExtent
      && !options.projection?.units
    ) {
      return registeredProjection;
    }

    return new olProjProjection({
      code,
      extent:
        options.projection?.extent
        ?? registeredProjection?.getExtent()
        ?? [-180, -90, 180, 90],
      worldExtent:
        options.projection?.worldExtent
        ?? registeredProjection?.getWorldExtent()
        ?? [-180, -90, 180, 90],
      units:
        options.projection?.units
        ?? registeredProjection?.getUnits()
        ?? "degrees"
    });
  }

  /**
   * 缺失时注册 proj4 投影定义，避免生产构建依赖第三方模块默认副作用。
   */
  private static ensureProj4Definition(code: string, definition: string): void {
    if (!proj4.defs(code)) {
      proj4.defs(code, definition);
    }
  }

  /**
   * 应用用户显式提供的投影元数据。
   *
   * - 提供 units：以用户输入为权威，覆盖已注册投影
   * - 未提供 units 但已注册：仅刷新 extent / worldExtent
   * - 未提供 units 且未注册：新建 Projection（OL 会从 proj4 推导单位）
   */
  private static applyCustomProjectionMetadata(
    projection: NonNullable<MapInitType["projection"]>
  ): void {
    const { code, extent, worldExtent, units } = projection;
    const registeredProjection = olProjGetProjection(code);

    if (units) {
      olProjAddProjection(
        new olProjProjection({
          code,
          extent: extent ?? registeredProjection?.getExtent(),
          worldExtent: worldExtent ?? registeredProjection?.getWorldExtent(),
          units
        })
      );
      return;
    }

    if (registeredProjection) {
      if (extent) registeredProjection.setExtent(extent);
      if (worldExtent) registeredProjection.setWorldExtent(worldExtent);
      return;
    }

    if (extent || worldExtent) {
      olProjAddProjection(
        new olProjProjection({
          code,
          extent,
          worldExtent
        })
      );
    }
  }
}
