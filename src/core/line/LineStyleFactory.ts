import Feature from 'ol/Feature';
import { LineString } from 'ol/geom';
import { Fill, Icon, RegularShape, Stroke, Style } from 'ol/style';
import { ConfigManager } from '../map';
import type { FeatureLike } from 'ol/Feature';
import type { FlowLineOptions, LineOptions } from '../../types';

/**
 * 线样式工厂
 * 负责静态线样式、流光虚线样式和 moving symbol 样式缓存。
 */
export default class LineStyleFactory {
  private readonly movingSymbolStyleCache = new globalThis.Map<string, Style>();
  private readonly baseLineStyle = new Style();
  private readonly emptyStyle = new Style();
  private readonly dashFallback = [12, 12];

  /**
   * 创建静态线样式解析函数。
   */
  createBaseLineStyleResolver(options: LineOptions) {
    return (feature: FeatureLike) => {
      if (feature instanceof Feature) {
        feature.set('type', options.type);
        feature.set('layerName', options.layerName);
      }

      if (options.style) {
        if (typeof options.style === 'function') {
          return options.style(feature);
        }
        return options.style;
      }

      this.baseLineStyle.setStroke(new Stroke({
        color: options.strokeColor ?? ConfigManager.DEFAULT_LINE_OPTIONS.strokeColor,
        width: options.strokeWidth ?? ConfigManager.DEFAULT_LINE_OPTIONS.strokeWidth,
        lineDash: options.lineDash,
        lineDashOffset: options.lineDashOffset
      }));
      return this.baseLineStyle;
    };
  }

  /**
   * 创建流动线基础线样式。
   */
  getFlowBaseLineStyle(feature: Feature<LineString>, options: FlowLineOptions): Style | Style[] | void {
    if (!options.showBaseLine) {
      this.baseLineStyle.setStroke(new Stroke({ color: 'rgba(0,0,0,0)', width: 0 }));
      return this.baseLineStyle;
    }

    if (options.style) {
      if (typeof options.style === 'function') {
        return options.style(feature);
      }
      return options.style;
    }

    this.baseLineStyle.setStroke(new Stroke({
      color: options.strokeColor ?? ConfigManager.DEFAULT_LINE_OPTIONS.strokeColor,
      width: options.strokeWidth ?? ConfigManager.DEFAULT_LINE_OPTIONS.strokeWidth,
      lineDash: options.lineDash,
      lineDashOffset: options.lineDashOffset
    }));
    return this.baseLineStyle;
  }

  /**
   * 创建流光虚线样式。
   */
  createDashStyle(options: FlowLineOptions): Style {
    const lineDash = options.lineDash && options.lineDash.length > 0 ? options.lineDash : this.dashFallback;
    return new Style({
      stroke: new Stroke({
        color: options.strokeColor ?? ConfigManager.DEFAULT_LINE_OPTIONS.strokeColor,
        width: options.strokeWidth ?? ConfigManager.DEFAULT_LINE_OPTIONS.strokeWidth,
        lineDash,
        lineDashOffset: options.lineDashOffset ?? 0
      })
    });
  }

  /**
   * 创建动画图层样式。
   */
  getAnimationLayerStyle(options: FlowLineOptions, dashStyle: Style): Style {
    if (options.animationMode === 'icon') {
      return this.emptyStyle;
    }
    return dashStyle;
  }

  /**
   * 获取 moving symbol 样式，按旋转与配置做缓存。
   */
  getMovingSymbolStyle(rotation: number, options: FlowLineOptions): Style {
    const flowSymbol = options.flowSymbol ?? {};
    const cacheKey = [
      rotation.toFixed(2),
      flowSymbol.src ?? 'builtin',
      flowSymbol.scale ?? ConfigManager.DEFAULT_FLOW_LINE_OPTIONS.flowSymbol.scale,
      flowSymbol.color ?? options.strokeColor ?? ConfigManager.DEFAULT_LINE_OPTIONS.strokeColor,
      String(flowSymbol.rotateWithView ?? ConfigManager.DEFAULT_FLOW_LINE_OPTIONS.flowSymbol.rotateWithView)
    ].join('|');

    const cachedStyle = this.movingSymbolStyleCache.get(cacheKey);
    if (cachedStyle) {
      return cachedStyle;
    }

    const color = flowSymbol.color ?? options.strokeColor ?? ConfigManager.DEFAULT_LINE_OPTIONS.strokeColor;
    const scale = flowSymbol.scale ?? ConfigManager.DEFAULT_FLOW_LINE_OPTIONS.flowSymbol.scale;
    const rotateWithView = flowSymbol.rotateWithView ?? ConfigManager.DEFAULT_FLOW_LINE_OPTIONS.flowSymbol.rotateWithView;
    const image = flowSymbol.src
      ? new Icon({
          src: flowSymbol.src,
          scale,
          color: flowSymbol.color,
          rotation,
          rotateWithView
        })
      : new RegularShape({
          points: 3,
          radius: 10 * scale,
          rotation: rotation - Math.PI / 2,
          rotateWithView,
          fill: new Fill({ color }),
          stroke: new Stroke({ color, width: 1 })
        });

    const style = new Style({ image });
    this.movingSymbolStyleCache.set(cacheKey, style);
    return style;
  }

  /**
   * 清理样式缓存。
   */
  clearCaches(): void {
    this.movingSymbolStyleCache.clear();
  }

  /**
   * 获取 dash 默认总长度。
   */
  getDashFallback(): number[] {
    return this.dashFallback;
  }
}
