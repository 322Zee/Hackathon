import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EventBus } from '../../src/core/EventBus';
import { TutorialManager } from '../../src/tutorial/TutorialManager';
import { TutorialSequenceId, TutorialStepId } from '../../src/tutorial/TutorialTypes';
import { FacilityRegistry } from '../../src/facilities/FacilityRegistry';
import { InputManager } from '../../src/input/InputManager';

describe('TutorialManager', () => {
  let eventBus: EventBus;
  let facilityRegistry: FacilityRegistry;
  let inputManager: InputManager;
  let tutorialManager: TutorialManager;

  beforeEach(() => {
    TutorialManager.resetInstance();
    eventBus = new EventBus();
    facilityRegistry = new FacilityRegistry(eventBus);
    inputManager = new InputManager();
    tutorialManager = new TutorialManager(eventBus, inputManager, facilityRegistry);
  });

  afterEach(() => {
    TutorialManager.resetInstance();
  });

  it('initializes with default state and registered initial onboarding sequence', () => {
    const state = tutorialManager.getState();
    expect(state.hasStarted).toBe(false);
    expect(state.isOnboardingComplete).toBe(false);
    expect(state.isSkipped).toBe(false);
    expect(state.tutorialsEnabled).toBe(true);

    const seq = tutorialManager.getSequence(TutorialSequenceId.INITIAL_ONBOARDING);
    expect(seq).toBeDefined();
    expect(seq?.length).toBe(7);
  });

  it('starts onboarding sequence and dispatches events', () => {
    let startedEvent: any = null;
    let stepChangedEvent: any = null;

    eventBus.on('tutorial:started', (payload) => {
      startedEvent = payload;
    });
    eventBus.on('tutorial:step-changed', (payload) => {
      stepChangedEvent = payload;
    });

    const started = tutorialManager.startSequence(TutorialSequenceId.INITIAL_ONBOARDING);
    expect(started).toBe(true);
    expect(startedEvent).toBeDefined();
    expect(startedEvent.sequenceId).toBe(TutorialSequenceId.INITIAL_ONBOARDING);
    expect(stepChangedEvent).toBeDefined();
    expect(stepChangedEvent.stepIndex).toBe(1);
    expect(stepChangedEvent.step.id).toBe(TutorialStepId.STEP_1_ARRIVAL);

    const currentStep = tutorialManager.getCurrentStep();
    expect(currentStep?.id).toBe(TutorialStepId.STEP_1_ARRIVAL);
  });

  it('advances through steps manually and marks completed step ids', () => {
    tutorialManager.startSequence(TutorialSequenceId.INITIAL_ONBOARDING);

    // Step 1 -> Step 2
    const adv1 = tutorialManager.advanceStep();
    expect(adv1).toBe(true);
    expect(tutorialManager.getCurrentStep()?.id).toBe(TutorialStepId.STEP_2_MOVEMENT);
    expect(tutorialManager.getState().completedStepIds).toContain(TutorialStepId.STEP_1_ARRIVAL);

    // Step 2 -> Step 3
    const adv2 = tutorialManager.advanceStep();
    expect(adv2).toBe(true);
    expect(tutorialManager.getCurrentStep()?.id).toBe(TutorialStepId.STEP_3_CAMPUS_EXPLORATION);
  });

  it('supports stepping backwards with previousStep', () => {
    tutorialManager.startSequence(TutorialSequenceId.INITIAL_ONBOARDING);
    tutorialManager.advanceStep(); // Step 2
    expect(tutorialManager.getCurrentStep()?.id).toBe(TutorialStepId.STEP_2_MOVEMENT);

    const steppedBack = tutorialManager.previousStep();
    expect(steppedBack).toBe(true);
    expect(tutorialManager.getCurrentStep()?.id).toBe(TutorialStepId.STEP_1_ARRIVAL);

    // Cannot step back before step 1
    const steppedBackAgain = tutorialManager.previousStep();
    expect(steppedBackAgain).toBe(false);
  });

  it('auto-progresses step 2 when player accumulates sufficient movement distance', () => {
    tutorialManager.startSequence(TutorialSequenceId.INITIAL_ONBOARDING);
    tutorialManager.advanceStep(); // Now at Step 2 (MOVEMENT)
    expect(tutorialManager.getCurrentStep()?.id).toBe(TutorialStepId.STEP_2_MOVEMENT);

    // Simulate small movements over time
    tutorialManager.update(1.0, { playerX: 100, playerY: 100 });
    tutorialManager.update(0.1, { playerX: 150, playerY: 100 });
    tutorialManager.update(0.1, { playerX: 230, playerY: 100 }); // Moved total > 120px

    expect(tutorialManager.getCurrentStep()?.id).toBe(TutorialStepId.STEP_3_CAMPUS_EXPLORATION);
  });

  it('auto-progresses step 3 when player approaches Mission Operations Centre', () => {
    tutorialManager.startSequence(TutorialSequenceId.INITIAL_ONBOARDING);
    tutorialManager.advanceStep(); // Step 2
    tutorialManager.advanceStep(); // Step 3 (MOC Exploration)
    expect(tutorialManager.getCurrentStep()?.id).toBe(TutorialStepId.STEP_3_CAMPUS_EXPLORATION);

    // Player far away
    tutorialManager.update(1.0, { playerX: 500, playerY: 500 });
    expect(tutorialManager.getCurrentStep()?.id).toBe(TutorialStepId.STEP_3_CAMPUS_EXPLORATION);

    // Player approaches MOC entrance at (1800, 1730)
    tutorialManager.update(0.5, { playerX: 1810, playerY: 1740 });
    expect(tutorialManager.getCurrentStep()?.id).toBe(TutorialStepId.STEP_4_FACILITY_DISCOVERY);
  });

  it('completes sequence on final step and sets isOnboardingComplete', () => {
    let completedEvent: any = null;
    eventBus.on('tutorial:completed', (payload) => {
      completedEvent = payload;
    });

    tutorialManager.startSequence(TutorialSequenceId.INITIAL_ONBOARDING);
    // Advance through all 7 steps
    for (let i = 1; i < 7; i++) {
      tutorialManager.advanceStep();
    }
    expect(tutorialManager.getCurrentStep()?.id).toBe(TutorialStepId.STEP_7_FREE_EXPLORATION);

    // Final step advance completes sequence
    const completedAdv = tutorialManager.advanceStep();
    expect(completedAdv).toBe(false);
    expect(tutorialManager.getCurrentStep()).toBeNull();
    expect(tutorialManager.getState().isOnboardingComplete).toBe(true);
    expect(tutorialManager.getState().completedSequenceIds).toContain(
      TutorialSequenceId.INITIAL_ONBOARDING
    );
    expect(completedEvent).toBeDefined();
  });

  it('allows skipping sequence immediately', () => {
    let skippedEvent: any = null;
    eventBus.on('tutorial:skipped', (payload) => {
      skippedEvent = payload;
    });

    tutorialManager.startSequence(TutorialSequenceId.INITIAL_ONBOARDING);
    tutorialManager.skipCurrentSequence();

    expect(tutorialManager.getCurrentStep()).toBeNull();
    expect(tutorialManager.getState().isSkipped).toBe(true);
    expect(tutorialManager.getState().isOnboardingComplete).toBe(true);
    expect(skippedEvent).toBeDefined();
  });

  it('does not re-trigger completed onboarding for returning players unless forceReplay is true', () => {
    tutorialManager.startSequence(TutorialSequenceId.INITIAL_ONBOARDING);
    tutorialManager.skipCurrentSequence(); // Marks onboarding completed

    // Returning player starts game
    const restarted = tutorialManager.startSequence(TutorialSequenceId.INITIAL_ONBOARDING, false);
    expect(restarted).toBe(false);

    // Player manually asks to replay onboarding from pause menu
    const forceRestarted = tutorialManager.startSequence(
      TutorialSequenceId.INITIAL_ONBOARDING,
      true
    );
    expect(forceRestarted).toBe(true);
    expect(tutorialManager.getCurrentStep()?.id).toBe(TutorialStepId.STEP_1_ARRIVAL);
  });

  it('persists and restores state accurately', () => {
    tutorialManager.startSequence(TutorialSequenceId.INITIAL_ONBOARDING);
    tutorialManager.advanceStep(); // Step 2

    const savedState = tutorialManager.saveState();
    expect(savedState.hasStarted).toBe(true);
    expect(savedState.completedStepIds).toContain(TutorialStepId.STEP_1_ARRIVAL);

    const newManager = new TutorialManager(eventBus, inputManager, facilityRegistry);
    newManager.loadState(savedState);

    expect(newManager.getState().hasStarted).toBe(true);
    expect(newManager.getState().completedStepIds).toContain(TutorialStepId.STEP_1_ARRIVAL);
  });
});
