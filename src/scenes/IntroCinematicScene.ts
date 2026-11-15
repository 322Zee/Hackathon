/**
 * INTERSTELLAR CONTINUUM - Introductory Cinematic Scene
 * Complete 6-act narrative cinematic sequence establishing the game's setting,
 * the player's role as Mission Director, and the organisation's long-term objective.
 * Transitions smoothly into the Earth Headquarters campus.
 */

import { Container } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { SceneId } from './SceneId';
import { SceneManager } from './SceneManager';
import { ServiceLocator } from '../core/ServiceLocator';
import { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import { CameraSystem } from '../camera/CameraSystem';
import { AudioService } from '../audio/AudioService';
import { EventBus } from '../core/EventBus';
import { FadeTransition } from './transitions/FadeTransition';
import { Logger } from '../core/logging/Logger';

// Cinematic Subsystems
import {
  CinematicSequencer,
  INTRO_CINEMATIC_SEQUENCE,
  CinematicSubtitleRenderer,
  CinematicControlsOverlay,
  CinematicPlaybackState,
} from '../cinematics';

export class IntroCinematicScene extends BaseScene {
  public readonly id = SceneId.INTRO_CINEMATIC;

  private sceneManager?: SceneManager;
  private inputManager?: InputManager;
  private cameraSystem?: CameraSystem;
  private audioService?: AudioService;
  private eventBus?: EventBus;

  // Cinematic Display Containers
  private stageContainer!: Container;
  private subtitleRenderer!: CinematicSubtitleRenderer;
  private controlsOverlay!: CinematicControlsOverlay;
  private sequencer!: CinematicSequencer;

  private isReplay: boolean = false;
  private returnToTitleOnComplete: boolean = false;

  protected async onInitialize(): Promise<void> {
    Logger.info('INTRO_CINEMATIC', 'Initializing Introductory Cinematic Scene...');

    // 1. Resolve Core Services
    if (ServiceLocator.has('SceneManager')) {
      this.sceneManager = ServiceLocator.get<SceneManager>('SceneManager');
    }
    if (ServiceLocator.has('InputManager')) {
      this.inputManager = ServiceLocator.get<InputManager>('InputManager');
    }
    if (ServiceLocator.has('CameraSystem')) {
      this.cameraSystem = ServiceLocator.get<CameraSystem>('CameraSystem');
    }
    if (ServiceLocator.has('AudioService')) {
      this.audioService = ServiceLocator.get<AudioService>('AudioService');
    }
    if (ServiceLocator.has('EventBus')) {
      this.eventBus = ServiceLocator.get<EventBus>('EventBus');
    }

    // 2. Build Layered Display Hierarchy
    this.stageContainer = new Container();
    this.stageContainer.label = 'CinematicStage';
    this.container.addChild(this.stageContainer);

    this.subtitleRenderer = new CinematicSubtitleRenderer();
    this.container.addChild(this.subtitleRenderer.container);

    this.controlsOverlay = new CinematicControlsOverlay(
      () => this.handleSkipRequest(),
      () => this.handleTogglePause()
    );
    this.container.addChild(this.controlsOverlay.container);

    // 3. Instantiate Central Sequencer
    this.sequencer = new CinematicSequencer({
      config: INTRO_CINEMATIC_SEQUENCE,
      stageContainer: this.stageContainer,
      subtitleRenderer: this.subtitleRenderer,
      controlsOverlay: this.controlsOverlay,
      cameraSystem: this.cameraSystem,
      eventBus: this.eventBus,
      onComplete: () => {
        this.proceedToDestination();
      },
    });

    Logger.info('INTRO_CINEMATIC', 'Introductory Cinematic Scene initialized successfully.');
  }

  protected override async onActivate(payload?: any): Promise<void> {
    super.onActivate(payload);

    this.isReplay = Boolean(payload?.isReplay);
    this.returnToTitleOnComplete = Boolean(payload?.returnToTitle);

    Logger.info(
      'INTRO_CINEMATIC',
      `Introductory Cinematic activated (Replay Mode: ${this.isReplay}).`
    );

    // Play cinematic musical score
    if (this.audioService) {
      this.audioService.playMusic('cinematic_intro', true, 1200);
    }

    // Start 6-act playback sequence
    this.sequencer.start();
  }

  protected onUpdate(deltaSeconds: number): void {
    // 1. Handle Keyboard Controls
    if (this.inputManager) {
      if (this.inputManager.isActionJustPressed(InputAction.Cancel)) {
        this.handleTogglePause();
      } else if (
        this.inputManager.isActionJustPressed(InputAction.Confirm) ||
        this.inputManager.isActionJustPressed(InputAction.Interact)
      ) {
        if (this.sequencer.getState() === CinematicPlaybackState.PAUSED) {
          this.sequencer.resume();
        } else {
          this.handleSkipRequest();
        }
      }
    }

    // 2. Update Sequencer & Overlays
    this.sequencer.update(deltaSeconds);
    this.subtitleRenderer.update(deltaSeconds);
    this.controlsOverlay.update(deltaSeconds);
  }

  public handleTogglePause(): void {
    this.sequencer.togglePause();
  }

  public handleSkipRequest(): void {
    Logger.info('INTRO_CINEMATIC', 'Skip requested during cinematic.');
    this.sequencer.skip();
  }

  public async proceedToDestination(): Promise<void> {
    Logger.info('INTRO_CINEMATIC', 'Cinematic complete. Navigating to destination...');

    if (!this.sceneManager) return;

    if (this.isReplay && this.returnToTitleOnComplete) {
      await this.sceneManager.switchScene(SceneId.TITLE_SCREEN, {
        transition: new FadeTransition(0.5),
      });
      return;
    }

    // Default destination: Earth Headquarters campus with director spawned at the Arrival Gate
    await this.sceneManager.switchScene(SceneId.HEADQUARTERS, {
      transition: new FadeTransition(0.6),
      payload: {
        spawnX: 480,
        spawnY: 1350,
        isNewGame: !this.isReplay,
        isReplay: this.isReplay,
      },
    });
  }

  public getSequencer(): CinematicSequencer {
    return this.sequencer;
  }

  protected onCleanup(): void {
    Logger.info('INTRO_CINEMATIC', 'Cleaning up Introductory Cinematic Scene...');
    this.sequencer.destroy();
  }
}
