import {fromEvent} from 'rxjs';
import {map} from 'rxjs/operators';

import ValueEntered from '../value-entered';

export default class InputEventHandler {
  constructor() {
    this._events = fromEvent(document, 'change')
      .pipe(
        map((event) => new ValueEntered(event))
      );
  }

  get events() {
    return this._events;
  }
};
