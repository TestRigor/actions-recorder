import {webSocket} from 'rxjs/webSocket';
import {EventListener} from './events';
import {retryWhen, tap, delay} from 'rxjs/operators';

export default class Recorder {
  constructor(options) {
    this.eventListener = new EventListener();
    this.token = options.token;
    // eslint-disable-next-line no-undef
    this.webSocket = webSocket(RECORDER_URL + '/events?API_TOKEN=' + this.token);
    this.webSocket.pipe(
      retryWhen(errors =>
        errors.pipe(
          tap(err => {
            console.error('Got error', err);
          }),
          delay(2000)
        )
      )
    ).subscribe();
    this.subscribeToEvents();
  }

  subscribeToEvents() {
    this.eventListener
      .events()
      .subscribe((event) => {
        this.webSocket.next(event);
      });
  }
}
