import eventTypes from './event-types';
import Event from './event';

export default class EnterKeyPressed extends Event {
  constructor(event, options) {
    super(event, options);
    this.type = eventTypes.ENTER_KEY_PRESS;
  }
};
