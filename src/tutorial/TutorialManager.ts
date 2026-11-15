/**
 * INTERSTELLAR CONTINUUM - Centralized Tutorial Manager Service
 * Orchestrates player onboarding, tutorial sequences, step progression,
 * condition evaluation, HUD panel guidance, waypoint markers, and persistence.
 */

import { EventBus } from '../core/EventBus';
import { Logger } from '../core/logging/Logger';
import {
  TutorialSequenceId,
  TutorialStep,
  TutorialProgressState,
  DEFAULT_TUTORIAL_STATE,
  TutorialStepContext,
  TutorialHighlightTarget,
} from './TutorialTypes';
import { createInitialOnboardingSequence } from './sequences/InitialOnboardingSequence';
import { InputManager } from '../input/InputManager';
import { FacilityRegistry } from '../facilities/FacilityRegistry';

export class TutorialManager {
  private static instance?: TutorialManager;

  private state: TutorialProgressState;
  private sequences: Map<string, TutorialStep[]> = new Map();
  private eventBus?: EventBus;
  private inputManager?: InputManager;
  private facilityRegistry?: FacilityRegistry;

  private stepTimer: number = 0;
  private distanceAccumulator: number = 0;
  private lastPlayerPos?: { x: number; y: number };

  constructor(
    eventBus?: EventBus,
    inputManager?: InputManager,
    facilityRegistry?: FacilityRegistry
  ) {
    this.eventBus = eventBus;
    this.inputManager = inputManager;
    this.facilityRegistry = facilityRegistry;
    this.state = {
      ...DEFAULT_TUTORIAL_STATE,
      completedStepIds: [],
      completedSequenceIds: [],
    };

    // Register initial sequence by default
    this.registerSequence(
      TutorialSequenceId.INITIAL_ONBOARDING,
      createInitialOnboardingSequence(this.inputManager, this.facilityRegistry)
    );

    Logger.info('TUTORIAL_MANAGER', 'TutorialManager service initialized.');
  }

  public static getInstance(
    eventBus?: EventBus,
    inputManager?: InputManager,
    facilityRegistry?: FacilityRegistry
  ): TutorialManager {
    if (!TutorialManager.instance) {
      TutorialManager.instance = new TutorialManager(
        eventBus,
        inputManager,
        facilityRegistry
      );
    } else {
      if (eventBus && !TutorialManager.instance.eventBus) {
        TutorialManager.instance.setEventBus(eventBus);
      }
      if (inputManager && !TutorialManager.instance.inputManager) {
        TutorialManager.instance.setInputManager(inputManager);
      }
      if (facilityRegistry && !TutorialManager.instance.facilityRegistry) {
        TutorialManager.instance.setFacilityRegistry(facilityRegistry);
      }
    }
    return TutorialManager.instance;
  }

  public static resetInstance(): void {
    if (TutorialManager.instance) {
      TutorialManager.instance.reset();
      TutorialManager.instance = undefined;
    }
  }

  public setEventBus(bus: EventBus): void {
    this.eventBus = bus;
  }

  public setInputManager(im: InputManager): void {
    this.inputManager = im;
    // Re-register initial sequence with updated input bindings
    this.registerSequence(
      TutorialSequenceId.INITIAL_ONBOARDING,
      createInitialOnboardingSequence(this.inputManager, this.facilityRegistry)
    );
  }

  public setFacilityRegistry(registry: FacilityRegistry): void {
    this.facilityRegistry = registry;
    this.registerSequence(
      TutorialSequenceId.INITIAL_ONBOARDING,
      createInitialOnboardingSequence(this.inputManager, this.facilityRegistry)
    );
  }

  public registerSequence(sequenceId: string, steps: TutorialStep[]): void {
    this.sequences.set(sequenceId, [...steps]);
    Logger.debug(
      'TUTORIAL_MANAGER',
      `Registered tutorial sequence '${sequenceId}' with ${steps.length} steps.`
    );
  }

  public getSequence(sequenceId: string): TutorialStep[] | undefined {
    return this.sequences.get(sequenceId);
  }

  public isEnabled(): boolean {
    return this.state.tutorialsEnabled;
  }

  public setEnabled(enabled: boolean): void {
    this.state.tutorialsEnabled = enabled;
    this.eventBus?.emit('tutorial:enabled-changed', { enabled });
    Logger.info(
      'TUTORIAL_MANAGER',
      `Tutorial system ${enabled ? 'ENABLED' : 'DISABLED'}.`
    );
  }

