"use strict";

import Map from "ol/Map";
import Feature from "ol/Feature";
import { Point as olPoint } from "ol/geom";
import { Text, Style, Fill, Stroke, Icon, Circle as CircleStyle } from "ol/style";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
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


export default class Point {
  private map: Map;

  constructor(map: Map) {
    this.map = map;
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
      layerName: options.layerName,
      source: new VectorSource({
        features: pointFeatureList
      }),
      zIndex: options.zIndex || ConfigManager.DEFAULT_POINT_OPTIONS.zIndex,
    } as any);
    
    this.configureLayer(PointVectorLayer, options);
    return PointVectorLayer;
  }


  addClusterPoint(pointData: PointData[], options: ClusterOptions): VectorLayer<VectorSource> | null {
    if (!ValidationUtils.validatePointData(pointData)) {
      return null;
    }

    return PointClusterLayer.create(this.map, pointData, options, this.createClusterStyle.bind(this));
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
    return PointPulseLayer.create(this.map, pointData, options);
  }


  // // 在流域中心添加闪烁点位
  // addTwinkleLayerFromPolygon(twinkleList: any[], className: string, key: string, json: MapJSONData, options?: PolygonOptions) {
  //   new MapTools(this.map).removeLayer('twinklePoint')
  //   // 计算多边形的中心点坐标
  //   const calculatePolygonCenter = (polygonCoordinates: any) => {
  //     const polygon = turf.polygon(polygonCoordinates[0]);

  //     const centroid = turf.centroid(polygon);
  //     return centroid.geometry.coordinates;
  //   };

  //   const features: any[] = json.features
  //   const vectorSource = new VectorSource({
  //     format: new GeoJSON(),
  //   });
  //   twinkleList.forEach(item => {
  //     const feature = features.find((ele: any) => {
  //       return ele.properties.BASIN === item.idx
  //     })
  //     if (!feature) return
  //     feature.properties.level = item.lev
  //     const geojson = new GeoJSON();
  //     const olFeature = geojson.readFeature(feature);
  //     if (Array.isArray(olFeature)) {
  //       vectorSource.addFeatures(olFeature);
  //     } else {
  //       vectorSource.addFeature(olFeature);
  //     }
  //     if (feature) {
  //       const polygonCenter = calculatePolygonCenter(feature.geometry.coordinates)
  //       item.lgtd = polygonCenter[0]
  //       item.lttd = polygonCenter[1]
  //     }
  //   })
  //   const basinLayer = new VectorLayer({
  //     name: 'twinklePoint',
  //     layerName: 'twinklePoint',
  //     source: vectorSource,
  //     style: function (feature: any) {
  //       if (options?.style) {
  //         if (typeof options.style === 'function') {
  //           return options.style(feature);
  //         } else {
  //           return options.style;
  //         }
  //       }
  //       return new Style({
  //         stroke: new Stroke({
  //           color: 'rgb(139,188,245)',
  //           width: 3
  //         }),
  //         fill: new Fill({ color: 'rgba(255, 255, 255, 0)' }),
  //         text: new Text({
  //           text: feature.values_['BASIN'] || "",
  //           font: '14px Calibri,sans-serif',
  //           fill: new Fill({ color: '#FFF' }),
  //           stroke: new Stroke({
  //             color: '#409EFF', width: 2
  //           }),
  //         })
  //       })
  //     },
  //     zIndex: 21
  //   } as any)
  //   this.map.addLayer(basinLayer)
  //   this.addTwinkleLayer(twinkleList.map(item => ({...item, className: item[key]})), className, key)
  // }

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
    return PointOverlay.create(this.map, twinkleList, callback);
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
      const vueTemplatePoint = new VueTemplatePoint(this.map);
      return vueTemplatePoint.addVueTemplatePoint(pointDataList, template, options);
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
