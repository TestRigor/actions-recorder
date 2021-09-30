import {from} from 'rxjs';
import { publish, mergeAll } from 'rxjs/operators';

import {ClickEventHandler, InputEventHandler, DragEventHandler, NavigateEventHandler, EnterKeyPressEventHandler,
  HoverEventHandler, DoubleClickEventHandler, ScrollEventHandler, SubmitEventHandler} from './handlers';

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
    let eventSources = [(new ClickEventHandler(documents)).events,
      (new InputEventHandler(documents, options)).events,
      (new DragEventHandler(documents)).events,
      (new NavigateEventHandler(windows)).events,
      (new EnterKeyPressEventHandler(documents)).events,
      (new DoubleClickEventHandler(documents)).events,
      (new ScrollEventHandler(documents)).events,
      (new SubmitEventHandler(documents)).events];

    if (!dispatchEvents) {
      eventSources.push((new HoverEventHandler(documents)).events);
    }

    this._events = from(eventSources)
      .pipe(mergeAll(), publish());
    this._events.connect();
    this._documents = documents;
  }

  events() {
    return this._events;
  }

  documents() {
    return this._documents;
  }
};
