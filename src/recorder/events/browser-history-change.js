import eventTypes from './event-types';
import Event from './event';

export default class BrowserHistoryChange extends Event {

  constructor(event) {
    super(event);
    this.type = eventTypes.BROWSER_HISTORY_CHANGE;
  }
};
