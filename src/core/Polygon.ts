"use strict";

import Map from "ol/Map";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Fill, Icon, Stroke, Style, Text } from "ol/style";
import { Tile as TileLayer, Image as ImageLayer, Heatmap } from "ol/layer";
import { Geometry, LinearRing, Point } from "ol/geom";
import { fromExtent } from "ol/geom/Polygon";
import Feature from "ol/Feature";
import ImageStatic from "ol/source/ImageStatic";
import { OptionsType, MapJSONData, PointData, HeatMapOptions } from '../types'
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
  addBorderPolygon(data: MapJSONData, options?: OptionsType) {
    options = options ?? {}
    options.type = options.type ?? 'border'
    options.fillColor = options.fillColor ?? 'rgba(255, 255, 255, 0)'
    this.addPolygon(data, options)
    if (options.mask) this.setOutLayer(data)
  }


  // 添加分区
  //fyBasinJson中的id的key需要跟options中的nameKey一致
  addPolygon(dataJSON: MapJSONData, options?: OptionsType) {
    options = options ?? {}
    if (options.type != null) {
      MapTools.removeLayer(this.map, options.type)
    }
    const layer = new VectorLayer({
      name: options.type,
      layerName: options.type,
      source: new VectorSource({
        features: (new GeoJSON()).readFeatures(dataJSON, options.projectionOptOptions ?? {})
      }),
      // style: function (feature: any) {
      //   feature.set('type', options?.type)
      //   feature.set('layerName', options?.type)
      //   return new Style({
      //     stroke: new Stroke({
      //       color: options?.strokeColor ?? '#EBEEF5',
      //       width: options?.strokeWidth ?? 2,
      //       lineDash: options?.lineDash,
      //       lineDashOffset: options?.lineDashOffset
      //     }),
      //     fill: new Fill({ color: options?.fillColor || 'rgba(255, 255, 255, 0.3)' }),
      //     text: new Text({
      //       text: options?.textVisible && options.nameKey ? feature.values_[options.nameKey] : "",
      //       font: options?.textFont ?? '14px Calibri,sans-serif',
      //       fill: new Fill({ color: options?.textFillColor ?? '#FFF' }),
      //       stroke: new Stroke({
      //         color: options?.textStrokeColor ?? '#409EFF',
      //         width: options?.textStrokeWidth ?? 2
      //       })
      //     })
      //   })
      // },
      zIndex: options.zIndex ?? 11
    } as any)
    const features = layer.getSource()?.getFeatures();
    features?.forEach(feature => {
      feature.set('type', options?.type)
      feature.set('layerName', options?.type)
      feature.setStyle(new Style({
        stroke: new Stroke({
          color: options?.strokeColor ?? '#EBEEF5',
          width: options?.strokeWidth ?? 2,
          lineDash: options?.lineDash,
          lineDashOffset: options?.lineDashOffset
        }),
        fill: new Fill({ color: options?.fillColor || 'rgba(255, 255, 255, 0.3)' }),
        text: new Text({
          text: options?.textVisible && options.nameKey ? feature.get(options.nameKey) : "",
          font: options?.textFont ?? '14px Calibri,sans-serif',
          fill: new Fill({ color: options?.textFillColor ?? '#FFF' }),
          stroke: new Stroke({
            color: options?.textStrokeColor ?? '#409EFF',
            width: options?.textStrokeWidth ?? 2
          })
        })
      }))
    })
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
   * @param colorObj 数据 不传或者传{}则重置所有颜色
   *   colorObj:{
   *     对应geojson文件中的索引字段[propName]: 'rgba(255, 0, 0, 0.6)', // 颜色
   *     ...
   *   }
   * @param options 配置项
   */
  updateFeatureColors(layerName: string, colorObj?: {
    [propName: string]: string
  }, options?: OptionsType) {
    const layer = MapTools.getLayerByLayerName(this.map, layerName)[0]
    if (layer instanceof VectorLayer) {
      const features = layer.getSource()?.getFeatures();
      features.forEach((feature: Feature) => {
        if (options?.nameKey || (!colorObj || Object.keys(colorObj).length === 0)) {
          const name = options?.nameKey ? feature.get(options.nameKey) : ''
          const newColor = colorObj?.[name];
          // const oldStyle = feature.getStyle()
          // console.log(oldStyle)
          // if (newColor) {
          feature.setStyle(new Style({
            stroke: new Stroke({
              color: options?.strokeColor ?? '#EBEEF5',
              width: options?.strokeWidth ?? 2
            }),
            fill: new Fill({ color: newColor || options?.fillColor || 'rgba(255, 255, 255, 0.3)' }),
            text: new Text({
              text: options?.textVisible === false ? "" : name,
              font: options?.textFont ?? '14px Calibri,sans-serif',
              fill: new Fill({ color: options?.textFillColor || '#FFF' }),
              stroke: new Stroke({
                color: options?.textStrokeColor ?? '#409EFF',
                width: options?.textStrokeWidth ?? 2
              })
            })
          }))
          // }
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
    strokeColor?: string,
    zIndex?: number
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
      zIndex: options?.zIndex ?? 12
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
  addImage(layerName: string, img?: string, extent?: number[], options?: OptionsType) {
    let imageLayer = MapTools.getLayerByLayerName(this.map, layerName)[0]
    if (img && extent) {
      const source = new ImageStatic({
        url: img,
        imageExtent: extent
      })
      if (imageLayer && imageLayer instanceof ImageLayer) {
        imageLayer.setSource(source)
      } else {
        imageLayer = new ImageLayer()
        imageLayer.set('name', layerName)
        imageLayer.set('layerName', layerName)
        if (imageLayer instanceof ImageLayer) imageLayer.setSource(source)
        imageLayer.setZIndex(options?.zIndex ?? 11)
        imageLayer.setOpacity(options?.opacity ?? 1)
        if (options?.visible !== undefined) imageLayer.setVisible(options?.visible)
        if (options?.mapClip && options?.mapClipData) {
          imageLayer = MapTools.setMapClip(imageLayer, options?.mapClipData)
        }
        this.map.addLayer(imageLayer)
      }
    } else {
      this.removePolygonLayer(layerName)
    }
    return imageLayer
  }

  addHeatmap(layerName: string, pointData: PointData[], options: HeatMapOptions) {
    const heatmapLayer = new Heatmap({
      source: new VectorSource(),
      weight: function (fea: Feature) {
        return fea.get('weight');
      },
      blur: options.blur ?? 15,
      radius: options.radius ?? 10,
      zIndex: options.zIndex ?? 11,
      opacity: options.opacity ?? 1,
    });
    heatmapLayer.set('layerName', layerName)
    this.map.addLayer(heatmapLayer);
    const max = Math.max(...pointData.map(item => item[options.valueKey]))
    pointData.forEach((item) => {
      heatmapLayer?.getSource()!.addFeature(
        new Feature({
          geometry: new Point([item.lgtd, item.lttd]),
          weight: item[options.valueKey] / max//热力值范围是【0,1】；热力值计算 = 找出数据集中的最大值，然后用值除以最大值
        })
      );
    })
  }

  removePolygonLayer(layerName: string) {
    MapTools.removeLayer(this.map, layerName)
    this[layerName] = null
  }
}
