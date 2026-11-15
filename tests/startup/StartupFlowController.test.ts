/**
 * INTERSTELLAR CONTINUUM - Startup Flow Controller Unit Tests
 * Verifies first-time vs. returning player evaluation, save profile restoration,
 * overwrite prevention, and scene destination routing.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  StartupFlowController,
  PlayerStartupType,
} from '../../src/startup/StartupFlowController';
import { SaveService } from '../../src/services/SaveService';
import { GameStateManager } from '../../src/state/GameStateManager';
import { SceneManager } from '../../src/scenes/SceneManager';
import { SceneId } from '../../src/scenes/SceneId';
import { EventBus } from '../../src/core/EventBus';
import { Container } from 'pixi.js';

describe('StartupFlowController', () => {
  let controller: StartupFlowController;
  let saveService: SaveService;
  let gameStateManager: GameStateManager;
  let sceneManager: SceneManager;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    saveService = new SaveService();
    // Clear save slot 1 for clean testing
    saveService.deleteSlot(1);

    gameStateManager = new GameStateManager(eventBus);

    const rootContainer = new Container();
    const overlayContainer = new Container();
    sceneManager = new SceneManager(rootContainer, overlayContainer, eventBus);

    controller = new StartupFlowController({
      saveSlot: 1,
      saveService,
      gameStateManager,
      sceneManager,
      eventBus,
    });
  });

  it('correctly evaluates first-time player status when no save exists', () => {
    expect(controller.canContinue()).toBe(false);
    expect(controller.getSavedAgencyInfo()).toBeNull();
    expect(controller.getPlayerStartupType()).toBe(PlayerStartupType.FIRST_TIME);
  });

  it('correctly evaluates returning player status when an existing save profile is present', () => {
    const newSave = saveService.createNewGame();
    newSave.agency.agencyName = 'Orion Exploration Group';
    newSave.agency.rank = 2;
    newSave.agency.rankTitle = 'Senior Flight Director';
    saveService.saveToSlot(1, newSave);

    expect(controller.canContinue()).toBe(true);
    expect(controller.getPlayerStartupType()).toBe(PlayerStartupType.RETURNING);

    const agency = controller.getSavedAgencyInfo();
    expect(agency).toBeDefined();
    expect(agency?.agencyName).toBe('Orion Exploration Group');
    expect(agency?.rank).toBe(2);
  });

  it('rejects continue request when no save file exists', async () => {
    const success = await controller.continueGame();
    expect(success).toBe(false);
  });

  it('restores saved state and dispatches continue event for returning players', async () => {
    const saveState = saveService.createNewGame();
    saveState.agency.agencyName = 'Continuum Vanguard';
    saveState.resources.credits = 1250000;
    saveService.saveToSlot(1, saveState);

    let continueEvent: any = null;
    let destinationEvent: any = null;
    eventBus.on('startup:continue', (payload) => {
      continueEvent = payload;
    });
    eventBus.on('startup:destination-changed', (payload) => {
      destinationEvent = payload;
    });

    const success = await controller.continueGame();
    expect(success).toBe(true);
    expect(continueEvent).toEqual({
      agencyName: 'Continuum Vanguard',
      rank: 1,
    });
    expect(destinationEvent?.destination).toBe(SceneId.HEADQUARTERS);

    // Verify state was restored into GameStateManager
    const restored = gameStateManager.getState();
    expect(restored.organisation.agencyName).toBe('Continuum Vanguard');
    expect(restored.resources.credits).toBe(1250000);
  });

  it('protects existing saves from silent overwrite unless explicit confirmation is provided', async () => {
    const existing = saveService.createNewGame();
    existing.agency.agencyName = 'Protected Pioneer Inc';
    saveService.saveToSlot(1, existing);

    // Starting new organisation without overwrite flag must be rejected
    const blocked = await controller.startNewOrganisation(false);
    expect(blocked).toBe(false);

    // Existing save must remain untouched
    const current = saveService.loadFromSlot(1);
    expect(current?.agency.agencyName).toBe('Protected Pioneer Inc');

    // Starting new organisation with overwrite = true must succeed
    const confirmed = await controller.startNewOrganisation(true);
    expect(confirmed).toBe(true);

    const overwritten = saveService.loadFromSlot(1);
    expect(overwritten?.agency.agencyName).toBe('Astra Continuum Project');
    expect(controller.isFirstTimeIntroPending()).toBe(true);
  });

  it('replays introduction cinematic without mutating or resetting existing organisation save', async () => {
    const existing = saveService.createNewGame();
    existing.agency.agencyName = 'Veteran Space Corp';
    existing.resources.credits = 999999;
    saveService.saveToSlot(1, existing);

    let replayEventEmitted = false;
    eventBus.on('startup:replay-intro', () => {
      replayEventEmitted = true;
    });

    const success = await controller.replayIntroduction();
    expect(success).toBe(true);
    expect(replayEventEmitted).toBe(true);
    expect(controller.isReplayMode()).toBe(true);

    // Existing save remains intact
    const saveAfter = saveService.loadFromSlot(1);
    expect(saveAfter?.agency.agencyName).toBe('Veteran Space Corp');
    expect(saveAfter?.resources.credits).toBe(999999);

    // Concluding cinematic resolves destination to Headquarters
    const dest = controller.onCinematicComplete();
    expect(dest).toBe(SceneId.HEADQUARTERS);
    expect(controller.isReplayMode()).toBe(false);
  });
});
