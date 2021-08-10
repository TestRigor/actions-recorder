import { EventListener } from './events';
import { ajax } from 'rxjs/ajax';

const DEFAULT_PRIORITY = -100;
const TestRigorSession = window['TestRigorSession'] || {getSession: function () {}};
const pluginSessionId = 'tRPluginSession';

export default class Recorder {
  constructor(options) {
    this.config = (options || {});
    this.config.priority = DEFAULT_PRIORITY;
    this.startRecorder(this.config);
  }

  startRecorder(config) {
    let dispatchEvents = Recorder.shouldDispatchEvents(config);

    this.eventListener = new EventListener(config, dispatchEvents);
    if (dispatchEvents) {
      // eslint-disable-next-line no-undef,max-len
      this.url = `${RECORDER_URL}/v1/events/${TestRigorSession.getSession() || ''}`;
      this.eventListener
        .events()
        .subscribe((event) => {
          if (event.processed.skipEvent) {
            return;
          }
          setTimeout(() => {
            event.processed.calcAdditionalData(event.event, false);
            this.postNewEvent(event.processed);
          }, 0);
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
        'Api-Token': this.config.token
      },
      body: {
        priority: this.config.priority,
        event: event
      }
    }).subscribe(() => {}, () => {});
  }

  subscribeToEventsPlugin() {
    // clear legacy storage, this is no longer needed as plugin handles it on its own
    localStorage.removeItem(pluginSessionId);

    this.eventSubscription = this.eventListener
      .events()
      .subscribe((event) => {
        if (event.processed.skipEvent) {
          return;
        }
        setTimeout(() => {
          event.processed.calcAdditionalData(event.event, true);

          document.dispatchEvent(new CustomEvent('newEventRecorded', {
            detail: event.processed
          }));
        }, 0);
      });
    let recorder = this;

    this.eventListener.documents().forEach((doc) => {
      let current = doc.removeEventListener;

      doc.removeEventListener = function (type, listener) {
        current(type, listener);
        setTimeout(() => recorder.restartWithConfig(recorder.config), 100);
        doc.removeEventListener = current;
      };
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

  restartWithConfig(config) {
    if (this.eventSubscription && this.eventSubscription.unsubscribe) {
      this.eventSubscription.unsubscribe();
    }
    this.config = config;
    this.startRecorder(config);
  }
}
