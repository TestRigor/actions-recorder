import eventTypes from './event-types';

export default class BrowserHistoryChange {

  constructor() {
    this.type = eventTypes.BROWSER_HISTORY_CHANGE;
  }
};
