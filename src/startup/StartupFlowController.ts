/**
 * INTERSTELLAR CONTINUUM - Centralized Startup Flow Controller
 * Manages player startup states (First-time vs. Returning vs. New Organisation),
 * save profile verification, overwrite confirmation, and scene routing.
 */

import { EventBus } from '../core/EventBus';
import { Logger } from '../core/logging/Logger';
import { SaveService } from '../services/SaveService';
import { GameStateManager } from '../state/GameStateManager';
import { SceneManager } from '../scenes/SceneManager';
import { SceneId, SceneIdType } from '../scenes/SceneId';
import { AgencyProfile, GameSaveSchema } from '../core/GameState';
import { FadeTransition } from '../scenes/transitions/FadeTransition';

export enum StartupDestination {
  TITLE_SCREEN = 'TITLE_SCREEN',
  MAIN_MENU = 'MAIN_MENU',
  INTRO_CINEMATIC = 'INTRO_CINEMATIC',
  HEADQUARTERS = 'HEADQUARTERS',
  SETTINGS = 'SETTINGS',
  CREDITS = 'CREDITS',
}

export enum PlayerStartupType {
  FIRST_TIME = 'FIRST_TIME',
  RETURNING = 'RETURNING',
}

export interface StartupFlowConfig {
  saveSlot?: number;
  saveService?: SaveService;
  gameStateManager?: GameStateManager;
  sceneManager?: SceneManager;
  eventBus?: EventBus;
}

export class StartupFlowController {
  private saveSlot: number = 1;
  private saveService: SaveService;
  private gameStateManager?: GameStateManager;
  private sceneManager?: SceneManager;
  private eventBus?: EventBus;

  private isFirstTimeIntroductionPending: boolean = false;
  private isReplayIntroductionMode: boolean = false;

  constructor(config: StartupFlowConfig = {}) {
    this.saveSlot = config.saveSlot ?? 1;
    this.saveService = config.saveService ?? new SaveService();
    this.gameStateManager = config.gameStateManager;
    this.sceneManager = config.sceneManager;
    this.eventBus = config.eventBus;

    Logger.info('STARTUP_FLOW', 'StartupFlowController initialized.');
  }

  public setServices(services: {
    saveService?: SaveService;
    gameStateManager?: GameStateManager;
    sceneManager?: SceneManager;
    eventBus?: EventBus;
  }): void {
    if (services.saveService) this.saveService = services.saveService;
    if (services.gameStateManager) this.gameStateManager = services.gameStateManager;
    if (services.sceneManager) this.sceneManager = services.sceneManager;
    if (services.eventBus) this.eventBus = services.eventBus;
  }

  /**
   * Evaluates whether a valid saved organisation exists.
   */
  public canContinue(): boolean {
    return this.saveService.hasSave(this.saveSlot);
  }

  /**
   * Retrieves summary profile of the active saved organisation if it exists.
   */
  public getSavedAgencyInfo(): AgencyProfile | null {
    if (!this.canContinue()) return null;
    const save = this.saveService.loadFromSlot(this.saveSlot);
    return save ? save.agency : null;
  }

  /**
   * Evaluates the player's status on startup.
   */
  public getPlayerStartupType(): PlayerStartupType {
    return this.canContinue() ? PlayerStartupType.RETURNING : PlayerStartupType.FIRST_TIME;
  }

  /**
   * Action: CONTINUE
   * Restores existing organisation save and routes directly to Headquarters without repeating intro cinematic.
   */
  public async continueGame(): Promise<boolean> {
    if (!this.canContinue()) {
      Logger.warn('STARTUP_FLOW', 'Cannot continue: No valid saved organisation found.');
      return false;
    }

    const savedState = this.saveService.loadFromSlot(this.saveSlot);
    if (!savedState) {
      Logger.error('STARTUP_FLOW', `Failed to load save data from slot ${this.saveSlot}.`);
      return false;
    }

    Logger.info(
      'STARTUP_FLOW',
      `Restoring organisation "${savedState.agency.agencyName}" (Rank ${savedState.agency.rank}).`
    );

    // Apply save data to GameStateManager if present
    if (this.gameStateManager) {
      this.applySaveToGameStateManager(savedState);
    }

    this.isFirstTimeIntroductionPending = false;
    this.isReplayIntroductionMode = false;

    if (this.eventBus) {
      this.eventBus.emit('startup:continue', {
        agencyName: savedState.agency.agencyName,
        rank: savedState.agency.rank,
      });
      this.eventBus.emit('startup:destination-changed', {
        destination: SceneId.HEADQUARTERS,
      });
    }

    // Transition directly to Headquarters if available
    if (this.sceneManager) {
      if (this.sceneManager.has(SceneId.HEADQUARTERS)) {
        return await this.sceneManager.switchScene(SceneId.HEADQUARTERS, {
          transition: new FadeTransition(0.4),
        });
      }
      return true;
    }

    return true;
  }

