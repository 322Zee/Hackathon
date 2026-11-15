import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { InteractionSystem } from '../../src/interaction/InteractionSystem';
import { InteractiveObject } from '../../src/interaction/InteractiveObject';
import { BuildingEntrance } from '../../src/interaction/BuildingEntrance';
import { SystemId } from '../../src/systems/interfaces/IGameSystem';
import { EventBus } from '../../src/core/EventBus';
import { InputManager } from '../../src/input/InputManager';

describe('InteractionSystem', () => {
  let interactionSystem: InteractionSystem;
  let eventBus: EventBus;
  let inputManager: InputManager;
  let mockPlayer: any;

  beforeEach(() => {
    eventBus = new EventBus();
    inputManager = new InputManager();
    inputManager.initialize();

    mockPlayer = {
      id: 'mission_director',
      x: 500,
      y: 500,
      getPosition: vi.fn().mockReturnValue({ x: 500, y: 500 }),
      playInteraction: vi.fn(),
      playEnterBuilding: vi.fn(),
      playExitBuilding: vi.fn(),
    };

    interactionSystem = new InteractionSystem({
      eventBus,
      inputManager,
    });
    interactionSystem.setPlayer(mockPlayer);
    interactionSystem.initialize();
  });

  afterEach(() => {
    interactionSystem.shutdown();
  });

  it('initializes with correct SystemId and priority 14', () => {
    expect(interactionSystem.id).toBe(SystemId.INTERACTION);
    expect(interactionSystem.priority).toBe(14);
  });

  it('manages object registry (register, retrieve, unregister)', () => {
    const obj = new InteractiveObject({
      id: 'terminal_hq',
      displayName: 'HQ Terminal',
      x: 520,
      y: 500,
    });

    interactionSystem.registerObject(obj);
    expect(interactionSystem.getObject('terminal_hq')).toBe(obj);
    expect(interactionSystem.getAllObjects()).toHaveLength(1);

    interactionSystem.unregisterObject('terminal_hq');
    expect(interactionSystem.getObject('terminal_hq')).toBeUndefined();
    expect(interactionSystem.getAllObjects()).toHaveLength(0);
  });

  it('discovers nearby targets and updates active target on update', () => {
    const inRangeObj = new InteractiveObject({
      id: 'console_in_range',
      displayName: 'Near Console',
      x: 530,
      y: 500,
      interactionRadius: 80,
    });

    const outRangeObj = new InteractiveObject({
      id: 'console_far',
      displayName: 'Far Console',
      x: 800,
      y: 800,
      interactionRadius: 80,
    });

    interactionSystem.registerObject(inRangeObj);
    interactionSystem.registerObject(outRangeObj);

    interactionSystem.update(0.016);

    expect(interactionSystem.getActiveTarget()).toBe(inRangeObj);

    const nearby = interactionSystem.getNearbyObjects(500, 500);
    expect(nearby).toHaveLength(1);
    expect(nearby[0]).toBe(inRangeObj);
  });

  it('executes interaction pipeline: locks input, triggers animation, emits events, and unlocks input', async () => {
    let requestedEmitted = false;
    let completedEmitted = false;
    let executedEmitted = false;

    eventBus.on('InteractionRequested', (payload) => {
      if (payload.targetId === 'test_station') requestedEmitted = true;
    });

    eventBus.on('interaction:executed', (payload) => {
      if (payload.targetId === 'test_station') executedEmitted = true;
    });

    eventBus.on('InteractionCompleted', (payload) => {
      if (payload.targetId === 'test_station') completedEmitted = true;
    });

    const obj = new InteractiveObject({
      id: 'test_station',
      displayName: 'Telemetry Station',
      x: 520,
      y: 500,
      interactionRadius: 80,
      onInteract: async () => {
        expect(inputManager.isInputLocked()).toBe(true);
        return {
          success: true,
          action: 'TRIGGER_ACTION',
          message: 'Station telemetry calibrated',
        };
      },
    });

    interactionSystem.registerObject(obj);
    interactionSystem.update(0.016);

    expect(interactionSystem.getActiveTarget()).toBe(obj);

    const result = await interactionSystem.interactWithActiveTarget();
    expect(result).not.toBeNull();
    expect(result!.success).toBe(true);
    expect(result!.message).toBe('Station telemetry calibrated');

    expect(mockPlayer.playInteraction).toHaveBeenCalled();
    expect(requestedEmitted).toBe(true);
    expect(executedEmitted).toBe(true);
    expect(completedEmitted).toBe(true);
    expect(inputManager.isInputLocked()).toBe(false);
  });

  it('triggers custom building animations on player for building entrances', async () => {
    const airlock = new BuildingEntrance({
      id: 'airlock_entrance',
      buildingId: 'ENGINEERING_BAY',
      interiorId: 'HANGAR',
      displayName: 'Engineering Hangar',
      x: 520,
      y: 500,
    });

    interactionSystem.registerObject(airlock);
    interactionSystem.update(0.016);

    await interactionSystem.interactWithActiveTarget();
    expect(mockPlayer.playEnterBuilding).toHaveBeenCalled();
    expect(inputManager.isInputLocked()).toBe(false);
  });

  it('safely recovers and unlocks input if interaction handler throws', async () => {
    const faultyObj = new InteractiveObject({
      id: 'faulty_terminal',
      displayName: 'Faulty Terminal',
      x: 510,
      y: 500,
      onInteract: async () => {
        throw new Error('Hardware connection severed!');
      },
    });

    interactionSystem.registerObject(faultyObj);
    interactionSystem.update(0.016);

    const result = await interactionSystem.interactWithActiveTarget();
    expect(result!.success).toBe(false);
    expect(result!.message).toContain('Hardware connection severed');
    // Crucial safety check: player input must NOT remain locked!
    expect(inputManager.isInputLocked()).toBe(false);
  });

  it('opens information modal when action returns OPEN_PANEL', async () => {
    const consoleObj = new InteractiveObject({
      id: 'data_panel_obj',
      displayName: 'Info Kiosk',
      x: 510,
      y: 500,
      onInteract: async () => {
        return {
          success: true,
          action: 'OPEN_PANEL',
          data: {
            title: 'MISSION ROADMAP',
            category: 'RESEARCH',
            description: 'Overview of orbital trajectory goals.',
          },
        };
      },
    });

    interactionSystem.registerObject(consoleObj);
    interactionSystem.update(0.016);

    const infoPanel = interactionSystem.getInformationPanel();
    expect(infoPanel.isOpen()).toBe(false);

    await interactionSystem.interactWithActiveTarget();

    expect(infoPanel.isOpen()).toBe(true);
    expect(inputManager.isInputLocked()).toBe(true);

    // Dismiss modal via Escape key
    infoPanel.handleKeyDown('Escape');
    expect(infoPanel.isOpen()).toBe(false);
    expect(inputManager.isInputLocked()).toBe(false);
  });
});
