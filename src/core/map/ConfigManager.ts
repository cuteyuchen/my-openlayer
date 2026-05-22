import type { Units } from "ol/proj/Units";
import type { Positioning } from "ol/Overlay";

/**
 * P2-1：内部默认配置存储与 setDefaults 覆盖机制。
 *
 * 设计要点：
 * - 每组默认值都通过 getter 暴露，运行时 setDefaults 可叠加 partial 覆盖
 * - 旧 callsite 直接 spread `ConfigManager.DEFAULT_X` 不需要改一行代码
 * - 嵌套对象（如 flowSymbol）做深合并
 */

interface DefaultsRegistry {
  POINT_OPTIONS: { visible: boolean; zIndex: number };
  POINT_TEXT_OPTIONS: { textFont: string; textFillColor: string; textStrokeColor: string; textStrokeWidth: number; textOffsetY: number };
  POINT_ICON_SCALE: number;
  CLUSTER_OPTIONS: { distance: number; minDistance: number; zIndex: number };
  DOM_POINT_OVERLAY_OPTIONS: { positioning: Positioning; stopEvent: boolean };
  LINE_OPTIONS: { type: string; strokeColor: string; strokeWidth: number; visible: boolean; layerName: string; zIndex: number };
  FLOW_LINE_OPTIONS: any;
  POLYGON_OPTIONS: { zIndex: number; visible: boolean; textFont: string; textFillColor: string; textStrokeColor: string; textStrokeWidth: number };
  POLYGON_COLOR_MAP: Record<string, string>;
  IMAGE_OPTIONS: { opacity: number; visible: boolean; layerName: string; zIndex: number };
  MASK_OPTIONS: { fillColor: string; opacity: number; visible: boolean; layerName: string; zIndex: number };
  TEXT_OPTIONS: { textFont: string; textFillColor: string; textStrokeColor: string; textStrokeWidth: number };
  HEATMAP_OPTIONS: { blur: number; radius: number; zIndex: number; opacity: number };
  HEATMAP_VALUE_KEY: string;
  TIANDITU_CONFIG: { BASE_URL: string; PROJECTION: string; DEFAULT_ZINDEX: number; ANNOTATION_ZINDEX_OFFSET: number };
  MAP_LAYERS_OPTIONS: { zIndex: number; annotation: boolean; mapClip: boolean; mapClipData: any };
  MYOL_OPTIONS: { layers: any; zoom: number; center: number[]; extent: any };
  VUE_TEMPLATE_POINT_OPTIONS: { positioning: Positioning; stopEvent: boolean; visible: boolean; zIndex: number };
  RIVER_LEVEL_WIDTH_MAP: Record<number, number>;
  RIVER_LAYERS_BY_ZOOM_OPTIONS: { type: string; levelCount: number; zoomOffset: number; strokeColor: string; strokeWidth: number; visible: boolean; zIndex: number; layerName: string; removeExisting: boolean };
  RIVER_WIDTH_BY_LEVEL_OPTIONS: { type: string; layerName: string; strokeColor: string; strokeWidth: number; visible: boolean; zIndex: number; removeExisting: boolean };
}

