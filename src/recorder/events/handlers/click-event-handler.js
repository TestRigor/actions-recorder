import {fromEvent, zip} from 'rxjs';
import {filter, map, throttleTime} from 'rxjs/operators';
import ElementClicked from '../element-clicked';

export default class ClickEventHandler {
  constructor(sources) {
    this._events = zip(
      fromEvent(sources, 'mousedown', { capture: true }),
      fromEvent(sources, 'mouseup', { capture: true }),
      fromEvent(sources, 'click', { capture: true })
    )
      .pipe(
        throttleTime(200),
        filter(([mousedown, mouseup]) => {
          let absMouseMovement = Math.abs(mousedown.clientX - mouseup.clientX) +
            Math.abs(mousedown.clientY - mouseup.clientY);

          return absMouseMovement <= 50;
        }),
        map(([,, click]) => {return {event: click, processed: new ElementClicked(click, false)};})
      );
  }

  get events() {
    return this._events;
  }
};
