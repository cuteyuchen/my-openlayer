import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import type { BaseOptions, StyleOptions, TextOptions } from "./base";
import type { MapJSONData } from "./common";

export interface LineOptions extends BaseOptions, StyleOptions, TextOptions {
  type?: string;
}

export interface LineData {
  type: string;
  coordinates: number[][];
  [key: string]: any;
}

export interface FlowLineOptions extends LineOptions {
  loop?: boolean;
  autoStart?: boolean;
  duration?: number;
  speed?: number;
  showBaseLine?: boolean;
  animationMode?: 'icon' | 'dash' | 'icon+dash';
  flowSymbol?: {
    src?: string;
    scale?: number;
    color?: string;
    rotateWithView?: boolean;
    count?: number;
    spacing?: number;
  };
  trailEnabled?: boolean;
  trailLength?: number;
}

export interface FlowLineLayerHandle {
  layer: VectorLayer<VectorSource>;
  animationLayer: VectorLayer<VectorSource>;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setVisible: (visible: boolean) => void;
  updateData: (data: MapJSONData) => void;
  remove: () => void;
}
