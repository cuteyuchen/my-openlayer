import OlMap  from "ol/Map";
import { Select } from "ol/interaction";
import { SelectEvent } from "ol/interaction/Select";
import { click, pointerMove, platformModifierKeyOnly } from "ol/events/condition";
import Feature, { FeatureLike } from "ol/Feature";
import VectorLayer from "ol/layer/Vector";
import { Style, Fill, Stroke, Circle as CircleStyle } from "ol/style";
import Collection from 'ol/Collection';
import { getUid } from "ol/util";
import { EventManager } from "./EventManager";
import { ValidationUtils } from "../utils/ValidationUtils";
import { ErrorHandler, MyOpenLayersError, ErrorType } from "../utils/ErrorHandler";
import { SelectOptions, SelectMode, SelectCallbackEvent, ProgrammaticSelectOptions } from "../types";

/**
 * 要素选择处理器类
 * 用于在地图上选择和高亮显示要素，支持单选、多选等多种选择模式
 */
export default class SelectHandler {
  /** OpenLayers 地图实例 */
  private readonly map: OlMap;
  
  /** 事件管理器实例 */
  private readonly eventManager: EventManager;
  
  /** 错误处理器实例 */
  private readonly errorHandler: ErrorHandler;
  
  /** 主 Select 交互实例（只负责交互，不负责渲染） */
  private mainSelectInteraction?: Select;
  
  /** 额外的 Select 交互实例列表（用于编程式选择） */
  private extraSelectInteractions: Select[] = [];

  /** 渲染用 Select 交互实例映射（用于交互式选择的高亮渲染） featureUID -> Select */
  private renderInteractions: Map<string, Select> = new Map();
  
  /** 当前选择模式 */
  private currentMode?: SelectMode;
  
  /** 是否已启用选择 */
  private isEnabled: boolean = false;

