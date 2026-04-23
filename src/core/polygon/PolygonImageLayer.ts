import ImageStatic from "ol/source/ImageStatic";
import Map from "ol/Map";
import { Image as ImageLayer } from "ol/layer";
import type { ImageLayerData, PolygonOptions } from "../../types";
import ValidationUtils from "../../utils/ValidationUtils";
import { ConfigManager, MapTools } from "../map";

/**
 * 面图片图层辅助类。
 */
export default class PolygonImageLayer {
  static addImageLayer(map: Map, imageData: ImageLayerData, options?: PolygonOptions): ImageLayer<any> {
    const allowEmptyImg = !imageData.img && !!options?.layerName;
    ValidationUtils.validateImageData(imageData, allowEmptyImg);
    const mergedOptions: PolygonOptions = {
      ...ConfigManager.DEFAULT_IMAGE_OPTIONS,
      ...options
    };

    if (mergedOptions.layerName) {
      const existingLayers = MapTools.getLayerByLayerName(map, mergedOptions.layerName);
      if (existingLayers.length > 0) {
        const existingLayer = existingLayers[0] as ImageLayer<any>;
        if (!imageData.extent) {
          existingLayer.setSource(undefined);
        } else {
          const url = imageData.img || (existingLayer.getSource() as ImageStatic)?.getUrl() || '';
          existingLayer.setSource(new ImageStatic({
            url,
            imageExtent: imageData.extent
          }));
        }
        if (mergedOptions.opacity !== undefined) existingLayer.setOpacity(mergedOptions.opacity);
        if (mergedOptions.visible !== undefined) existingLayer.setVisible(mergedOptions.visible);
        if (mergedOptions.zIndex !== undefined) existingLayer.setZIndex(mergedOptions.zIndex);
        return existingLayer;
      }
    }

    const source = imageData.extent
      ? new ImageStatic({
          url: imageData.img || '',
          imageExtent: imageData.extent
        })
      : undefined;

    const imageLayer = new ImageLayer({
      source,
      opacity: mergedOptions.opacity!,
      visible: mergedOptions.visible!
    });
    imageLayer.set('name', mergedOptions.layerName);
    imageLayer.set('layerName', mergedOptions.layerName);
    imageLayer.setZIndex(mergedOptions.zIndex!);

    if (mergedOptions.mapClip && mergedOptions.mapClipData) {
      const clippedLayer = MapTools.setMapClip(imageLayer, mergedOptions.mapClipData);
      map.addLayer(clippedLayer);
      return clippedLayer as ImageLayer<any>;
    }

    map.addLayer(imageLayer);
    return imageLayer;
  }
}
