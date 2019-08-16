import {from} from 'rxjs';
import { publish, mergeAll} from 'rxjs/operators';

import {ClickEventHandler, InputEventHandler, DragEventHandler, NavigateEventHandler} from './handlers';

export default class EventListener {
  constructor(options) {
    this._clickEventHandler = new ClickEventHandler();
    this._inputEventHandler = new InputEventHandler(options);
    this._dragEventHandler = new DragEventHandler();
    this._navigateEventHandler = new NavigateEventHandler();
    this._events = from([
      this._clickEventHandler.events,
      this._inputEventHandler.events,
      this._dragEventHandler.events,
      this._navigateEventHandler.events
    ])
      .pipe(mergeAll(), publish());
    this._events.connect();
  }

  events() {
    return this._events;
  }
};
