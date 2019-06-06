import {from} from 'rxjs';
import { publish, mergeAll} from 'rxjs/operators';

import {ClickEventHandler, InputEventHandler, DragEventHandler} from './handlers';

export default class EventListener {
  constructor() {
    this._clickEventHandler = new ClickEventHandler();
    this._inputEventHandler = new InputEventHandler();
    this._dragEventHandler = new DragEventHandler();
    this._events = from([
      this._clickEventHandler.events,
      this._inputEventHandler.events,
      this._dragEventHandler.events
    ])
      .pipe(mergeAll(), publish());
    this._events.connect();
  }

  events() {
    return this._events;
  }
};
