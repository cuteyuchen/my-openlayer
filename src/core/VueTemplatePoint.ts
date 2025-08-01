import { Map as OLMap } from 'ol'
import Overlay from 'ol/Overlay'
import { Coordinate } from 'ol/coordinate'
import { VueTemplatePointOptions, VueApp, VueLegacyInstance, VueTemplatePointState, VueTemplatePointInstance } from '../types'
import { ErrorHandler, ErrorType } from '../utils/ErrorHandler'
import { ValidationUtils } from '../utils/ValidationUtils'

// 动态导入Vue
let Vue: any = null;
let isVue3 = false;

// 检测Vue版本并导入
async function detectAndImportVue() {
  try {
    // 尝试动态导入Vue
    const vueModule = await import('vue');
    Vue = vueModule.default || vueModule;
    
    // 检测Vue版本
    if (Vue && (Vue.version?.startsWith('3') || Vue.createApp)) {
      isVue3 = true;
    } else {
      isVue3 = false;
    }
  } catch (e) {
    console.warn('Vue not found. Please ensure Vue is installed in your project.');
    Vue = null;
  }
}

// 同步版本的Vue检测（用于兼容性）
function detectVueSync() {
  try {
    // 尝试从全局对象获取Vue
    if (typeof window !== 'undefined' && (window as any).Vue) {
      Vue = (window as any).Vue;
      isVue3 = !!(Vue.version?.startsWith('3') || Vue.createApp);
      return;
    }
    
    // 如果在Node.js环境中，尝试require
      if (typeof window === 'undefined') {
        try {
          // 使用eval来避免TypeScript编译时的require检查
          const requireFunc = eval('require');
          Vue = requireFunc('vue');
          isVue3 = !!(Vue.version?.startsWith('3') || Vue.createApp);
        } catch (e) {
          console.warn('Vue not found. Please ensure Vue is installed in your project.');
          Vue = null;
        }
      }
  } catch (e) {
    console.warn('Failed to detect Vue:', e);
  }
}

// 初始化Vue导入
detectVueSync();
if (!Vue) {
  detectAndImportVue();
}

/**
 * Vue模板点位管理类
 * 用于在地图上添加和管理Vue组件覆盖物
 */
export default class VueTemplatePoint {
  private readonly map: OLMap;
  private readonly errorHandler: ErrorHandler;
  private vuePoints: Map<string, VueTemplatePointInstance> = new Map();

  /**
   * 构造函数
   * @param map OpenLayers地图实例
   */
  constructor(map: OLMap) {
    ValidationUtils.validateRequired(map, 'Map instance is required');
    this.map = map;
    this.errorHandler = ErrorHandler.getInstance();
  }

  /**
   * 添加Vue模板点位
   * @param pointDataList 点位数据列表
   * @param template Vue模板
   * @param options 可选配置项
   * @returns 点位控制器
   */
  addVueTemplatePoint(pointDataList: any[], template: any, options?: {
    positioning?: 'bottom-left' | 'bottom-center' | 'bottom-right' | 'center-left' | 'center-center' | 'center-right' | 'top-left' | 'top-center' | 'top-right',
    stopEvent?: boolean
  }): {
    setVisible: (visible: boolean) => void,
    remove: () => void,
    getPoints: () => VueTemplatePointInstance[]
  } {
    if (!pointDataList || !Array.isArray(pointDataList) || pointDataList.length === 0) {
      throw new Error('Valid point info list is required');
    }
    
    if (!template) {
      throw new Error('Vue template is required');
    }

    try {
      const instances: VueTemplatePointInstance[] = [];
      
      pointDataList.forEach((pointData: any) => {
        if (!ValidationUtils.validateLngLat(pointData.lgtd, pointData.lttd)) {
          throw new Error('Valid longitude and latitude are required for each point');
        }
        
        const pointOptions: VueTemplatePointOptions = {
          Template: template,
          lgtd: pointData.lgtd,
          lttd: pointData.lttd,
          props: {
            pointData: {
              type: Object,
              default: pointData
            }
          },
          positioning: options?.positioning,
          stopEvent: options?.stopEvent,
        };
        
        const instance = new VueTemplatePointInstanceImpl(this.map, pointOptions, this.errorHandler);
        instances.push(instance);
        this.vuePoints.set(instance.id, instance);
      });
      
      return {
        setVisible: (visible: boolean) => {
          instances.forEach((instance: VueTemplatePointInstance) => {
            instance.setVisible(visible);
          });
        },
        remove: () => {
          instances.forEach((instance: VueTemplatePointInstance) => {
            instance.remove();
            this.vuePoints.delete(instance.id);
          });
        },
        getPoints: () => instances
      };
    } catch (error) {
      throw new Error(`Failed to create Vue template points: ${error}`);
    }
  }