const BUILTIN_DEFAULTS: DefaultsRegistry = {
  POINT_OPTIONS: { visible: true, zIndex: 21 },
  POINT_TEXT_OPTIONS: {
    textFont: '12px Calibri,sans-serif',
    textFillColor: '#FFF',
    textStrokeColor: '#000',
    textStrokeWidth: 3,
    textOffsetY: 20
  },
  POINT_ICON_SCALE: 1,
  CLUSTER_OPTIONS: { distance: 40, minDistance: 0, zIndex: 21 },
  DOM_POINT_OVERLAY_OPTIONS: { positioning: 'center-center', stopEvent: false },
  LINE_OPTIONS: {
    type: 'line',
    strokeColor: 'rgba(3, 122, 255, 1)',
    strokeWidth: 2,
    visible: true,
    layerName: 'lineLayer',
    zIndex: 15
  },
  FLOW_LINE_OPTIONS: {
    type: 'line',
    strokeColor: 'rgba(3, 122, 255, 1)',
    strokeWidth: 2,
    visible: true,
    layerName: 'lineLayer',
    duration: 4000,
    loop: true,
    autoStart: true,
    showBaseLine: true,
    animationMode: 'icon',
    flowSymbol: {
      scale: 0.8,
      rotateWithView: true,
      count: 1,
      spacing: 0.15
    },
    trailEnabled: false,
    trailLength: 0,
    zIndex: 16
  },
  POLYGON_OPTIONS: {
    zIndex: 11,
    visible: true,
    textFont: '14px Calibri,sans-serif',
    textFillColor: '#FFF',
    textStrokeColor: '#409EFF',
    textStrokeWidth: 2
  },
  POLYGON_COLOR_MAP: {
    '0': 'rgba(255, 0, 0, 0.6)',
    '1': 'rgba(245, 154, 35, 0.6)',
    '2': 'rgba(255, 238, 0, 0.6)',
    '3': 'rgba(1, 111, 255, 0.6)'
  },
  IMAGE_OPTIONS: { opacity: 1, visible: true, layerName: 'imageLayer', zIndex: 11 },
  MASK_OPTIONS: { fillColor: 'rgba(0, 0, 0, 0.5)', opacity: 1, visible: true, layerName: 'maskLayer', zIndex: 12 },
  TEXT_OPTIONS: { textFont: '14px Calibri,sans-serif', textFillColor: '#FFF', textStrokeColor: '#409EFF', textStrokeWidth: 2 },
  HEATMAP_OPTIONS: { blur: 15, radius: 10, zIndex: 11, opacity: 1 },
  HEATMAP_VALUE_KEY: 'value',
  TIANDITU_CONFIG: {
    BASE_URL: '//t{0-7}.tianditu.gov.cn/DataServer',
    PROJECTION: 'EPSG:4326',
    DEFAULT_ZINDEX: 9,
    ANNOTATION_ZINDEX_OFFSET: 10
  },
  MAP_LAYERS_OPTIONS: { zIndex: 9, annotation: false, mapClip: false, mapClipData: undefined },
  MYOL_OPTIONS: { layers: undefined, zoom: 10, center: [119.81, 29.969], extent: undefined },
  VUE_TEMPLATE_POINT_OPTIONS: { positioning: 'center-center', stopEvent: false, visible: true, zIndex: 1 },
  RIVER_LEVEL_WIDTH_MAP: { 1: 2, 2: 1, 3: 0.5, 4: 0.5, 5: 0.5 },
  RIVER_LAYERS_BY_ZOOM_OPTIONS: {
    type: 'river', levelCount: 5, zoomOffset: 8, strokeColor: 'rgb(0,113,255)', strokeWidth: 3,
    visible: true, zIndex: 15, layerName: 'riverLayer', removeExisting: false
  },
  RIVER_WIDTH_BY_LEVEL_OPTIONS: {
    type: 'river', layerName: 'river', strokeColor: 'rgba(3, 122, 255, 1)', strokeWidth: 2,
    visible: true, zIndex: 15, removeExisting: false
  }
};

/**
 * 当前生效的 defaults。运行时通过 setDefaults 修改这里的值，getter 再合并。
 * 深拷贝一份避免外部意外修改 BUILTIN_DEFAULTS。
 */
const currentDefaults: DefaultsRegistry = deepClone(BUILTIN_DEFAULTS);

function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (Array.isArray(obj)) return obj.map(item => deepClone(item)) as any;
  const cloned: any = {};
  for (const k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) cloned[k] = deepClone((obj as any)[k]);
  }
  return cloned;
}

function deepMerge<T extends Record<string, any>>(base: T, partial: Partial<T>): T {
  const result: any = Array.isArray(base) ? [...base] : { ...base };
  for (const k of Object.keys(partial)) {
    const v = (partial as any)[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
      result[k] = deepMerge(result[k] ?? {}, v);
    } else {
      result[k] = v;
    }
  }
  return result;
}

/**
 * 配置管理类
 * 用于统一管理默认配置和验证
 *
 * 运行时修改默认值：调用 ConfigManager.setDefaults('LINE_OPTIONS', { strokeWidth: 4 })
 * 之后所有新创建的 Line/FlowLine 都将以此为默认。
 */
export default class ConfigManager {
  /** 运行时覆盖默认配置。partial 会与现有 default 做深合并，未提到的键保持原值。 */
  static setDefaults<K extends keyof DefaultsRegistry>(group: K, partial: Partial<DefaultsRegistry[K]>): void {
    (currentDefaults as any)[group] = deepMerge(currentDefaults[group] as any, partial as any);
  }

