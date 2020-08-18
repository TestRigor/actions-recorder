import {fromEvent} from 'rxjs';
import {map, throttleTime} from 'rxjs/operators';
import ElementClicked from '../element-clicked';

export default class ClickEventHandler {
  constructor(sources, options) {
    this._events = fromEvent(sources, 'click', { capture: true })
      .pipe(
        throttleTime(200),
        map((event) => new ElementClicked(event, options))
      );
  }

  get events() {
    return this._events;
  }
};
