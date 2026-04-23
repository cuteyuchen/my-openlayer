import type { FeatureLike } from "ol/Feature";
import MapBrowserEvent from "ol/MapBrowserEvent";
import { Style } from "ol/style";

export type SelectMode = 'click' | 'hover' | 'ctrl';

export interface SelectCallbackEvent {
  selected: FeatureLike[];
  deselected: FeatureLike[];
  mapBrowserEvent: MapBrowserEvent<any>;
}

export interface SelectOptions {
  multi?: boolean;
  layerFilter?: string[];
  featureFilter?: (feature: FeatureLike) => boolean;
  hitTolerance?: number;
  selectStyle?: Style | Style[] | ((feature: FeatureLike) => Style | Style[]);
  onSelect?: (event: SelectCallbackEvent) => void;
  onDeselect?: (event: SelectCallbackEvent) => void;
}

export interface ProgrammaticSelectOptions {
  layerName?: string;
  selectStyle?: Style | Style[] | ((feature: FeatureLike) => Style | Style[]);
  fitView?: boolean;
  fitDuration?: number;
  fitPadding?: number;
}
