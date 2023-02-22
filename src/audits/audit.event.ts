import EventEmitter from 'events';
import { type EventRecord } from '../types/index.js';

export abstract class AuditEvent extends EventEmitter {
  private readonly event: EventRecord;

  constructor() {
    super();

    this.event = {
      END: 'end',
      SAVE: 'save',
      ERROR: 'error',
      INTERCEPT: 'intercept',
      'SAVE-SUCCESS': 'save-success'
    };
  }

  protected getEvent(): EventRecord {
    return this.event;
  }
}
