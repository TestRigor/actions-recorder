import {fromEvent, merge, combineLatest} from 'rxjs';
import {map, filter} from 'rxjs/operators';

import ValueEntered from '../value-entered';
import {isInput} from '../../helpers/html-tags';

export default class InputEventHandler {
  constructor(sources, options) {
    this.saveAllData = options.saveAllData;
    this._events = merge(
      fromEvent(sources, 'change', { capture: true }),
      combineLatest(
        fromEvent(sources, 'input', { capture: true }),
        fromEvent(sources, 'blur', { capture: true }),
      ).pipe(
        filter(([input, blur]) =>
          input.target.isContentEditable &&
          input.target === blur.target),
        map(([, blur]) => blur)))
      .pipe(
        filter((event) => isInput(event.target)),
        map((event) => {return {event: event, processed: new ValueEntered(event, this.saveAllData)};})
      );
  }

  get events() {
    return this._events;
  }
};