  /** 当前自定义样式函数（用于交互式选择） */
  private currentSelectStyle?: Style | Style[] | ((feature: FeatureLike, resolution: number) => Style | Style[]);

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
  constructor(map: OlMap) {
    ValidationUtils.validateMapInstance(map);
    this.map = map;
    this.eventManager = new EventManager(map);
    this.errorHandler = ErrorHandler.getInstance();
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

      this.currentSelectStyle = options?.selectStyle;

      // 创建主 Select 交互
      // 这里的 style 设置为 null，使其只负责交互捕获，不负责渲染
      // 渲染由独立的 renderInteractions 负责
      this.mainSelectInteraction = new Select({
        condition: this.getSelectCondition(mode),
        layers: this.createLayerFilter(options?.layerFilter),
        filter: options?.featureFilter,
        style: null, 
        multi: options?.multi ?? false,
        hitTolerance: options?.hitTolerance ?? 0
      });

      // 添加事件监听器
      this.attachEventListeners(this.mainSelectInteraction, options);

      // 添加到地图
      this.map.addInteraction(this.mainSelectInteraction);
      this.isEnabled = true;
      this.currentMode = mode;

      this.errorHandler.debug('要素选择已启用', { mode, options });
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
      if (this.mainSelectInteraction) {
        this.map.removeInteraction(this.mainSelectInteraction);
        this.mainSelectInteraction = undefined;
      }
      
      // 清理交互式渲染实例（但不清理编程式的 extraSelectInteractions）
      this.clearRenderInteractions();

      this.isEnabled = false;
      this.currentMode = undefined;
      this.currentSelectStyle = undefined;

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
   * 获取当前选中的要素（仅返回主交互中的要素）
   * @returns 选中的要素数组
   */
  getSelectedFeatures(): FeatureLike[] {
    const features: FeatureLike[] = [];
    if (this.mainSelectInteraction) {
      features.push(...this.mainSelectInteraction.getFeatures().getArray());
    }
    return features;
  }

  /**
   * 清除所有选择
   * @returns SelectHandler 实例（支持链式调用）
   */
  clearSelection(): this {
    // 1. 清除主交互的选择
    if (this.mainSelectInteraction) {
      this.mainSelectInteraction.getFeatures().clear();
    }
    
    // 2. 清理交互式渲染实例
    this.clearRenderInteractions();

    // 3. 移除并销毁所有额外交互（编程式选择）
    this.extraSelectInteractions.forEach(interaction => {
      this.map.removeInteraction(interaction);
    });
    this.extraSelectInteractions = []; 
    
    return this;
  }

  /**
   * 通过要素ID选择要素
   */
  selectByIds(featureIds: string[], options?: ProgrammaticSelectOptions): this {
    try {
      if (!featureIds || featureIds.length === 0) {
        this.errorHandler.warn('要素ID列表为空');
        return this;
      }

      const selectedFeatures = this.findFeaturesByIds(featureIds, options?.layerName);
      if (selectedFeatures.length === 0) return this;

      this.applySelection(selectedFeatures, options);
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
   */
  selectByProperty(propertyName: string, propertyValue: any, options?: ProgrammaticSelectOptions): this {
    try {
      if (!propertyName) throw new Error('属性名称不能为空');

      const selectedFeatures = this.findFeaturesByProperty(propertyName, propertyValue, options?.layerName);
      if (selectedFeatures.length === 0) return this;

      this.applySelection(selectedFeatures, options);
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
   * 应用选择（编程式）
   */
  private applySelection(features: Feature[], options?: ProgrammaticSelectOptions): void {
    if (options?.selectStyle) {
      if (typeof options.selectStyle === 'function') {
        features.forEach(feature => {
          const resolution = this.map.getView().getResolution() || 1;
          const style = (options.selectStyle as Function)(feature, resolution);
          this.addExtraInteraction(feature, style);
        });
      } else {
        const customSelect = new Select({
          condition: () => false,
          style: options.selectStyle as Style | Style[],
          features: new Collection(features),
          hitTolerance: 0
        });
        this.map.addInteraction(customSelect);
        this.extraSelectInteractions.push(customSelect);
      }
    } else {
      // 使用默认样式，添加到主交互
      this.ensureMainInteraction();
      this.mainSelectInteraction!.getFeatures().extend(features);
      // 手动触发渲染交互的创建（因为 mainSelectInteraction 不自动渲染，且直接 extend 可能不会触发 select 事件）
      // 注意：Select 交互的 'select' 事件通常在用户交互时触发，手动 extend 集合不会触发该事件
      features.forEach(feature => {
        this.createRenderInteraction(feature);
      });
    }

    if (options?.fitView) {
      this.fitToFeatures(features, options.fitDuration ?? 500, options.fitPadding ?? 100);
    }
  }

  /**
   * 添加额外的交互实例（用于函数式样式结果）
   */
  private addExtraInteraction(feature: Feature, style: Style | Style[]) {
    const customSelect = new Select({
      condition: () => false,
      style: style,
      features: new Collection([feature]),
      hitTolerance: 0
    });
    this.map.addInteraction(customSelect);
    this.extraSelectInteractions.push(customSelect);
  }

  // ... 查找方法保持不变 ...
  private findFeaturesByIds(featureIds: string[], layerName?: string): Feature[] {
    const selectedFeatures: Feature[] = [];
    const layers = this.map.getLayers().getArray();

    for (const layer of layers) {
      if (layerName && layer.get('layerName') !== layerName) continue;
      if (!(layer instanceof VectorLayer)) continue;
      const source = layer.getSource();
      if (!source) continue;
      for (const featureId of featureIds) {
        const feature = source.getFeatureById(featureId);
        if (feature && feature instanceof Feature) selectedFeatures.push(feature);
      }
    }
    return selectedFeatures;
  }

  private findFeaturesByProperty(key: string, value: any, layerName?: string): Feature[] {
    const selectedFeatures: Feature[] = [];
    const layers = this.map.getLayers().getArray();
    for (const layer of layers) {
      if (layerName && layer.get('layerName') !== layerName) continue;
      if (!(layer instanceof VectorLayer)) continue;
      const source = layer.getSource();
      if (!source) continue;
      const features = source.getFeatures();
      for (const feature of features) {
        if (feature.get(key) === value) selectedFeatures.push(feature);
      }
    }
    return selectedFeatures;
  }

  private ensureMainInteraction(): void {
    if (!this.mainSelectInteraction) {
      this.mainSelectInteraction = new Select({
        condition: () => false, 
        style: null // 主交互不直接渲染，依靠事件监听创建渲染实例
      });
      // 也要监听它的事件来处理默认样式的渲染
      this.attachEventListeners(this.mainSelectInteraction, {}); 
      this.map.addInteraction(this.mainSelectInteraction);
    }
  }

  isSelectEnabled(): boolean {
    return this.isEnabled;
  }

  getCurrentMode(): SelectMode | undefined {
    return this.currentMode;
  }

  updateSelectStyle(selectStyle: Style | Style[] | ((feature: FeatureLike, resolution: number) => Style | Style[])): this {
    if (!this.mainSelectInteraction) {
      this.errorHandler.warn('主选择交互未启用，无法更新样式');
      return this;
    }
    this.currentSelectStyle = selectStyle;
    
    // 强制刷新：重新生成所有选中要素的渲染实例
    const features = this.mainSelectInteraction.getFeatures().getArray();
    
    // 清除旧的渲染
    this.clearRenderInteractions();
    
    // 重新创建渲染
    features.forEach(feature => {
      this.createRenderInteraction(feature as Feature);
    });
    
    return this;
  }
  
  private fitToFeatures(features: FeatureLike[], duration: number = 500, padding: number = 100): void {
    try {
      if (!features || features.length === 0) return;
      let extent: number[] | undefined;
      for (const feature of features) {
        const geometry = feature.getGeometry();
        if (geometry) {
          const featureExtent = geometry.getExtent();
          if (!extent) extent = featureExtent;
          else {
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
          padding: [padding, padding, padding, padding],
          maxZoom: 18
        });
      }
    } catch (error) {
      this.errorHandler.error('定位至要素失败:', error);
    }
  }

  destroy(): void {
    try {
      this.disableSelect();
      this.clearSelection();
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

  private getSelectCondition(mode: SelectMode): any {
    switch (mode) {
      case 'click': return click;
      case 'hover': return pointerMove;
      case 'ctrl': return platformModifierKeyOnly;
      default: return click;
    }
  }

  private createLayerFilter(layerNames?: string[]): ((layer: any) => boolean) | undefined {
    if (!layerNames || layerNames.length === 0) return undefined;
    return (layer: any) => {
      const layerName = layer.get('layerName') || layer.get('name');
      return layerNames.includes(layerName);
    };
  }

  /**
   * 计算样式（解析函数或返回默认）
   */
  private calculateStyle(feature: FeatureLike, resolution: number): Style | Style[] {
    const styleSource = this.currentSelectStyle;
    
    if (styleSource) {
      if (typeof styleSource === 'function') {
        return styleSource(feature, resolution);
      }
      return styleSource;
    }
    
    // 默认样式逻辑
    const geometry = feature.getGeometry();
    if (!geometry) return this.defaultPointStyle;
    const geometryType = geometry.getType();
    switch (geometryType) {
      case 'Point': case 'MultiPoint': return this.defaultPointStyle;
      case 'LineString': case 'MultiLineString': return this.defaultLineStyle;
      case 'Polygon': case 'MultiPolygon': return this.defaultPolygonStyle;
      default: return this.defaultPointStyle;
    }
  }

  /**
   * 为单个要素创建并添加渲染交互
   */
  private createRenderInteraction(feature: Feature) {
    const uid = getUid(feature);
    if (this.renderInteractions.has(uid)) return; // 已存在

    const resolution = this.map.getView().getResolution() || 1;
    const style = this.calculateStyle(feature, resolution);

    const renderSelect = new Select({
      condition: () => false,
      style: style,
      features: new Collection([feature]),
      hitTolerance: 0
    });

    this.map.addInteraction(renderSelect);
    this.renderInteractions.set(uid, renderSelect);
  }

  /**
   * 移除单个要素的渲染交互
   */
  private removeRenderInteraction(feature: Feature) {
    const uid = getUid(feature);
    const interaction = this.renderInteractions.get(uid);
    if (interaction) {
      this.map.removeInteraction(interaction);
      this.renderInteractions.delete(uid);
    }
  }

  /**
   * 清理所有交互式渲染交互
   */
  private clearRenderInteractions() {
    this.renderInteractions.forEach(interaction => {
      this.map.removeInteraction(interaction);
    });
    this.renderInteractions.clear();
  }

  private attachEventListeners(interaction: Select, options?: SelectOptions): void {
    interaction.on('select', (event: SelectEvent) => {
      // 1. 处理渲染：选中时创建渲染实例
      event.selected.forEach(feature => {
        if (feature instanceof Feature) {
          this.createRenderInteraction(feature);
        }
      });

      // 2. 处理渲染：取消选中时销毁渲染实例
      event.deselected.forEach(feature => {
        if (feature instanceof Feature) {
          this.removeRenderInteraction(feature);
        }
      });

      // 3. 触发回调
      const callbackEvent: SelectCallbackEvent = {
        selected: event.selected,
        deselected: event.deselected,
        mapBrowserEvent: event.mapBrowserEvent
      };

      if (options?.onSelect && event.selected.length > 0) {
        try { options.onSelect(callbackEvent); } 
        catch (e) { this.errorHandler.error('选择回调失败:', e); }
      }

      if (options?.onDeselect && event.deselected.length > 0) {
        try { options.onDeselect(callbackEvent); } 
        catch (e) { this.errorHandler.error('取消选择回调失败:', e); }
      }
    });
  }
}
