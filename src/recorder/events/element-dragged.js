import eventTypes from './event-types';
import Event from './event';

export default class ElementDragged extends Event {
  constructor(from, to) {
    super(from);
    this.type = eventTypes.DRAG_AND_DROP;
    this.dragX = from.clientX;
    this.dragY = from.clientY;
    this.dropX = to.clientX;
    this.dropY = to.clientY;
  }
};