  /**
   * Starts a sequence. If already completed and forceReplay is false, ignores it.
   */
  public startSequence(sequenceId: string, forceReplay: boolean = false): boolean {
    if (!this.state.tutorialsEnabled) {
      Logger.debug('TUTORIAL_MANAGER', 'Tutorial ignored because tutorials are disabled.');
      return false;
    }

    const steps = this.sequences.get(sequenceId);
    if (!steps || steps.length === 0) {
      Logger.warn('TUTORIAL_MANAGER', `Cannot start unknown sequence: ${sequenceId}`);
      return false;
    }

    if (!forceReplay && this.state.completedSequenceIds.includes(sequenceId)) {
      Logger.info(
        'TUTORIAL_MANAGER',
        `Sequence '${sequenceId}' already completed. Skipping replay.`
      );
      return false;
    }

    this.state.hasStarted = true;
    this.state.isSkipped = false;
    this.state.isDismissed = false;
    this.state.activeSequenceId = sequenceId;
    this.state.currentStepIndex = 0;
    this.state.lastActiveTimestamp = Date.now();
    this.stepTimer = 0;
    this.distanceAccumulator = 0;

    const currentStep = steps[0];
    if (!currentStep) return false;

    Logger.info(
      'TUTORIAL_MANAGER',
      `Starting tutorial sequence: ${sequenceId} (Step 1/${steps.length}: ${currentStep.title})`
    );

    this.eventBus?.emit('tutorial:started', {
      sequenceId,
      step: currentStep,
      totalSteps: steps.length,
    });

    this.eventBus?.emit('tutorial:step-changed', {
      sequenceId,
      step: currentStep,
      stepIndex: 1,
      totalSteps: steps.length,
    });

    return true;
  }

  public advanceStep(): boolean {
    if (!this.state.activeSequenceId) return false;

    const steps = this.sequences.get(this.state.activeSequenceId);
    if (!steps) return false;

    const completedStep = steps[this.state.currentStepIndex];
    if (completedStep && !this.state.completedStepIds.includes(completedStep.id)) {
      this.state.completedStepIds.push(completedStep.id);
      this.eventBus?.emit('tutorial:step-completed', {
        sequenceId: this.state.activeSequenceId,
        stepId: completedStep.id,
      });
    }

    const nextIndex = this.state.currentStepIndex + 1;
    if (nextIndex < steps.length) {
      const nextStep = steps[nextIndex];
      if (!nextStep) return false;

      this.state.currentStepIndex = nextIndex;
      this.stepTimer = 0;
      this.distanceAccumulator = 0;

      Logger.info(
        'TUTORIAL_MANAGER',
        `Advanced to step ${nextIndex + 1}/${steps.length}: ${nextStep.title}`
      );

      this.eventBus?.emit('tutorial:step-changed', {
        sequenceId: this.state.activeSequenceId,
        step: nextStep,
        stepIndex: nextIndex + 1,
        totalSteps: steps.length,
      });
      return true;
    } else {
      // Sequence completed!
      this.completeSequence();
      return false;
    }
  }

  public previousStep(): boolean {
    if (!this.state.activeSequenceId) return false;

    const steps = this.sequences.get(this.state.activeSequenceId);
    if (!steps) return false;

    if (this.state.currentStepIndex > 0) {
      this.state.currentStepIndex--;
      this.stepTimer = 0;
      this.distanceAccumulator = 0;
      const step = steps[this.state.currentStepIndex];
      if (!step) return false;

      this.eventBus?.emit('tutorial:step-changed', {
        sequenceId: this.state.activeSequenceId,
        step,
        stepIndex: this.state.currentStepIndex + 1,
        totalSteps: steps.length,
      });
      return true;
    }
    return false;
  }

  private completeSequence(): void {
    const seqId = this.state.activeSequenceId;
    if (!seqId) return;

    if (!this.state.completedSequenceIds.includes(seqId)) {
      this.state.completedSequenceIds.push(seqId);
    }

    if (seqId === TutorialSequenceId.INITIAL_ONBOARDING) {
      this.state.isOnboardingComplete = true;
    }

    this.state.activeSequenceId = null;
    this.state.currentStepIndex = 0;
    this.state.lastActiveTimestamp = Date.now();

    Logger.info('TUTORIAL_MANAGER', `Completed tutorial sequence: ${seqId}`);
    this.eventBus?.emit('tutorial:completed', { sequenceId: seqId });
  }

  public skipCurrentSequence(): void {
    const seqId = this.state.activeSequenceId;
    if (!seqId) return;

    this.state.isSkipped = true;
    this.state.activeSequenceId = null;
    this.state.lastActiveTimestamp = Date.now();

    if (seqId === TutorialSequenceId.INITIAL_ONBOARDING) {
      this.state.isOnboardingComplete = true;
    }

    if (!this.state.completedSequenceIds.includes(seqId)) {
      this.state.completedSequenceIds.push(seqId);
    }

    Logger.info('TUTORIAL_MANAGER', `Skipped tutorial sequence: ${seqId}`);
    this.eventBus?.emit('tutorial:skipped', { sequenceId: seqId });
  }

