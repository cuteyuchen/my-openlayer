import Map from "ol/Map";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import VectorLayer from "ol/layer/Vector";
import { Fill, Stroke, Style, Text } from "ol/style";
import { Feature } from "ol";
import { LineOptions, MapJSONData } from "../types";
import MapTools from "./MapTools";

/**
 * 线要素管理类
 * 用于在地图上添加和管理线要素
 */
export default class Line {
  private readonly map: Map;
  riverLayerList: any[] = [];
  riverLayerShow: boolean = false;

  [propertyName: string]: any

  /**
   * 构造函数
   * @param map OpenLayers地图实例
   * @throws 当地图实例无效时抛出错误
   */
  constructor(map: Map) {
    if (!map) {
      throw new Error('Map instance is required');
    }
    this.map = map;
  }

  /**
   * 添加线要素
   * @param data GeoJSON格式的线数据
   * @param options 配置项
   * @returns 创建的矢量图层
   * @throws 当数据格式无效时抛出错误
   */
  addLine(data: MapJSONData, options: LineOptions): VectorLayer<VectorSource> {
    if (!data) {
      throw new Error('Line data is required');
    }

    if (!options || !options.type) {
      throw new Error('Options with type is required');
    }

    let features: Feature[];
    try {
      features = new GeoJSON().readFeatures(data);
    } catch (error) {
      throw new Error(`Invalid GeoJSON data: ${error}`);
    }

    if (!features || features.length === 0) {
      console.warn('No features found in line data');
    }

    const layer = new VectorLayer({
      name: options.layerName,
      layerName: options.layerName,
      source: new VectorSource({
        features: features
      }),
      style: function (feature: any) {
        feature.set('type', options.type)
        feature.set('layerName', options.type)
        return new Style({
          stroke: new Stroke({
            color: options.strokeColor || 'rgba(3, 122, 255, 1)',
            width: options.strokeWidth || 2,
            lineDash: options?.lineDash,
            lineDashOffset: options?.lineDashOffset
          }),
        })
      },
      zIndex: options.zIndex ?? 15,
    } as any)
    layer.setVisible(options.visible === undefined ? true : options.visible)
    this[options.type + 'Layer'] = layer
    this.map.addLayer(layer)
    return layer
  }

  // 添加水系并按照zoom显示不同级别
  addRiverLayersByZoom(fyRiverJson: MapJSONData, options: LineOptions = { type: 'river' }) {
    this.riverLayerShow = !!options.visible
    this.riverLayerList = []
    for (let i = 1; i <= 5; i++) {
      const vectorSource = new VectorSource({
        format: new GeoJSON(),
        loader: function () {
          const geojson = new GeoJSON();
          fyRiverJson.features.forEach((feature: any) => {
            if (feature.properties.level === i) {
              const olFeature = geojson.readFeature(feature);
              vectorSource.addFeature(olFeature)
            }
          })
        },
        // 其他配置
      })
      const riverLayer = new VectorLayer({
        name: 'river',
        layerName: 'river',
        source: vectorSource,
        style: function (feature: any) {
          feature.set('type', options.layerName)
          feature.set('layerName', options.layerName)
          return new Style({
            stroke: new Stroke({
              color: options.strokeColor || 'rgb(0,113,255)',
              width: options.strokeWidth || 3
            })
          })
        },
        zIndex: options.zIndex ?? 15
      } as any)
      riverLayer.setVisible(false)
      this.riverLayerList.push(riverLayer)
      this.map.addLayer(riverLayer)
    }

    this.showRiverLayerByZoom()
    MapTools.mapOnEvent(this.map, 'moveend', () => {
      this.showRiverLayerByZoom()
    })
  }

  showRiverLayer(show: boolean) {
    this.riverLayerShow = show
    this.riverNamePointLayer.setVisible(show)
    this.showRiverLayerByZoom()
  }

  //分级根据zoom显示河流
  showRiverLayerByZoom() {
    const zoom = this.map.getView().getZoom()
    this.riverLayerList.forEach((layer: any, index: number) => {
      // 一共分5级，加1因为level从1开始
      if (zoom && zoom > index + 1 + 8) {
        layer.setVisible(this.riverLayerShow)
      } else {
        layer.setVisible(false)
      }
    })
  }

  // 添加全部级别河流根据级别显示不同宽度
  addRiverWidthByLev(arr: any = {}) {
    const riverLayer = new VectorLayer({
      name: 'river',
      layerName: 'river',
      source: new VectorSource({
        features: (new GeoJSON()).readFeatures(arr)
      }),
      style: (feature: any) => this.setFeatureAttr(feature),
      zIndex: 15
    } as any)
    this.map.addLayer(riverLayer)
  }

  setFeatureAttr(feature: { get: (arg0: string) => any; }) {
    const level = feature.get('level')
    const levelWidth: any = { 1: 2, 2: 1, 3: 0.5, 4: 0.5, 5: 0.5 }
    return new Style({
      stroke: new Stroke({
        color: 'rgba(3, 122, 255, 1)',
        width: levelWidth[Number(level)]
      }),
    })
  }
}
