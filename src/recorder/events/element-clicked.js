import eventTypes from './event-types';
import Event from './event';

export default class ElementClicked extends Event {

  constructor(event) {
    super(event);
    this.type = eventTypes.CLICK;
    this.clickX = event.clientX;
    this.clickY = event.clientY;
  }
};
