import {fromEvent} from 'rxjs';
import {map} from 'rxjs/operators';
import BrowserHistoryChange from '../browser-history-change';

export default class NavigateEventHandler {
  constructor() {
    this._events = fromEvent(window, 'popstate')
      .pipe(
        map(() => {
          return new BrowserHistoryChange();
        })
      );
  }

  get events() {
    return this._events;
  }
};
