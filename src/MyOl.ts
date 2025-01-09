"use strict";

import { register as olProj4Register } from 'ol/proj/proj4'
import {
  Projection as olProjProjection,
  addProjection as olProjAddProjection,
  fromLonLat as olProjFromLonLat
} from 'ol/proj'
import View from "ol/View";
import Map from "ol/Map";
import Polygon from "./core/Polygon";
import Point from "./core/Point";
import Line from "./core/Line";
import MapBaseLayers from "./core/MapBaseLayers";
import proj4 from "proj4";
import MapTools from "./core/MapTools";
import { OptionsType, MapInitType, MapLayersOptions } from './types'
import { defaults as defaultControls } from 'ol/control'
import BaseLayer from "ol/layer/Base";
// import { Pixel } from "ol/pixel";
// import { FeatureLike } from "ol/Feature";
// import { MapBrowserEvent } from "ol";

export default class MyOl {
  map!: Map;
  private baseLayers!: MapBaseLayers;
  private polygon!: Polygon;
  private mapTools!: MapTools;
  private point!: Point;
  private line!: Line;
  private readonly options: MapInitType;
  static DefaultOptions: MapInitType = {
    layers: undefined,
    zoom: 10,
    center: [119.81, 29.969],
    minZoom: 8,
    maxZoom: 20,
    extent: undefined
  }

  constructor(id: string, options: MapInitType) {
    options.center = options.center || MyOl.DefaultOptions.center
    this.options = { ...MyOl.DefaultOptions, ...options }
    let layers: BaseLayer[] = []
    if (Array.isArray(options.layers)) {
      layers = options.layers
    }
    this.map = new Map({
      target: id, // 地图容器
      view: MyOl.getView(this.options), // 视图
      layers: layers,
      controls: defaultControls({
        zoom: false,
        rotate: false,
        attribution: false
      }).extend([])
    })
  }

  /**
   * 获取视图
   * @param options 视图配置
   * @param options.center 中心点
   * @param options.zoom 缩放级别
   * @param options.minZoom 最小缩放级别
   * @param options.maxZoom 最大缩放级别
   * @param options.extent 视图范围
   * @returns View
   */
  static getView(options: MapInitType = MyOl.DefaultOptions) {
    proj4.defs("EPSG:4490", "+proj=longlat +ellps=GRS80 +no_defs");
    proj4.defs("EPSG:4549", "+proj=tmerc +lat_0=0 +lon_0=120 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs");
    olProj4Register(proj4)

    const cgsc2000 = new olProjProjection({
      code: "EPSG:4490",
      extent: [-180, -90, 180, 90],
      worldExtent: [-180, -90, 180, 90],
      units: "degrees"
    })
    olProjAddProjection(cgsc2000)
    // 视图配置
    const viewOptions: any = {
      projection: cgsc2000, // 坐标系
      center: olProjFromLonLat(<number[]>options.center, cgsc2000), // 中心点
      zoom: options.zoom || 10, // 缩放级别
      minZoom: options.minZoom || 8,
      maxZoom: options.maxZoom || 20
    }
    if (options.extent) viewOptions.extent = options.extent
    return new View(viewOptions)
  }


  //  ╔══════════╗
  //  ║  地图 面  ║
  //  ╚══════════╝

  /**
   * 获取 地图 面 操作
   * @returns Polygon
   */
  getPolygon() {
    if (!this.polygon) this.polygon = new Polygon(this.map)
    return this.polygon
  }

  getMapBaseLayers() {
    if (Array.isArray(this.options.layers)) {
      console.warn('已设置默认底图，MapBaseLayers中的switchBaseLayer方法将失效')
    }
    const options: MapLayersOptions = {
      layers: this.options.layers,
      annotation: this.options.annotation,
      zIndex: 1,
      mapClip: !!this.options.mapClipData,
      mapClipData: this.options.mapClipData,
      token: this.options.token || ''
    }
    if (!this.baseLayers) this.baseLayers = new MapBaseLayers(this.map, options)
    return this.baseLayers
  }

  //  ╔══════════╗
  //  ║  地图 点  ║
  //  ╚══════════╝

  /**
   * 获取 地图 点 操作
   * @returns Point
   */
  getPoint() {
    if (!this.point) this.point = new Point(this.map)
    return this.point
  }


  //  ╔══════════╗
  //  ║  地图 线  ║
  //  ╚══════════╝

  /**
   * 获取 地图 线 操作
   * @returns Line
   */
  getLine() {
    if (!this.line) this.line = new Line(this.map)
    return this.line
  }


  //  ╔════════════╗
  //  ║  地图 工具  ║
  //  ╚════════════╝

  /**
   * 获取 地图 工具 操作
   * @returns MapTools
   */
  getTools() {
    if (!this.mapTools) this.mapTools = new MapTools(this.map)
    return this.mapTools
  }

  restPosition(duration = 3000) {
    if (!this.options.center) return console.error('未设置中心点')
    this.locationAction(this.options.center[0], this.options.center[1], this.options.zoom, duration)
  }

  /**
   * 地图定位
   * @param lgtd 经度
   * @param lttd 纬度
   * @param zoom 缩放级别
   * @param duration 动画时间
   */
  locationAction(lgtd: number, lttd: number, zoom = 20, duration = 3000) {
    this.getPoint().locationAction(lgtd, lttd, zoom, duration)
  }

  /**
   * 地图监听事件
   * @param eventType 事件类型
   * @param clickType 点击类型
   * @param callback 回调函数
   */
  mapOnEvent(eventType = "def", callback: (feature?: any, e?: any) => void, clickType?: 'point' | 'line' | 'polygon' | undefined) {
    MapTools.mapOnEvent(this.map, eventType, callback, clickType)
  }

}