  public dismissGuidance(): void {
    this.state.isDismissed = true;
    this.eventBus?.emit('tutorial:dismissed', { isDismissed: true });
  }

  public resumeGuidance(): void {
    this.state.isDismissed = false;
    this.eventBus?.emit('tutorial:dismissed', { isDismissed: false });
  }

  public toggleDismiss(): void {
    if (this.state.isDismissed) {
      this.resumeGuidance();
    } else {
      this.dismissGuidance();
    }
  }

  public replayOnboarding(): void {
    Logger.info('TUTORIAL_MANAGER', 'Manual replay of Initial Onboarding requested.');
    this.startSequence(TutorialSequenceId.INITIAL_ONBOARDING, true);
  }

  public getCurrentStep(): TutorialStep | null {
    if (!this.state.activeSequenceId) return null;
    const steps = this.sequences.get(this.state.activeSequenceId);
    if (!steps || this.state.currentStepIndex >= steps.length) return null;
    return steps[this.state.currentStepIndex] ?? null;
  }

  public getActiveHighlight(): TutorialHighlightTarget | null {
    const step = this.getCurrentStep();
    if (!step || this.state.isDismissed || step.highlight.type === 'NONE') {
      return null;
    }
    return step.highlight;
  }

  public getState(): Readonly<TutorialProgressState> {
    return this.state;
  }

  public loadState(saved: Partial<TutorialProgressState>): void {
    this.state = {
      ...DEFAULT_TUTORIAL_STATE,
      ...saved,
      completedStepIds: Array.isArray(saved.completedStepIds)
        ? [...saved.completedStepIds]
        : [],
      completedSequenceIds: Array.isArray(saved.completedSequenceIds)
        ? [...saved.completedSequenceIds]
        : [],
    };
    Logger.info(
      'TUTORIAL_MANAGER',
      `Loaded tutorial progress: Onboarding Complete=${this.state.isOnboardingComplete}, Completed Seqs=[${this.state.completedSequenceIds.join(', ')}]`
    );
  }

  public saveState(): TutorialProgressState {
    return {
      ...this.state,
      completedStepIds: [...this.state.completedStepIds],
      completedSequenceIds: [...this.state.completedSequenceIds],
      lastActiveTimestamp: Date.now(),
    };
  }

  public update(deltaSeconds: number, context: Partial<TutorialStepContext>): void {
    if (!this.state.tutorialsEnabled || !this.state.activeSequenceId) return;

    const currentStep = this.getCurrentStep();
    if (!currentStep) return;

    this.stepTimer += deltaSeconds;

    // Track player movement distance for condition auto-progression
    if (typeof context.playerX === 'number' && typeof context.playerY === 'number') {
      if (this.lastPlayerPos) {
        const dx = context.playerX - this.lastPlayerPos.x;
        const dy = context.playerY - this.lastPlayerPos.y;
        const moved = Math.hypot(dx, dy);
        if (moved > 0.1 && moved < 500) {
          // accumulate valid walking movement, ignore massive screen teleports
          this.distanceAccumulator += moved;
        }
      }
      this.lastPlayerPos = { x: context.playerX, y: context.playerY };
    }

    const fullContext: TutorialStepContext = {
      playerX: context.playerX ?? 0,
      playerY: context.playerY ?? 0,
      playerMovedDistance: this.distanceAccumulator,
      visitedFacilityCount: context.visitedFacilityCount ?? 0,
      activeTargetId: context.activeTargetId ?? null,
      keysPressed: context.keysPressed ?? new Set(),
    };

    // If step has an auto-progress check and minimum duration elapsed (e.g. 0.8s), evaluate it
    if (this.stepTimer >= (currentStep.minDurationSeconds ?? 0.8)) {
      if (currentStep.autoProgressCheck && currentStep.autoProgressCheck(fullContext)) {
        Logger.info(
          'TUTORIAL_MANAGER',
          `Auto-progression condition met for step: ${currentStep.id}`
        );
        this.advanceStep();
      }
    }
  }

  public reset(): void {
    this.state = {
      ...DEFAULT_TUTORIAL_STATE,
      completedStepIds: [],
      completedSequenceIds: [],
    };
    this.stepTimer = 0;
    this.distanceAccumulator = 0;
    this.lastPlayerPos = undefined;
  }
}
