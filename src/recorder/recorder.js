import {webSocket} from 'rxjs/webSocket';
import {EventListener} from './events';
import {retryWhen, delay} from 'rxjs/operators';

const Session = window['Session'] || {getSession: function () {}};

export default class Recorder {
  constructor(options) {
    this.eventListener = new EventListener();
    this.token = options.token;
    // eslint-disable-next-line no-undef
    this.webSocket = webSocket(`${RECORDER_URL}/events?API_TOKEN=${this.token}&clientId=${Session.getSession() || ''}`);
    this.webSocket.pipe(
      retryWhen(errors =>
        errors.pipe(
          delay(5000)
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
