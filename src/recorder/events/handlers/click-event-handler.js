import {fromEvent} from 'rxjs';
import {map, throttleTime} from 'rxjs/operators';
import ElementClicked from '../element-clicked';

export default class ClickEventHandler {
  constructor() {
    this._events = fromEvent(document, 'click')
      .pipe(
        throttleTime(1000),
        map((event) => new ElementClicked(event))
      );
  }

  get events() {
    return this._events;
  }
};
