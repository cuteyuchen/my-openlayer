import MyOl from "../index";
// import { createApp } from "vue";
import Overlay from "ol/Overlay";
import Map from "ol/Map";
// import type { App } from 'vue';

interface Options {
  Vue: any
  Template: any;
  lgtd: number;
  lttd: number;
  props?: any;
  type?: string;
  sttp?: string;
  zIndex?: number
}

export default class DomPoint {

  private map: Map;
  private app: any;
  private anchor: Overlay;
  private dom: HTMLElement;

  constructor(map: Map, options: Options) {
    this.map = map;
    const {
      Vue,
      Template,
      lgtd,
      lttd,
      props,
    } = options;
    this.dom = document.createElement('div');
    this.map.getViewport().appendChild(this.dom);
    if (Vue.version.startsWith('3')) {
      this.app = Vue.createApp(
        Object.assign(Template, {
          props: { ...props }
        })
      );
      this.app.mount(this.dom);
    } else {
      this.app = new Vue({
        el: this.dom,
        render: (h: any) => h(Template, { props })
      });
    }

    this.anchor = new Overlay({
      element: this.dom,
      positioning: 'center-center',
      stopEvent: false
    })
    this.anchor.setPosition([lgtd, lttd])
    this.map.addOverlay(this.anchor)
  }

  setVisible(visible: boolean) {
    this.dom.style.visibility = visible ? 'visible' : 'hidden';
  }

  remove() {
    this.app.unmount();
    this.map.removeOverlay(this.anchor);
  }
}