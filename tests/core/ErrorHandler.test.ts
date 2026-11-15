import { describe, it, expect, beforeEach } from 'vitest';
import { ErrorHandler } from '../../src/core/errors/ErrorHandler';
import { EventBus } from '../../src/core/EventBus';

describe('ErrorHandler', () => {
  let eventBus: EventBus;
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    eventBus = new EventBus();
    errorHandler = new ErrorHandler(eventBus);
    errorHandler.clearErrors();
  });

  it('records reported error and provides diagnostic report', () => {
    errorHandler.report(new Error('Orbital thruster ignition failure'), 'ThrusterSystem', false);

    const reports = errorHandler.getRecentErrors();
    expect(reports.length).toBe(1);
    expect(reports[0]?.message).toBe('Orbital thruster ignition failure');
    expect(reports[0]?.context).toBe('ThrusterSystem');
    expect(reports[0]?.fatal).toBe(false);
  });

  it('emits error:captured on EventBus when error is reported', () => {
    let capturedMessage = '';
    eventBus.on('error:captured', ({ message }) => {
      capturedMessage = message;
    });

    errorHandler.report('Radiation sensor bus timeout', 'Telemetry', false);
    expect(capturedMessage).toBe('Radiation sensor bus timeout');
  });
});
