import {fromEvent} from 'rxjs';
import {debounceTime, filter, map} from 'rxjs/operators';
import ElementScrolled from '../element-scrolled';

export default class ScrollEventHandler {
  constructor(sources) {
    this._elementsScrollY = {};
    this._events = fromEvent(sources, 'scroll', { capture: true })
      .pipe(
        debounceTime(150),
        filter((event) => {
          return event.target !== document;
        }),
        map((event) => this.processEvent(event))
      );
  }

  processEvent(event) {
    let target = event.target,
      newScroll = target.scrollTop,
      down;

    let currentScroll = this._elementsScrollY[target] || 0;

    down = newScroll > currentScroll;
    this._elementsScrollY[target] = newScroll;

    return {event: event, processed: new ElementScrolled(event, down)};
  }

  get events() {
    return this._events;
  }
};
