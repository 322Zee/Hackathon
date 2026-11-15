/**
 * INTERSTELLAR CONTINUUM - Cinematic Sequencer
 * Central state machine and timeline runner coordinating scene transitions,
 * camera waypoints, narration timing, pause/resume, and skip handling.
 */

import { Container } from 'pixi.js';
import {
  CinematicSceneId,
  CinematicPlaybackState,
  CinematicSequenceConfig,
  CinematicSceneDefinition,
  CinematicNarrationCue,
} from './CinematicTypes';
import { CinematicSubtitleRenderer } from './ui/CinematicSubtitleRenderer';
import { CinematicControlsOverlay } from './ui/CinematicControlsOverlay';
import { CameraSystem } from '../camera/CameraSystem';
import { CameraMode } from '../camera/CameraMode';
import { EventBus } from '../core/EventBus';
import { Logger } from '../core/logging/Logger';

// Scene Renderers
import { EarthCinematicScene } from './scenes/EarthCinematicScene';
import { SolarScaleCinematicScene } from './scenes/SolarScaleCinematicScene';
import { HeadquartersOverviewCinematicScene } from './scenes/HeadquartersOverviewCinematicScene';
import { OpportunityCinematicScene } from './scenes/OpportunityCinematicScene';
import { PlayerRoleCinematicScene } from './scenes/PlayerRoleCinematicScene';
import { FirstStepCinematicScene } from './scenes/FirstStepCinematicScene';

export interface CinematicSequencerOptions {
  config: CinematicSequenceConfig;
  stageContainer: Container;
  subtitleRenderer: CinematicSubtitleRenderer;
  controlsOverlay: CinematicControlsOverlay;
  cameraSystem?: CameraSystem;
  eventBus?: EventBus;
  onComplete: () => void;
}

export class CinematicSequencer {
  private config: CinematicSequenceConfig;
  private stageContainer: Container;
  private subtitleRenderer: CinematicSubtitleRenderer;
  private controlsOverlay: CinematicControlsOverlay;
  private cameraSystem?: CameraSystem;
  private eventBus?: EventBus;
  private onCompleteCallback: () => void;

  private state: CinematicPlaybackState = CinematicPlaybackState.STOPPED;
  private currentSceneIndex: number = 0;
  private currentSceneTime: number = 0;
  private totalTimeElapsed: number = 0;

  // Active scene renderer
  private activeSceneNode?: any;
  private currentNarrationCue?: CinematicNarrationCue;

  constructor(options: CinematicSequencerOptions) {
    this.config = options.config;
    this.stageContainer = options.stageContainer;
    this.subtitleRenderer = options.subtitleRenderer;
    this.controlsOverlay = options.controlsOverlay;
    this.cameraSystem = options.cameraSystem;
    this.eventBus = options.eventBus;
    this.onCompleteCallback = options.onComplete;
  }

  public getState(): CinematicPlaybackState {
    return this.state;
  }

  public getCurrentSceneIndex(): number {
    return this.currentSceneIndex;
  }

  public getCurrentScene(): CinematicSceneDefinition | null {
    return this.config.scenes[this.currentSceneIndex] ?? null;
  }

  public start(): void {
    if (this.state === CinematicPlaybackState.PLAYING) return;

    this.state = CinematicPlaybackState.PLAYING;
    this.currentSceneIndex = 0;
    this.currentSceneTime = 0;
    this.totalTimeElapsed = 0;

    if (this.cameraSystem) {
      this.cameraSystem.setMode(CameraMode.CINEMATIC);
    }

    this.eventBus?.emit('cinematic:started', { sequenceId: this.config.id });
    Logger.info('CINEMATIC_SEQUENCER', `Started cinematic sequence: ${this.config.title}`);

    this.loadScene(0);
  }

