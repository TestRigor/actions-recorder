import {fromEvent, zip} from 'rxjs';
import {filter, map} from 'rxjs/operators';
import TextSelected from '../text-selected';

export default class TextSelectedEventHandler {
  constructor(sources) {
    function getSelectedText() {
      let text = '';

      if (window.getSelection) {
        text = window.getSelection().toString();
      } else if (document.selection && document.selection.type !== 'Control') {
        text = document.selection.createRange().text;
      }
      return text;
    }

    this._events = zip(
      fromEvent(sources, 'mousedown', { capture: true }),
      fromEvent(sources, 'mouseup', { capture: true }),
    )
      .pipe(
        filter(([mousedown, mouseup]) => {
          let absMouseMovement = Math.abs(mousedown.clientX - mouseup.clientX) +
            Math.abs(mousedown.clientY - mouseup.clientY);

          return !!getSelectedText() && absMouseMovement > 50;
        }),
        map(([, mouseup]) => {return {event: mouseup, processed: new TextSelected(mouseup, getSelectedText())};})
      );
  }

  get events() {
    return this._events;
  }
};
