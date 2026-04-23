import Overlay from 'ol/Overlay';
import Map from 'ol/Map';
import type { TwinkleItem } from '../../types';
import { ConfigManager } from '../map';

/**
 * DOM 点位覆盖物构建器。
 */
export default class PointOverlay {
  static create(map: Map, twinkleList: TwinkleItem[], callback?: Function) {
    let anchors: Overlay[] = [];
    twinkleList.forEach(twinkleItem => {
      let element: HTMLElement;
      if (twinkleItem.element) {
        element = typeof twinkleItem.element === 'function'
          ? twinkleItem.element(twinkleItem)
          : twinkleItem.element;
        if (twinkleItem.className) {
          const classes = twinkleItem.className.split(/\s+/).filter(Boolean);
          if (classes.length > 0) {
            element.classList.add(...classes);
          }
        }
      } else {
        element = document.createElement('div');
        element.className = twinkleItem.className || '';
      }

      if (callback) {
        element.addEventListener('click', () => callback(twinkleItem));
      }

      const anchor = new Overlay({
        element,
        positioning: ConfigManager.DEFAULT_DOM_POINT_OVERLAY_OPTIONS.positioning,
        stopEvent: ConfigManager.DEFAULT_DOM_POINT_OVERLAY_OPTIONS.stopEvent
      });

      anchor.setPosition([twinkleItem.lgtd, twinkleItem.lttd]);
      map.addOverlay(anchor);
      anchors.push(anchor);
    });

    return {
      anchors,
      remove: () => {
        anchors.forEach(anchor => {
          anchor.getElement()?.remove();
          map.removeOverlay(anchor);
        });
        anchors = [];
      },
      setVisible: (visible: boolean) => {
        anchors.forEach(anchor => {
          const element = anchor.getElement();
          if (element) {
            element.style.display = visible ? '' : 'none';
          }
        });
      }
    };
  }
}
