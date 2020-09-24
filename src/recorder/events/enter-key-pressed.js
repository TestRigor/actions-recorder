import eventTypes from './event-types';
import Event from './event';

export default class EnterKeyPressed extends Event {
  constructor(event) {
    super(event);
    this.type = eventTypes.ENTER_KEY_PRESS;
  }
};
