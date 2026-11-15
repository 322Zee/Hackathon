/**
 * INTERSTELLAR CONTINUUM - Introductory Cinematic Scene Integration Tests
 * Verifies 6-act cinematic initialization, input controls (pause/skip),
 * audio hook triggers, and transition to Earth Headquarters campus with spawn coordinates.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Container } from 'pixi.js';
import { IntroCinematicScene } from '../../src/scenes/IntroCinematicScene';
import { SceneId } from '../../src/scenes/SceneId';
import { SceneManager } from '../../src/scenes/SceneManager';
import { ServiceLocator } from '../../src/core/ServiceLocator';
import { InputManager } from '../../src/input/InputManager';
import { InputAction } from '../../src/input/InputAction';
import { CameraSystem } from '../../src/camera/CameraSystem';
import { AudioService } from '../../src/audio/AudioService';
import { EventBus } from '../../src/core/EventBus';
import { CinematicPlaybackState } from '../../src/cinematics';

describe('IntroCinematicScene Integration', () => {
  let scene: IntroCinematicScene;
  let sceneManager: SceneManager;
  let inputManager: InputManager;
  let cameraSystem: CameraSystem;
  let audioService: AudioService;
  let eventBus: EventBus;

  beforeEach(async () => {
    ServiceLocator.clear();

    eventBus = new EventBus();
    ServiceLocator.register('EventBus', eventBus);

    inputManager = new InputManager();
    inputManager.initialize();
    ServiceLocator.register('InputManager', inputManager);

    cameraSystem = new CameraSystem();
    ServiceLocator.register('CameraSystem', cameraSystem);

    audioService = new AudioService(
      {
        masterVolume: 1,
        musicVolume: 0.8,
        sfxVolume: 1,
        uiVolume: 1,
        ambienceVolume: 0.8,
        muted: false,
      },
      eventBus
    );
    ServiceLocator.register('AudioService', audioService);

    const rootContainer = new Container();
    const overlayContainer = new Container();
    sceneManager = new SceneManager(rootContainer, overlayContainer, eventBus);
    ServiceLocator.register('SceneManager', sceneManager);

    scene = new IntroCinematicScene();
    sceneManager.register(scene);

    await sceneManager.switchScene(scene.id, { transition: null });
  });

  afterEach(async () => {
    sceneManager.destroy();
    ServiceLocator.reset();
  });

  it('correctly registers as SceneId.INTRO_CINEMATIC and builds display layers', () => {
    expect(scene.id).toBe(SceneId.INTRO_CINEMATIC);
    expect(scene.container.children.length).toBeGreaterThanOrEqual(3); // Stage, Subtitles, Controls
  });

  it('activates sequencer and plays cinematic musical score on activation', async () => {
    const playMusicSpy = vi.spyOn(audioService, 'playMusic');

    await scene.deactivate();
    await scene.activate({ isReplay: false });

    const sequencer = scene.getSequencer();
    expect(sequencer.getState()).toBe(CinematicPlaybackState.PLAYING);
    expect(playMusicSpy).toHaveBeenCalledWith('cinematic_intro', true, 1200);
  });

  it('toggles pause on Escape keypress (InputAction.Cancel)', async () => {
    await scene.activate();
    const sequencer = scene.getSequencer();
    expect(sequencer.getState()).toBe(CinematicPlaybackState.PLAYING);

    // Mock Cancel keypress (Escape)
    vi.spyOn(inputManager, 'isActionJustPressed').mockImplementation(
      (action) => action === InputAction.Cancel
    );

    scene.update(0.1);
    expect(sequencer.getState()).toBe(CinematicPlaybackState.PAUSED);

    // Press Escape again to resume
    scene.update(0.1);
    expect(sequencer.getState()).toBe(CinematicPlaybackState.PLAYING);
  });

  it('skips cinematic on InputAction.Confirm and initiates transition to HEADQUARTERS', async () => {
    let switchSceneCalled = false;
    let switchedDestination: any = null;
    let transitionPayload: any = null;

    vi.spyOn(sceneManager, 'switchScene').mockImplementation(async (dest, opts) => {
      switchSceneCalled = true;
      switchedDestination = dest;
      transitionPayload = opts?.payload;
      return true;
    });

    await scene.activate();
    const sequencer = scene.getSequencer();

    // Trigger skip
    scene.handleSkipRequest();

    expect(sequencer.getState()).toBe(CinematicPlaybackState.SKIPPED);
    expect(switchSceneCalled).toBe(true);
    expect(switchedDestination).toBe(SceneId.HEADQUARTERS);
    expect(transitionPayload).toEqual({
      spawnX: 480,
      spawnY: 1350,
      isNewGame: true,
      isReplay: false,
    });
  });

  it('handles replay mode and respects returnToTitle flag if requested', async () => {
    let switchedDestination: any = null;

    vi.spyOn(sceneManager, 'switchScene').mockImplementation(async (dest) => {
      switchedDestination = dest;
      return true;
    });

    await scene.deactivate();
    await scene.activate({ isReplay: true, returnToTitle: true });
    scene.handleSkipRequest();

    expect(switchedDestination).toBe(SceneId.TITLE_SCREEN);
  });

  it('cleans up sequencer on scene cleanup', async () => {
    await scene.activate();
    const sequencer = scene.getSequencer();

    await scene.cleanup();
    expect(sequencer.getState()).toBe(CinematicPlaybackState.STOPPED);
  });
});
