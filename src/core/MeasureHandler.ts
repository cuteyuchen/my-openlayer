import Draw from 'ol/interaction/Draw.js';
import Overlay from 'ol/Overlay.js';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style.js';
import { LineString, Polygon } from 'ol/geom.js';
import { Vector as VectorSource } from 'ol/source.js';
import { Vector as VectorLayer } from 'ol/layer.js';
import { getArea, getLength } from 'ol/sphere.js';
import { unByKey } from 'ol/Observable.js';
import Map from "ol/Map";
import { MeasureHandlerType } from "../types";
import { ValidationUtils } from '../utils/ValidationUtils';
import { ErrorHandler } from '../utils/ErrorHandler';

import { Feature } from 'ol';

/**
 * 测量工具处理类
 * 提供距离和面积测量功能
 */
export default class MeasureHandler {
  private readonly source: VectorSource;
  private readonly vector: VectorLayer<VectorSource>;
  private sketch: Feature | null;
  private helpTooltipElement: HTMLElement | null;
  private helpTooltip: Overlay | null;
  private readonly _map: Map;
  private measureTooltipElement: HTMLDivElement | null;
  private measureTooltip: Overlay | null;
  private readonly continuePolygonMsg: string;
  private readonly continueLineMsg: string;
  private _tipsCollection: Overlay[];
  private _mouseListener: (evt: any) => void;
  private _draw: Draw | null = null;

