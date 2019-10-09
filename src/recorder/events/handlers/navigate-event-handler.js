import {fromEvent} from 'rxjs';
import {map} from 'rxjs/operators';
import BrowserHistoryChange from '../browser-history-change';

export default class NavigateEventHandler {
  constructor() {
    this._events = fromEvent(window, 'popstate')
      .pipe(
        map((event) => {
          return new BrowserHistoryChange(event);
        })
      );
  }

  get events() {
    return this._events;
  }
};
