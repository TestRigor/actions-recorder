import {fromEvent, zip} from 'rxjs';
import {map} from 'rxjs/operators';

import ElementDragged from '../element-dragged';

export default class DragEventHandler {
  constructor() {
    this._events = zip(
      fromEvent(document, 'dragstart'),
      fromEvent(document, 'drop')
    )
      .pipe(map(([from, to]) => {
        return new ElementDragged(from, to);
      }));
  }

  get events() {
    return this._events;
  }
};
