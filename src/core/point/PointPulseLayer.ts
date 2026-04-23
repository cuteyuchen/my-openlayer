import Feature from "ol/Feature";
import Map from "ol/Map";
import { Point as OlPoint } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Circle as CircleStyle, Fill, Icon, Stroke, Style, Text } from "ol/style";
import type { PointData, PulsePointLayerHandle, PulsePointOptions } from "../../types";
import ProjectionUtils from "../../utils/ProjectionUtils";
import ValidationUtils from "../../utils/ValidationUtils";
import { ConfigManager } from "../map";

/**
 * 高性能闪烁点图层构建器。
 */
export default class PointPulseLayer {
  static createTextStyle(options: PulsePointOptions, text: string): Text {
    const defaultTextOptions = ConfigManager.DEFAULT_POINT_TEXT_OPTIONS;
    return new Text({
      text,
      font: options.textFont || defaultTextOptions.textFont,
      fill: new Fill({ color: options.textFillColor || defaultTextOptions.textFillColor }),
      stroke: new Stroke({
        color: options.textStrokeColor || defaultTextOptions.textStrokeColor,
        width: options.textStrokeWidth || defaultTextOptions.textStrokeWidth
      }),
      offsetY: options.textOffsetY || defaultTextOptions.textOffsetY
    });
  }

