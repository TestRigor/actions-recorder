import { EventListener } from './events';
import { ajax } from 'rxjs/ajax';

const DEFAULT_PRIORITY = -100;
const Session = window['Session'] || {getSession: function () {}};
const pluginSessionId = 'tRPluginSession';

export default class Recorder {
  constructor(options) {
    this.config = (options || {});
    this.config.priority = DEFAULT_PRIORITY;
    this.startRecorder(this.config);
  }

  startRecorder(config) {
    this.eventListener = new EventListener(config);
    if (Recorder.shouldDispatchEvents(config)) {
      // eslint-disable-next-line no-undef,max-len
      this.url = `${RECORDER_URL}/v1/events/${Session.getSession() || ''}`;
      this.eventListener
        .events()
        .subscribe((event) => {
          this.postNewEvent(event);
        });
    } else {
      this.subscribeToEventsPlugin();
    }
  }

  postNewEvent(event) {
    ajax({
      url: this.url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API_TOKEN': this.config.token
      },
      body: {
        priority: this.config.priority,
        event: event
      }
    }).subscribe(() => {}, () => {});
  }

  subscribeToEventsPlugin() {
    this.eventListener
      .events()
      .subscribe((event) => {
        const events = JSON.parse(localStorage.getItem(pluginSessionId) || '[]');

        event.occurredAt = new Date();
        events.push(event);

        localStorage.setItem(pluginSessionId, JSON.stringify(events));
      });
  }

  static shouldDispatchEvents(config) {
    if (!config.token) {
      return false;
    }
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

  stopRecording() {
    const events = JSON.parse(localStorage.getItem(pluginSessionId) || '[]');

    localStorage.removeItem(pluginSessionId);

    document.dispatchEvent(new CustomEvent('recordingStopped', {
      detail: events
    }));
  }

  restartWithConfig(config) {
    this.config = config;
    this.startRecorder(config);
  }
}
