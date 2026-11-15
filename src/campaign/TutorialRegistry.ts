/**
 * INTERSTELLAR CONTINUUM - Tutorial Registry & Interactive Guidance Service
 * Manages all 7 canonical operational tutorials: registration, discovery,
 * step execution, skip logic, replay capabilities, and settings persistence.
 */

import {
  TutorialCategory,
  TutorialDefinition,
  InteractiveTutorialStep,
  TutorialPreferences,
  DEFAULT_TUTORIAL_PREFERENCES,
} from './CampaignTypes';
import { TUTORIAL_DEFINITIONS } from './data/TutorialDefinitions';
import { CampaignEventBus } from './CampaignEventBus';
import { Logger } from '../core/logging/Logger';
import { TutorialManager } from '../tutorial/TutorialManager';

export interface TutorialRegistryConfig {
  eventBus: CampaignEventBus;
  tutorialManager?: TutorialManager;
  preferences?: TutorialPreferences;
  completedTutorialIds?: string[];
  skippedTutorialIds?: string[];
  replayedTutorialIds?: string[];
}

export class TutorialRegistry {
  private eventBus: CampaignEventBus;
  private tutorialManager?: TutorialManager;
  private tutorials: Map<string, TutorialDefinition> = new Map();

  private activeTutorialId: string | null = null;
  private activeStepIndex: number = 0;

  private completedTutorialIds: Set<string> = new Set();
  private skippedTutorialIds: Set<string> = new Set();
  private replayedTutorialIds: Set<string> = new Set();
  private preferences: TutorialPreferences;

  constructor(config: TutorialRegistryConfig) {
    this.eventBus = config.eventBus;
    this.tutorialManager = config.tutorialManager;
    this.preferences = config.preferences
      ? { ...config.preferences }
      : { ...DEFAULT_TUTORIAL_PREFERENCES };

    if (config.completedTutorialIds) {
      this.completedTutorialIds = new Set(config.completedTutorialIds);
    }
    if (config.skippedTutorialIds) {
      this.skippedTutorialIds = new Set(config.skippedTutorialIds);
    }
    if (config.replayedTutorialIds) {
      this.replayedTutorialIds = new Set(config.replayedTutorialIds);
    }

    this.loadCatalog();
  }

  private loadCatalog(): void {
    this.tutorials.clear();
    for (const tut of TUTORIAL_DEFINITIONS) {
      const clone: TutorialDefinition = JSON.parse(JSON.stringify(tut));
      if (this.completedTutorialIds.has(clone.id)) {
        clone.isCompleted = true;
      }
      this.tutorials.set(clone.id, clone);
    }
    Logger.info(
      'TUTORIAL_REGISTRY',
      `Loaded ${this.tutorials.size} interactive tutorials across 7 categories.`
    );
  }

  // =========================================================================
  // QUERY METHODS
  // =========================================================================

  public getTutorial(id: string): TutorialDefinition | undefined {
    return this.tutorials.get(id);
  }

  public getAllTutorials(): TutorialDefinition[] {
    return Array.from(this.tutorials.values());
  }

  public getTutorialsByCategory(category: TutorialCategory): TutorialDefinition[] {
    return Array.from(this.tutorials.values()).filter((t) => t.category === category);
  }

  public getActiveTutorial(): TutorialDefinition | null {
    if (!this.activeTutorialId) return null;
    return this.tutorials.get(this.activeTutorialId) || null;
  }

  public getActiveStep(): InteractiveTutorialStep | null {
    const activeTut = this.getActiveTutorial();
    if (!activeTut || !activeTut.steps) return null;
    return activeTut.steps[this.activeStepIndex] || null;
  }

  public getActiveStepIndex(): number {
    return this.activeStepIndex;
  }

  public isTutorialCompleted(id: string): boolean {
    return this.completedTutorialIds.has(id);
  }

  public isTutorialSkipped(id: string): boolean {
    return this.skippedTutorialIds.has(id);
  }

  // =========================================================================
  // LIFECYCLE & STEP PROGRESSION
  // =========================================================================

