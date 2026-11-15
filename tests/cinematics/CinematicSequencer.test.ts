/**
 * INTERSTELLAR CONTINUUM - Cinematic Sequencer Unit Tests
 * Verifies timeline progression, 6-act scene order, camera waypoints,
 * narration cue evaluation, pause/resume, and skip handling.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Container } from 'pixi.js';
import {
  CinematicSequencer,
  CinematicPlaybackState,
  CinematicSceneId,
  CinematicSubtitleRenderer,
  CinematicControlsOverlay,
} from '../../src/cinematics';
import { INTRO_CINEMATIC_SEQUENCE } from '../../src/cinematics/IntroCinematicData';
import { CameraSystem } from '../../src/camera/CameraSystem';
import { EventBus } from '../../src/core/EventBus';

describe('CinematicSequencer', () => {
  let sequencer: CinematicSequencer;
  let stageContainer: Container;
  let subtitleRenderer: CinematicSubtitleRenderer;
  let controlsOverlay: CinematicControlsOverlay;
  let cameraSystem: CameraSystem;
  let eventBus: EventBus;
  let onCompleteMock: any;

  beforeEach(() => {
    stageContainer = new Container();
    subtitleRenderer = new CinematicSubtitleRenderer();
    controlsOverlay = new CinematicControlsOverlay(vi.fn(), vi.fn());
    cameraSystem = new CameraSystem();
    eventBus = new EventBus();
    onCompleteMock = vi.fn();

    sequencer = new CinematicSequencer({
      config: INTRO_CINEMATIC_SEQUENCE,
      stageContainer,
      subtitleRenderer,
      controlsOverlay,
      cameraSystem,
      eventBus,
      onComplete: onCompleteMock,
    });
  });

  it('initializes in STOPPED state with 6 configured scenes in canonical order', () => {
    expect(sequencer.getState()).toBe(CinematicPlaybackState.STOPPED);
    expect(INTRO_CINEMATIC_SEQUENCE.scenes.length).toBe(6);

    const expectedOrder = [
      CinematicSceneId.EARTH,
      CinematicSceneId.SCALE_OF_SPACE,
      CinematicSceneId.INDEPENDENT_ORGANISATION,
      CinematicSceneId.THE_OPPORTUNITY,
      CinematicSceneId.PLAYERS_ROLE,
      CinematicSceneId.THE_FIRST_STEP,
    ];

    expect(INTRO_CINEMATIC_SEQUENCE.scenes.map((s) => s.id)).toEqual(expectedOrder);
  });

  it('starts sequence at Scene 0 (EARTH), emits start event, and loads stage node', () => {
    let startedEvent: any = null;
    let sceneChangedEvent: any = null;

    eventBus.on('cinematic:started', (payload) => {
      startedEvent = payload;
    });
    eventBus.on('cinematic:scene-changed', (payload) => {
      sceneChangedEvent = payload;
    });

    sequencer.start();

    expect(sequencer.getState()).toBe(CinematicPlaybackState.PLAYING);
    expect(sequencer.getCurrentSceneIndex()).toBe(0);
    expect(startedEvent?.sequenceId).toBe(INTRO_CINEMATIC_SEQUENCE.id);
    expect(sceneChangedEvent?.sceneId).toBe(CinematicSceneId.EARTH);
    expect(stageContainer.children.length).toBeGreaterThan(0);
  });

  it('evaluates narration cues and dispatches subtitle events', () => {
    let narrationEmitted: any = null;
    eventBus.on('cinematic:narration', (payload) => {
      narrationEmitted = payload;
    });

    sequencer.start();

    // Advance by 1.0s to trigger the narration cue scheduled at time: 0.5s
    sequencer.update(1.0);

    expect(narrationEmitted).toBeDefined();
    expect(narrationEmitted.speaker).toContain('PLANETARY OBSERVATION ARCHIVE');
    expect(narrationEmitted.text).toContain('For generations, humanity gazed upward');
  });

  it('interpolates camera waypoints during scene updates', () => {
    sequencer.start();

    const startPos = cameraSystem.getPosition();
    expect(startPos.x).toBe(960);
    expect(startPos.y).toBe(540);

    // Update through half of scene 1 duration
    sequencer.update(3.4);

    const midPos = cameraSystem.getPosition();
    expect(midPos.x).toBeLessThan(960); // Panning west towards 930
  });

  it('advances through scenes chronologically when scene durations elapse', () => {
    sequencer.start();
    expect(sequencer.getCurrentSceneIndex()).toBe(0);

    const scene1Duration = INTRO_CINEMATIC_SEQUENCE.scenes[0]!.duration;
    sequencer.update(scene1Duration + 0.1);

    expect(sequencer.getCurrentSceneIndex()).toBe(1);
    expect(sequencer.getCurrentScene()?.id).toBe(CinematicSceneId.SCALE_OF_SPACE);

    const scene2Duration = INTRO_CINEMATIC_SEQUENCE.scenes[1]!.duration;
    sequencer.update(scene2Duration + 0.1);

    expect(sequencer.getCurrentSceneIndex()).toBe(2);
    expect(sequencer.getCurrentScene()?.id).toBe(CinematicSceneId.INDEPENDENT_ORGANISATION);
  });

  it('pauses, resumes, and prevents timeline progression while paused', () => {
    sequencer.start();
    expect(sequencer.getState()).toBe(CinematicPlaybackState.PLAYING);

    sequencer.pause();
    expect(sequencer.getState()).toBe(CinematicPlaybackState.PAUSED);

    // Update while paused should not advance scene time
    sequencer.update(5.0);
    expect(sequencer.getCurrentSceneIndex()).toBe(0);

    sequencer.resume();
    expect(sequencer.getState()).toBe(CinematicPlaybackState.PLAYING);

    // Toggling pause
    sequencer.togglePause();
    expect(sequencer.getState()).toBe(CinematicPlaybackState.PAUSED);
    sequencer.togglePause();
    expect(sequencer.getState()).toBe(CinematicPlaybackState.PLAYING);
  });

  it('skips the cinematic immediately and invokes onComplete callback', () => {
    let skippedEvent: any = null;
    eventBus.on('cinematic:skipped', (payload) => {
      skippedEvent = payload;
    });

    sequencer.start();
    sequencer.update(2.0);

    sequencer.skip();

    expect(sequencer.getState()).toBe(CinematicPlaybackState.SKIPPED);
    expect(skippedEvent).toBeDefined();
    expect(onCompleteMock).toHaveBeenCalledTimes(1);
    expect(stageContainer.children.length).toBe(0);
  });

  it('invokes onComplete and emits completion event when all 6 scenes finish', () => {
    let completedEvent: any = null;
    eventBus.on('cinematic:completed', (payload) => {
      completedEvent = payload;
    });

    sequencer.start();

    // Advance through all 6 scenes
    let totalDuration = 0;
    for (const sc of INTRO_CINEMATIC_SEQUENCE.scenes) {
      totalDuration += sc.duration + 0.1;
    }

    sequencer.update(totalDuration);

    expect(sequencer.getState()).toBe(CinematicPlaybackState.COMPLETED);
    expect(completedEvent).toBeDefined();
    expect(onCompleteMock).toHaveBeenCalledTimes(1);
  });
});
