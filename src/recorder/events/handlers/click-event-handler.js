import {fromEvent} from 'rxjs';
import {map, throttleTime} from 'rxjs/operators';
import ElementClicked from '../element-clicked';

export default class ClickEventHandler {
  constructor(sources) {
    this._events = fromEvent(sources, 'click', { capture: true })
      .pipe(
        throttleTime(200),
        map((event) => {return {event: event, processed: new ElementClicked(event, false)};})
      );
  }

  get events() {
    return this._events;
  }
};
