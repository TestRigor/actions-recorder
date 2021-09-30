import {fromEvent} from 'rxjs';
import {map} from 'rxjs/operators';
import FormSubmitted from '../form-submitted';

export default class SubmitEventHandler {
  constructor(sources) {
    this._events = fromEvent(sources, 'submit')
      .pipe(
        map((event) => {
          return {event: event, processed: new FormSubmitted(event)};
        })
      );
  }

  get events() {
    return this._events;
  }
};
