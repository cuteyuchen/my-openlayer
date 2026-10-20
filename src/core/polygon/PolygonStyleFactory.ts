import Feature, { type FeatureLike } from "ol/Feature";
import { Fill, Stroke, Style, Text } from "ol/style";
import type { FeatureColorUpdateOptions, PolygonOptions } from "../../types";
import ConfigManager from "../map/ConfigManager";

/**
 * 面图层样式工厂。
 */
export default class PolygonStyleFactory {
  static getFeatureText(feature: FeatureLike, options: PolygonOptions | FeatureColorUpdateOptions): string {
    if (options.textCallBack) {
      return options.textCallBack(feature) || '';
    }
    if (options.textKey) {
      return feature.get(options.textKey) || '';
    }
    return '';
  }

  private static normalizeStyles(styles?: Style | Style[] | void): Style[] {
    if (!styles) return [];
    return Array.isArray(styles) ? styles : [styles];
  }

  static resolveFeatureStyles(styleLike: unknown, feature: FeatureLike, resolution = 1): Style[] {
    if (!styleLike) return [];
    if (typeof styleLike === 'function') {
      return PolygonStyleFactory.normalizeStyles(styleLike(feature, resolution));
    }
    return PolygonStyleFactory.normalizeStyles(styleLike as Style | Style[]);
  }

  private static getPreviousStroke(styles: Style[]): Stroke | undefined {
    return styles.map(style => style.getStroke()).find((stroke): stroke is Stroke => !!stroke);
  }

  private static getPreviousFill(styles: Style[]): Fill | undefined {
    return styles.map(style => style.getFill()).find((fill): fill is Fill => !!fill);
  }

  private static getPreviousText(styles: Style[]): Text | undefined {
    return styles.map(style => style.getText()).find((text): text is Text => !!text);
  }

  static createStyle(options: PolygonOptions): Style | Style[] | ((feature: FeatureLike) => Style | Style[]) {
    if (options.style) {
      return options.style;
    }

    const withDefaultStroke = options.withDefaultStroke ?? true;
    const withDefaultFill = options.withDefaultFill ?? true;
    const strokeColor = options.strokeColor ?? (withDefaultStroke ? '#EBEEF5' : undefined);
    const strokeWidth = options.strokeWidth ?? 2;
    const staticFillColor = options.fillColor ?? (withDefaultFill ? 'rgba(255, 255, 255, 0)' : undefined);
    const stroke = strokeColor ? new Stroke({
      color: strokeColor,
      width: strokeWidth,
      lineDash: options.lineDash,
      lineDashOffset: options.lineDashOffset
    }) : undefined;

    let baseStyle: Style | undefined;
    if (!options.fillColorCallBack) {
      const fill = staticFillColor ? new Fill({ color: staticFillColor }) : undefined;
      if (stroke || fill) {
        baseStyle = new Style({ stroke, fill, zIndex: options.styleZIndex });
      }
    }

    if (baseStyle && !options.textVisible) {
      return baseStyle;
    }

    return (feature: FeatureLike) => {
      const styles: Style[] = [];
      if (baseStyle) {
        styles.push(baseStyle);
      } else {
        const fillColor = options.fillColorCallBack ? options.fillColorCallBack(feature) : staticFillColor;
        const fill = fillColor ? new Fill({ color: fillColor }) : undefined;
        if (stroke || fill) {
          styles.push(new Style({ stroke, fill, zIndex: options.styleZIndex }));
        }
      }

      if (options.textVisible) {
        const text = PolygonStyleFactory.getFeatureText(feature, options);
        if (text) {
          styles.push(new Style({
            zIndex: options.styleZIndex,
            text: new Text({
              text,
              font: options.textFont!,
              overflow: options.textOverflow,
              fill: new Fill({ color: options.textFillColor! }),
              stroke: new Stroke({
                color: options.textStrokeColor!,
                width: options.textStrokeWidth!
              })
            })
          }));
        }
      }

      return styles;
    };
  }

