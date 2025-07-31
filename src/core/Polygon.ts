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
import {
  PolygonOptions,
  MapJSONData,
  PointData,
  HeatMapOptions,
  ImageLayerData,
  MaskLayerOptions,
  ColorMap,
  FeatureColorUpdateOptions
} from '../types'
import MapTools from "./MapTools";
import { ValidationUtils } from '../utils/ValidationUtils';

/**
 * Polygon 类用于处理地图上的面要素操作
 * 包括添加多边形、边框、图片图层、热力图等功能
 */
export default class Polygon {
  private map: Map;
  private colorMap: ColorMap = {
    '0': 'rgba(255, 0, 0, 0.6)',
    '1': 'rgba(245, 154, 35, 0.6)',
    '2': 'rgba(255, 238, 0, 0.6)',
    '3': 'rgba(1, 111, 255, 0.6)'
  };

  [key: string]: any;

  /**
   * 构造函数
   * @param map OpenLayers 地图实例
   */
  constructor(map: Map) {
    if (!map) {
      throw new Error('Map instance is required');
    }
    this.map = map;
  }

  /**
   * 获取等级颜色
   * @param lev 等级值，支持字符串或数字
   * @returns 对应等级的颜色值，如果等级不存在则返回默认颜色
   */
  getLevColor(lev: string | number): string {
    const key = lev.toString();
    return this.colorMap[key] || 'rgba(128, 128, 128, 0.6)';
  }


  /**
   * 添加地图边框图层
   * @param data 图层数据，必须是有效的 GeoJSON 格式
   * @param options 图层配置选项
   * @returns 创建的图层实例
   * @throws 当数据格式无效时抛出错误
   */
  addBorderPolygon(data: MapJSONData, options?: PolygonOptions): VectorLayer<VectorSource> {
    ValidationUtils.validateGeoJSONData(data);

    const mergedOptions: PolygonOptions = {
      layerName: 'border',
      fillColor: 'rgba(255, 255, 255, 0)',
      ...options
    };

    const layer = this.addPolygon(data, mergedOptions);

    if (mergedOptions.mask) {
      this.setOutLayer(data);
    }

    return layer;
  }


  /**
   * 添加多边形图层
   * @param dataJSON GeoJSON 数据
   * @param options 图层配置选项
   * @returns 创建的矢量图层
   * @throws 当数据格式无效时抛出错误
   */
  addPolygon(dataJSON: MapJSONData, options?: PolygonOptions): VectorLayer<VectorSource> {
    ValidationUtils.validateGeoJSONData(dataJSON);

    const mergedOptions: PolygonOptions = {
      zIndex: 11,
      visible: true,
      strokeColor: '#EBEEF5',
      strokeWidth: 2,
      fillColor: 'rgba(255, 255, 255, 0)',
      textFont: '14px Calibri,sans-serif',
      textFillColor: '#FFF',
      textStrokeColor: '#409EFF',
      textStrokeWidth: 2,
      ...options
    };

    // 如果指定了图层名称，先移除同名图层
    if (mergedOptions.layerName) {
      new MapTools(this.map).removeLayer(mergedOptions.layerName);
    }

    let features: Feature[];
    try {
      features = new GeoJSON().readFeatures(dataJSON, mergedOptions.projectionOptOptions ?? {});
    } catch (error) {
      throw new Error(`Failed to parse GeoJSON data: ${error}`);
    }

    const layer = new VectorLayer({
      properties: {
        name: mergedOptions.layerName,
        layerName: mergedOptions.layerName
      },
      source: new VectorSource({ features }),
      zIndex: mergedOptions.zIndex
    });

    // 设置要素样式
    this.setFeatureStyles(features, mergedOptions);

    layer.setVisible(mergedOptions.visible!);
    this.map.addLayer(layer);

    // 如果需要适应视图
    if (mergedOptions.fitView) {
      this.fitViewToLayer(layer);
    }

    return layer;
  }

  /**
   * 设置要素样式
   * @param features 要素数组
   * @param options 样式配置选项
   */
  private setFeatureStyles(features: Feature[], options: PolygonOptions): void {
    features.forEach(feature => {
      feature.set('type', options.type || options.layerName);
      feature.set('layerName', options.type || options.layerName);

      const fillColor = options.fillColorCallBack
        ? options.fillColorCallBack(feature)
        : options.fillColor;

      const featureStyle = new Style({
        stroke: new Stroke({
          color: options.strokeColor!,
          width: options.strokeWidth!,
          lineDash: options.lineDash,
          lineDashOffset: options.lineDashOffset
        }),
        fill: new Fill({ color: fillColor! })
      });

      // 添加文本样式
      if (options.textVisible) {
        const text = this.getFeatureText(feature, options);
        if (text) {
          featureStyle.setText(new Text({
            text,
            font: options.textFont!,
            fill: new Fill({ color: options.textFillColor! }),
            stroke: new Stroke({
              color: options.textStrokeColor!,
              width: options.textStrokeWidth!
            })
          }));
        }
      }

      feature.setStyle(featureStyle);
    });
  }

