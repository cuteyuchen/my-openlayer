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

export default class MapTools {
  private map: Map;

  constructor(map: Map) {
    this.map = map;
  }

  /**
   * 根据名称获取图层
   * @param layerName 图层名称
   */
  getLayerByLayerName(layerName: string) {
    if (!this.map) return null

    const targetLayer: any[] = []
    const layers = this.map.getLayers().getArray()
    Object.keys(layers).forEach(function (key: any) {
      const _layerName = layers[key]['values_'].layerName
      // if (_layerName && _layerName.toString().includes(layerName)) {
      if (_layerName && _layerName === layerName) {
        targetLayer.push(layers[key])
      }
    })

    return targetLayer.length === 1 ? targetLayer[0] : targetLayer
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

  removeLayer(layerName: string) {
    this.map.removeLayer(this.getLayerByLayerName(layerName))
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