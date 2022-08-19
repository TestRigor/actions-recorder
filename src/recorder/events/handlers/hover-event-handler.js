import {zip, fromEvent} from 'rxjs';
import {map, filter, throttleTime} from 'rxjs/operators';
import ElementHovered from '../element-hovered';
import {isVisible} from '../../helpers/rect-helper';

function isHoverable(element) {
  let count = 0;

  while (element && count < 10) {
    let attrs = [element.className && typeof element.className === 'string' ? element.className : '',
      element.tagName, element.name, element.id];

    if (attrs.map((attr) => attr ? attr.toLowerCase() : '').some((attr) => attr.includes('nav') ||
      attr.includes('hover') || attr.includes('menu')) && isVisible(element)) {
      return true;
    }
    element = element.parentNode;
    if (element && element.host) {
      // if an element's parent is a document-fragment skip to its host
      element = element.host;
    }
    count++;
  }
  return false;
}

export default class HoverEventHandler {
  constructor(sources) {
    this._events = zip(
      fromEvent(sources, 'mouseover', { capture: true }),
      fromEvent(sources, 'mouseout', { capture: true }),
    ).pipe(
      filter(([enter, leave]) => {
        return enter.target === leave.target &&
        (leave.timeStamp - enter.timeStamp) > 500 &&
          isHoverable(enter.target);
      }),
      throttleTime(500),
      map(([, leave]) => {return {event: leave, processed: new ElementHovered(leave)};})
    );
  }

  get events() {
    return this._events;
  }
};