  /**
   * 获取要素文本
   * @param feature 要素对象
   * @param options 配置选项
   * @returns 文本内容
   */
  private getFeatureText(feature: Feature, options: PolygonOptions): string {
    if (options.textCallBack) {
      return options.textCallBack(feature) || '';
    }
    if (options.nameKey) {
      return feature.get(options.nameKey) || '';
    }
    return '';
  }

  /**
   * 适应图层视图
   * @param layer 图层对象
   */
  private fitViewToLayer(layer: VectorLayer<VectorSource>): void {
    const extent = layer.getSource()?.getExtent();
    if (extent) {
      this.map.getView().fit(extent, { duration: 500 });
    }
  }

  /**
   * 根据数据数组更新某个面颜色
   * @param layerName 图层名称
   * @param colorObj 颜色映射对象，键为要素属性值，值为颜色字符串
   * @param options 配置项
   * @throws 当图层不存在时抛出错误
   */
  updateFeatureColor(
    layerName: string,
    colorObj?: { [propName: string]: string },
    options?: FeatureColorUpdateOptions
  ): void {
    ValidationUtils.validateLayerName(layerName);

    const layers = MapTools.getLayerByLayerName(this.map, layerName);
    if (layers.length === 0) {
      throw new Error(`Layer with name '${layerName}' not found`);
    }

    const layer = layers[0];
    if (!(layer instanceof VectorLayer)) {
      throw new Error(`Layer '${layerName}' is not a vector layer`);
    }

    const mergedOptions: FeatureColorUpdateOptions = {
      strokeColor: '#EBEEF5',
      strokeWidth: 2,
      fillColor: 'rgba(255, 255, 255, 0.3)',
      textFont: '14px Calibri,sans-serif',
      textFillColor: '#FFF',
      textStrokeColor: '#409EFF',
      textStrokeWidth: 2,
      ...options
    };

    const features = layer.getSource()?.getFeatures();
    if (!features) {
      console.warn(`No features found in layer '${layerName}'`);
      return;
    }

    features.forEach((feature: Feature) => {
      this.updateSingleFeatureColor(feature, colorObj, mergedOptions);
    });
  }

