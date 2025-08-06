"use strict";

import Map from "ol/Map";
import Overlay from 'ol/Overlay'
import Feature from "ol/Feature";
import { Point as olPoint } from "ol/geom";
import { Text, Style, Fill, Stroke, Icon } from "ol/style";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Cluster } from 'ol/source';
import * as turf from '@turf/turf';
import GeoJSON from "ol/format/GeoJSON";
import { MapJSONData, PointOptions, ClusterOptions, PointData,VueTemplatePointInstance } from '../types'
import VueTemplatePoint from './VueTemplatePoint';
import MapTools from "./MapTools";
import { Options as IconOptions } from "ol/style/Icon";
import { Options as StyleOptions } from "ol/style/Style";
import { ValidationUtils } from '../utils/ValidationUtils';


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
  private createTextStyle(options: PointOptions | ClusterOptions, text: string): Text {
    return new Text({
      text: text,
      font: options.textFont || '12px Calibri,sans-serif',
      fill: new Fill({
        color: options.textFillColor || '#FFF'
      }),
      stroke: new Stroke({
        color: options.textStrokeColor || '#000',
        width: options.textStrokeWidth || 3
      }),
      offsetY: options.textOffsetY || 20,
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
      scale: options.scale ?? 1,
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
        geometry: new olPoint([item.lgtd, item.lttd])
      });
      
      pointFeature.setStyle(this.createPointStyle(options, item));
      pointFeatureList.push(pointFeature);
    });

    const PointVectorLayer = new VectorLayer({
      layerName: options.layerName,
      source: new VectorSource({
        features: pointFeatureList
      }),
      zIndex: options.zIndex || 21,
    } as any);
    
    this.configureLayer(PointVectorLayer, options);
    return PointVectorLayer;
  }


  addClusterPoint(pointData: PointData[], options: ClusterOptions): VectorLayer<VectorSource> | null {
    if (!ValidationUtils.validatePointData(pointData)) {
      return null;
    }
    
    const pointFeatureList: Feature[] = [];
    pointData.forEach(item => {
      if (!ValidationUtils.validateCoordinates(item)) {
        return;
      }
      
      const pointFeature = new Feature({
        geometry: new olPoint([item.lgtd, item.lttd]),
        name: options.textKey ? item[options.textKey] : '',
      });
      pointFeatureList.push(pointFeature);
    });

    const source = new VectorSource({
      features: pointFeatureList,
    });

    const clusterSource = new Cluster({
      distance: options.distance || 40, // The distance for clustering in pixels
      minDistance: options.minDistance || 0,
      source: source,
    });

    const clusterLayer = new VectorLayer({
      layerName: options.layerName,
      source: clusterSource,
      style: (feature: any) => {
        const name = feature.get('features')[0].get(options.textKey);
        return this.createClusterStyle(options, name);
      },
      zIndex: options.zIndex || 21,
    } as any);
    
    this.configureLayer(clusterLayer, options);
    return clusterLayer;
  }


  // 在流域中心添加闪烁点位
  addTwinkleLayerFromPolygon(twinkleList: any[], className: string, key: string, json: MapJSONData) {
    new MapTools(this.map).removeLayer('twinklePoint')
    // 计算多边形的中心点坐标
    const calculatePolygonCenter = (polygonCoordinates: any) => {
      const polygon = turf.polygon(polygonCoordinates[0]);

      const centroid = turf.centroid(polygon);
      return centroid.geometry.coordinates;
    };

    const features: any[] = json.features
    const vectorSource = new VectorSource({
      format: new GeoJSON(),
    });
    twinkleList.forEach(item => {
      const feature = features.find((ele: any) => {
        return ele.properties.BASIN === item.idx
      })
      if (!feature) return
      feature.properties.level = item.lev
      const geojson = new GeoJSON();
      const olFeature = geojson.readFeature(feature);
      vectorSource.addFeature(olFeature)
      if (feature) {
        const polygonCenter = calculatePolygonCenter(feature.geometry.coordinates)
        item.lgtd = polygonCenter[0]
        item.lttd = polygonCenter[1]
      }
    })
    const basinLayer = new VectorLayer({
      name: 'twinklePoint',
      layerName: 'twinklePoint',
      source: vectorSource,
      style: function (feature: any) {
        return new Style({
          stroke: new Stroke({
            color: 'rgb(139,188,245)',
            width: 3
          }),
          fill: new Fill({ color: 'rgba(255, 255, 255, 0)' }),
          text: new Text({
            text: feature.values_['BASIN'] || "",
            font: '14px Calibri,sans-serif',
            fill: new Fill({ color: '#FFF' }),
            stroke: new Stroke({
              color: '#409EFF', width: 2
            }),
          })
        })
      },
      zIndex: 21
    } as any)
    this.map.addLayer(basinLayer)
    this.addTwinkleLayer(twinkleList, className, key, (twinkleItem: any) => {

    })
  }

  /**
   * 添加闪烁点
   * @param twinkleList 闪烁点数据 - 二维数组 [[]，[]]
   * @param className 闪烁点样式,需要和id保持一致
   * @param key 闪烁点索引
   * @param callback
   */
  addTwinkleLayer(twinkleList: any[], className: string = 'marker_warning', key: string, callback?: Function) {
    // 查找class是warn-points的dom，并删除
    const arr = document.getElementsByClassName(className)
    const l = arr.length;
    for (let i = l - 1; i >= 0; i--) {
      if (arr[i] !== null) {
        arr[i].parentNode?.removeChild(arr[i]);
      }
    }

    const el = document.getElementById(className)
    for (let i = 0; i < twinkleList.length; i++) {
      const twinkleItem = twinkleList[i];

      // 定义图标Dom
      const el2 = document.createElement('div');
      el2.id = className + i
      el2.className = className + twinkleItem[key]
      el2.onclick = () => {
        callback && callback(twinkleItem)
        // bus.emit('twinkleClick', twinkleItem)
      }

      // 插入图标
      if (el) el.insertAdjacentElement('afterend', el2)

      // 创建一个覆盖物
      const anchor = new Overlay({
        element: document.getElementById(className + i) || undefined,
        positioning: 'center-center',
        className: className
      })
      // 关键的一点，需要设置附加到地图上的位置
      anchor.setPosition([twinkleItem.lgtd, twinkleItem.lttd])
      // 然后添加到map上
      this.map.addOverlay(anchor)
    }
  }

  /**
   * 地图定位
   * @param lgtd 经度
   * @param lttd 纬度
   * @param zoom 缩放级别
   * @param duration 动画时长
   */
  locationAction(lgtd: number, lttd: number, zoom = 20, duration = 3000): boolean {
    if (!ValidationUtils.validateLngLat(lgtd, lttd)) {
      return false;
    }
    
    try {
      this.map.getView().animate({ center: [lgtd, lttd], zoom, duration });
      return true;
    } catch (error) {
      console.error('[地图定位]', '定位失败:', error);
      return false;
    }
  }

  /**
   * 设置dom元素为点位
   */
  addDomPoint(id: string, lgtd: number, lttd: number): boolean {
    if (!id) {
      console.error('Element ID is required');
      return false;
    }
    
    if (!ValidationUtils.validateLngLat(lgtd, lttd)) {
      return false;
    }
    
    const el = document.getElementById(id);
    if (!el) {
      console.error(`Element with id '${id}' not found`);
      return false;
    }
    
    try {
      const anchor = new Overlay({
        id: id,
        element: el,
        positioning: 'center-center',
        stopEvent: false
      });
      anchor.setPosition([lgtd, lttd]);
      this.map.addOverlay(anchor);
      return true;
    } catch (error) {
      console.error('Failed to set DOM point:', error);
      return false;
    }
  }

  /**
   * 添加vue组件为点位
   * @param pointDataList 点位信息列表
   * @param template vue组件模板
   * @param options 选项，包含Vue实例
   * @returns 返回控制对象，包含显示、隐藏、移除方法
   * @throws 当参数无效时抛出错误
   */
  addVueTemplatePoint(pointDataList: PointData[], template: any, options?: {
    Vue?: any,
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

    if (!options?.Vue) {
      throw new Error('Vue instance is required in options');
    }

    try {
      const vueTemplatePoint = new VueTemplatePoint(this.map);
      return vueTemplatePoint.addVueTemplatePoint(pointDataList, template, options);
    } catch (error) {
      throw new Error(`Failed to create Vue template points: ${error}`);
    }
  }
}
