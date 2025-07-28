import { Map as OLMap } from 'ol';
import MapBrowserEvent from 'ol/MapBrowserEvent';
import { Pixel } from 'ol/pixel';
import { FeatureLike } from 'ol/Feature';
import { ErrorHandler, ErrorType } from '../utils/ErrorHandler';

/**
 * 事件类型定义
 */
export type MapEventType = 'click' | 'dblclick' | 'hover' | 'moveend' | 'zoomend' | 'pointermove';

/**
 * 事件回调函数类型
 */
export type EventCallback = (event: MapEventData) => void;

/**
 * 地图事件数据接口
 */
export interface MapEventData {
  type: MapEventType;
  originalEvent?: Event;
  coordinate?: number[];
  pixel?: Pixel;
  features?: FeatureLike[];
  feature?: FeatureLike;
  zoom?: number;
  [key: string]: any;
}

/**
 * 事件监听器接口
 */
interface EventListener {
  id: string;
  type: MapEventType;
  callback: EventCallback;
  options?: {
    once?: boolean;
    filter?: (event: MapEventData) => boolean;
  };
}

/**
 * 事件管理器类
 * 用于统一管理地图事件的注册、触发和移除
 */
export class EventManager {
  private readonly map: OLMap;
  private listeners: Map<string, EventListener> = new Map();
  private eventCounters: Map<MapEventType, number> = new Map();

  /**
   * 构造函数
   * @param map OpenLayers地图实例
   */
  constructor(map: OLMap) {
    ErrorHandler.validateMap(map);
    this.map = map;
    this.initializeEventCounters();
  }

  /**
   * 初始化事件计数器
   */
  private initializeEventCounters(): void {
    const eventTypes: MapEventType[] = ['click', 'dblclick', 'hover', 'moveend', 'zoomend', 'pointermove'];
    eventTypes.forEach(type => {
      this.eventCounters.set(type, 0);
    });
  }

  /**
   * 注册事件监听器
   * @param type 事件类型
   * @param callback 回调函数
   * @param options 选项
   * @returns 事件监听器ID
   */
  on(
    type: MapEventType,
    callback: EventCallback,
    options?: {
      once?: boolean;
      filter?: (event: MapEventData) => boolean;
    }
  ): string {
    ErrorHandler.validate(
      typeof callback === 'function',
      'Event callback must be a function',
      { type, callback }
    );

    const id = this.generateListenerId(type);
    const listener: EventListener = {
      id,
      type,
      callback,
      options
    };

    this.listeners.set(id, listener);
    this.attachMapEvent(type);

    return id;
  }

  /**
   * 移除事件监听器
   * @param id 监听器ID
   */
  off(id: string): boolean {
    const listener = this.listeners.get(id);
    if (!listener) {
      return false;
    }

    this.listeners.delete(id);
    this.detachMapEventIfNeeded(listener.type);
    return true;
  }

  /**
   * 移除指定类型的所有事件监听器
   * @param type 事件类型
   */
  offAll(type: MapEventType): void {
    const idsToRemove: string[] = [];
    
    this.listeners.forEach((listener: EventListener, id: string) => {
      if (listener.type === type) {
        idsToRemove.push(id);
      }
    });

    idsToRemove.forEach(id => {
      this.listeners.delete(id);
    });

    this.detachMapEventIfNeeded(type);
  }

  /**
   * 清除所有事件监听器
   */
  clear(): void {
    this.listeners.clear();
    this.eventCounters.forEach((_: number, type: MapEventType) => {
      this.detachMapEventIfNeeded(type);
    });
  }

  /**
   * 获取指定类型的监听器数量
   * @param type 事件类型
   */
  getListenerCount(type: MapEventType): number {
    let count = 0;
    this.listeners.forEach((listener: EventListener) => {
      if (listener.type === type) {
        count++;
      }
    });
    return count;
  }

  /**
   * 生成监听器ID
   * @param type 事件类型
   */
  private generateListenerId(type: MapEventType): string {
    const counter = this.eventCounters.get(type) || 0;
    this.eventCounters.set(type, counter + 1);
    return `${type}_${counter + 1}_${Date.now()}`;
  }

