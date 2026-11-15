/**
 * INTERSTELLAR CONTINUUM - SettingsView Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SettingsView } from '../../src/ui/settings/SettingsView';
import { SettingsManager } from '../../src/settings';
import { ServiceLocator } from '../../src/core/ServiceLocator';
import { InputAction } from '../../src/input/InputAction';

describe('SettingsView', () => {
  let settingsManager: SettingsManager;
  let settingsView: SettingsView;

  beforeEach(() => {
    settingsManager = new SettingsManager();
    ServiceLocator.register('SettingsManager', settingsManager);
    settingsView = new SettingsView({
      initialCategory: 'GRAPHICS',
    });
  });

  afterEach(() => {
    settingsView.destroy();
  });

  it('initializes and mounts tab bar with 6 categories', () => {
    expect(settingsView.container).toBeDefined();
    expect(settingsView.getActiveCategory()).toBe('GRAPHICS');
  });

  it('switches tabs between categories correctly', () => {
    settingsView.selectCategory('AUDIO');
    expect(settingsView.getActiveCategory()).toBe('AUDIO');

    settingsView.selectCategory('CONTROLS');
    expect(settingsView.getActiveCategory()).toBe('CONTROLS');

    settingsView.selectCategory('ACCESSIBILITY');
    expect(settingsView.getActiveCategory()).toBe('ACCESSIBILITY');

    settingsView.selectCategory('INTERFACE');
    expect(settingsView.getActiveCategory()).toBe('INTERFACE');

    settingsView.selectCategory('GAMEPLAY');
    expect(settingsView.getActiveCategory()).toBe('GAMEPLAY');
  });

  it('manages key rebinding state and conflicts safely', () => {
    settingsView.selectCategory('CONTROLS');
    settingsView.startRebinding(InputAction.MoveUp);

    // Conflict test: Attempt to bind MoveUp to KeyS (already bound to MoveDown)
    const conflictHandled = settingsView.handleRebindKey('KeyS');
    expect(conflictHandled).toBe(false);

    // Cancel test
    const cancelHandled = settingsView.handleRebindKey('Escape');
    expect(cancelHandled).toBe(true);

    // Successful rebind test
    settingsView.startRebinding(InputAction.MoveUp);
    const successHandled = settingsView.handleRebindKey('KeyY');
    expect(successHandled).toBe(true);
    expect(settingsManager.getCategory('controls').bindings[InputAction.MoveUp]).toContain('KeyY');
  });

  it('closes cleanly via close method', () => {
    let closed = false;
    const viewWithCallback = new SettingsView({
      onClose: () => {
        closed = true;
      },
    });

    viewWithCallback.close();
    expect(closed).toBe(true);
    viewWithCallback.destroy();
  });
});
