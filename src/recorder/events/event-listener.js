import {from} from 'rxjs';
import { publish, mergeAll} from 'rxjs/operators';

import {ClickEventHandler, InputEventHandler, DragEventHandler,
  NavigateEventHandler, EnterKeyPressEventHandler} from './handlers';

export default class EventListener {
  constructor(options, dispatchEvents) {
    let documents = [document],
      windows = [window];

    if (dispatchEvents) {
      let iframes = document.getElementsByTagName('iframe');

      for (let i = 0; i < iframes.length; i++) {
        if (iframes[i].contentDocument) {
          documents.push(iframes[i].contentDocument);
          windows.push(iframes[i].contentWindow);
        }
      }
    }
    this._clickEventHandler = new ClickEventHandler(documents, options);
    this._inputEventHandler = new InputEventHandler(documents, options);
    this._dragEventHandler = new DragEventHandler(documents, options);
    this._navigateEventHandler = new NavigateEventHandler(windows);
    this._enterKeyPressEventHandler = new EnterKeyPressEventHandler(documents, options);
    this._events = from([
      this._clickEventHandler.events,
      this._inputEventHandler.events,
      this._dragEventHandler.events,
      this._navigateEventHandler.events,
      this._enterKeyPressEventHandler.events
    ])
      .pipe(mergeAll(), publish());
    this._events.connect();
  }

  events() {
    return this._events;
  }
};
