import {fromEvent} from 'rxjs';
import {map} from 'rxjs/operators';
import BrowserHistoryChange from '../browser-history-change';

export default class NavigateEventHandler {
  constructor(sources) {
    this._events = fromEvent(sources, 'popstate')
      .pipe(
        map((event) => {
          return {event: event, processed: new BrowserHistoryChange(event)};
        })
      );
  }

  get events() {
    return this._events;
  }
};
