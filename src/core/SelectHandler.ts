import Map from "ol/Map";
import { Select } from "ol/interaction";
import { SelectEvent } from "ol/interaction/Select";
import { click, pointerMove, platformModifierKeyOnly } from "ol/events/condition";
import { FeatureLike } from "ol/Feature";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Style, Fill, Stroke, Circle as CircleStyle } from "ol/style";
import { EventManager } from "./EventManager";
import { ValidationUtils } from "../utils/ValidationUtils";
import { ErrorHandler, MyOpenLayersError, ErrorType } from "../utils/ErrorHandler";
import { SelectOptions, SelectMode, SelectCallbackEvent, ProgrammaticSelectOptions } from "../types";

/**
 * 要素选择处理器类
 * 用于在地图上选择和高亮显示要素，支持单选、多选等多种选择模式
 * 
 * @example
 * ```typescript
 * const selectHandler = new SelectHandler(map);
 * 
 * // 启用点击选择
 * selectHandler.enableSelect('click', {
 *   layerFilter: ['pointLayer', 'polygonLayer'],
 *   multi: false,
 *   onSelect: (event) => {
 *     console.log('选中要素:', event.selected);
 *   }
 * });
 * 
 * // 获取当前选中的要素
 * const selected = selectHandler.getSelectedFeatures();
 * 
 * // 清除选择
 * selectHandler.clearSelection();
 * 
 * // 禁用选择
 * selectHandler.disableSelect();
 * ```
 */
export default class SelectHandler {
  /** OpenLayers 地图实例 */
  private readonly map: Map;
  
  /** 事件管理器实例 */
  private readonly eventManager: EventManager;
  
  /** 错误处理器实例 */
  private readonly errorHandler: ErrorHandler;
  
  /** Select 交互实例 */
  private selectInteraction?: Select;
  
  /** 当前选择模式 */
  private currentMode?: SelectMode;
  
  /** 当前配置选项 */
  private currentOptions?: SelectOptions;
  
  /** 是否已启用选择 */
  private isEnabled: boolean = false;

  /** 默认选中样式 - 点要素 */
  private readonly defaultPointStyle = new Style({
    image: new CircleStyle({
      radius: 7,
      fill: new Fill({ color: 'rgba(255, 0, 0, 0.6)' }),
      stroke: new Stroke({ color: '#ff0000', width: 2 })
    })
  });

  /** 默认选中样式 - 线要素 */
  private readonly defaultLineStyle = new Style({
    stroke: new Stroke({
      color: '#ff0000',
      width: 3
    })
  });

  /** 默认选中样式 - 面要素 */
  private readonly defaultPolygonStyle = new Style({
    stroke: new Stroke({
      color: '#ff0000',
      width: 2
    }),
    fill: new Fill({
      color: 'rgba(255, 0, 0, 0.2)'
    })
  });

  /**
   * 构造函数
   * @param map OpenLayers地图实例
   */
  constructor(map: Map) {
    ValidationUtils.validateMapInstance(map);
    this.map = map;
    this.eventManager = new EventManager(map);
    this.errorHandler = ErrorHandler.getInstance();
    
    // 默认启用点击选择模式，支持多选
    this.enableSelect('click', { multi: true });
  }

  /**
   * 启用要素选择
   * @param mode 选择模式：'click'（点击）、'hover'（悬停）、'ctrl'（Ctrl+点击）
   * @param options 选择配置选项
   * @returns SelectHandler 实例（支持链式调用）
   */
  enableSelect(mode: SelectMode = 'click', options?: SelectOptions): this {
    try {
      // 如果已启用，先禁用
      if (this.isEnabled) {
        this.disableSelect();
      }

      const mergedOptions = this.mergeOptions(options);
      this.currentMode = mode;
      this.currentOptions = mergedOptions;

      // 创建 Select 交互
      this.selectInteraction = this.createSelectInteraction(mode, mergedOptions);

      // 添加事件监听器
      this.attachEventListeners(mergedOptions);

      // 添加到地图
      this.map.addInteraction(this.selectInteraction);
      this.isEnabled = true;

      this.errorHandler.debug('要素选择已启用', { mode, options: mergedOptions });
      return this;

    } catch (error) {
      this.errorHandler.handleError(
        new MyOpenLayersError(
          `启用要素选择失败: ${error instanceof Error ? error.message : '未知错误'}`,
          ErrorType.COMPONENT_ERROR,
          { mode, options }
        )
      );
      throw error;
    }
  }