  public pause(): void {
    if (this.state !== CinematicPlaybackState.PLAYING) return;
    this.state = CinematicPlaybackState.PAUSED;
    this.controlsOverlay.setPaused(true);
    this.eventBus?.emit('cinematic:paused', undefined);
    Logger.info('CINEMATIC_SEQUENCER', 'Cinematic playback paused.');
  }

  public resume(): void {
    if (this.state !== CinematicPlaybackState.PAUSED) return;
    this.state = CinematicPlaybackState.PLAYING;
    this.controlsOverlay.setPaused(false);
    this.eventBus?.emit('cinematic:resumed', undefined);
    Logger.info('CINEMATIC_SEQUENCER', 'Cinematic playback resumed.');
  }

  public togglePause(): void {
    if (this.state === CinematicPlaybackState.PAUSED) {
      this.resume();
    } else if (this.state === CinematicPlaybackState.PLAYING) {
      this.pause();
    }
  }

  public skip(): void {
    if (
      this.state === CinematicPlaybackState.COMPLETED ||
      this.state === CinematicPlaybackState.SKIPPED
    ) {
      return;
    }

    this.state = CinematicPlaybackState.SKIPPED;
    this.eventBus?.emit('cinematic:skipped', {
      sceneIndex: this.currentSceneIndex,
      timestamp: this.totalTimeElapsed,
    });
    Logger.info('CINEMATIC_SEQUENCER', 'Cinematic skipped by player.');

    this.cleanupCurrentSceneNode();
    this.subtitleRenderer.clearNarration();
    this.onCompleteCallback();
  }

  public update(deltaSeconds: number): void {
    if (this.state !== CinematicPlaybackState.PLAYING) return;

    this.currentSceneTime += deltaSeconds;
    this.totalTimeElapsed += deltaSeconds;

    let currentScene = this.getCurrentScene();
    if (!currentScene) {
      this.finishSequence();
      return;
    }

    // 1. Update Active Scene Visuals
    if (this.activeSceneNode && typeof this.activeSceneNode.update === 'function') {
      this.activeSceneNode.update(deltaSeconds);
    }

    // 2. Evaluate Camera Waypoint Interpolation
    this.updateCameraWaypoints(currentScene);

    // 3. Evaluate Subtitle Narrations
    this.updateNarrations(currentScene);

    // 4. Check Scene Advance
    while (
      this.state === CinematicPlaybackState.PLAYING &&
      this.currentSceneTime >= currentScene.duration
    ) {
      const leftover = this.currentSceneTime - currentScene.duration;
      if (this.currentSceneIndex < this.config.scenes.length - 1) {
        this.loadScene(this.currentSceneIndex + 1);
        this.currentSceneTime = leftover;
        currentScene = this.getCurrentScene()!;
      } else {
        this.finishSequence();
        break;
      }
    }
  }

  private loadScene(index: number): void {
    if (index >= this.config.scenes.length) {
      this.finishSequence();
      return;
    }

    this.currentSceneIndex = index;
    this.currentSceneTime = 0;
    this.currentNarrationCue = undefined;

    const sceneDef = this.config.scenes[index];
    if (!sceneDef) return;

    this.cleanupCurrentSceneNode();

    // Instantiate appropriate scene visual renderer
    this.activeSceneNode = this.createSceneNode(sceneDef.id);
    if (this.activeSceneNode?.container) {
      this.stageContainer.addChild(this.activeSceneNode.container);
    }

    // Configure initial camera position for this scene
    if (this.cameraSystem && sceneDef.cameraWaypoints.length > 0) {
      const initialWp = sceneDef.cameraWaypoints[0];
      if (initialWp) {
        this.cameraSystem.setPosition(initialWp.x, initialWp.y, true);
        this.cameraSystem.setZoom(initialWp.zoom, true);
      }
    }

    // Update timeline indicator dots
    this.controlsOverlay.updateTimeline(index, this.config.scenes.length);

    this.eventBus?.emit('cinematic:scene-changed', {
      sceneIndex: index,
      sceneId: sceneDef.id,
      title: sceneDef.title,
    });
    Logger.info(
      'CINEMATIC_SEQUENCER',
      `Advanced to scene [${index + 1}/${this.config.scenes.length}]: ${sceneDef.title}`
    );
  }

