export interface VueInstance {
  mount(element: Element | string): VueInstance;
  unmount?(): void;
  $destroy?(): void;
  [key: string]: any;
}

export interface VueApp {
  mount(element: Element | string): VueInstance;
  unmount(): void;
  [key: string]: any;
}

export interface VueLegacyInstance {
  $mount(element?: Element | string): VueLegacyInstance;
  $destroy(): void;
  [key: string]: any;
}

export enum VueTemplatePointState {
  CREATED = 'created',
  MOUNTED = 'mounted',
  VISIBLE = 'visible',
  HIDDEN = 'hidden',
  DESTROYED = 'destroyed'
}

export interface VueTemplatePointOptions {
  Template: any;
  lgtd: number;
  lttd: number;
  props?: any;
  styleType?: 'default' | 'custom';
  positioning?: 'bottom-left' | 'bottom-center' | 'bottom-right' | 'center-left' | 'center-center' | 'center-right' | 'top-left' | 'top-center' | 'top-right';
  stopEvent?: boolean;
  visible?: boolean;
  className?: string;
  zIndex?: number;
}

export interface VueTemplatePointInstance {
  id: string;
  dom: HTMLElement;
  anchor: any;
  app: VueApp | VueLegacyInstance | null;
  state: VueTemplatePointState;
  position: number[];
  options: VueTemplatePointOptions;
  setVisible(visible: boolean): void;
  updatePosition(lgtd: number, lttd: number): void;
  updateProps(newProps: Record<string, any>): void;
  setStyle(styles: Partial<CSSStyleDeclaration>): void;
  addClass(className: string): void;
  removeClass(className: string): void;
  remove(): void;
  getState(): VueTemplatePointState;
  getOptions(): Readonly<VueTemplatePointOptions>;
  isDestroyed(): boolean;
}