  /**
   * 禁用要素选择
   * @returns SelectHandler 实例（支持链式调用）
   */
  disableSelect(): this {
    try {
      if (this.selectInteraction) {
        this.map.removeInteraction(this.selectInteraction);
        this.selectInteraction = undefined;
      }

      this.isEnabled = false;
      this.currentMode = undefined;

      this.errorHandler.debug('要素选择已禁用');
      return this;

    } catch (error) {
      this.errorHandler.handleError(
        new MyOpenLayersError(
          `禁用要素选择失败: ${error instanceof Error ? error.message : '未知错误'}`,
          ErrorType.COMPONENT_ERROR
        )
      );
      throw error;
    }
  }

  /**
   * 获取当前选中的要素
   * @returns 选中的要素数组
   */
  getSelectedFeatures(): FeatureLike[] {
    if (!this.selectInteraction) {
      return [];
    }

    const features = this.selectInteraction.getFeatures();
    return features.getArray();
  }

  /**
   * 清除所有选择
   * @returns SelectHandler 实例（支持链式调用）
   */
  clearSelection(): this {
    if (this.selectInteraction) {
      this.selectInteraction.getFeatures().clear();
    }
    return this;
  }

  /**
   * 通过要素ID选择要素
   * @param featureIds 要素ID数组
   * @param options 编程式选择配置选项
   * @returns SelectHandler 实例（支持链式调用）
   */
  selectByIds(featureIds: string[], options?: ProgrammaticSelectOptions): this {
    try {
      // 确保交互实例存在
      this.ensureSelectInteraction();

      if (!this.selectInteraction) {
        // 理论上 ensureSelectInteraction 后不应为空，这里做双重保险
        return this;
      }

      if (!featureIds || featureIds.length === 0) {
        this.errorHandler.warn('要素ID列表为空');
        return this;
      }

      // 清除当前选择
      this.clearSelection();

      // 临时存储选中的要素
      const selectedFeatures: FeatureLike[] = [];

      // 获取所有图层
      const layers = this.map.getLayers().getArray();
      
      for (const layer of layers) {
        // 过滤图层
        if (options?.layerName && layer.get('layerName') !== options.layerName) {
          continue;
        }

        if (layer instanceof VectorLayer) {
          const source = layer.getSource();
          if (!source) continue;

          // 查找并选择要素
          for (const featureId of featureIds) {
            const feature = source.getFeatureById(featureId);
            if (feature) {
              selectedFeatures.push(feature);
              this.selectInteraction.getFeatures().push(feature);
            }
          }
        }
      }

      // 如果传入了自定义样式，为选中的要素设置样式
      if (options?.selectStyle && selectedFeatures.length > 0) {
        for (const feature of selectedFeatures) {
          if (typeof options.selectStyle === 'function') {
            (feature as any).setStyle(options.selectStyle(feature));
          } else {
            (feature as any).setStyle(options.selectStyle);
          }
        }
      }

      // 定位至选中要素
      if (options?.fitView && selectedFeatures.length > 0) {
        this.fitToFeatures(
          selectedFeatures,
          options.fitDuration ?? 500,
          options.fitPadding ?? 100
        );
      }

      return this;

    } catch (error) {
      this.errorHandler.handleError(
        new MyOpenLayersError(
          `通过ID选择要素失败: ${error instanceof Error ? error.message : '未知错误'}`,
          ErrorType.COMPONENT_ERROR,
          { featureIds, options }
        )
      );
      throw error;
    }
  }

