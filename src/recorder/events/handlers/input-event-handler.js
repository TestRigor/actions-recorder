import {fromEvent, merge} from 'rxjs';
import {map, filter} from 'rxjs/operators';

import ValueEntered from '../value-entered';

export default class InputEventHandler {
  constructor(sources, options) {
    this.saveAllData = options.saveAllData;
    this._events = merge(
      fromEvent(sources, 'change', { capture: true }),
      fromEvent(sources, 'input', { capture: true }).pipe(filter((evt) => evt.target.isContentEditable))
    )
      .pipe(
        map((event) => new ValueEntered(event, this.saveAllData, options))
      );
  }

  get events() {
    return this._events;
  }
};
