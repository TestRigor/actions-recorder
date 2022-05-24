import eventTypes from './event-types';
import Event from './event';

export default class TextSelected extends Event {

  constructor(event, text) {
    super(event, true);

    this.type = eventTypes.TEXT_SELECTION;
    this.value = text;
  }
};
