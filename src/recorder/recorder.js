import { webSocket } from 'rxjs/webSocket';
import { EventListener } from './events';
import { retryWhen, delay } from 'rxjs/operators';
import { version } from '../../package.json';

const DEFAULT_PRIORITY = -100;
const PLUGIN_PRIORITY = -150;
const Session = window['Session'] || {getSession: function () {}};

export default class Recorder {
  constructor(options) {
    this.config = (options || {});
    this.config.priority = DEFAULT_PRIORITY;
    this.startRecorder(this.config);
  }

  startRecorder(config) {
    this.eventListener = new EventListener(config);
    if (Recorder.shouldConnect()) {
      // eslint-disable-next-line no-undef,max-len
      this.webSocket = webSocket(`${RECORDER_URL}/events?API_TOKEN=${config.token}&clientId=${Session.getSession() || ''}&priority=${config.priority}`);
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

  getVersion() {
    return version;
  }

  disconnectAndRestart() {
    this.webSocket.unsubscribe();
    Session.recreateSession();
    this.startRecorder(this.config);
  }

  startRecording() {
    this.config.priority = PLUGIN_PRIORITY;
    this.disconnectAndRestart();
    document.dispatchEvent(new CustomEvent('recordingStarted', {
      detail: Session.getSession()
    }));
  }

  stopRecording() {
    const currentSession = Session.getSession();

    this.config.priority = DEFAULT_PRIORITY;
    this.disconnectAndRestart();
    document.dispatchEvent(new CustomEvent('recordingStopped', {
      detail: currentSession
    }));
  }
}