  /**
   * 构造函数
   * @param map OpenLayers地图实例
   * @throws 当地图实例无效时抛出错误
   */
  constructor(map: Map) {
    ValidationUtils.validateMap(map);
    this.initStyles();
    
    this._map = map;
    this.source = new VectorSource();
    this.vector = new VectorLayer({
      source: this.source,
      style: new Style({
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.2)',
        }),
        stroke: new Stroke({
          color: 'rgba(0, 255, 0, 0.8)',
          lineDash: [10, 10],
          width: 2,
        }),
        image: new CircleStyle({
          radius: 5,
          stroke: new Stroke({
            color: 'rgba(0, 255, 0, 0.8)'
          }),
          fill: new Fill({
            color: 'rgba(255, 255, 255, 0.2)',
          }),
        }),
      }),
      zIndex: 999,
    });

    /**
     * Currently drawn feature.
     * @type {import("ol/Feature.js").default}
     */
    this.sketch = null;

    /**
     * The help tooltip element.
     * @type {HTMLElement}
     */
    this.helpTooltipElement = null;

    /**
     * Overlay to show the help messages.
     * @type {Overlay}
     */
    this.helpTooltip = null;

    /**
     * The measure tooltip element.
     * @type {HTMLElement}
     */
    this.measureTooltipElement = null;

    /**
     * Overlay to show the measurement.
     * @type {Overlay}
     */
    this.measureTooltip = null;

    /**
     * Message to show when the user is drawing a polygon.
     * @type {string}
     */
    this.continuePolygonMsg = '双击结束绘制';

    /**
     * Message to show when the user is drawing a line.
     * @type {string}
     */
    this.continueLineMsg = '双击结束绘制';

    /**
     * contain the the overlays of tips
     * @type {Array}
     */
    this._tipsCollection = [];

    /**
     *
     * @param evt
     * @private
     */
    this._mouseListener = (evt) => {
      if (evt.dragging) {
        return;
      }
      /** @type {string} */
      let helpMsg = '单击开始绘制';

      if (this.sketch) {
        const geom = this.sketch.getGeometry();
        if (geom instanceof Polygon) {
          helpMsg = this.continuePolygonMsg;
        } else if (geom instanceof LineString) {
          helpMsg = this.continueLineMsg;
        }
      }
      if (this.helpTooltipElement) {
        this.helpTooltipElement.innerHTML = helpMsg;
      }
      this.helpTooltip?.setPosition(evt.coordinate);
      this._map?.addLayer(this.vector);
    }
  }


  /**
   * destory the object
   */
  destory() {
    this.clean();
    this._map?.removeLayer(this.vector);
  }


  /**
   * Format length output.
   * @param {LineString} line The line.
   * @return {string} The formatted length.
   */
  formatLength(line: any) {
    const length = getLength(line, {
      projection: "EPSG:4326"
    });
    let output;
    if (length > 100) {
      output = Math.round((length / 1000) * 100) / 100 + ' ' + 'km';
    } else {
      output = Math.round(length * 100) / 100 + ' ' + 'm';
    }
    return output;
  }

  /**
   * Format area output.
   * @param {Polygon} polygon The polygon.
   * @return {string} Formatted area.
   */
  formatArea(polygon: any) {
    const area = getArea(polygon, {
      projection: "EPSG:4326"
    });
    let output;
    if (area > 10000) {
      output = Math.round((area / 1000000) * 100) / 100 + ' ' + 'km<sup>2</sup>';
    } else {
      output = Math.round(area * 100) / 100 + ' ' + 'm<sup>2</sup>';
    }
    return output;
  }


  /**
   * 开始测量
   * @param type 测量类型
   * @throws 当测量类型无效时抛出错误
   */
  start(type: MeasureHandlerType): void {
    ValidationUtils.validateMeasureType(type);
    ValidationUtils.validateMap(this._map);
    
    try {
      this.createMeasureTooltip();
      this.createHelpTooltip();
      if (this._draw) {
        this._map.removeInteraction(this._draw);
      }
    } catch (error) {
      ErrorHandler.getInstance().error('Error starting measurement:', error);
      throw new Error('Failed to start measurement');
    }
    this._draw = new Draw({
      source: this.source,
      type: type,
      style: (feature) => {
        const geometryType = feature.getGeometry()?.getType();
        if (geometryType === type || geometryType === 'Point') {
          return new Style({
            fill: new Fill({
              color: 'rgba(220, 255, 255, 0.2)',
            }),
            stroke: new Stroke({
              color: 'rgba(255, 0, 0, 0.7)',
              lineDash: [10, 10],
              width: 2,
            }),
            image: new CircleStyle({
              radius: 5,
              stroke: new Stroke({
                color: 'rgba(255, 0, 0, 0.7)',
              }),
              fill: new Fill({
                color: 'rgba(255, 255, 255, 0.2)',
              }),
            }),
          });
        }
      },
    });
    this._map.addInteraction(this._draw);
    let listener: any;
    this._draw.on('drawstart', (evt:any) => {
      // set sketch
      this.sketch = evt.feature;

      /** @type {import("ol/coordinate.js").Coordinate|undefined} */
      let tooltipCoord = evt?.coordinate;

      const geometry = this.sketch?.getGeometry();
        if (geometry) {
          listener = geometry.on('change', (evt:any) => {
            const geom = evt.target;
            let output;
            if (geom instanceof Polygon) {
              output = this.formatArea(geom);
              tooltipCoord = geom.getInteriorPoint().getCoordinates();
            } else if (geom instanceof LineString) {
              output = this.formatLength(geom);
              tooltipCoord = geom.getLastCoordinate();
            }
            if (this.measureTooltipElement) {
              this.measureTooltipElement.innerHTML = output as string;
            }
            this.measureTooltip?.setPosition(tooltipCoord);
          });
        }
    });

    this._draw.on('drawend', () => {
      if (this.measureTooltipElement) {
        this.measureTooltipElement.className = 'ol-tooltip ol-tooltip-static';
      }
      this.measureTooltip?.setOffset([0, -7]);
      // unset sketch
      this.sketch = null;
      // unset tooltip so that a new one can be created
      this.measureTooltipElement = null;
      this.createMeasureTooltip();
      unByKey(listener);
    });
    this._map.on('pointermove', this._mouseListener);
  }


  /**
   * end the measure drawing
   */
  end() {
    if (this._draw) {
      this._map?.removeInteraction(this._draw);
    }
    if (this.helpTooltipElement) {
      this.helpTooltipElement.parentNode?.removeChild(this.helpTooltipElement);
      this.helpTooltipElement = null;
    }

    if (this.measureTooltipElement) {
      this.measureTooltipElement.parentNode?.removeChild(this.measureTooltipElement);
      this.measureTooltipElement = null;
    }
    this._map?.un("pointermove", this._mouseListener);
  }

  /**
   * Creates a new help tooltip
   */
  createHelpTooltip() {
    if (this.helpTooltipElement) {
      this.helpTooltipElement.parentNode?.removeChild(this.helpTooltipElement);
    }
    this.helpTooltipElement = document.createElement('div');
    this.helpTooltipElement.className = 'ol-tooltip';
    this.helpTooltip = new Overlay({
      element: this.helpTooltipElement,
      offset: [15, 0],
      positioning: 'center-left',
    });
    this._map?.addOverlay(this.helpTooltip);
    this._tipsCollection.push(this.helpTooltip);
  }

  /**
   * Creates a new measure tooltip
   */
  createMeasureTooltip() {
    if (this.measureTooltipElement) {
      this.measureTooltipElement.parentNode?.removeChild(this.measureTooltipElement);
    }
    this.measureTooltipElement = document.createElement('div');
    this.measureTooltipElement.className = 'ol-tooltip ol-tooltip-measure';
    this.measureTooltip = new Overlay({
      element: this.measureTooltipElement,
      offset: [0, -15],
      positioning: 'bottom-center',
      stopEvent: false,
      insertFirst: false,
    });
    this._tipsCollection.push(this.measureTooltip);
    this._map?.addOverlay(this.measureTooltip);
  }


  /**
   * clean the all result of measure
   */
  clean() {
    this._tipsCollection.forEach((item) => {
      this._map?.removeOverlay(item);
    });
    this.source.clear(true);
    if (this._draw) {
      this._map?.removeInteraction(this._draw);
    }
    this._tipsCollection = [];
  }

  /**
   * 初始化样式
   * @private
   */
  private initStyles() {
    const styleId = 'ol-measure-tooltip-styles';
    if (document.getElementById(styleId)) {
      return;
    }
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      .ol-tooltip {
        position: relative;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 4px;
        color: white;
        padding: 4px 8px;
        opacity: 0.7;
        white-space: nowrap;
        font-size: 12px;
        cursor: default;
        user-select: none;
        border: 1px solid #cccccc;
        text-shadow: 1px 1px 2px #000;
      }
      .ol-tooltip-measure {
        opacity: 1;
        font-weight: bold;
      }
      .ol-tooltip-static {
        background-color: #ffcc33;
        color: black;
        border: 1px solid white;
        text-shadow: none;
      }
      .ol-tooltip-measure:before,
      .ol-tooltip-static:before {
        border-top: 6px solid rgba(0, 0, 0, 0.5);
        border-right: 6px solid transparent;
        border-left: 6px solid transparent;
        content: "";
        position: absolute;
        bottom: -6px;
        margin-left: -7px;
        left: 50%;
      }
      .ol-tooltip-static:before {
        border-top-color: #ffcc33;
      }
    `;
    document.head.appendChild(style);
  }
}