  public startTutorial(id: string, forceReplay: boolean = false): boolean {
    const tut = this.tutorials.get(id);
    if (!tut) {
      Logger.warn('TUTORIAL_REGISTRY', `Cannot start unknown tutorial '${id}'`);
      return false;
    }

    if (!this.preferences.tutorialsEnabled && !forceReplay) {
      Logger.debug('TUTORIAL_REGISTRY', `Tutorial '${id}' not started because tutorials are disabled in settings.`);
      return false;
    }

    if (this.completedTutorialIds.has(id) && !forceReplay) {
      Logger.info('TUTORIAL_REGISTRY', `Tutorial '${id}' already completed. Set forceReplay=true to replay.`);
      return false;
    }

    if (forceReplay) {
      this.replayedTutorialIds.add(id);
      Logger.info('TUTORIAL_REGISTRY', `Replaying tutorial '${tut.title}' (${id})`);
    }

    this.activeTutorialId = id;
    this.activeStepIndex = 0;

    const firstStep = tut.steps[0];
    Logger.info(
      'TUTORIAL_REGISTRY',
      `Started tutorial '${tut.title}' (Step 1/${tut.steps.length}: ${firstStep?.title || 'Init'})`
    );

    if (this.tutorialManager) {
      this.tutorialManager.startSequence(id, forceReplay);
    }

    this.eventBus.emit('TutorialStarted', {
      tutorial: tut,
      isReplay: forceReplay,
      timestamp: Date.now(),
    });

    return true;
  }

  public advanceStep(): boolean {
    const tut = this.getActiveTutorial();
    if (!tut) {
      return false;
    }

    const nextIndex = this.activeStepIndex + 1;

    if (nextIndex < tut.steps.length) {
      this.activeStepIndex = nextIndex;
      const nextStep = tut.steps[nextIndex];
      Logger.info(
        'TUTORIAL_REGISTRY',
        `Advanced step for '${tut.title}': [${this.activeStepIndex + 1}/${tut.steps.length}] ${nextStep ? nextStep.title : ''}`
      );
      return true;
    } else {
      // Completed last step
      return this.completeTutorial(tut.id);
    }
  }

  public completeTutorial(id: string): boolean {
    const tut = this.tutorials.get(id);
    if (!tut) return false;

    tut.isCompleted = true;
    this.completedTutorialIds.add(id);

    if (this.activeTutorialId === id) {
      this.activeTutorialId = null;
      this.activeStepIndex = 0;
    }

    Logger.info('TUTORIAL_REGISTRY', `Completed tutorial: '${tut.title}' (${id})`);

    this.eventBus.emit('TutorialCompleted', {
      tutorialId: id,
      category: tut.category,
      timestamp: Date.now(),
    });

    return true;
  }

  public skipActiveTutorial(): boolean {
    if (!this.activeTutorialId) return false;
    return this.skipTutorial(this.activeTutorialId);
  }

  public skipTutorial(id: string): boolean {
    const tut = this.tutorials.get(id);
    if (!tut) return false;

    tut.isDismissed = true;
    this.skippedTutorialIds.add(id);

    if (this.activeTutorialId === id) {
      this.activeTutorialId = null;
      this.activeStepIndex = 0;
    }

    Logger.info('TUTORIAL_REGISTRY', `Skipped tutorial: '${tut.title}' (${id})`);

    this.eventBus.emit('TutorialSkipped', {
      tutorialId: id,
      timestamp: Date.now(),
    });

    return true;
  }

  public replayTutorial(id: string): boolean {
    return this.startTutorial(id, true);
  }

  // =========================================================================
  // PREFERENCES & PERSISTENCE
  // =========================================================================

  public getPreferences(): TutorialPreferences {
    return { ...this.preferences };
  }

  public setPreferences(newPrefs: Partial<TutorialPreferences>): void {
    this.preferences = {
      ...this.preferences,
      ...newPrefs,
    };
    Logger.info(
      'TUTORIAL_REGISTRY',
      `Tutorial preferences updated: enabled=${this.preferences.tutorialsEnabled}, contextualHints=${this.preferences.showContextualHints}`
    );
  }

  public getCompletedTutorialIds(): string[] {
    return Array.from(this.completedTutorialIds);
  }

  public getSkippedTutorialIds(): string[] {
    return Array.from(this.skippedTutorialIds);
  }

  public getReplayedTutorialIds(): string[] {
    return Array.from(this.replayedTutorialIds);
  }

  public reset(): void {
    this.activeTutorialId = null;
    this.activeStepIndex = 0;
    this.completedTutorialIds.clear();
    this.skippedTutorialIds.clear();
    this.replayedTutorialIds.clear();
    this.preferences = { ...DEFAULT_TUTORIAL_PREFERENCES };
    this.loadCatalog();
  }
}
