import Map from "ol/Map";
import Feature from "ol/Feature";
import { Point as olPoint } from "ol/geom";
import { Text, Style, Fill, Stroke, Icon, Circle as CircleStyle } from "ol/style";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import BaseLayer from "ol/layer/Base";
import { PointOptions, ClusterOptions, PointData,VueTemplatePointInstance,TwinkleItem, PulsePointOptions, PulsePointLayerHandle } from '../../types'
import { VueTemplatePoint } from '../vue-template-point';
import { Options as IconOptions } from "ol/style/Icon";
import { Options as StyleOptions } from "ol/style/Style";
import ValidationUtils from '../../utils/ValidationUtils';
import ProjectionUtils from '../../utils/ProjectionUtils';
import { ConfigManager, MapTools } from "../map";
import PointClusterLayer from './PointClusterLayer';
import PointOverlay from './PointOverlay';
import PointPulseLayer from './PointPulseLayer';


/**
 * 通用的可销毁句柄。用于让 Point 内部统一回收 addPulsePointLayer / addDomPoint /
 * addVueTemplatePoint 等返回的不同形态对象。
 */
interface Disposable { remove(): void }

export default class Point {
  private map: Map;

  /** 由本实例创建的纯图层（addPoint / addClusterPoint）。destroyAll 时统一移除。 */
  private readonly managedLayers = new Set<BaseLayer>();

  /** 由本实例创建的、需要主动 remove 的句柄（Pulse / DOM / Vue 模板）。 */
  private readonly managedDisposables = new Set<Disposable>();

  /** VueTemplatePoint 实例复用，避免每次调用 addVueTemplatePoint 都 new 一个无主实例。 */
  private vueTemplatePoint?: VueTemplatePoint;

  constructor(map: Map) {
    this.map = map;
  }

  /** @internal */
  private trackLayer<T extends BaseLayer>(layer: T): T {
    this.managedLayers.add(layer);
    return layer;
  }

  /** @internal */
  private trackDisposable<T extends Disposable>(handle: T): T {
    this.managedDisposables.add(handle);
    return handle;
  }

  /**
   * 销毁本实例创建的所有图层与动画句柄。供 MyOl.destroy 调用。
   */
  destroyAll(): void {
    this.managedDisposables.forEach(handle => {
      try { handle.remove(); } catch { /* ignore */ }
    });
    this.managedDisposables.clear();

    this.managedLayers.forEach(layer => {
      try { this.map.removeLayer(layer); } catch { /* ignore */ }
    });
    this.managedLayers.clear();

    if (this.vueTemplatePoint) {
      try { this.vueTemplatePoint.removeAllPoints(); } catch { /* ignore */ }
      this.vueTemplatePoint = undefined;
    }
  }



  /**
   * 创建文本样式
   * @private
   * @param options 选项
   * @param text 文本内容
   * @returns 文本样式
   */
  private createTextStyle(options: PointOptions | ClusterOptions | PulsePointOptions, text: string): Text {
    const defaultTextOptions = ConfigManager.DEFAULT_POINT_TEXT_OPTIONS;
    return new Text({
      text: text,
      font: options.textFont || defaultTextOptions.textFont,
      fill: new Fill({
        color: options.textFillColor || defaultTextOptions.textFillColor
      }),
      stroke: new Stroke({
        color: options.textStrokeColor || defaultTextOptions.textStrokeColor,
        width: options.textStrokeWidth || defaultTextOptions.textStrokeWidth
      }),
      offsetY: options.textOffsetY || defaultTextOptions.textOffsetY,
    });
  }

  /**
   * 创建图标样式
   * @private
   * @param options 选项
   * @returns 图标样式
   */
  private createIconStyle(options: PointOptions | ClusterOptions): Icon {
    const iconOptions: IconOptions = {
      src: options.img,
      scale: options.scale ?? ConfigManager.DEFAULT_POINT_ICON_SCALE,
    };
    if (options.iconColor) {
      iconOptions.color = options.iconColor;
    }
    return new Icon(iconOptions);
  }

  /**
   * 创建点样式
   * @private
   * @param options 选项
   * @param item 数据项
   * @returns 样式对象
   */
  private createPointStyle(options: PointOptions | ClusterOptions, item?: PointData): Style {
    const style: StyleOptions = {};
    
    if (options.textKey && item) {
      style.text = this.createTextStyle(options, item[options.textKey]);
    }
    
    if (options.img) {
      style.image = this.createIconStyle(options);
    }
    
    return new Style(style);
  }

  /**
   * 创建集群样式
   * @private
   * @param options 选项
   * @param name 名称
   * @returns 样式对象
   */
  private createClusterStyle(options: ClusterOptions, name: string): Style {
    const style: StyleOptions = {};
    
    if (options.textKey) {
      style.text = this.createTextStyle(options, name);
    }
    
    if (options.img) {
      style.image = this.createIconStyle(options);
    }
    
    return new Style(style);
  }

