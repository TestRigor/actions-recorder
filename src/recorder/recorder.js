import {webSocket} from 'rxjs/webSocket';
import {EventListener} from './events';
import {retryWhen, delay} from 'rxjs/operators';

const Session = window['Session'] || {getSession: function () {}};

export default class Recorder {
  constructor(options) {
    const config = (options || {});

    this.eventListener = new EventListener(config);
    this.token = config.token;
    if (Recorder.shouldConnect()) {
      // eslint-disable-next-line no-undef,max-len
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

  }

  subscribeToEvents() {
    this.eventListener
      .events()
      .subscribe((event) => {
        this.webSocket.next(event);
      });
  }

  static shouldConnect() {
    let cookies = document.cookie.split(';');

    let length = cookies.length;

    for (let i = 0; i < length; i++) {
      let cookie = cookies[i].split('=');

      if (cookie.length && cookie[0].trim() === '44523a90-a964-49b9-84e5-b04fd8981730') {
        return false;
      }
    }
    return true;
  }
}
