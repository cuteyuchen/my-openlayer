import { describe, expect, it } from "vitest";
import proj4 from "proj4";
import { addCommon, clearAllProjections, get as getProjection } from "ol/proj";
import MyOl from "../src/MyOl";
import type { MapInitType } from "../src/types";

type ProjectionInitializer = {
  initializeProjections(options: MapInitType): void;
};

const initializeProjections = (MyOl as unknown as ProjectionInitializer).initializeProjections.bind(MyOl);

/** *********************投影测试工具*********************/
function resetProjectionState(): void {
  clearAllProjections();
  addCommon();
}

describe("MyOl 投影初始化", () => {
  it("在 proj4 默认副作用缺失时补齐 EPSG:4326 并允许创建默认视图", () => {
    const originalEpsg4326 = proj4.defs("EPSG:4326");
    const originalWgs84Alias = proj4.defs.WGS84;

    try {
      delete proj4.defs["EPSG:4326"];
      delete proj4.defs.WGS84;
      resetProjectionState();

      initializeProjections(MyOl.DefaultOptions);

      expect(proj4.defs("EPSG:4326")).toBeTruthy();
      expect(() => MyOl.createView(MyOl.DefaultOptions)).not.toThrow();
    } finally {
      if (originalEpsg4326) {
        proj4.defs("EPSG:4326", originalEpsg4326);
      }
      if (originalWgs84Alias) {
        proj4.defs.WGS84 = originalWgs84Alias;
      }
      resetProjectionState();
    }
  });

  it("自定义米制投影未显式传 metadata 时保留 proj4 推导的单位", () => {
    const code = "EPSG:12345";
    const originalDefinition = proj4.defs(code);

    try {
      delete proj4.defs[code];
      resetProjectionState();

      initializeProjections({
        ...MyOl.DefaultOptions,
        projection: {
          code,
          def: "+proj=tmerc +lat_0=0 +lon_0=120 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs"
        }
      });

      expect(getProjection(code)?.getUnits()).toBe("m");
    } finally {
      if (originalDefinition) {
        proj4.defs(code, originalDefinition);
      } else {
        delete proj4.defs[code];
      }
      resetProjectionState();
    }
  });

  it("createView 使用自定义米制投影时复用已注册投影单位", () => {
    const code = "EPSG:12346";
    const originalDefinition = proj4.defs(code);
    const options: MapInitType = {
      ...MyOl.DefaultOptions,
      center: [120, 30],
      projection: {
        code,
        def: "+proj=tmerc +lat_0=0 +lon_0=120 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs"
      }
    };

    try {
      delete proj4.defs[code];
      resetProjectionState();

      initializeProjections(options);

      expect(MyOl.createView(options).getProjection().getUnits()).toBe("m");
    } finally {
      if (originalDefinition) {
        proj4.defs(code, originalDefinition);
      } else {
        delete proj4.defs[code];
      }
      resetProjectionState();
    }
  });
});
