import { describe, it, expect, beforeEach } from 'vitest';
import { Logger, LogLevel } from '../../src/core/logging/Logger';

describe('Logger', () => {
  beforeEach(() => {
    Logger.clearHistory();
    Logger.setLogLevel(LogLevel.DEBUG);
  });

  it('records logs with appropriate levels and tags', () => {
    Logger.info('TEST_TAG', 'Information payload', { foo: 'bar' });
    const history = Logger.getHistory();

    expect(history.length).toBe(1);
    expect(history[0]?.level).toBe(LogLevel.INFO);
    expect(history[0]?.tag).toBe('TEST_TAG');
    expect(history[0]?.message).toBe('Information payload');
    expect(history[0]?.details).toEqual({ foo: 'bar' });
  });

  it('filters out messages below current minimum log level', () => {
    Logger.setLogLevel(LogLevel.WARN);

    Logger.debug('DEBUG_TAG', 'Should be ignored');
    Logger.info('INFO_TAG', 'Should also be ignored');
    Logger.warn('WARN_TAG', 'Should be captured');
    Logger.error('ERROR_TAG', 'Should be captured too');

    const history = Logger.getHistory();
    expect(history.length).toBe(2);
    expect(history[0]?.tag).toBe('WARN_TAG');
    expect(history[1]?.tag).toBe('ERROR_TAG');
  });

  it('notifies listeners when new log entry is produced', () => {
    let notifiedTag = '';
    const unsubscribe = Logger.addListener((entry) => {
      notifiedTag = entry.tag;
    });

    Logger.info('LISTENER_TAG', 'Checking listener execution');
    expect(notifiedTag).toBe('LISTENER_TAG');

    unsubscribe();
    Logger.info('SECOND_TAG', 'Should not update notifiedTag');
    expect(notifiedTag).toBe('LISTENER_TAG');
  });
});
