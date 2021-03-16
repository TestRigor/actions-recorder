import eventTypes from './event-types';
import Event from './event';

export default class ElementScrolled extends Event {
  constructor(event, down) {
    super(event, true);
    this.type = eventTypes.SCROLL;
    this.down = down;
  }
};