  static updateSingleFeatureColor(
    feature: Feature,
    colorObj?: { [propName: string]: string },
    options?: FeatureColorUpdateOptions,
    previousStyles: Style[] = []
  ): void {
    const name = options?.textKey ? String(feature.get(options.textKey) ?? '') : '';
    const hasMappedColor = !!colorObj && Object.prototype.hasOwnProperty.call(colorObj, name);
    const previousStroke = PolygonStyleFactory.getPreviousStroke(previousStyles);
    const previousFill = PolygonStyleFactory.getPreviousFill(previousStyles);
    const previousText = PolygonStyleFactory.getPreviousText(previousStyles);
    // 填色更新只继承样式层级，不能把图层 zIndex 当作回退值。
    const styleZIndex = options?.styleZIndex
      ?? previousStyles.find(style => style.getZIndex() !== undefined)?.getZIndex();
    const withDefaultStroke = options?.withDefaultStroke !== false;
    const withDefaultFill = options?.withDefaultFill !== false;
    const strokeColor = withDefaultStroke ? options?.strokeColor ?? previousStroke?.getColor() : undefined;
    const strokeWidth = withDefaultStroke ? options?.strokeWidth ?? previousStroke?.getWidth() : undefined;
    const lineDash = withDefaultStroke ? options?.lineDash ?? previousStroke?.getLineDash() ?? undefined : undefined;
    const lineDashOffset = withDefaultStroke ? options?.lineDashOffset ?? previousStroke?.getLineDashOffset() : undefined;
    /** *********************颜色回退策略*********************/
    // 1) colorObj 命中映射：使用映射颜色
    // 2) 未命中但 options.fillColor 传入：使用传入的 fillColor
    // 3) 都未提供：使用透明填充，避免沿用上一次更新的颜色
    let newColor: string | number[] | undefined;
    if (hasMappedColor) {
      newColor = colorObj![name];
    } else if (options?.fillColor !== undefined) {
      newColor = options.fillColor;
    } else {
      newColor = withDefaultFill ? 'rgba(0, 0, 0, 0)' : undefined;
    }

    const featureStyle = new Style({
      stroke: strokeColor !== undefined || strokeWidth !== undefined || lineDash !== undefined || lineDashOffset !== undefined
        ? new Stroke({ color: strokeColor, width: strokeWidth, lineDash, lineDashOffset })
        : undefined,
      fill: newColor ? new Fill({ color: newColor }) : undefined,
      zIndex: styleZIndex
    });

    const textVisible = options?.textVisible ?? !!previousText;
    if (textVisible) {
      const text = options ? PolygonStyleFactory.getFeatureText(feature, options) || previousText?.getText() : previousText?.getText();
      if (text) {
        const textFillColor = options?.textFillColor ?? previousText?.getFill()?.getColor();
        const textStrokeColor = options?.textStrokeColor ?? previousText?.getStroke()?.getColor();
        const textStrokeWidth = options?.textStrokeWidth ?? previousText?.getStroke()?.getWidth();
        featureStyle.setText(new Text({
          text,
          font: options?.textFont ?? previousText?.getFont(),
          overflow: options?.textOverflow ?? previousText?.getOverflow(),
          offsetY: options?.textOffsetY ?? previousText?.getOffsetY(),
          fill: textFillColor !== undefined ? new Fill({ color: textFillColor }) : undefined,
          stroke: textStrokeColor !== undefined || textStrokeWidth !== undefined
            ? new Stroke({ color: textStrokeColor, width: textStrokeWidth })
            : undefined
        }));
      }
    }

    feature.setStyle(featureStyle);
  }
}

/**
 * 根据单个要素创建面样式，复用内置工厂及运行时默认配置。
 * 返回已解析的 Style 或 Style[]，可直接用于图层的 style 回调。
 */
export function createPolygonStyle(options: PolygonOptions, feature: FeatureLike): Style | Style[] {
  const style = PolygonStyleFactory.createStyle({
    ...ConfigManager.DEFAULT_POLYGON_OPTIONS,
    ...options
  });
  return typeof style === 'function' ? style(feature) : style;
}
