import eventTypes from './event-types';
import Event from './event';

export default class ElementClicked extends Event {

  constructor(event, options) {
    super(event, options);

    const element = event['srcElement'];

    this.type = eventTypes.CLICK;
    this.clickX = event.clientX;
    this.clickY = event.clientY;

    if (!element) {
      return;
    }
    this.value = element.defaultValue;
  }
};
