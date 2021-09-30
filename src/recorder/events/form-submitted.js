import Event from './event';
import eventTypes from './event-types';

export default class FormSubmitted extends Event {
  constructor(event) {
    super(event, true);
    this.type = eventTypes.SUBMIT;
  }
};