  /**
   * 根据ID获取点位实例
   * @param id 点位ID
   * @returns 点位实例或undefined
   */
  getPointById(id: string): VueTemplatePointInstance | undefined {
    return this.vuePoints.get(id);
  }

  /**
   * 获取所有点位实例
   * @returns 所有点位实例数组
   */
  getAllPoints(): VueTemplatePointInstance[] {
    return Array.from(this.vuePoints.values());
  }

  /**
   * 移除所有点位
   */
  removeAllPoints(): void {
    this.vuePoints.forEach((instance: VueTemplatePointInstance) => {
      instance.remove();
    });
    this.vuePoints.clear();
  }

  /**
   * 获取点位数量
   * @returns 点位数量
   */
  getPointCount(): number {
     return this.vuePoints.size;
   }
}

/**
 * Vue模板点位实例实现类
 * @internal
 */
class VueTemplatePointInstanceImpl implements VueTemplatePointInstance {
  public readonly id: string;
  public readonly dom: HTMLElement;
  public readonly anchor: Overlay;
  public app: VueApp | VueLegacyInstance | null = null;
  public state: VueTemplatePointState = VueTemplatePointState.CREATED;
  public position: number[];
  public readonly options: VueTemplatePointOptions;
  private readonly map: OLMap;
  private readonly errorHandler: ErrorHandler;

  constructor(map: OLMap, options: VueTemplatePointOptions, errorHandler: ErrorHandler) {
    this.map = map;
    this.errorHandler = errorHandler;
    this.options = this.mergeDefaultOptions(options);
    this.id = this.generateUniqueId();
    this.position = [this.options.lgtd, this.options.lttd];
    
    try {
      // 参数验证
      this.validateConstructorParams(map, options);
      
      // 创建DOM元素
      this.dom = this.createDomElement();
      
      // 创建Vue应用实例
      this.createVueApp();
      
      // 创建覆盖层
      this.anchor = this.createOverlay();
      
      // 添加到地图
      this.map.addOverlay(this.anchor);
      
      // 设置初始状态
      this.state = VueTemplatePointState.MOUNTED;
      this.setVisible(this.options.visible ?? true);
      
    } catch (error) {
      this.handleError('Failed to create Vue template point', error, { map, options });
      throw error;
    }
  }

  /**
    * 验证构造函数参数
    * @param map 地图实例
    * @param options 配置选项
    * @private
    */
   private validateConstructorParams(map: OLMap, options: VueTemplatePointOptions): void {
    ValidationUtils.validateRequired(map, 'Map instance is required');
    ValidationUtils.validateRequired(options, 'Options are required');
    
    const { Template, lgtd, lttd } = options;
    
    ValidationUtils.validateRequired(Template, 'Template is required in options');
    
    if (typeof lgtd !== 'number' || typeof lttd !== 'number') {
      throw new Error('Longitude and lttd must be numbers');
    }
    
    ValidationUtils.validateCoordinate(lgtd, lttd);
  }

  /**
   * 合并默认配置选项
   * @param options 用户配置选项
   * @returns 合并后的配置选项
   * @private
   */
  private mergeDefaultOptions(options: VueTemplatePointOptions): VueTemplatePointOptions {
    return {
      positioning: 'center-center',
      stopEvent: false,
      visible: true,
      zIndex: 1,
      ...options
    };
  }

