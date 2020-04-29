import {fromEvent} from 'rxjs';
import {map} from 'rxjs/operators';

import ValueEntered from '../value-entered';

export default class InputEventHandler {
  constructor(sources, options) {
    this.saveAllData = options.saveAllData;
    this._events = fromEvent(sources, 'change')
      .pipe(
        map((event) => new ValueEntered(event, this.saveAllData, options))
      );
  }

  get events() {
    return this._events;
  }
};
