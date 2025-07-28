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
import { MapJSONData, PointOptions, ClusterOptions, PointData } from '../types'
import DomPoint from './DomPoint';
import MapTools from "./MapTools";
import { Options as IconOptions } from "ol/style/Icon";
import { Options as StyleOptions } from "ol/style/Style";


export default class Point {
  private map: Map;

  constructor(map: Map) {
    this.map = map;
  }

  /**
   *
   * @param pointData
   * @param type
   * @param options {
   *   nameKey: String 数据中的名称的key
   *   img: String 图标
   *   hasImg: Boolean 是否显示图标
   * }
   */
  addPoint(pointData: PointData[], options: PointOptions): VectorLayer<VectorSource> | null {
    if (!pointData || pointData.length === 0) {
      console.warn('Point data is empty or undefined');
      return null;
    }
    
    const pointFeatureList: Feature[] = [];
    pointData.forEach((item) => {
      if (!item.lgtd || !item.lttd) {
        console.warn('Invalid coordinates for point:', item);
        return;
      }
      
      const pointFeature = new Feature({
        rawData: item,
        type: options.layerName,
        geometry: new olPoint([item.lgtd, item.lttd])
      })
      const style: StyleOptions = {}
      if (options.nameKey) {
        style.text = new Text({
          text: item[options.nameKey],
          font: options.textFont || '12px Calibri,sans-serif',
          fill: new Fill({
            color: options.textFillColor || '#FFF'
          }),
          stroke: new Stroke({
            color: options.textStrokeColor || '#000',
            width: options.textStrokeWidth || 3
          }),
          offsetY: options.textOffsetY || 20,
        })
      }
      if (options.hasImg || options.hasImg === undefined) {
        const iconOptions: IconOptions = {
          src: options.img,
          scale: options.scale ?? 1,
        }
        if (options.iconColor) {
          iconOptions.color = options.iconColor
        }
        style.image = new Icon(iconOptions)
      }
      pointFeature.setStyle(new Style(style))
      pointFeatureList.push(pointFeature)
    })

    const PointVectorLayer = new VectorLayer({
      layerName: options.layerName,
      source: new VectorSource({
        features: pointFeatureList
      }),
      zIndex: options.zIndex || 21,
    } as any)
    PointVectorLayer.setVisible(options.visible === undefined ? true : options.visible)
    this.map.addLayer(PointVectorLayer)
    return PointVectorLayer
  }


  addClusterPoint(pointData: PointData[], options: ClusterOptions): VectorLayer<VectorSource> | null {
    if (!pointData || pointData.length === 0) {
      console.warn('Point data is empty or undefined');
      return null;
    }
    
    const pointFeatureList: Feature[] = [];
    pointData.forEach(item => {
      if (!item.lgtd || !item.lttd) {
        console.warn('Invalid coordinates for cluster point:', item);
        return;
      }
      
      const pointFeature = new Feature({
        geometry: new olPoint([item.lgtd, item.lttd]),
        name: options.nameKey ? item[options.nameKey] : '',
      });
      pointFeatureList.push(pointFeature);
    });

    const source = new VectorSource({
      features: pointFeatureList,
    });

    const clusterSource = new Cluster({
      distance: 40, // The distance for clustering in pixels
      source: source,
    });

    const clusterLayer = new VectorLayer({
      layerName: options.layerName,
      source: clusterSource,
      style: function (feature: any) {
        const name = feature.get('features')[0].get(options.nameKey);
        const style: StyleOptions = {}
        if (options.nameKey) {
          style.text = new Text({
            text: name,
            font: options.textFont || '12px Calibri,sans-serif',
            fill: new Fill({
              color: options.textFillColor || '#FFF'
            }),
            stroke: new Stroke({
              color: options.textStrokeColor || '#000',
              width: options.textStrokeWidth || 3
            }),
            offsetY: options.textOffsetY || 20,
          })
        }
        if (options.hasImg || options.hasImg === undefined) {
          const iconOptions: IconOptions = {
            src: options.img,
            scale: options.scale ?? 1,
          }
          if (options.iconColor) {
            iconOptions.color = options.iconColor
          }
          style.image = new Icon(iconOptions)
        }
        return new Style(style)
      },
      zIndex: options.zIndex || 21,
    } as any);
    clusterLayer.setVisible(options.visible === undefined ? true : options.visible)
    this.map.addLayer(clusterLayer);
    return clusterLayer;
  }


  // 在流域中心添加闪烁点位
  setTwinkleLayerFromPolygon(twinkleList: any[], className: string, key: string, json: MapJSONData) {
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
    this.setTwinkleLayer(twinkleList, className, key, (twinkleItem: any) => {

    })
  }

  /**
   * 设置闪烁点
   * @param twinkleList 闪烁点数据 - 二维数组 [[],[]]
   * @param className 闪烁点样式,需要和id保持一致
   * @param key 闪烁点索引
   * @param callback
   */
  setTwinkleLayer(twinkleList: any[], className: string = 'marker_warning', key: string, callback?: Function) {
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
    if (!lgtd || !lttd || isNaN(lgtd) || isNaN(lttd)) {
      console.error('[地图定位]', '经纬度不能为空或无效');
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
  setDomPoint(id: string, lgtd: number, lttd: number): boolean {
    if (!id || !lgtd || !lttd || isNaN(lgtd) || isNaN(lttd)) {
      console.error('Invalid parameters for setDomPoint');
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
   * 设置vue组件为点位
   * @param pointInfoList 点位信息列表
   * @param template vue组件模板
   * @param Vue Vue实例
   * @returns 返回控制对象，包含显示、隐藏、移除方法
   * @throws 当参数无效时抛出错误
   */
  setDomPointVue(pointInfoList: any[], template: any, Vue: any): {
    setVisible: (visible: boolean) => void,
    remove: () => void
  } {
    if (!pointInfoList || !Array.isArray(pointInfoList) || pointInfoList.length === 0) {
      throw new Error('Valid point info list is required');
    }
    
    if (!template) {
      throw new Error('Vue template is required');
    }
    
    if (!Vue) {
      throw new Error('Vue instance is required');
    }
    
    try {
      const layer = pointInfoList.map((pointInfo: any) => {
        if (!pointInfo.lgtd || !pointInfo.lttd || isNaN(pointInfo.lgtd) || isNaN(pointInfo.lttd)) {
          throw new Error('Valid longitude and latitude are required for each point');
        }
        
        return new DomPoint(this.map, {
          Vue,
          Template: template,
          lgtd: pointInfo.lgtd,
          lttd: pointInfo.lttd,
          props: {
            stationInfo: {
              type: Object,
              default: pointInfo
            }
          },
        })
      })
      
      return {
        setVisible: (visible: boolean) => {
          layer.forEach((item: DomPoint) => {
            item.setVisible(visible)
          })
        },
        remove: () => {
          layer.forEach((item: DomPoint) => {
            item.remove()
          })
        }
      }
    } catch (error) {
      throw new Error(`Failed to create DOM points: ${error}`);
    }
  }
}
