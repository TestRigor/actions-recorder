import eventTypes from './event-types';
import Event from './event';

export default class ValueEntered extends Event {
  constructor(event) {
    super(event);
    this.type = eventTypes.INPUT;
  }

};