  /**
   * 通过属性选择要素
   * @param propertyName 属性名称
   * @param propertyValue 属性值
   * @param options 编程式选择配置选项
   * @returns SelectHandler 实例（支持链式调用）
   */
  selectByProperty(propertyName: string, propertyValue: any, options?: ProgrammaticSelectOptions): this {
    try {
      // 确保交互实例存在
      this.ensureSelectInteraction();

      if (!this.selectInteraction) {
        // 理论上 ensureSelectInteraction 后不应为空，这里做双重保险
        return this;
      }

      if (!propertyName) {
        throw new Error('属性名称不能为空');
      }

      // 清除当前选择
      this.clearSelection();

      // 临时存储选中的要素
      const selectedFeatures: FeatureLike[] = [];

      // 获取所有图层
      const layers = this.map.getLayers().getArray();
      
      for (const layer of layers) {
        // 过滤图层
        if (options?.layerName && layer.get('layerName') !== options.layerName) {
          continue;
        }

        if (layer instanceof VectorLayer) {
          const source = layer.getSource();
          if (!source) continue;

          // 查找并选择要素
          const features = source.getFeatures();
          for (const feature of features) {
            if (feature.get(propertyName) === propertyValue) {
              selectedFeatures.push(feature);
              this.selectInteraction.getFeatures().push(feature);
            }
          }
        }
      }

      // 如果传入了自定义样式，为选中的要素设置样式
      if (options?.selectStyle && selectedFeatures.length > 0) {
        for (const feature of selectedFeatures) {
          if (typeof options.selectStyle === 'function') {
            (feature as any).setStyle(options.selectStyle(feature));
          } else {
            (feature as any).setStyle(options.selectStyle);
          }
        }
      }

      // 定位至选中要素
      if (options?.fitView && selectedFeatures.length > 0) {
        this.fitToFeatures(
          selectedFeatures,
          options.fitDuration ?? 500,
          options.fitPadding ?? 100
        );
      }

      return this;

    } catch (error) {
      this.errorHandler.handleError(
        new MyOpenLayersError(
          `通过属性选择要素失败: ${error instanceof Error ? error.message : '未知错误'}`,
          ErrorType.COMPONENT_ERROR,
          { propertyName, propertyValue, options }
        )
      );
      throw error;
    }
  }

  /**
   * 判断选择是否已启用
   * @returns 是否已启用
   */
  isSelectEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * 获取当前选择模式
   * @returns 当前选择模式
   */
  getCurrentMode(): SelectMode | undefined {
    return this.currentMode;
  }

  /**
   * 定位至要素
   * @private
   * @param features 要素数组
   * @param duration 动画持续时间（毫秒），默认500
   * @param padding 边距（像素），默认100
   */
  private fitToFeatures(features: FeatureLike[], duration: number = 500, padding: number = 100): void {
    try {
      if (!features || features.length === 0) {
        return;
      }

      // 创建一个包含所有要素的范围
      let extent: number[] | undefined;
      
      for (const feature of features) {
        const geometry = feature.getGeometry();
        if (geometry) {
          const featureExtent = geometry.getExtent();
          if (!extent) {
            extent = featureExtent;
          } else {
            // 扩展范围以包含当前要素
            extent = [
              Math.min(extent[0], featureExtent[0]),
              Math.min(extent[1], featureExtent[1]),
              Math.max(extent[2], featureExtent[2]),
              Math.max(extent[3], featureExtent[3])
            ];
          }
        }
      }

      if (extent) {
        this.map.getView().fit(extent, {
          duration,
          padding: [padding, padding, padding, padding]
        });
      }
    } catch (error) {
      this.errorHandler.error('定位至要素失败:', error);
    }
  }

  /**
   * 销毁选择处理器，清理所有资源
   */
  destroy(): void {
    try {
      this.disableSelect();
      this.errorHandler.debug('选择处理器已销毁');
    } catch (error) {
      this.errorHandler.handleError(
        new MyOpenLayersError(
          `销毁选择处理器失败: ${error instanceof Error ? error.message : '未知错误'}`,
          ErrorType.COMPONENT_ERROR
        )
      );
    }
  }

  /**
   * 合并选项配置
   * @private
   */
  private mergeOptions(options?: SelectOptions): SelectOptions {
    return {
      multi: false,
      layerFilter: undefined,
      featureFilter: undefined,
      hitTolerance: 0,
      selectStyle: undefined,
      onSelect: undefined,
      onDeselect: undefined,
      ...options
    };
  }

  /**
   * 创建 Select 交互
   * @private
   */
  private createSelectInteraction(mode: SelectMode, options: SelectOptions): Select {
    // 确定选择条件
    const condition = this.getSelectCondition(mode);

    // 创建图层过滤器
    const layerFilter = this.createLayerFilter(options.layerFilter);

    // 创建要素过滤器
    const filter = options.featureFilter;

    // 创建选择样式
    const style = this.createSelectStyle(options.selectStyle);

    return new Select({
      condition,
      layers: layerFilter,
      filter,
      style,
      multi: options.multi,
      hitTolerance: options.hitTolerance
    });
  }

