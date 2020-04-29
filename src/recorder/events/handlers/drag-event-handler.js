import {fromEvent, zip} from 'rxjs';
import {map} from 'rxjs/operators';

import ElementDragged from '../element-dragged';

export default class DragEventHandler {
  constructor(sources, options) {
    this._events = zip(
      fromEvent(sources, 'dragstart'),
      fromEvent(sources, 'drop')
    )
      .pipe(map(([from, to]) => {
        return new ElementDragged(from, to, options);
      }));
  }

  get events() {
    return this._events;
  }
};
