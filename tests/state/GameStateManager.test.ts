import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/state/GameStateManager';
import { EventBus } from '../../src/core/EventBus';

describe('GameStateManager', () => {
  let eventBus: EventBus;
  let stateManager: GameStateManager;

  beforeEach(() => {
    eventBus = new EventBus();
    stateManager = new GameStateManager(eventBus);
  });

  it('initializes with modular game state slices', () => {
    const state = stateManager.getState();

    expect(state.organisation.agencyName).toBe('Astra Continuum Project');
    expect(state.resources.credits).toBe(500000);
    expect(state.player.bodyId).toBe('EARTH');
    expect(state.research.unlockedNodeIds.length).toBeGreaterThan(0);
    expect(state.destinations.unlockedBodyIds).toContain('EARTH');
    expect(state.buildings.mission_control).toBeDefined();
    expect(state.multiplayer.isMultiplayer).toBe(false);
  });

  it('updates player position and emits PlayerMoved event', () => {
    let capturedEvent: any = null;
    eventBus.on('PlayerMoved', (payload) => {
      capturedEvent = payload;
    });

    stateManager.updatePlayerPosition(500, 250, 45, 10, 'MOON');

    expect(stateManager.getState().player.worldCoords.x).toBe(500);
    expect(stateManager.getState().player.worldCoords.y).toBe(250);
    expect(stateManager.getState().player.bodyId).toBe('MOON');

    expect(capturedEvent).not.toBeNull();
    expect(capturedEvent.x).toBe(500);
    expect(capturedEvent.heading).toBe(45);
  });

  it('adjusts credits and grants resources with event emission', () => {
    let creditsDelta = 0;
    eventBus.on('CreditsChanged', (payload) => {
      creditsDelta = payload.delta;
    });

    stateManager.adjustCredits(100000, 'contract_reward');
    expect(stateManager.getState().resources.credits).toBe(600000);
    expect(creditsDelta).toBe(100000);

    stateManager.grantResources({ rawMaterials: 50, researchData: 25 }, 'mining');
    expect(stateManager.getState().resources.rawMaterials).toBe(150);
    expect(stateManager.getState().resources.researchData).toBe(75);
  });

  it('unlocks technology nodes without duplicate unlocks', () => {
    let unlockedTech = '';
    eventBus.on('ResearchUnlocked', (payload) => {
      unlockedTech = payload.techId;
    });

    const firstUnlock = stateManager.unlockTechnology('tech_ion_propulsion', 'Propulsion', 50);
    expect(firstUnlock).toBe(true);
    expect(unlockedTech).toBe('tech_ion_propulsion');
    expect(stateManager.getState().research.unlockedNodeIds).toContain('tech_ion_propulsion');

    // Duplicate attempt returns false
    const secondUnlock = stateManager.unlockTechnology('tech_ion_propulsion');
    expect(secondUnlock).toBe(false);
  });

  it('manages mission start and completion', () => {
    stateManager.startMission('M-001', 'SUB-1', 'Karman Line Test');
    expect(stateManager.getState().mission.missionId).toBe('M-001');
    expect(stateManager.getState().mission.phase).toBe('FLIGHT');

    stateManager.completeMission(98);
    expect(stateManager.getState().mission.phase).toBe('COMPLETED');
    expect(stateManager.getState().completedMissions.completedMissionIds).toContain('M-001');
    expect(stateManager.getState().organisation.successfulMissions).toBe(1);
  });

  it('supports snapshots and state restoration', () => {
    stateManager.adjustCredits(250000, 'grant');
    const snapshot = stateManager.getSnapshot();

    stateManager.adjustCredits(-500000, 'loss');
    expect(stateManager.getState().resources.credits).toBe(250000);

    stateManager.restoreSnapshot(snapshot);
    expect(stateManager.getState().resources.credits).toBe(750000);
  });
});
