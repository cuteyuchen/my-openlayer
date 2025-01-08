"use strict";

import Map from "ol/Map";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Fill, Icon, Stroke, Style, Text } from "ol/style";
import { Tile as TileLayer, Image as ImageLayer } from "ol/layer";
import { Geometry, LinearRing } from "ol/geom";
import { fromExtent } from "ol/geom/Polygon";
import Feature from "ol/Feature";
import ImageStatic from "ol/source/ImageStatic";
import { OptionsType, MapJSONData } from '../types'
import MapTools from "./MapTools";

export default class Polygon {
  map: Map;
  private colorMap: any = {
    '0': 'rgba(255, 0, 0, 0.6)',
    '1': 'rgba(245, 154, 35, 0.6)',
    '2': 'rgba(255, 238, 0, 0.6)',
    '3': 'rgba(1, 111, 255, 0.6)'
  };

  [key: string]: any;

  constructor(map: Map) {
    this.map = map;
  }

  /**
   * 获取等级颜色
   * @param lev
   */
  getLevColor(lev: string | number): string {
    return this.colorMap[lev.toString()];
  }


  /**
   * 添加 地图 边框 图层
   * @param data 图层数据
   * @param options 图层配置
   */
  addBorderPolygonLayer(data: MapJSONData, options: OptionsType) {
    options.type = options.type ?? 'border'
    options.fillColor = options.fillColor ?? 'rgba(255, 255, 255, 0)'
    this.addPolygonLayerCommon(data, options)
    if (options.mask) this.setOutLayer(data)
  }


  // 添加分区
  //fyBasinJson中的id的key需要跟options中的nameKey一致
  addPolygonLayerCommon(dataJSON: MapJSONData, options: OptionsType = {}) {
    if (options.type != null) {
      new MapTools(this.map).removeLayer(options.type)
    }
    const layer = new VectorLayer({
      name: options.type,
      layerName: options.type,
      source: new VectorSource({
        features: (new GeoJSON()).readFeatures(dataJSON, options.projectionOptOptions ?? {})
      }),
      style: function (feature: any) {
        feature.set('type', options.type)
        feature.set('layerName', options.type)
        return new Style({
          stroke: new Stroke({
            color: options.strokeColor ?? '#EBEEF5',
            width: options.strokeWidth ?? 3,
            lineDash: options.lineDash,
            lineDashOffset: options.lineDashOffset
          }),
          fill: new Fill({ color: options.fillColor || 'rgba(255, 255, 255, 0.3)' }),
          text: new Text({
            text: options.nameKey ? feature.values_[options.nameKey] : "",
            font: options.textFont ?? '14px Calibri,sans-serif',
            fill: new Fill({ color: options.textFillColor ?? '#FFF' }),
            stroke: new Stroke({
              color: options.textStrokeColor ?? '#409EFF',
              width: options.textStrokeWidth ?? 2
            })
          })
        })
      },
      zIndex: options.zIndex ?? 2
    } as any)
    layer.setVisible(options.visible === undefined ? true : options.visible)
    this.map.addLayer(layer)
    if (options.fitView) {
      // 获取面的范围
      const extent = layer.getSource()?.getExtent();
      // 适应这个范围
      if (extent) this.map.getView().fit(extent, { duration: 500 });
    }
    return layer
  }

  /**
   * 根据数据数组更新某个面颜色
   * @param layerName 图层名称
   * @param colorObj 数据
   *   colorObj:{
   *     对应geojson文件中的索引字段[propName]: 'rgba(255, 0, 0, 0.6)', // 颜色
   *     ...
   *   }
   * @param options 配置项
   */
  updateFeatureColors(layerName: string, colorObj: {
    [propName: string]: string
  }, options: OptionsType) {
    const layer = this.map.getLayers().getArray().find(layer => layer.get('name') === layerName);
    if (layer instanceof VectorLayer) {
      const source = layer.getSource();
      const features = source.getFeatures();
      features.forEach((feature: Feature) => {
        if (options.nameKey) {
          const name = feature['values_'][options.nameKey];
          const newColor = colorObj[name];
          if (newColor) {
            feature.setStyle(new Style({
              stroke: new Stroke({
                color: options.strokeColor ?? '#EBEEF5',
                width: options.strokeWidth ?? 3
              }),
              fill: new Fill({ color: newColor }),
              text: new Text({
                text: options.textVisible === false ? "" : name,
                font: options.textFont ?? '14px Calibri,sans-serif',
                fill: new Fill({ color: options.textFillColor || '#FFF' }),
                stroke: new Stroke({
                  color: options.textStrokeColor ?? '#409EFF',
                  width: options.textStrokeWidth ?? 2
                })
              })
            }))
          }
        }
      });
    }
  }


