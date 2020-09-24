import eventTypes from './event-types';
import Event from './event';

export default class ValueEntered extends Event {
  constructor(event, saveAllData) {
    super(event);
    const element = event.target;

    if (!element) {
      return;
    }
    this.placeholder = element.placeholder;
    this.name = element.name;

    if (this.resourceId) {
      try {
        let query = document.querySelector(`[for=${this.resourceId}]`);

        if (query) {
          this.label = query.innerText;
        }
      } catch (error) {}
    }

    if (saveAllData === 'true' || saveAllData === true) {
      this.value = element.value || element.innerText;
    }
    this.type = eventTypes.INPUT;
  }

};