  /**
   * 获取选择条件
   * @private
   */
  private getSelectCondition(mode: SelectMode): any {
    switch (mode) {
      case 'click':
        return click;
      case 'hover':
        return pointerMove;
      case 'ctrl':
        return platformModifierKeyOnly;
      default:
        return click;
    }
  }

  /**
   * 创建图层过滤器
   * @private
   */
  private createLayerFilter(layerNames?: string[]): ((layer: any) => boolean) | undefined {
    if (!layerNames || layerNames.length === 0) {
      return undefined;
    }

    return (layer: any) => {
      const layerName = layer.get('layerName') || layer.get('name');
      return layerNames.includes(layerName);
    };
  }

  /**
   * 创建选择样式
   * @private
   */
  private createSelectStyle(customStyle?: Style | Style[] | ((feature: FeatureLike) => Style | Style[])): Style | Style[] | ((feature: FeatureLike) => Style | Style[]) {
    if (customStyle) {
      return customStyle;
    }

    // 返回根据几何类型的默认样式
    return (feature: FeatureLike) => {
      const geometry = feature.getGeometry();
      if (!geometry) {
        return this.defaultPointStyle;
      }

      const geometryType = geometry.getType();
      switch (geometryType) {
        case 'Point':
        case 'MultiPoint':
          return this.defaultPointStyle;
        case 'LineString':
        case 'MultiLineString':
          return this.defaultLineStyle;
        case 'Polygon':
        case 'MultiPolygon':
          return this.defaultPolygonStyle;
        default:
          return this.defaultPointStyle;
      }
    };
  }

  /**
   * 更新选择样式
   * @param selectStyle 新的选择样式
   * @returns SelectHandler 实例（支持链式调用）
   */
  updateSelectStyle(selectStyle: Style | Style[] | ((feature: FeatureLike) => Style | Style[])): this {
    if (!this.selectInteraction) {
      this.errorHandler.warn('选择交互未启用，无法更新样式');
      return this;
    }

    try {
      // 更新选择交互的样式
      this.selectInteraction.getStyle = () => {
        if (typeof selectStyle === 'function') {
          return selectStyle;
        }
        return selectStyle;
      };

      // 触发样式更新
      const features = this.selectInteraction.getFeatures();
      features.changed();

      return this;
    } catch (error) {
      this.errorHandler.handleError(
        new MyOpenLayersError(
          `更新选择样式失败: ${error instanceof Error ? error.message : '未知错误'}`,
          ErrorType.COMPONENT_ERROR,
          { selectStyle }
        )
      );
      throw error;
    }
  }

  /**
   * 确保 Select 交互已创建
   * 如果当前未启用选择交互，则创建一个不响应用户操作的交互实例用于编程式选择
   * @private
   */
  private ensureSelectInteraction(): void {
    if (this.selectInteraction) {
      return;
    }

    // 创建一个不响应任何用户操作的 Select 交互
    // condition 返回 false 表示不响应任何事件
    this.selectInteraction = new Select({
      condition: () => false,
      style: this.createSelectStyle()
    });

    this.map.addInteraction(this.selectInteraction);
    this.isEnabled = true;
    
    // 注意：这里我们不设置 currentMode，因为这是一种特殊的编程式模式
    // 也不需要 attachEventListeners，因为这种交互不会触发用户事件
    this.errorHandler.debug('已自动创建编程式选择交互实例');
  }

  /**
   * 附加事件监听器
   * @private
   */
  private attachEventListeners(options: SelectOptions): void {
    if (!this.selectInteraction) {
      return;
    }

    // 监听选择事件
    this.selectInteraction.on('select', (event: SelectEvent) => {
      const callbackEvent: SelectCallbackEvent = {
        selected: event.selected,
        deselected: event.deselected,
        mapBrowserEvent: event.mapBrowserEvent
      };

      // 触发选择回调
      if (options.onSelect && event.selected.length > 0) {
        try {
          options.onSelect(callbackEvent);
        } catch (error) {
          this.errorHandler.error('选择回调执行失败:', error);
        }
      }

      // 触发取消选择回调
      if (options.onDeselect && event.deselected.length > 0) {
        try {
          options.onDeselect(callbackEvent);
        } catch (error) {
          this.errorHandler.error('取消选择回调执行失败:', error);
        }
      }
    });
  }
}
