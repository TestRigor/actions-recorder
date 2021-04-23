import eventTypes from './event-types';
import Event from './event';

export default class ValueEntered extends Event {
  constructor(event, saveAllData) {
    super(event, false);

    let element = this.getTarget(event);

    this.init(element);

    if (this.skipEvent) {
      return;
    }

    this.placeholder = element.placeholder;
    this.name = element.name;

    if (saveAllData === true) {
      this.value = element.value || element.innerText;

      if (element.tagName && element.tagName.toLowerCase() === 'select') {
        for (let i = 0; i < element.children.length; i++) {
          let option = element.children[i];

          if ((option.value === element.value) && !!option.innerText && !!option.innerText.trim()) {
            this.value = option.innerText.trim();
            break;
          }
        }
      }
    }
    this.type = eventTypes.INPUT;
  }
};
