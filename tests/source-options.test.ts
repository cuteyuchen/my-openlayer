// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import BaseLayer from 'ol/layer/Base';
import ImageStatic from 'ol/source/ImageStatic';
import TileWMS from 'ol/source/TileWMS';
import { MapBaseLayers } from '../src/core/map';
import { Polygon } from '../src/core/polygon';

function createMapStub() {
  const layers: BaseLayer[] = [];
  return {
    layers,
    addLayer: vi.fn((layer: BaseLayer) => { layers.push(layer); }),
    removeLayer: vi.fn((layer: BaseLayer) => {
      const index = layers.indexOf(layer);
      if (index >= 0) layers.splice(index, 1);
    }),
    getLayers: vi.fn(() => ({ getArray: () => layers }))
  } as any;
}

describe('source 配置透传', () => {
  it('ImageStatic 首次创建时透传 projection 和 interpolate', () => {
    const map = createMapStub();
    const polygon = new Polygon(map);
    const handle = polygon.addImageLayer({
      img: '/inundation.png',
      extent: [117.560633, 28.02882, 120.738828, 30.591628],
      projection: 'EPSG:4326',
      interpolate: false
    }, {
      layerName: 'inundation-layer'
    });

    const source = handle.layer.getSource() as ImageStatic;
    expect(source.getProjection()?.getCode()).toBe('EPSG:4326');
    expect(source.getInterpolate()).toBe(false);
  });

  it('ImageStatic 未传 projection 和 interpolate 时保持 OpenLayers 默认行为', () => {
    const map = createMapStub();
    const polygon = new Polygon(map);
    const handle = polygon.addImageLayer({
      img: '/default.png',
      extent: [120, 30, 121, 31]
    }, {
      layerName: 'default-image-layer'
    });

    const source = handle.layer.getSource() as ImageStatic;
    expect(source.getProjection()).toBeUndefined();
    expect(source.getInterpolate()).toBe(true);
  });

  it('同名图片图层更新 source 时保留 URL 并应用 source 与图层配置', () => {
    const map = createMapStub();
    const polygon = new Polygon(map);
    const initialHandle = polygon.addImageLayer({
      img: '/original.png',
      extent: [120, 30, 121, 31]
    }, {
      layerName: 'reused-image-layer',
      opacity: 0.3,
      visible: false,
      zIndex: 4
    });

    const updatedHandle = polygon.addImageLayer({
      extent: [117.560633, 28.02882, 120.738828, 30.591628],
      projection: 'EPSG:4326',
      interpolate: false
    }, {
      layerName: 'reused-image-layer',
      opacity: 0.6,
      visible: true,
      zIndex: 25
    });

    const source = updatedHandle.layer.getSource() as ImageStatic;
    expect(updatedHandle.layer).toBe(initialHandle.layer);
    expect(source.getUrl()).toBe('/original.png');
    expect(source.getImageExtent()).toEqual([117.560633, 28.02882, 120.738828, 30.591628]);
    expect(source.getProjection()?.getCode()).toBe('EPSG:4326');
    expect(source.getInterpolate()).toBe(false);
    expect(updatedHandle.layer.getOpacity()).toBe(0.6);
    expect(updatedHandle.layer.getVisible()).toBe(true);
    expect(updatedHandle.layer.getZIndex()).toBe(25);
    expect(typeof updatedHandle.remove).toBe('function');
    expect(typeof updatedHandle.setVisible).toBe('function');
  });

  it('GeoServer TileWMS 透传 projection、interpolate 和 serverType', () => {
    const map = createMapStub();
    const baseLayers = new MapBaseLayers(map, {});
    const layer = baseLayers.addGeoServerLayer('/geoserver/wms', 'workspace:layer', {
      projection: 'EPSG:4326',
      interpolate: false,
      serverType: 'mapserver'
    });

    const source = layer.getSource() as TileWMS;
    expect(source).toBeInstanceOf(TileWMS);
    expect(source.getProjection()?.getCode()).toBe('EPSG:4326');
    expect(source.getInterpolate()).toBe(false);
    // OpenLayers 未提供 serverType getter，通过实例内部值验证构造参数已透传。
    expect((source as any).serverType_).toBe('mapserver');
  });

  it('GeoServer TileWMS 未传新增配置时保持旧默认', () => {
    const map = createMapStub();
    const baseLayers = new MapBaseLayers(map, {});
    const layer = baseLayers.addGeoServerLayer('/geoserver/wms', 'workspace:layer');

    const source = layer.getSource() as TileWMS;
    expect(source.getProjection()).toBeUndefined();
    expect(source.getInterpolate()).toBe(true);
    expect((source as any).serverType_).toBe('geoserver');
  });
});
