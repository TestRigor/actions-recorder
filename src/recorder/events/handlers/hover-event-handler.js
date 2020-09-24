import {zip, fromEvent} from 'rxjs';
import {map, filter} from 'rxjs/operators';
import ElementHovered from '../element-hovered';

function isHoverable(element) {
  while (element) {
    if (element.tagName && element.tagName.toLowerCase().includes('nav')) {
      return true;
    }
    element = element.parentNode;
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
        (leave.timeStamp - enter.timeStamp) > 100 &&
          isHoverable(enter.target);
      }),
      map(([, leave]) => {return {event: leave, processed: new ElementHovered(leave)};})
    );
  }

  get events() {
    return this._events;
  }
};