  /**
   * 附加地图事件
   * @param type 事件类型
   */
  private attachMapEvent(type: MapEventType): void {
    const existingListeners = this.getListenerCount(type);
    if (existingListeners > 1) {
      return; // 已经附加过该类型的事件
    }

    switch (type) {
      case 'click':
        this.map.on('click', this.handleClickEvent.bind(this));
        break;
      case 'dblclick':
        this.map.on('dblclick', this.handleDblClickEvent.bind(this));
        break;
      case 'hover':
      case 'pointermove':
        this.map.on('pointermove', this.handlePointerMoveEvent.bind(this));
        break;
      case 'moveend':
        this.map.on('moveend', this.handleMoveEndEvent.bind(this));
        break;
      case 'zoomend':
        this.map.getView().on('change:resolution', this.handleZoomEndEvent.bind(this));
        break;
    }
  }

  /**
   * 分离地图事件（如果不再需要）
   * @param type 事件类型
   */
  private detachMapEventIfNeeded(type: MapEventType): void {
    const remainingListeners = this.getListenerCount(type);
    if (remainingListeners > 0) {
      return; // 还有其他监听器需要该事件
    }

    // 注意：OpenLayers 不提供直接移除特定事件监听器的方法
    // 这里只是示例，实际实现可能需要保存事件监听器的引用
    console.warn(`Event type '${type}' detachment not fully implemented`);
  }

  /**
   * 处理点击事件
   * @param event 地图浏览器事件
   */
  private handleClickEvent(event: MapBrowserEvent<any>): void {
    const eventData = this.createEventData('click', event);
    this.triggerListeners('click', eventData);
  }

  /**
   * 处理双击事件
   * @param event 地图浏览器事件
   */
  private handleDblClickEvent(event: MapBrowserEvent<any>): void {
    const eventData = this.createEventData('dblclick', event);
    this.triggerListeners('dblclick', eventData);
  }

  /**
   * 处理指针移动事件
   * @param event 地图浏览器事件
   */
  private handlePointerMoveEvent(event: MapBrowserEvent<any>): void {
    const eventData = this.createEventData('pointermove', event);
    this.triggerListeners('hover', eventData);
    this.triggerListeners('pointermove', eventData);
  }

  /**
   * 处理移动结束事件
   */
  private handleMoveEndEvent(): void {
    const eventData: MapEventData = {
      type: 'moveend',
      zoom: this.map.getView().getZoom(),
      coordinate: this.map.getView().getCenter()
    };
    this.triggerListeners('moveend', eventData);
  }

  /**
   * 处理缩放结束事件
   */
  private handleZoomEndEvent(): void {
    const eventData: MapEventData = {
      type: 'zoomend',
      zoom: this.map.getView().getZoom(),
      coordinate: this.map.getView().getCenter()
    };
    this.triggerListeners('zoomend', eventData);
  }

  /**
   * 创建事件数据
   * @param type 事件类型
   * @param event 原始事件
   */
  private createEventData(type: MapEventType, event: MapBrowserEvent<any>): MapEventData {
    const pixel = this.map.getEventPixel(event.originalEvent);
    const features = this.map.getFeaturesAtPixel(pixel);
    
    return {
      type,
      originalEvent: event.originalEvent,
      coordinate: event.coordinate,
      pixel,
      features,
      feature: features.length > 0 ? features[0] : undefined
    };
  }

  /**
   * 触发监听器
   * @param type 事件类型
   * @param eventData 事件数据
   */
  private triggerListeners(type: MapEventType, eventData: MapEventData): void {
    const typeListeners: EventListener[] = [];
    
    this.listeners.forEach((listener: EventListener) => {
      if (listener.type === type) {
        typeListeners.push(listener);
      }
    });

    typeListeners.forEach((listener: EventListener) => {
      try {
        // 应用过滤器
        if (listener.options?.filter && !listener.options.filter(eventData)) {
          return;
        }

        // 执行回调
        listener.callback(eventData);

        // 如果是一次性监听器，移除它
        if (listener.options?.once) {
          this.off(listener.id);
        }
      } catch (error) {
        ErrorHandler.getInstance().createAndHandleError(
          `Error in event listener: ${error}`,
          ErrorType.COMPONENT_ERROR,
          { listener, eventData, error }
        );
      }
    });
  }

  /**
   * 获取监听器信息（用于调试）
   */
  getListenersInfo(): Array<{
    id: string;
    type: MapEventType;
    hasFilter: boolean;
    isOnce: boolean;
  }> {
    const result: Array<{
      id: string;
      type: MapEventType;
      hasFilter: boolean;
      isOnce: boolean;
    }> = [];
    
    this.listeners.forEach((listener: EventListener) => {
      result.push({
        id: listener.id,
        type: listener.type,
        hasFilter: !!listener.options?.filter,
        isOnce: !!listener.options?.once
      });
    });
    
    return result;
  }
}