  /** 取当前运行时 default（含 setDefaults 覆盖后的结果），返回深拷贝避免被外部修改。 */
  static getDefaults<K extends keyof DefaultsRegistry>(group: K): DefaultsRegistry[K] {
    return deepClone(currentDefaults[group]);
  }

  /** 把所有 setDefaults 覆盖清掉，恢复到内置默认值。 */
  static resetDefaults(group?: keyof DefaultsRegistry): void {
    if (group) {
      (currentDefaults as any)[group] = deepClone(BUILTIN_DEFAULTS[group]);
    } else {
      (Object.keys(BUILTIN_DEFAULTS) as Array<keyof DefaultsRegistry>).forEach(k => {
        (currentDefaults as any)[k] = deepClone(BUILTIN_DEFAULTS[k]);
      });
    }
  }

  // ---------------- 兼容性 getter（旧 callsite 直接读字段，setDefaults 透明生效）----------------

  static get DEFAULT_POINT_OPTIONS() { return currentDefaults.POINT_OPTIONS; }
  static get DEFAULT_POINT_TEXT_OPTIONS() { return currentDefaults.POINT_TEXT_OPTIONS; }
  static get DEFAULT_POINT_ICON_SCALE() { return currentDefaults.POINT_ICON_SCALE; }
  static get DEFAULT_CLUSTER_OPTIONS() { return currentDefaults.CLUSTER_OPTIONS; }
  static get DEFAULT_DOM_POINT_OVERLAY_OPTIONS() { return currentDefaults.DOM_POINT_OVERLAY_OPTIONS; }
  static get DEFAULT_LINE_OPTIONS() { return currentDefaults.LINE_OPTIONS; }
  static get DEFAULT_FLOW_LINE_OPTIONS() { return currentDefaults.FLOW_LINE_OPTIONS; }
  static get DEFAULT_POLYGON_OPTIONS() { return currentDefaults.POLYGON_OPTIONS; }
  static get DEFAULT_POLYGON_COLOR_MAP() { return currentDefaults.POLYGON_COLOR_MAP; }
  static get DEFAULT_IMAGE_OPTIONS() { return currentDefaults.IMAGE_OPTIONS; }
  static get DEFAULT_MASK_OPTIONS() { return currentDefaults.MASK_OPTIONS; }
  static get DEFAULT_TEXT_OPTIONS() { return currentDefaults.TEXT_OPTIONS; }
  static get DEFAULT_HEATMAP_OPTIONS() { return currentDefaults.HEATMAP_OPTIONS; }
  static get DEFAULT_HEATMAP_VALUE_KEY() { return currentDefaults.HEATMAP_VALUE_KEY; }
  static get TIANDITU_CONFIG() { return currentDefaults.TIANDITU_CONFIG; }
  static get DEFAULT_MAP_LAYERS_OPTIONS() { return currentDefaults.MAP_LAYERS_OPTIONS; }
  static get DEFAULT_MYOL_OPTIONS() { return currentDefaults.MYOL_OPTIONS; }
  static get DEFAULT_VUE_TEMPLATE_POINT_OPTIONS() { return currentDefaults.VUE_TEMPLATE_POINT_OPTIONS; }
  static get DEFAULT_RIVER_LEVEL_WIDTH_MAP() { return currentDefaults.RIVER_LEVEL_WIDTH_MAP; }
  static get DEFAULT_RIVER_LAYERS_BY_ZOOM_OPTIONS() { return currentDefaults.RIVER_LAYERS_BY_ZOOM_OPTIONS; }
  static get DEFAULT_RIVER_WIDTH_BY_LEVEL_OPTIONS() { return currentDefaults.RIVER_WIDTH_BY_LEVEL_OPTIONS; }

  /**
   * 合并配置选项
   * @param defaultOptions 默认配置
   * @param userOptions 用户配置
   * @returns 合并后的配置
   */
  static mergeOptions<T extends Record<string, any>>(
    defaultOptions: T,
    userOptions?: Partial<T>
  ): T {
    return {
      ...defaultOptions,
      ...userOptions
    };
  }

  /**
   * 生成唯一ID
   * @param prefix 前缀
   * @returns 唯一ID
   */
  static generateId(prefix: string = 'id'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 深度克隆对象
   * @param obj 要克隆的对象
   * @returns 克隆后的对象
   */
  static deepClone<T>(obj: T): T {
    return deepClone(obj);
  }
}
