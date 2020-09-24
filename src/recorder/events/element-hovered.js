import eventTypes from './event-types';
import Event from './event';

export default class ElementHovered extends Event {
  constructor(event) {
    super(event);
    this.type = eventTypes.HOVER;
  }
};
