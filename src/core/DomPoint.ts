import { Map } from 'ol'
import Overlay from 'ol/Overlay'
import { Coordinate } from 'ol/coordinate'
import { DomPointOptions } from '../types'
import { ErrorHandler } from '../utils/ErrorHandler'
import { ConfigManager } from './ConfigManager'

interface Options {
  Vue: any;
  Template: any;
  lgtd: number;
  lttd: number;
  props?: any;
  type?: string;
  sttp?: string;
  zIndex?: number;
}

/**
 * DOM点位管理类
 * 用于在地图上添加和管理DOM元素覆盖物
 */
export default class DomPoint {

  private readonly map: Map;
  private app: any;
  private readonly anchor: Overlay;
  private readonly dom: HTMLElement;
  private readonly id: string;

  /**
   * 构造函数
   * @param map OpenLayers地图实例
   * @param options 配置选项
   * @throws 当参数无效时抛出错误
   */
  constructor(map: Map, options: Options) {
    if (!map) {
      throw new Error('Map instance is required');
    }
    
    if (!options) {
      throw new Error('Options are required');
    }
    
    const {
      Vue,
      Template,
      lgtd,
      lttd,
      props,
    } = options;
    
    if (!Vue || !Template) {
      throw new Error('Vue and Template are required in options');
    }
    
    if (!lgtd || !lttd || isNaN(lgtd) || isNaN(lttd)) {
      throw new Error('Valid longitude and latitude are required');
    }
    
    this.map = map;
    this.id = Math.random().toString(36).substr(2, 9);
    
    try {
      this.dom = document.createElement('div');
      this.map.getViewport().appendChild(this.dom);
      
      if (Vue.version.startsWith('3')) {
        this.app = Vue.createApp(
          Object.assign(Template, {
            props: { ...props }
          })
        );
        this.app.mount(this.dom);
      } else {
        this.app = new Vue({
          el: this.dom,
          render: (h: any) => h(Template, { props })
        });
      }

      this.anchor = new Overlay({
        element: this.dom,
        positioning: 'center-center',
        stopEvent: false
      });
      this.anchor.setPosition([lgtd, lttd]);
      this.map.addOverlay(this.anchor);
    } catch (error) {
      throw new Error(`Failed to create DOM point: ${error}`);
    }
  }

  /**
   * 设置可见性
   * @param visible 是否可见
   * @throws 当操作失败时抛出错误
   */
  setVisible(visible: boolean): void {
    if (typeof visible !== 'boolean') {
      throw new Error('Visible parameter must be a boolean');
    }
    
    try {
      this.dom.style.visibility = visible ? 'visible' : 'hidden';
    } catch (error) {
      throw new Error(`Failed to set visibility: ${error}`);
    }
  }

  /**
   * 移除点位
   * @throws 当移除失败时抛出错误
   */
  remove(): void {
    try {
      if (this.app) {
        if (this.app.unmount) {
          this.app.unmount();
        } else if (this.app.$destroy) {
          this.app.$destroy();
        }
      }
      
      this.map.removeOverlay(this.anchor);
      
      // 清理DOM元素
      if (this.dom && this.dom.parentNode) {
        this.dom.parentNode.removeChild(this.dom);
      }
    } catch (error) {
      throw new Error(`Failed to remove DOM point: ${error}`);
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
}