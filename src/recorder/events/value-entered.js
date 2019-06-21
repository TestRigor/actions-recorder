import eventTypes from './event-types';
import Event from './event';

export default class ValueEntered extends Event {
  constructor(event) {
    super(event);
    const element = event['srcElement'];

    if (!element) {
      return;
    }
    const isNotEmailAddress = (element.value.indexOf('@') === -1);

    if (element.type !== 'password' && isNotEmailAddress) {
      this.value = element.value;
    }

    if (!isNotEmailAddress && element.type === 'text') {
      this.elementType = 'email';
    }

    this.type = eventTypes.INPUT;
  }

};