  private createSceneNode(sceneId: CinematicSceneId): any {
    switch (sceneId) {
      case CinematicSceneId.EARTH:
        return new EarthCinematicScene();
      case CinematicSceneId.SCALE_OF_SPACE:
        return new SolarScaleCinematicScene();
      case CinematicSceneId.INDEPENDENT_ORGANISATION:
        return new HeadquartersOverviewCinematicScene();
      case CinematicSceneId.THE_OPPORTUNITY:
        return new OpportunityCinematicScene();
      case CinematicSceneId.PLAYERS_ROLE:
        return new PlayerRoleCinematicScene();
      case CinematicSceneId.THE_FIRST_STEP:
        return new FirstStepCinematicScene();
      default:
        return null;
    }
  }

  private updateCameraWaypoints(scene: CinematicSceneDefinition): void {
    if (!this.cameraSystem || scene.cameraWaypoints.length < 2) return;

    const startWp = scene.cameraWaypoints[0];
    const endWp = scene.cameraWaypoints[1];
    if (!startWp || !endWp) return;

    const duration = Math.max(0.1, endWp.duration);
    const progress = Math.min(1.0, this.currentSceneTime / duration);

    // Smooth cubic ease-in-out
    const easedProgress =
      progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    const currentX = startWp.x + (endWp.x - startWp.x) * easedProgress;
    const currentY = startWp.y + (endWp.y - startWp.y) * easedProgress;
    const currentZoom = startWp.zoom + (endWp.zoom - startWp.zoom) * easedProgress;

    this.cameraSystem.setPosition(currentX, currentY, true);
    this.cameraSystem.setZoom(currentZoom, true);
  }

  private updateNarrations(scene: CinematicSceneDefinition): void {
    let activeCue: CinematicNarrationCue | undefined;

    for (const cue of scene.narrations) {
      if (
        this.currentSceneTime >= cue.time &&
        this.currentSceneTime < cue.time + cue.duration
      ) {
        activeCue = cue;
        break;
      }
    }

    if (activeCue && activeCue !== this.currentNarrationCue) {
      this.currentNarrationCue = activeCue;
      const progressLabel = `${scene.title} // ${scene.subtitle}`;
      this.subtitleRenderer.setNarration(activeCue.speaker, activeCue.text, progressLabel);
      this.eventBus?.emit('cinematic:narration', {
        text: activeCue.text,
        speaker: activeCue.speaker,
      });
    } else if (!activeCue && this.currentNarrationCue) {
      this.currentNarrationCue = undefined;
      this.subtitleRenderer.clearNarration();
    }
  }

  private finishSequence(): void {
    if (this.state === CinematicPlaybackState.COMPLETED) return;

    this.state = CinematicPlaybackState.COMPLETED;
    this.cleanupCurrentSceneNode();
    this.subtitleRenderer.clearNarration();

    this.eventBus?.emit('cinematic:completed', {
      totalDuration: this.totalTimeElapsed,
    });
    Logger.info(
      'CINEMATIC_SEQUENCER',
      `Cinematic sequence completed successfully (${this.totalTimeElapsed.toFixed(1)}s).`
    );

    this.onCompleteCallback();
  }

  private cleanupCurrentSceneNode(): void {
    if (this.activeSceneNode?.container) {
      this.stageContainer.removeChild(this.activeSceneNode.container);
      if (typeof this.activeSceneNode.container.destroy === 'function') {
        this.activeSceneNode.container.destroy({ children: true });
      }
      this.activeSceneNode = undefined;
    }
  }

  public destroy(): void {
    this.cleanupCurrentSceneNode();
    this.state = CinematicPlaybackState.STOPPED;
  }
}
