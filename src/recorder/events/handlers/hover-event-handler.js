import {zip, fromEvent} from 'rxjs';
import {map, filter} from 'rxjs/operators';
import ElementHovered from '../element-hovered';

function isHoverable(element) {
  while (element) {
    if (element.tagName && element.tagName.toLowerCase().includes('nav') ||
      element.className && typeof element.className === 'string' && element.className.toLowerCase().includes('hover')) {
      return true;
    }
    element = element.parentNode;
  }
  return false;
}

export default class HoverEventHandler {
  constructor(sources, options) {
    this._events = zip(
      fromEvent(sources, 'mouseover'),
      fromEvent(sources, 'mouseout'),
    ).pipe(
      filter(([enter, leave]) => {
        return enter.target === leave.target &&
        leave.timeStamp - enter.timeStamp > 200 &&
          isHoverable(enter.target);
      }),
      map(([, leave]) => new ElementHovered(leave, options))
    );
  }

  get events() {
    return this._events;
  }
};
