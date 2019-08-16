import eventTypes from './event-types';
import Event from './event';

export default class ValueEntered extends Event {
  constructor(event, saveAllData) {
    super(event);
    const element = event['srcElement'];

    if (!element) {
      return;
    }
    this.placeholder = element.placeholder;
    this.name = element.name;

    if (this.resourceId) {
      let query = document.querySelector(`[for=${this.resourceId}]`);

      if (query) {
        this.label = query.innerText;
      }
    }

    if (saveAllData) {
      this.value = element.value;
    }
    this.type = eventTypes.INPUT;
  }

};