  /**
   * 配置图层属性
   * @private
   * @param layer 图层
   * @param options 选项
   */
  private configureLayer(layer: VectorLayer<VectorSource>, options: PointOptions | ClusterOptions): void {
    layer.setVisible(options.visible === undefined ? true : options.visible);
    this.map.addLayer(layer);
  }

  /**
   *
   * @param pointData
   * @param type
   * @param options {
   *   textKey: String 数据中的文本的key
   *   img: String 图标
   * }
   */
  addPoint(pointData: PointData[], options: PointOptions): VectorLayer<VectorSource> | null {
    if (!ValidationUtils.validatePointData(pointData)) {
      return null;
    }
    
    const pointFeatureList: Feature[] = [];
    pointData.forEach((item) => {
      if (!ValidationUtils.validateCoordinates(item)) {
        return;
      }
      
      const pointFeature = new Feature({
        rawData: item,
        type: options.layerName,
        layerName: options.layerName,
        geometry: new olPoint(ProjectionUtils.transformCoordinate([item.lgtd, item.lttd], options))
      });
      
      if (options.style) {
        if (typeof options.style === 'function') {
          pointFeature.setStyle(options.style(pointFeature));
        } else {
          pointFeature.setStyle(options.style);
        }
      } else {
        pointFeature.setStyle(this.createPointStyle(options, item));
      }
      pointFeatureList.push(pointFeature);
    });

    const PointVectorLayer = new VectorLayer({
      properties: {
        name: options.layerName,
        layerName: options.layerName
      },
      source: new VectorSource({
        features: pointFeatureList
      }),
      zIndex: options.zIndex || ConfigManager.DEFAULT_POINT_OPTIONS.zIndex,
    });

    this.configureLayer(PointVectorLayer, options);
    this.trackLayer(PointVectorLayer);
    return PointVectorLayer;
  }


  addClusterPoint(pointData: PointData[], options: ClusterOptions): VectorLayer<VectorSource> | null {
    if (!ValidationUtils.validatePointData(pointData)) {
      return null;
    }

    const layer = PointClusterLayer.create(this.map, pointData, options, this.createClusterStyle.bind(this));
    if (layer) {
      this.trackLayer(layer);
    }
    return layer;
  }

  /**
   * 添加高性能闪烁点图层。
   *
   * 与 addDomPoint 不同，该方法使用 VectorLayer 批量渲染点位，并通过单个
   * requestAnimationFrame 驱动闪烁圈，适合村庄预警等大量点位场景。
   */
  addPulsePointLayer(pointData: PointData[], options: PulsePointOptions): PulsePointLayerHandle | null {
    if (!ValidationUtils.validatePointData(pointData)) {
      return null;
    }
    const handle = PointPulseLayer.create(this.map, pointData, options);
    this.trackDisposable(handle);
    return handle;
  }


  /**
   * 添加闪烁点
   * @param twinkleList 闪烁点数据
   * @param callback
   */
  addDomPoint(twinkleList: TwinkleItem[], callback?: Function): {
    anchors: import('ol/Overlay').default[],
    remove:()=>void
    setVisible:(visible:boolean)=>void
  } {
    const handle = PointOverlay.create(this.map, twinkleList, callback);
    this.trackDisposable(handle);
    return handle;
  }

  /**
   * 添加vue组件为点位
   * @param pointDataList 点位信息列表
   * @param template vue组件模板
   * @param Vue Vue实例
   * @returns 返回控制对象，包含显示、隐藏、移除方法
   * @throws 当参数无效时抛出错误
   */
  addVueTemplatePoint(pointDataList: PointData[], template: any, options?: {
    positioning?: 'bottom-left' | 'bottom-center' | 'bottom-right' | 'center-left' | 'center-center' | 'center-right' | 'top-left' | 'top-center' | 'top-right',
    stopEvent?: boolean
  }): {
    setVisible: (visible: boolean) => void,
    setOneVisibleByProp: (propName: string, propValue: any, visible: boolean) => void,
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
      if (!this.vueTemplatePoint) {
        this.vueTemplatePoint = new VueTemplatePoint(this.map);
      }
      const handle = this.vueTemplatePoint.addVueTemplatePoint(pointDataList, template, options);
      this.trackDisposable(handle);
      return handle;
    } catch (error) {
      throw new Error(`Failed to create Vue template points: ${error}`);
    }
  }

    /**
   * 地图定位
   * @deprecated 请使用 MapTools.locationAction 方法代替
   * @param lgtd 经度
   * @param lttd 纬度
   * @param zoom 缩放级别
   * @param duration 动画时长
   */
  locationAction(lgtd: number, lttd: number, zoom = 20, duration = 3000, projection?: {
    dataProjection?: string;
    featureProjection?: string;
  }): boolean {
    return new MapTools(this.map).locationAction(lgtd, lttd, zoom, duration, projection);
  }
}
