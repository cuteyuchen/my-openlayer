/**
 * 地图底图图层
 */

import Map from "ol/Map";
import { Tile as TileLayer } from "ol/layer";
import { get as getProjection, Projection } from "ol/proj";
import { getTopLeft, getWidth } from "ol/extent";
// import { WMTS } from "ol/source";
import WMTSTileGrid from "ol/tilegrid/WMTS";
import XYZ from "ol/source/XYZ";
import BaseLayer from "ol/layer/Base";
import MapTools from "./MapTools";
import { MapLayersOptions, TiandituType, AnnotationLayerOptions, MapLayers } from "../types";


export default class MapBaseLayers {
  private map!: Map;
  private readonly options: MapLayersOptions = {
    zIndex: 0,
    annotation: false,
    mapClip: false,
    mapClipData: undefined,
  };
  private readonly layers: MapLayers = {}

  constructor(map: Map, options: MapLayersOptions) {
    this.map = map;
    this.options = { ...this.options, ...options };
    //如果没有配置底图，则默认使用天地图底图
    if (!Array.isArray(this.options.layers)) {
      this.layers = this.options.layers || {}
      if (!this.options.token) {
        throw new Error('请配置token后才能使用天地图底图')
      } else {
        this.initLayer()
      }
      if (this.layers && Object.keys(this.layers).length !== 0) {
        this.addMapLayer()
        this.switchBaseLayer(<string>Object.keys(this.layers)[0])
      }
    }
  }

  switchBaseLayer(type: TiandituType) {
    if (Array.isArray(this.options.layers)) {
      console.error('需要按照键值对的方式配置底图才可使用切换底图功能')
      return
    }
    for (const key in this.layers) {
      this.layers[key]?.forEach((layer: BaseLayer) => {
        layer.setVisible(key === type)
        // console.log(layer)
      })
    }
  }

  initLayer() {
    if (this.layers && this.options.token) {
      const { token, zIndex = 9 } = this.options
      this.layers.vec_c = [MapBaseLayers.getTiandiTuLayer({ type: 'vec_c', token, zIndex, visible: false })]
      this.layers.img_c = [MapBaseLayers.getTiandiTuLayer({ type: 'img_c', token, zIndex, visible: false })]
      this.layers.ter_c = [MapBaseLayers.getTiandiTuLayer({ type: 'ter_c', token, zIndex, visible: false })]
      if (this.options.annotation) {
        this.layers.vec_c.push(MapBaseLayers.getAnnotationLayer({
          type: 'cva_c',
          token,
          zIndex: zIndex + 1,
          visible: false
        }))
        this.layers.img_c.push(MapBaseLayers.getAnnotationLayer({
          type: 'cia_c',
          token,
          zIndex: zIndex + 1,
          visible: false
        }))
        this.layers.ter_c.push(MapBaseLayers.getAnnotationLayer({
          type: 'cta_c',
          token,
          zIndex: zIndex + 1,
          visible: false
        }))
      }
    }
  }

  //添加注记图层
  addAnnotationLayer(options: Omit<AnnotationLayerOptions, 'token'>) {
    MapBaseLayers.addAnnotationLayer(this.map, {
      ...options,
      token: this.options.token || ''
    })
  }

  //添加注记图层
  static addAnnotationLayer(map: Map, options: AnnotationLayerOptions) {
    const layer = MapBaseLayers.getAnnotationLayer({
      type: options.type,
      token: options.token,
      zIndex: options.zIndex ?? 10,
      visible: options.visible ?? true
    })
    map.addLayer(layer)
    return layer
  }

  addMapLayer() {
    if (this.layers) {
      for (const key in this.layers) {
        this.layers[key]?.forEach((layer: BaseLayer) => {
          layer = this.createLayer(layer)
          this.map.addLayer(layer)
        })
      }
    }
  }

  createLayer(layer: any) {
    if (this.options.mapClip && this.options.mapClipData) {
      layer = MapTools.setMapClip(layer, this.options.mapClipData);
    }
    return layer;
  }


  //img_c 影像底图 ter_c 地形底图
  static getTiandiTuLayer(options: { type: TiandituType, token: string, zIndex: number, visible: boolean }) {
    return new TileLayer({
      source: new XYZ({
        url: `//t{0-7}.tianditu.gov.cn/DataServer?T=${ options.type }&tk=${ options.token }&x={x}&y={y}&l={z}`,
        projection: 'EPSG:4326'
      }),
      zIndex: options.zIndex,
      visible: options.visible
    })
  }


  /**
   * 地图注记
   */
  static getAnnotationLayer(options: AnnotationLayerOptions) {
    return new TileLayer({
      source: new XYZ({
        url: `//t{0-7}.tianditu.gov.cn/DataServer?T=${ options.type }&tk=${ options.token }&x={x}&y={y}&l={z}`,
        projection: 'EPSG:4326'
      }),
      zIndex: options.zIndex,
      visible: options.visible
    })
  }

  static getTileGrid(length: number) {
    const projection: Projection = <Projection>getProjection('EPSG:4326');
    const projectionExtent = projection?.getExtent();
    const size = getWidth(projectionExtent) / 256;
    const resolutions = new Array(length);
    const matrixIds = new Array(length);
    for (let i = 0; i < length; i += 1) {
      const pow = Math.pow(2, i);
      resolutions[i] = size / pow;
      matrixIds[i] = i;
    }
    return new WMTSTileGrid({
      origin: getTopLeft(projectionExtent),
      resolutions,
      matrixIds
    })
  }
}
