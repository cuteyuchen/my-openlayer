"use strict";

import Map from "ol/Map";
import Overlay from 'ol/Overlay'
import Feature from "ol/Feature";
import { Point as olPoint } from "ol/geom";
import { Text, Style, Fill, Stroke, Icon } from "ol/style";
// import {Style, Icon, Text} from "ol/style";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Cluster } from 'ol/source';
import * as turf from 'turf';
import GeoJSON from "ol/format/GeoJSON";
import MyOl from "../index";
import { OptionsType, PointData } from '../types'
import DomPoint from "./DomPoint";
import MapTools from "./MapTools";


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
  addPoint(pointData: PointData[], type: string, options: OptionsType) {
    const pointFeatureList: any[] = [];
    pointData.forEach((item) => {
      const pointFeature = new Feature({
        // clickLocation: options.clickLocation,
        // all: JSON.stringify(item),
        rawData: item,//保存原始数据
        type: type,
        geometry: new olPoint([item.lgtd, item.lttd])
      })
      const style: { text?: Text, image?: Icon } = {}
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
        const iconOptions: any = {
          src: options.img,
          scale: options.scale ?? 1,
        }
        if (options.color) {
          iconOptions.color = options.color
        }
        style.image = new Icon(iconOptions)
      }
      pointFeature.setStyle(new Style(style))
      pointFeatureList.push(pointFeature)
    })

    const PointVectorLayer = new VectorLayer({
      layerName: type,
      source: new VectorSource({
        features: pointFeatureList
      }),
      zIndex: options.zIndex || 4,
    } as any)
    PointVectorLayer.setVisible(options.visible === undefined ? true : options.visible)
    this.map.addLayer(PointVectorLayer)
    return PointVectorLayer
  }


  addClusterPoint(pointData: any[], type: string = 'village', options: OptionsType) {

    const pointFeatureList: any[] = [];

    pointData.forEach(item => {
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
      layerName: type,
      source: clusterSource,
      style: function (feature: any) {
        const aviValue = feature.get('features')[0].get('name');
        return new Style({
          image: new Icon({
            src: options.img,
          }),
          text: new Text({
            text: aviValue,
            font: '12px Calibri,sans-serif',
            fill: new Fill({
              color: '#FFF'
            }),
            stroke: new Stroke({
              color: '#000',
              width: 3
            }),
            offsetY: 20,
          }),
        });
      },
      zIndex: options.zIndex || 4,
    } as any);
    clusterLayer.setVisible(options.visible === undefined ? true : options.visible)
    this.map.addLayer(clusterLayer);
  }

  /**
   * 添加点 - 闪烁
   *
   */
  addFlashWarnPoint(img: any) {
    const flashIconLayer = new VectorLayer({
      source: new VectorSource({
        features: [
          new Feature({
            geometry: new olPoint([119.81, 29.969]),
          })
        ]
      }),
      style: new Style({
        image: new Icon({
          src: img,
        })
      }),
      zIndex: 99
    })
    this.map.addLayer(flashIconLayer)
  }


  // 在流域中心添加闪烁点位
  setTwinkleLayerFromPolygon(twinkleList: any[], className: string, key: string, json: any) {
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
      zIndex: 6
    } as any)
    this.map.addLayer(basinLayer)
    this.setTwinkleLayer(twinkleList, className, key, (twinkleItem: any) => {

    })
  }

  /**
   * 设置闪烁点
   * @param twinkleList 闪烁点数据 - 二维数组 [[],[]]
   * @param className 闪烁点样式
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

    const el = document.getElementById('marker_warning')
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
  locationAction(lgtd: number, lttd: number, zoom = 20, duration = 3000) {
    if (!(lgtd && lttd)) {
      console.error('[地图定位]', '经纬度不能为空')
      return false
    }
    this.map.getView().animate({ center: [lgtd, lttd], zoom, duration })
  }

  /**
   * 设置dom元素为点位
   */
  setDomPoint(id: string, lgtd: number, lttd: number): void {
    const el = document.getElementById(id)
    if (el) {
      const anchor = new Overlay({
        id: id,
        element: el,
        positioning: 'center-center',
        stopEvent: false
        // autoPan: true,
        // autoPanAnimation: {
        //   duration: 250
        // },
      })
      anchor.setPosition([lgtd, lttd])
      this.map.addOverlay(anchor)
    }
  }

  setDomPointVue(pointInfoList: any[], template: any, Vue: any): {
    setVisible: (visible: boolean) => void,
    remove: () => void
  } {
    const layer = pointInfoList.map((pointInfo: any) => {
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
        layer.forEach((item: any) => {
          item.remove()
        })
      }
    }
  }
}
