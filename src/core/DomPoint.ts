import { Map } from 'ol'
import Overlay from 'ol/Overlay'
import { Coordinate } from 'ol/coordinate'
import { DomPointOptions, VueInstance, VueApp, VueLegacyInstance, DomPointState } from '../types'
import { ErrorHandler, ErrorType } from '../utils/ErrorHandler'
import { ValidationUtils } from '../utils/ValidationUtils'

/**
 * DOM点位管理类
 * 用于在地图上添加和管理DOM元素覆盖物
 */
export default class DomPoint {
  private readonly map: Map;
  private readonly errorHandler: ErrorHandler;
  private app: VueApp | VueLegacyInstance | null = null;
  private readonly anchor: Overlay;
  private readonly dom: HTMLElement;
  private readonly id: string;
  private readonly options: DomPointOptions;
  private state: DomPointState = DomPointState.CREATED;
  private position: Coordinate;

  /**
   * 构造函数
   * @param map OpenLayers地图实例
   * @param options 配置选项
   * @throws 当参数无效时抛出错误
   */
  constructor(map: Map, options: DomPointOptions) {
    this.errorHandler = ErrorHandler.getInstance();
    
    try {
      // 参数验证
      this.validateConstructorParams(map, options);
      
      this.map = map;
      this.options = this.mergeDefaultOptions(options);
      this.id = this.generateUniqueId();
      this.position = [
        this.options.longitude ?? this.options.lgtd,
        this.options.latitude ?? this.options.lttd
      ];
      
      // 创建DOM元素
      this.dom = this.createDomElement();
      
      // 创建Vue应用实例
      this.createVueApp();
      
      // 创建覆盖层
      this.anchor = this.createOverlay();
      
      // 添加到地图
      this.map.addOverlay(this.anchor);
      
      // 设置初始状态
      this.state = DomPointState.MOUNTED;
      this.setVisible(this.options.visible ?? true);
      
    } catch (error) {
      this.handleError('Failed to create DOM point', error, { map, options });
      throw error;
    }
  }

  /**
   * 验证构造函数参数
   * @param map 地图实例
   * @param options 配置选项
   * @private
   */
  private validateConstructorParams(map: Map, options: DomPointOptions): void {
    ValidationUtils.validateRequired(map, 'Map instance is required');
    ValidationUtils.validateRequired(options, 'Options are required');
    
    const { Vue, Template, longitude, latitude } = options;
    
    ValidationUtils.validateRequired(Vue, 'Vue is required in options');
    ValidationUtils.validateRequired(Template, 'Template is required in options');
    
    if (typeof longitude !== 'number' || typeof latitude !== 'number') {
      throw new Error('Longitude and latitude must be numbers');
    }
    
    ValidationUtils.validateCoordinate(longitude, latitude);
  }

  /**
   * 合并默认配置选项
   * @param options 用户配置选项
   * @returns 合并后的配置选项
   * @private
   */
  private mergeDefaultOptions(options: DomPointOptions): DomPointOptions {
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
    const { Vue, Template, props } = this.options;
    
    try {
      if (this.isVue3(Vue)) {
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
   * 判断是否为Vue 3
   * @param Vue Vue构造函数
   * @returns 是否为Vue 3
   * @private
   */
  private isVue3(Vue: VueInstance): boolean {
    return !!(Vue.version && Vue.version.startsWith('3')) || !!Vue.createApp;
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
    if (this.state === DomPointState.DESTROYED) {
      throw new Error('Cannot set visibility on destroyed DOM point');
    }
    
    ValidationUtils.validateType(visible, 'boolean', 'Visible parameter must be a boolean');
    
    try {
      this.dom.style.visibility = visible ? 'visible' : 'hidden';
      this.state = visible ? DomPointState.VISIBLE : DomPointState.HIDDEN;
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
    return this.state === DomPointState.VISIBLE;
  }

  /**
   * 更新位置
   * @param longitude 新经度
   * @param latitude 新纬度
   * @throws 当操作失败时抛出错误
   */
  updatePosition(longitude: number, latitude: number): void {
    if (this.state === DomPointState.DESTROYED) {
      throw new Error('Cannot update position on destroyed DOM point');
    }
    
    ValidationUtils.validateCoordinate(longitude, latitude);
    
    try {
      this.position = [longitude, latitude];
      this.anchor.setPosition(this.position);
    } catch (error) {
      this.handleError('Failed to update position', error, { longitude, latitude });
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
    if (this.state === DomPointState.DESTROYED) {
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
    if (this.state === DomPointState.DESTROYED) {
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
    if (this.state === DomPointState.DESTROYED) {
      throw new Error('Cannot add class on destroyed DOM point');
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
    if (this.state === DomPointState.DESTROYED) {
      throw new Error('Cannot remove class on destroyed DOM point');
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
        if ('unmount' in this.app) {
          // Vue 3
          (this.app as VueApp).unmount();
        } else if ('$destroy' in this.app) {
          // Vue 2
          (this.app as VueLegacyInstance).$destroy();
        }
      } catch (error) {
        console.warn('Error destroying Vue app:', error);
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
    if (this.state === DomPointState.DESTROYED) {
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
      this.state = DomPointState.DESTROYED;
      
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
  getState(): DomPointState {
    return this.state;
  }

  /**
   * 获取配置选项
   * @returns 配置选项的副本
   */
  getOptions(): Readonly<DomPointOptions> {
    return Object.freeze({ ...this.options });
  }

  /**
   * 检查是否已销毁
   * @returns 是否已销毁
   */
  isDestroyed(): boolean {
    return this.state === DomPointState.DESTROYED;
  }

  /**
   * 获取地图实例
   * @returns 地图实例
   */
  getMap(): Map {
    return this.map;
  }
}