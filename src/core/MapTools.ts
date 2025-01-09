"use strict";

import Map from "ol/Map";
import { MapJSONData } from "../types";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Fill, Style } from "ol/style";
import { getVectorContext } from "ol/render";
import { Pixel } from "ol/pixel";
import { FeatureLike } from "ol/Feature";
import { MapBrowserEvent } from "ol/index";
import BaseLayer from "ol/layer/Base";
import Layer from "ol/layer/Layer";
import ImageLayer from "ol/layer/Image";
import ImageSource from "ol/source/Image";
import BaseImageLayer from "ol/layer/BaseImage";

export default class MapTools {
  private readonly map: Map;

  constructor(map: Map) {
    this.map = map;
  }

  /**
   * 根据名称获取图层
   * @param layerName 图层名称
   */
  getLayerByLayerName(layerName: string) {
    if (!this.map) return []
    return MapTools.getLayerByLayerName(this.map, layerName)
  }

  static getLayerByLayerName(map: Map, layerName: string) {
    const targetLayer: (VectorLayer<VectorSource> | BaseLayer | ImageLayer<ImageSource>)[] = []
    const layers = map.getLayers().getArray()
    Object.keys(layers).forEach(function (key: any) {
      const _layerName = layers[key]['values_'].layerName
      if (_layerName && _layerName === layerName) {
        targetLayer.push(layers[key])
      }
    })
    return targetLayer
  }

  /**
   * 设置地图裁剪
   */
  static setMapClip(baseLayer: any, data: MapJSONData) {
    const clipLayer = new VectorLayer({
      style: null,
      source: new VectorSource({
        features: new GeoJSON().readFeatures(data)
      })
    });
    const style = new Style({
      fill: new Fill({
        color: 'transparent'
      })
    });
    baseLayer.on("prerender", (event: any) => {
      const vectorContext = getVectorContext(event);
      event.context.globalCompositeOperation = 'source-over';
      const ctx = event.context;
      ctx.save();
      clipLayer.getSource()?.forEachFeature(function (feature) {
        vectorContext.drawFeature(feature, style);
      });
      ctx.clip();
    })
    baseLayer.on("postrender", (event: any) => {
      const ctx = event.context;
      ctx.restore();
    })
    clipLayer.getSource()?.on('addfeature', function () {
      baseLayer.setExtent(clipLayer.getSource()?.getExtent());
    });
    return baseLayer
  }

  /**
   * 移除图层
   * @param layerName 图层名称
   */

  removeLayer(layerName: string) {
    if (!this.map) return
    MapTools.removeLayer(this.map, layerName)
  }

  /**
   * 移除图层
   * @param map 地图对象
   * @param layerName 图层名称
   */
  static removeLayer(map: Map, layerName: string) {
    const layers = MapTools.getLayerByLayerName(map, layerName)
    layers.forEach(layer => {
      map.removeLayer(layer)
    })
  }

  setLayerVisible(layerName: string, visible: boolean) {
    if (!this.map) return
    MapTools.setLayerVisible(this.map, layerName, visible)
  }

  /**
   * 设置图层可见性
   * @param map
   * @param layerName 图层名称
   * @param visible 是否可见
   */

  static setLayerVisible = (map: Map, layerName: string, visible: boolean) => {
    const layers = MapTools.getLayerByLayerName(map, layerName)
    layers.forEach(layer => {
      layer.setVisible(visible)
    })
  }

  mapOnEvent(eventType: string, callback: (feature?: any, e?: any) => void, clickType?: 'point' | 'line' | 'polygon' | undefined) {
    if (!this.map) return
    MapTools.mapOnEvent(this.map, eventType, callback, clickType)
  }

  /**
   * 地图监听事件
   * @param map
   * @param eventType 事件类型
   * @param clickType 点击类型
   * @param callback 回调函数
   */
  static mapOnEvent(map: Map, eventType = "def", callback: (feature?: any, e?: any) => void, clickType?: 'point' | 'line' | 'polygon' | undefined) {
    const clickTypeObj = {
      point: ['point'],
      line: ['line'],
      polygon: ['polygon', 'MultiPolygon']
    }

    if (eventType === "click") {
      map.on("click", (e) => {
        // 获取点位 feature
        const pixel: Pixel = map.getEventPixel(e.originalEvent);
        const features: FeatureLike[] = map.getFeaturesAtPixel(pixel);

        let feature: FeatureLike | undefined = undefined;
        if (features.length > 0) feature = features[0];

        callback(feature, { features, pixel });
      });
    } else if (eventType === 'moveend') {
      map.on('moveend', function () {
        const zoom = map.getView().getZoom()
        if (zoom) {
          callback(zoom)
        }
      })
    } else if (eventType === 'hover') {
      map.on('pointermove', (e: MapBrowserEvent<any>) => {
        const pixel: Pixel = map.getEventPixel(e.originalEvent);
        const features: FeatureLike[] = map.getFeaturesAtPixel(pixel);
        callback({ features, pixel });
      });
    }
  }
}