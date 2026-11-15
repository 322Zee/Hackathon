import { describe, it, expect, beforeEach } from 'vitest';
import { ErrorHandler } from '../../../src/core/errors/ErrorHandler';
import { SceneError, AssetError, ConfigError, StateError, EventError } from '../../../src/core/errors/GameError';
import { EventBus } from '../../../src/core/EventBus';

describe('GameError & ErrorHandler Integration', () => {
  let eventBus: EventBus;
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    eventBus = new EventBus();
    errorHandler = new ErrorHandler(eventBus);
    errorHandler.clearErrors();
  });

  it('records SceneError with recovery advice and specific code', () => {
    const err = new SceneError('Headquarters facility model failed to load', 'HQ_LOAD_FAIL', 'Return to Title Screen');
    errorHandler.handleSceneError(err, 'HEADQUARTERS');

    const reports = errorHandler.getRecentErrors();
    expect(reports.length).toBe(1);
    expect(reports[0]?.category).toBe('SCENE');
    expect(reports[0]?.code).toBe('HQ_LOAD_FAIL');
    expect(reports[0]?.recoveryAdvice).toBe('Return to Title Screen');
  });

  it('records AssetError when asset loading fails', () => {
    const err = new AssetError('Missing normal map texture', 'TEXTURE_NOT_FOUND');
    errorHandler.handleAssetError(err, 'mars_surface_norm');

    const reports = errorHandler.getRecentErrors();
    expect(reports.length).toBe(1);
    expect(reports[0]?.category).toBe('ASSET');
    expect(reports[0]?.code).toBe('TEXTURE_NOT_FOUND');
  });

  it('records ConfigError and StateError appropriately', () => {
    errorHandler.handleConfigError(new ConfigError('Resolution scale out of bounds'), 'display');
    errorHandler.handleStateError(new StateError('Invalid state transition while in flight'), 'StateEngine');

    const reports = errorHandler.getRecentErrors();
    expect(reports.length).toBe(2);
    expect(reports[0]?.category).toBe('CONFIG');
    expect(reports[1]?.category).toBe('STATE');
  });

  it('records EventError and reports through eventBus', () => {
    let captured = false;
    eventBus.on('error:captured', () => {
      captured = true;
    });

    errorHandler.handleEventError(new EventError('Listener threw uncaught exception'), 'PlayerMoved');
    expect(captured).toBe(true);
  });
});
