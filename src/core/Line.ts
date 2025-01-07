import Map from "ol/Map";
import MyOl from "../index";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import VectorLayer from "ol/layer/Vector";
import { Fill, Stroke, Style, Text } from "ol/style";
import { OptionsType, MapJSONData } from "../types";
import MapTools from "./MapTools";

export default class Line {
  private map: Map;
  riverLayerList: any[] = [];
  riverLayerShow: boolean = false;

  [propertyName: string]: any

  constructor(map: Map) {
    this.map = map
  }

  addLineCommon(data: MapJSONData, options: OptionsType) {
    const layer = new VectorLayer({
      name: options.type,
      layerName: options.type,
      source: new VectorSource({
        features: (new GeoJSON()).readFeatures(data)
      }),
      style: function (feature: any) {
        feature.set('type', options.type)
        feature.set('layerName', options.type)
        return new Style({
          stroke: new Stroke({
            color: options.strokeColor || 'rgba(3, 122, 255, 1)',
            width: options.strokeWidth || 3
          }),
        })
      },
      zIndex: options.zIndex ?? 3
    } as any)
    this[options.type + 'Layer'] = layer
    this.map.addLayer(layer)
    return layer
  }

  // 添加水系并按照zoom显示不同级别
  addRiverLayersByZoom(fyRiverJson: MapJSONData, options: OptionsType = { type: 'river' }) {
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
          feature.set('type', options.type)
          feature.set('layerName', options.type)
          return new Style({
            stroke: new Stroke({
              color: options.strokeColor || 'rgb(0,113,255)',
              width: options.strokeWidth || 3
            })
          })
        },
        zIndex: options.zIndex ?? 6
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
      zIndex: 3
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
