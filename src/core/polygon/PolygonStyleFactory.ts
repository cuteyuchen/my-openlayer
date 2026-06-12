import Feature, { type FeatureLike } from "ol/Feature";
import { Fill, Stroke, Style, Text } from "ol/style";
import type { FeatureColorUpdateOptions, PolygonOptions } from "../../types";

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
        baseStyle = new Style({ stroke, fill });
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
          styles.push(new Style({ stroke, fill }));
        }
      }

      if (options.textVisible) {
        const text = PolygonStyleFactory.getFeatureText(feature, options);
        if (text) {
          styles.push(new Style({
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
    const withDefaultStroke = options?.withDefaultStroke !== false;
    const withDefaultFill = options?.withDefaultFill !== false;
    const strokeColor = withDefaultStroke ? options?.strokeColor ?? previousStroke?.getColor() : undefined;
    const strokeWidth = withDefaultStroke ? options?.strokeWidth ?? previousStroke?.getWidth() : undefined;
    const lineDash = withDefaultStroke ? options?.lineDash ?? previousStroke?.getLineDash() ?? undefined : undefined;
    const lineDashOffset = withDefaultStroke ? options?.lineDashOffset ?? previousStroke?.getLineDashOffset() : undefined;
    const newColor = hasMappedColor
      ? colorObj![name]
      : options?.fillColor ?? (withDefaultFill ? previousFill?.getColor() : undefined);

    const featureStyle = new Style({
      stroke: strokeColor !== undefined || strokeWidth !== undefined || lineDash !== undefined || lineDashOffset !== undefined
        ? new Stroke({ color: strokeColor, width: strokeWidth, lineDash, lineDashOffset })
        : undefined,
      fill: newColor ? new Fill({ color: newColor }) : undefined
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
