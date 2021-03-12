import {fromEvent} from 'rxjs';
import {map} from 'rxjs/operators';
import ElementClicked from '../element-clicked';

export default class DoubleClickEventHandler {
  constructor(sources) {
    this._events = fromEvent(sources, 'dblclick', { capture: true })
      .pipe(
        map((event) => {return {event: event, processed: new ElementClicked(event, true)};})
      );
  }

  get events() {
    return this._events;
  }
};
