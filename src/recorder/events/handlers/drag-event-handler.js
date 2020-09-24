import {fromEvent, zip} from 'rxjs';
import {map} from 'rxjs/operators';

import ElementDragged from '../element-dragged';

export default class DragEventHandler {
  constructor(sources) {
    this._events = zip(
      fromEvent(sources, 'dragstart', { capture: true }),
      fromEvent(sources, 'drop', { capture: true })
    )
      .pipe(map(([from, to]) => {
        return {event: to, processed: new ElementDragged(from, to)};
      }));
  }

  get events() {
    return this._events;
  }
};