  /**
   * 更新单个要素的颜色
   * @param feature 要素对象
   * @param colorObj 颜色映射对象
   * @param options 配置选项
   */
  private updateSingleFeatureColor(
    feature: Feature,
    colorObj?: { [propName: string]: string },
    options?: FeatureColorUpdateOptions
  ): void {
    const name = options?.nameKey ? feature.get(options.nameKey) : '';
    const newColor = colorObj?.[name] || options?.fillColor;

    const featureStyle = new Style({
      stroke: new Stroke({
        color: options?.strokeColor!,
        width: options?.strokeWidth!
      }),
      fill: new Fill({ color: newColor! })
    });

    // 添加文本样式
    if (options?.textVisible) {
      const text = this.getFeatureText(feature, options);
      if (text) {
        featureStyle.setText(new Text({
          text,
          font: options.textFont!,
          fill: new Fill({ color: options.textFillColor! }),
          stroke: new Stroke({
            color: options.textStrokeColor!,
            width: options.textStrokeWidth!
          })
        }));
      }
    }

    feature.setStyle(featureStyle);
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
   * @param imageData 图片数据，包含url和extent
   * @param options 配置项
   * @returns 创建的图片图层
   * @throws 当数据格式无效时抛出错误
   */
  addImageLayer(imageData: ImageLayerData, options?: PolygonOptions): ImageLayer<any> {
    // 检查是否允许空img（当存在layerName且存在同名图层时）
    const allowEmptyImg = !imageData.img && !!options?.layerName;
    ValidationUtils.validateImageData(imageData, allowEmptyImg);

    const mergedOptions: PolygonOptions = {
      opacity: 1,
      visible: true,
      zIndex: 11,
      layerName: 'imageLayer',
      ...options
    };

    // 尝试更新现有图层
    if (mergedOptions.layerName) {
      const existingLayer = this.tryUpdateExistingImageLayer(imageData, mergedOptions);
      if (existingLayer) {
        return existingLayer;
      }
    }

    // 创建新图层
    return this.createNewImageLayer(imageData, mergedOptions);
  }

  /**
   * 尝试更新现有图层
   * @private
   */
  private tryUpdateExistingImageLayer(imageData: ImageLayerData, options: PolygonOptions): ImageLayer<any> | null {
    const existingLayers = MapTools.getLayerByLayerName(this.map, options.layerName!);
    if (existingLayers.length === 0) {
      return null;
    }

    const existingLayer = existingLayers[0] as ImageLayer<any>;

    // 如果没有extent，直接设置source为undefined
    if (!imageData.extent) {
      existingLayer.setSource(undefined);
    } else {
      // 创建新的source
      const url = imageData.img || (existingLayer.getSource() as ImageStatic)?.getUrl() || '';
      const newSource = new ImageStatic({
        url,
        imageExtent: imageData.extent
      });
      existingLayer.setSource(newSource);
    }

    // 更新图层属性
    this.updateImageLayerProperties(existingLayer, options);

    return existingLayer;
  }

  /**
   * 创建新的图像图层
   * @private
   */
  private createNewImageLayer(imageData: ImageLayerData, options: PolygonOptions): ImageLayer<any> {
    let source: ImageStatic | undefined = undefined;

    // 只有当extent存在时才创建ImageStatic source
    if (imageData.extent) {
      source = new ImageStatic({
        url: imageData.img || '',
        imageExtent: imageData.extent
      });
    }

    const imageLayer = new ImageLayer({
      source,
      opacity: options.opacity!,
      visible: options.visible!
    });

    this.configureImageLayer(imageLayer, options);
    return this.addImageLayerToMap(imageLayer, options);
  }

  /**
   * 更新图层属性
   * @private
   */
  private updateImageLayerProperties(layer: ImageLayer<any>, options: PolygonOptions): void {
    if (options.opacity !== undefined) {
      layer.setOpacity(options.opacity);
    }
    if (options.visible !== undefined) {
      layer.setVisible(options.visible);
    }
    if (options.zIndex !== undefined) {
      layer.setZIndex(options.zIndex);
    }
  }

  /**
   * 配置图层基本属性
   * @private
   */
  private configureImageLayer(layer: ImageLayer<any>, options: PolygonOptions): void {
    layer.set('name', options.layerName);
    layer.set('layerName', options.layerName);
    layer.setZIndex(options.zIndex!);
  }

  /**
   * 添加图层到地图并应用裁剪
   * @private
   */
  private addImageLayerToMap(layer: ImageLayer<any>, options: PolygonOptions): ImageLayer<any> {
    if (options.mapClip && options.mapClipData) {
      const clippedLayer = MapTools.setMapClip(layer, options.mapClipData);
      this.map.addLayer(clippedLayer);
      return clippedLayer;
    }

    this.map.addLayer(layer);
    return layer;
  }

  /**
   * 添加热力图图层
   * @param pointData 点数据数组
   * @param options 热力图配置
   */
  addHeatmap(pointData: PointData[], options?: HeatMapOptions) {
    // 只有在指定layerName时才移除已存在的同名图层
    if (options?.layerName) {
      new MapTools(this.map).removeLayer(options.layerName)
    }

    const heatmapLayer = new Heatmap({
      source: new VectorSource(),
      weight: function (fea: Feature) {
        return fea.get('weight');
      },
      blur: options?.blur ?? 15,
      radius: options?.radius ?? 10,
      zIndex: options?.zIndex ?? 11,
      opacity: options?.opacity ?? 1,
    });

    // 只有在指定layerName时才设置layerName
    if (options?.layerName) {
      heatmapLayer.set('layerName', options.layerName)
    }

    this.map.addLayer(heatmapLayer);

    const valueKey = options?.valueKey || 'value'
    const max = Math.max(...pointData.map(item => item[valueKey]))
    pointData.forEach((item) => {
      heatmapLayer?.getSource()!.addFeature(
        new Feature({
          geometry: new Point([item.lgtd, item.lttd]),
          weight: item[valueKey] / max//热力值范围是【0,1】；热力值计算 = 找出数据集中的最大值，然后用值除以最大值
        })
      );
    })

    return heatmapLayer
  }

  /**
   * 添加遮罩图层
   * @param data GeoJSON格式的遮罩数据
   * @param options 配置项
   * @returns 创建的遮罩图层
   * @throws 当数据格式无效时抛出错误
   */
  addMaskLayer(data: any, options?: MaskLayerOptions): VectorLayer<VectorSource> {
    ValidationUtils.validateMaskData(data);

    const mergedOptions: MaskLayerOptions = {
      fillColor: 'rgba(0, 0, 0, 0.5)',
      opacity: 1,
      visible: true,
      layerName: 'maskLayer',
      ...options
    };

    let features: Feature[];
    try {
      features = new GeoJSON().readFeatures(data);
    } catch (error) {
      throw new Error(`Invalid GeoJSON data: ${error}`);
    }

    if (!features || features.length === 0) {
      console.warn('No features found in mask data');
    }

    const maskLayer = new VectorLayer({
      source: new VectorSource({ features }),
      style: new Style({
        fill: new Fill({
          color: mergedOptions.fillColor!
        }),
        stroke: mergedOptions.strokeColor ? new Stroke({
          color: mergedOptions.strokeColor,
          width: mergedOptions.strokeWidth || 1
        }) : undefined
      }),
      opacity: mergedOptions.opacity!,
      visible: mergedOptions.visible!
    });

    maskLayer.set('layerName', mergedOptions.layerName);
    this.map.addLayer(maskLayer);

    return maskLayer;
  }

  removePolygonLayer(layerName: string) {
    new MapTools(this.map).removeLayer(layerName)
    this[layerName] = null
  }
}
