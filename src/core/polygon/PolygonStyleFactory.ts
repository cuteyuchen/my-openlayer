import Feature from "ol/Feature";
import { Fill, Stroke, Style, Text } from "ol/style";
import type { FeatureColorUpdateOptions, PolygonOptions } from "../../types";

/**
 * 面图层样式工厂。
 */
export default class PolygonStyleFactory {
  static getFeatureText(feature: Feature, options: PolygonOptions | FeatureColorUpdateOptions): string {
    if (options.textCallBack) {
      return options.textCallBack(feature) || '';
    }
    if (options.textKey) {
      return feature.get(options.textKey) || '';
    }
    return '';
  }

  static createStyle(options: PolygonOptions): any {
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

    return (feature: Feature) => {
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
    options?: FeatureColorUpdateOptions
  ): void {
    const name = options?.textKey ? feature.get(options.textKey) : '';
    const withDefaultStroke = options?.withDefaultStroke ?? true;
    const withDefaultFill = options?.withDefaultFill ?? true;
    const strokeColor = options?.strokeColor ?? (withDefaultStroke ? '#EBEEF5' : undefined);
    const strokeWidth = options?.strokeWidth ?? 2;
    const defaultFillColor = 'rgba(255, 255, 255, 0.3)';
    const resolvedFillColor = options?.fillColor ?? (withDefaultFill ? defaultFillColor : undefined);
    const newColor = colorObj?.[name] || resolvedFillColor;

    const featureStyle = new Style({
      stroke: strokeColor ? new Stroke({ color: strokeColor, width: strokeWidth }) : undefined,
      fill: newColor ? new Fill({ color: newColor }) : undefined
    });

    if (options?.textVisible) {
      const text = PolygonStyleFactory.getFeatureText(feature, options);
      if (text) {
        featureStyle.setText(new Text({
          text,
          font: options.textFont!,
          fill: new Fill({ color: options.textFillColor }),
          stroke: new Stroke({
            color: options.textStrokeColor,
            width: options.textStrokeWidth
          })
        }));
      }
    }

    feature.setStyle(featureStyle);
  }
}
