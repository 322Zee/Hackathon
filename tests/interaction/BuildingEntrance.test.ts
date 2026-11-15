import { describe, it, expect } from 'vitest';
import { BuildingEntrance } from '../../src/interaction/BuildingEntrance';
import { InteractionCategory } from '../../src/interaction/InteractionTypes';
import { CharacterAnimationState } from '../../src/animation/AnimationTypes';
import { EventBus } from '../../src/core/EventBus';

describe('BuildingEntrance', () => {
  it('initializes entrance portal with appropriate defaults', () => {
    const entrance = new BuildingEntrance({
      id: 'airlock_eng',
      buildingId: 'ROCKET_ENGINEERING',
      interiorId: 'HANGAR_BAY',
      displayName: 'Rocket Engineering Hangar',
      x: 200,
      y: 300,
    });

    expect(entrance.category).toBe(InteractionCategory.BUILDING);
    expect(entrance.actionText).toBe('Enter Rocket Engineering Hangar');
    expect(entrance.customAnimation).toBe(CharacterAnimationState.ENTER_BUILDING);
    expect(entrance.isExit).toBe(false);
    expect(entrance.priority).toBe(5);
  });

  it('initializes exit portal with appropriate defaults', () => {
    const exitPortal = new BuildingEntrance({
      id: 'airlock_exit',
      buildingId: 'ROCKET_ENGINEERING',
      interiorId: 'HANGAR_BAY',
      displayName: 'Rocket Engineering Exit',
      x: 200,
      y: 300,
      isExit: true,
    });

    expect(exitPortal.category).toBe(InteractionCategory.DOOR);
    expect(exitPortal.actionText).toBe('Exit to Headquarters');
    expect(exitPortal.customAnimation).toBe(CharacterAnimationState.EXIT_BUILDING);
    expect(exitPortal.isExit).toBe(true);
  });

  it('dispatches entry events and returns ENTER_BUILDING action', async () => {
    const eventBus = new EventBus();
    let buildingEnteredEmitted = false;
    let domainEnteredEmitted = false;

    eventBus.on('building:entered', (payload) => {
      if (payload.buildingId === 'SCIENCE_LAB' && payload.interiorId === 'BIO_MODULE') {
        buildingEnteredEmitted = true;
      }
    });

    eventBus.on('BuildingEntered', (payload) => {
      if (payload.buildingId === 'SCIENCE_LAB') {
        domainEnteredEmitted = true;
      }
    });

    const entrance = new BuildingEntrance({
      id: 'science_entry',
      buildingId: 'SCIENCE_LAB',
      interiorId: 'BIO_MODULE',
      displayName: 'Science Lab',
      x: 500,
      y: 500,
    });

    const result = await entrance.onInteract({
      player: { id: 'director' },
      object: entrance,
      eventBus,
    });

    expect(result.success).toBe(true);
    expect(result.action).toBe('ENTER_BUILDING');
    expect(result.data.buildingId).toBe('SCIENCE_LAB');
    expect(buildingEnteredEmitted).toBe(true);
    expect(domainEnteredEmitted).toBe(true);
  });

  it('dispatches exit events and returns EXIT_BUILDING action', async () => {
    const eventBus = new EventBus();
    let exitedEmitted = false;

    eventBus.on('building:exited', (payload) => {
      if (payload.buildingId === 'SCIENCE_LAB') {
        exitedEmitted = true;
      }
    });

    const exitPortal = new BuildingEntrance({
      id: 'science_exit',
      buildingId: 'SCIENCE_LAB',
      interiorId: 'BIO_MODULE',
      displayName: 'Science Lab Exit',
      x: 500,
      y: 500,
      isExit: true,
    });

    const result = await exitPortal.onInteract({
      player: { id: 'director' },
      object: exitPortal,
      eventBus,
    });

    expect(result.success).toBe(true);
    expect(result.action).toBe('EXIT_BUILDING');
    expect(exitedEmitted).toBe(true);
  });
});