  static withOpacity(color: string, opacity: number): string {
    const safeOpacity = Math.max(0, Math.min(1, opacity));
    const rgbaMatch = color.match(/^rgba?\(([^)]+)\)$/i);
    if (rgbaMatch) {
      const parts = rgbaMatch[1].split(',').map(part => part.trim());
      if (parts.length >= 3) {
        const alpha = parts.length >= 4 ? Number(parts[3]) : 1;
        const nextAlpha = Number.isFinite(alpha) ? alpha * safeOpacity : safeOpacity;
        return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${nextAlpha})`;
      }
    }

    if (/^#[0-9a-f]{6}$/i.test(color)) {
      const red = parseInt(color.slice(1, 3), 16);
      const green = parseInt(color.slice(3, 5), 16);
      const blue = parseInt(color.slice(5, 7), 16);
      return `rgba(${red}, ${green}, ${blue}, ${safeOpacity})`;
    }

    return color;
  }

  static createFeatures(pointData: PointData[], options: PulsePointOptions): Feature[] {
    const pointFeatureList: Feature[] = [];
    pointData.forEach(item => {
      if (!ValidationUtils.validateCoordinates(item)) {
        return;
      }

      pointFeatureList.push(new Feature({
        rawData: item,
        type: options.layerName,
        layerName: options.layerName,
        geometry: new OlPoint(ProjectionUtils.transformCoordinate([item.lgtd, item.lttd], options))
      }));
    });
    return pointFeatureList;
  }

  static create(map: Map, pointData: PointData[], options: PulsePointOptions): PulsePointLayerHandle {
    const pulseOptions = {
      enabled: options.pulse?.enabled ?? true,
      duration: options.pulse?.duration ?? 2400,
      radius: options.pulse?.radius ?? [8, 26] as [number, number],
      colorMap: options.pulse?.colorMap ?? {
        0: 'rgba(255, 48, 54, 0.45)',
        1: 'rgba(255, 136, 0, 0.45)',
        2: 'rgba(253, 216, 46, 0.38)',
        3: 'rgba(6, 183, 253, 0.3)'
      },
      strokeColorMap: options.pulse?.strokeColorMap,
      strokeWidth: options.pulse?.strokeWidth ?? 0,
      frameCount: Math.max(1, options.pulse?.frameCount ?? 24)
    };
    const levelKey = options.levelKey ?? 'lev';
    const pulseStyleCache = new globalThis.Map<string, Style>();
    const staticStyleCache = new globalThis.Map<string, Style>();
    let frameIndex = 0;
    let renderedFrameIndex = -1;
    let rafId: number | null = null;
    let running = false;

    const source = new VectorSource({
      features: PointPulseLayer.createFeatures(pointData, options)
    });

    const createStyles = (feature: Feature): Style[] => {
      const rawData = feature.get('rawData') as PointData | undefined;
      const level = rawData?.[levelKey] ?? 'default';
      const progress = frameIndex / Math.max(1, pulseOptions.frameCount - 1);
      const [minRadius, maxRadius] = pulseOptions.radius;
      const radius = minRadius + (maxRadius - minRadius) * progress;
      const opacity = 1 - progress;
      const fillColor = pulseOptions.colorMap[level] ?? pulseOptions.colorMap.default ?? 'rgba(6, 183, 253, 0.32)';
      const strokeColor = pulseOptions.strokeColorMap?.[level] ?? pulseOptions.strokeColorMap?.default;
      const styles: Style[] = [];

      if (pulseOptions.enabled) {
        const pulseCacheKey = `${level}_${frameIndex}`;
        let pulseStyle = pulseStyleCache.get(pulseCacheKey);
        if (!pulseStyle) {
          pulseStyle = new Style({
            zIndex: 0,
            image: new CircleStyle({
              radius,
              fill: new Fill({ color: PointPulseLayer.withOpacity(fillColor, opacity) }),
              stroke: strokeColor && pulseOptions.strokeWidth > 0
                ? new Stroke({ color: PointPulseLayer.withOpacity(strokeColor, opacity), width: pulseOptions.strokeWidth })
                : undefined
            })
          });
          pulseStyleCache.set(pulseCacheKey, pulseStyle);
        }
        styles.push(pulseStyle);
      }

      const text = options.textVisible && options.textKey && rawData ? rawData[options.textKey] ?? '' : '';
      const staticCacheKey = [
        options.img ?? options.icon?.src ?? '',
        options.scale ?? options.icon?.scale ?? ConfigManager.DEFAULT_POINT_ICON_SCALE,
        options.iconColor ?? options.icon?.color ?? '',
        text
      ].join('|');
      let pointStyle = staticStyleCache.get(staticCacheKey);
      if (pointStyle) {
        styles.push(pointStyle);
        return styles;
      }

      const pointStyleOptions: any = {};
      const iconSrc = options.img ?? options.icon?.src;
      if (iconSrc) {
        pointStyleOptions.image = new Icon({
          src: iconSrc,
          scale: options.scale ?? options.icon?.scale ?? ConfigManager.DEFAULT_POINT_ICON_SCALE,
          color: options.iconColor ?? options.icon?.color
        });
      } else if (options.icon) {
        pointStyleOptions.image = new CircleStyle({
          radius: options.icon.radius ?? 5,
          fill: new Fill({ color: options.icon.fillColor ?? '#06b7fd' }),
          stroke: new Stroke({
            color: options.icon.strokeColor ?? '#ffffff',
            width: options.icon.strokeWidth ?? 2
          })
        });
      }
      if (text) {
        pointStyleOptions.text = PointPulseLayer.createTextStyle(options, text);
      }
      if (pointStyleOptions.image || pointStyleOptions.text) {
        pointStyle = new Style(pointStyleOptions);
        pointStyle.setZIndex(1);
        staticStyleCache.set(staticCacheKey, pointStyle);
        styles.push(pointStyle);
      }
      return styles;
    };

    const layer = new VectorLayer({
      layerName: options.layerName,
      source,
      style: createStyles as any,
      zIndex: options.zIndex || ConfigManager.DEFAULT_POINT_OPTIONS.zIndex,
    } as any);
    layer.setVisible(options.visible === undefined ? true : options.visible);
    map.addLayer(layer);

    const tick = () => {
      if (!running) return;
      const duration = Math.max(1, pulseOptions.duration);
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const nextFrameIndex = Math.floor(((now % duration) / duration) * pulseOptions.frameCount);
      if (nextFrameIndex !== renderedFrameIndex) {
        frameIndex = nextFrameIndex;
        renderedFrameIndex = nextFrameIndex;
        layer.changed();
      }
      rafId = requestAnimationFrame(tick);
    };

    const stop = () => {
      running = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const start = () => {
      if (running || !pulseOptions.enabled) return;
      running = true;
      tick();
    };

    start();

    return {
      layer,
      source,
      start,
      stop,
      setVisible: (visible: boolean) => layer.setVisible(visible),
      updateData: (nextData: PointData[]) => {
        source.clear();
        source.addFeatures(PointPulseLayer.createFeatures(nextData, options));
      },
      remove: () => {
        stop();
        source.clear();
        map.removeLayer(layer);
      }
    };
  }
}