  /**
   * Action: NEW ORGANISATION
   * Initializes default game state, marks introduction flag, and prepares route to Introductory Cinematic.
   */
  public async startNewOrganisation(overwrite: boolean = false): Promise<boolean> {
    if (this.canContinue() && !overwrite) {
      Logger.warn(
        'STARTUP_FLOW',
        'Cannot start new organisation: Existing save found and overwrite not confirmed.'
      );
      return false;
    }

    Logger.info('STARTUP_FLOW', 'Initializing new organisation venture...');
    const defaultState = this.saveService.createNewGame();
    this.saveService.saveToSlot(this.saveSlot, defaultState);

    if (this.gameStateManager) {
      this.applySaveToGameStateManager(defaultState);
    }

    this.isFirstTimeIntroductionPending = true;
    this.isReplayIntroductionMode = false;

    if (this.eventBus) {
      this.eventBus.emit('startup:new-game', { overwrite });
      this.eventBus.emit('startup:destination-changed', {
        destination: SceneId.INTRO_CINEMATIC,
      });
    }

    // Transition to Introductory Cinematic (or fallback to Headquarters if cinematic not registered)
    if (this.sceneManager) {
      const destination = this.sceneManager.has(SceneId.INTRO_CINEMATIC)
        ? SceneId.INTRO_CINEMATIC
        : this.sceneManager.has(SceneId.HEADQUARTERS)
        ? SceneId.HEADQUARTERS
        : null;

      if (destination) {
        return await this.sceneManager.switchScene(destination, {
          transition: new FadeTransition(0.5),
          payload: { isNewGame: true },
        });
      }
      return true;
    }

    return true;
  }

  /**
   * Action: REPLAY INTRODUCTION
   * Plays the introductory cinematic without resetting save progress or overwriting organisation resources.
   */
  public async replayIntroduction(): Promise<boolean> {
    Logger.info('STARTUP_FLOW', 'Replaying introductory cinematic without resetting progress.');
    this.isReplayIntroductionMode = true;

    if (this.eventBus) {
      this.eventBus.emit('startup:replay-intro', undefined);
      this.eventBus.emit('startup:destination-changed', {
        destination: SceneId.INTRO_CINEMATIC,
      });
    }

    if (this.sceneManager) {
      const destination = this.sceneManager.has(SceneId.INTRO_CINEMATIC)
        ? SceneId.INTRO_CINEMATIC
        : this.sceneManager.has(SceneId.HEADQUARTERS)
        ? SceneId.HEADQUARTERS
        : null;

      if (destination) {
        return await this.sceneManager.switchScene(destination, {
          transition: new FadeTransition(0.4),
          payload: { isReplay: true },
        });
      }
      return true;
    }

    return true;
  }

  /**
   * Evaluates the destination after the introductory cinematic concludes.
   */
  public onCinematicComplete(): SceneIdType {
    this.isFirstTimeIntroductionPending = false;
    this.isReplayIntroductionMode = false;
    return SceneId.HEADQUARTERS;
  }

  public isFirstTimeIntroPending(): boolean {
    return this.isFirstTimeIntroductionPending;
  }

  public isReplayMode(): boolean {
    return this.isReplayIntroductionMode;
  }

  private applySaveToGameStateManager(save: GameSaveSchema): void {
    if (!this.gameStateManager) return;
    const current = this.gameStateManager.getSnapshot();
    current.organisation = {
      ...current.organisation,
      agencyName: save.agency.agencyName,
      directorName: save.agency.directorName,
      rank: save.agency.rank,
      rankTitle: save.agency.rankTitle,
      foundedDate: save.agency.foundedDate,
      totalLaunches: save.agency.totalMissionsLaunched,
      successfulMissions: save.agency.totalMissionsSuccessful,
    };
    current.resources = { ...save.resources };
    current.research.unlockedNodeIds = [...save.unlockedTechnologies];
    current.completedMissions.completedMissionIds = [...save.completedMissions];
    this.gameStateManager.restoreSnapshot(current);
  }
}