  /**
   * 生成唯一ID
   * @returns 唯一标识符
   * @private
   */
  private generateUniqueId(): string {
    return `dom-point-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 创建DOM元素
   * @returns DOM元素
   * @private
   */
  private createDomElement(): HTMLElement {
    const element = document.createElement('div');
    element.id = this.id;
    
    if (this.options.className) {
      element.className = this.options.className;
    }
    
    if (this.options.zIndex) {
      element.style.zIndex = this.options.zIndex.toString();
    }
    
    return element;
  }

  /**
   * 创建Vue应用实例
   * @private
   */
  private createVueApp(): void {
    const { Template, props } = this.options;
    
    if (!Vue) {
      throw new Error('Vue is not available. Please ensure Vue is installed in your project.');
    }
    
    try {
      if (isVue3) {
        // Vue 3
        this.app = Vue.createApp!({
          ...Template,
          props: props || {}
        });
        (this.app as VueApp).mount(this.dom);
      } else {
        // Vue 2
        this.app = new Vue({
          el: this.dom,
          render: (h: any) => h(Template, { props: props || {} })
        }) as VueLegacyInstance;
      }
    } catch (error) {
      throw new Error(`Failed to create Vue app: ${error}`);
    }
  }

  

  /**
   * 创建覆盖层
   * @returns 覆盖层实例
   * @private
   */
  private createOverlay(): Overlay {
    const overlay = new Overlay({
      element: this.dom,
      positioning: this.options.positioning || 'center-center',
      stopEvent: this.options.stopEvent || false
    });
    
    overlay.setPosition(this.position);
    return overlay;
  }

  /**
   * 错误处理
   * @param message 错误消息
   * @param error 原始错误
   * @param context 错误上下文
   * @private
   */
  private handleError(message: string, error: any, context?: any): void {
    this.errorHandler.createAndHandleError(
      `${message}: ${error}`,
      ErrorType.COMPONENT_ERROR,
      { ...context, domPointId: this.id }
    );
  }

  /**
   * 设置可见性
   * @param visible 是否可见
   * @throws 当操作失败时抛出错误
   */
  setVisible(visible: boolean): void {
    if (this.state === VueTemplatePointState.DESTROYED) {
      throw new Error('Cannot set visibility on destroyed DOM point');
    }
    
    ValidationUtils.validateType(visible, 'boolean', 'Visible parameter must be a boolean');
    
    try {
      this.dom.style.visibility = visible ? 'visible' : 'hidden';
      this.state = visible ? VueTemplatePointState.VISIBLE : VueTemplatePointState.HIDDEN;
    } catch (error) {
      this.handleError('Failed to set visibility', error, { visible });
      throw error;
    }
  }

  /**
   * 获取当前可见性状态
   * @returns 是否可见
   */
  isVisible(): boolean {
    return this.state === VueTemplatePointState.VISIBLE;
  }

  /**
   * 更新位置
   * @param lgtd 新经度
   * @param lttd 新纬度
   * @throws 当操作失败时抛出错误
   */
  updatePosition(lgtd: number, lttd: number): void {
    if (this.state === VueTemplatePointState.DESTROYED) {
      throw new Error('Cannot update position on destroyed DOM point');
    }
    
    ValidationUtils.validateCoordinate(lgtd, lttd);
    
    try {
      this.position = [lgtd, lttd];
      this.anchor.setPosition(this.position);
    } catch (error) {
      this.handleError('Failed to update position', error, { lgtd, lttd });
      throw error;
    }
  }

  /**
   * 获取当前位置
   * @returns 当前坐标位置
   */
  getPosition(): Coordinate {
    return [...this.position];
  }

  /**
   * 更新组件属性
   * @param newProps 新的属性对象
   * @throws 当操作失败时抛出错误
   */
  updateProps(newProps: Record<string, any>): void {
    if (this.state === VueTemplatePointState.DESTROYED) {
      throw new Error('Cannot update props on destroyed DOM point');
    }
    
    try {
      // 重新创建Vue应用实例
      this.destroyVueApp();
      this.options.props = { ...this.options.props, ...newProps };
      this.createVueApp();
    } catch (error) {
      this.handleError('Failed to update props', error, { newProps });
      throw error;
    }
  }

  /**
   * 设置CSS样式
   * @param styles 样式对象
   * @throws 当操作失败时抛出错误
   */
  setStyle(styles: Partial<CSSStyleDeclaration>): void {
    if (this.state === VueTemplatePointState.DESTROYED) {
      throw new Error('Cannot set style on destroyed DOM point');
    }
    
    try {
      Object.assign(this.dom.style, styles);
    } catch (error) {
      this.handleError('Failed to set style', error, { styles });
      throw error;
    }
  }

  /**
   * 添加CSS类名
   * @param className 要添加的类名
   * @throws 当操作失败时抛出错误
   */
  addClass(className: string): void {
    if (this.state === VueTemplatePointState.DESTROYED) {
      throw new Error('Cannot add class to destroyed DOM point');
    }
    
    ValidationUtils.validateNonEmptyString(className, 'Valid class name is required');
    
    try {
      this.dom.classList.add(className);
    } catch (error) {
      this.handleError('Failed to add class', error, { className });
      throw error;
    }
  }

  /**
   * 移除CSS类名
   * @param className 要移除的类名
   * @throws 当操作失败时抛出错误
   */
  removeClass(className: string): void {
    if (this.state === VueTemplatePointState.DESTROYED) {
      throw new Error('Cannot remove class from destroyed DOM point');
    }
    
    ValidationUtils.validateNonEmptyString(className, 'Valid class name is required');
    
    try {
      this.dom.classList.remove(className);
    } catch (error) {
      this.handleError('Failed to remove class', error, { className });
      throw error;
    }
  }

  /**
   * 销毁Vue应用实例
   * @private
   */
  private destroyVueApp(): void {
    if (this.app) {
      try {
        if (isVue3) {
          // Vue 3: 使用 unmount
          (this.app as VueApp).unmount();
        } else {
          // Vue 2: 使用 $destroy
          (this.app as VueLegacyInstance).$destroy();
        }
      } catch (error) {
        this.handleError('Failed to destroy Vue app', error);
      } finally {
        this.app = null;
      }
    }
  }

  /**
   * 移除点位
   * @throws 当移除失败时抛出错误
   */
  remove(): void {
    if (this.state === VueTemplatePointState.DESTROYED) {
      console.warn('DOM point already destroyed');
      return;
    }
    
    try {
      // 销毁Vue应用实例
      this.destroyVueApp();
      
      // 从地图移除覆盖层
      this.map.removeOverlay(this.anchor);
      
      // 清理DOM元素
      if (this.dom && this.dom.parentNode) {
        this.dom.parentNode.removeChild(this.dom);
      }
      
      // 更新状态
      this.state = VueTemplatePointState.DESTROYED;
      
    } catch (error) {
      this.handleError('Failed to remove DOM point', error);
      throw error;
    }
  }

  /**
   * 获取覆盖层
   * @returns 覆盖层实例
   */
  getOverlay(): Overlay {
    return this.anchor;
  }

  /**
   * 获取点位ID
   * @returns 点位唯一标识符
   */
  getId(): string {
    return this.id;
  }

  /**
   * 获取DOM元素
   * @returns DOM元素
   */
  getDomElement(): HTMLElement {
    return this.dom;
  }

  /**
   * 获取当前状态
   * @returns 当前状态
   */
  getState(): VueTemplatePointState {
    return this.state;
  }

  /**
   * 获取配置选项
   * @returns 配置选项的副本
   */
  getOptions(): Readonly<VueTemplatePointOptions> {
    return Object.freeze({ ...this.options });
  }

  /**
   * 检查是否已销毁
   * @returns 是否已销毁
   */
  isDestroyed(): boolean {
    return this.state === VueTemplatePointState.DESTROYED;
  }

  /**
   * 获取地图实例
   * @returns 地图实例
   */
  getMap(): OLMap {
    return this.map;
  }
}