import eventTypes from './event-types';
import Event from './event';

export default class ElementHovered extends Event {
  constructor(event, options) {
    super(event, options);
    this.type = eventTypes.HOVER;
  }
};