  /**
   * 设置外围蒙版图层
   *
   * 详细文档参考 https_blog.csdn.net/?url=https%3A%2F%2Fblog.csdn.net%2Fu012413551%2Farticle%2Fdetails%2F122739501
   *
   * @param data
   * @param options
   */
  setOutLayer(data: MapJSONData, options?: {
    extent?: any,
    fillColor?: string,
    strokeWidth?: number,
    strokeColor?: string
  }) {
    /** geom转坐标数组 **/
    function getCoordsGroup(geom: any) {
      let group: any[] = [] //
      const geomType = geom.getType()
      if (geomType === 'LineString') {
        group.push(geom.getCoordinates())
      } else if (geomType === 'MultiLineString') {
        group = geom.getCoordinates()
      } else if (geomType === 'Polygon') {
        group = geom.getCoordinates()
      } else if (geomType === 'MultiPolygon') {
        geom.getPolygons().forEach((poly: any) => {
          const coords = poly.getCoordinates()
          group = group.concat(coords)
        })
      } else {
        console.log('暂时不支持的类型')
      }
      return group
    }

    /** 擦除操作 **/
    function erase(geom: any, view: any) {
      const part = getCoordsGroup(geom)
      if (!part) {
        return
      }
      const extent = view.getProjection().getExtent()
      const polygonRing = fromExtent(extent);
      part.forEach((item) => {
        const linearRing = new LinearRing(item);
        polygonRing.appendLinearRing(linearRing);
      })
      return polygonRing
    }

    /** 添加遮罩 **/
    function createShade(geom: any, view: any) {
      if (geom instanceof Geometry) {
        const source = geom.clone()
        const polygon = erase(source, view)
        const feature = new Feature({
          geometry: polygon
        })
        return {
          feature,
          shade: source
        }
      }
    }

    // 遮罩样式
    const shadeStyle = new Style({
      fill: new Fill({
        color: options?.fillColor ?? 'rgba(0,27,59,0.8)'
      }),
      stroke: new Stroke({
        width: options?.strokeWidth ?? 1,
        color: options?.strokeColor ?? 'rgba(0,27,59,0.8)'
      })
    })

    // 遮罩数据源
    const vtSource = new VectorSource()
    // 遮罩图层
    const vtLayer = new VectorLayer({
      source: vtSource,
      style: shadeStyle,
      zIndex: 99
    })

    this.map.addLayer(vtLayer)


    const features = new GeoJSON().readFeatures(data)
    const ft = features[0]
    const bound = ft.getGeometry()
    const result = createShade(bound, this.map.getView())
    if (result) {
      vtSource.addFeature(result.feature)
      if (options?.extent) this.map.getView().fit(<any>result.shade)
    }

  }

  /**
   * 添加图片图层
   * @param layerName 图层名称
   * @param img 图片地址
   * @param extent 图片范围（对角线坐标） [minx, miny, maxx, maxy]
   * @param options 图层配置
   */
  addImgLayer(layerName: string, img: string | undefined, extent: number[], options: OptionsType = { zIndex: 3 }) {
    if (img && extent) {
      const source = new ImageStatic({
        url: img,
        imageExtent: extent
      })
      if (this[layerName]) {
        this[layerName].setSource(source)
      } else {
        let imageLayer = new ImageLayer()
        imageLayer.set('name', layerName)
        imageLayer.set('layerName', layerName)
        imageLayer.setSource(source)
        imageLayer.setZIndex(options.zIndex ?? 3)
        imageLayer.setOpacity(options.opacity ?? 1)
        if (options.visible !== undefined) imageLayer.setVisible(options.visible)
        if (options.mapClip && options.mapClipData) {
          imageLayer = MapTools.setMapClip(imageLayer, options.mapClipData)
        }
        this.map.addLayer(imageLayer)
        this[layerName] = imageLayer
      }
    } else {
      this.removePolygonLayer(layerName)
    }

    return this[layerName]
  }

  removePolygonLayer(layerName: string) {
    new MapTools(this.map).removeLayer(layerName)
    this[layerName] = null
  }
}