/**
 * INTERSTELLAR CONTINUUM - Campaign Manager Service & Public Facade
 * Central orchestration service connecting progression engine, tutorial registry,
 * contextual help, domain adapters, and persistence.
 */

import { EventBus } from '../core/EventBus';
import { Logger } from '../core/logging/Logger';
import { CampaignEventBus } from './CampaignEventBus';
import {
  CampaignChapter,
  CampaignObjective,
  CampaignOverview,
  CampaignState,
  TutorialPreferences,
  TutorialStatusInfo,
  TutorialCategory,
} from './CampaignTypes';
import { CampaignProgressionEngine } from './CampaignProgressionEngine';
import { TutorialRegistry } from './TutorialRegistry';
import { ContextualHelpService } from './ContextualHelpService';
import { CampaignSaveAdapter } from './adapters/CampaignSaveAdapter';
import { MissionCompletionAdapter } from './adapters/MissionCompletionAdapter';
import { RocketEngineeringAdapter } from './adapters/RocketEngineeringAdapter';
import { ResearchProgressionAdapter } from './adapters/ResearchProgressionAdapter';
import { ContractsAdapter } from './adapters/ContractsAdapter';
import { SolarSystemAdapter } from './adapters/SolarSystemAdapter';
import { OrganisationAdapter } from './adapters/OrganisationAdapter';
import { HeadquartersAdapter } from './adapters/HeadquartersAdapter';
import { TutorialManager } from '../tutorial/TutorialManager';

export interface CampaignManagerOptions {
  coreEventBus?: EventBus;
  tutorialManager?: TutorialManager;
  autoLoad?: boolean;
}

export class CampaignManager {
  private static instance?: CampaignManager;

  private coreEventBus?: EventBus;
  private campaignEventBus: CampaignEventBus;
  private progressionEngine: CampaignProgressionEngine;
  private tutorialRegistry: TutorialRegistry;
  private contextualHelpService: ContextualHelpService;
  private saveAdapter: CampaignSaveAdapter;

  // Adapters
  private missionAdapter: MissionCompletionAdapter;
  private rocketAdapter: RocketEngineeringAdapter;
  private researchAdapter: ResearchProgressionAdapter;
  private contractsAdapter: ContractsAdapter;
  private solarSystemAdapter: SolarSystemAdapter;
  private organisationAdapter: OrganisationAdapter;
  private headquartersAdapter: HeadquartersAdapter;

  constructor(options: CampaignManagerOptions = {}) {
    this.coreEventBus = options.coreEventBus;
    this.campaignEventBus = new CampaignEventBus(this.coreEventBus);
    this.saveAdapter = new CampaignSaveAdapter();

    // Initialize progression engine
    this.progressionEngine = new CampaignProgressionEngine({
      eventBus: this.campaignEventBus,
      onRewardGranted: (reward) => this.disburseRewards(reward),
    });

    // Initialize tutorial registry
    this.tutorialRegistry = new TutorialRegistry({
      eventBus: this.campaignEventBus,
      tutorialManager: options.tutorialManager,
    });

    // Initialize contextual help service
    this.contextualHelpService = new ContextualHelpService({
      eventBus: this.campaignEventBus,
    });

    // Initialize adapters with (this, this.coreEventBus)
    this.missionAdapter = new MissionCompletionAdapter(this, this.coreEventBus);
    this.rocketAdapter = new RocketEngineeringAdapter(this, this.coreEventBus);
    this.researchAdapter = new ResearchProgressionAdapter(this, this.coreEventBus);
    this.contractsAdapter = new ContractsAdapter(this, this.coreEventBus);
    this.solarSystemAdapter = new SolarSystemAdapter(this, this.coreEventBus);
    this.organisationAdapter = new OrganisationAdapter(this, this.coreEventBus);
    this.headquartersAdapter = new HeadquartersAdapter(this, this.coreEventBus);

    if (options.autoLoad !== false) {
      this.load();
    }

    Logger.info('CAMPAIGN_MANAGER', 'CampaignManager initialized successfully.');
  }

  public static getInstance(options?: CampaignManagerOptions): CampaignManager {
    if (!CampaignManager.instance) {
      CampaignManager.instance = new CampaignManager(options);
    }
    return CampaignManager.instance;
  }

  public static resetInstance(): void {
    CampaignManager.instance = undefined;
  }

  // =========================================================================
  // PUBLIC SECTION 12 API CONTRACT
  // =========================================================================

  public getCampaignState(): CampaignState {
    const baseState = this.progressionEngine.getState();
    const activeTut = this.tutorialRegistry.getActiveTutorial();

    return {
      ...baseState,
      activeTutorialId: activeTut ? activeTut.id : null,
      activeTutorialStepIndex: this.tutorialRegistry.getActiveStepIndex(),
      completedTutorialIds: this.tutorialRegistry.getCompletedTutorialIds(),
      skippedTutorialIds: this.tutorialRegistry.getSkippedTutorialIds(),
      replayedTutorialIds: this.tutorialRegistry.getReplayedTutorialIds(),
      viewedHelpTopicIds: this.contextualHelpService.getViewedTopicIds(),
      dismissedHelpTopicIds: this.contextualHelpService.getDismissedTopicIds(),
      tutorialPreferences: this.tutorialRegistry.getPreferences(),
    };
  }

  public getCurrentChapter(): CampaignChapter {
    return this.progressionEngine.getCurrentChapter();
  }

  public listCampaignObjectives(chapter?: number): CampaignObjective[] {
    if (chapter !== undefined) {
      return this.progressionEngine.getObjectivesForChapter(chapter);
    }
    return this.progressionEngine.getAllObjectives();
  }

  public getObjective(objectiveId: string): CampaignObjective | null {
    return this.progressionEngine.getObjective(objectiveId) || null;
  }

  public updateObjectiveProgress(objectiveId: string, progress: number, target?: number): void {
    this.progressionEngine.updateObjectiveProgress(objectiveId, progress, target);
  }

  public completeCampaignObjective(objectiveId: string): void {
    this.progressionEngine.completeObjective(objectiveId, true);
  }

  public unlockCampaignChapter(chapterNumber: number): void {
    this.progressionEngine.unlockChapter(chapterNumber);
  }

  public getCampaignOverview(): CampaignOverview {
    return this.progressionEngine.getCampaignOverview();
  }

  public startTutorial(tutorialId: string, forceReplay: boolean = false): void {
    this.tutorialRegistry.startTutorial(tutorialId, forceReplay);
  }

  public completeTutorial(tutorialId: string): void {
    this.tutorialRegistry.completeTutorial(tutorialId);
  }

  public skipTutorial(tutorialId: string): void {
    this.tutorialRegistry.skipTutorial(tutorialId);
  }

  public getTutorialStatus(tutorialId: string): TutorialStatusInfo {
    const tut = this.tutorialRegistry.getTutorial(tutorialId);
    const activeTut = this.tutorialRegistry.getActiveTutorial();
    const isActive = activeTut ? activeTut.id === tutorialId : false;
    const isCompleted = this.tutorialRegistry.isTutorialCompleted(tutorialId);
    const isSkipped = this.tutorialRegistry.isTutorialSkipped(tutorialId);
    const isAvailable = this.tutorialRegistry.getPreferences().tutorialsEnabled;

    return {
      tutorialId,
      category: tut ? tut.category : TutorialCategory.HEADQUARTERS,
      title: tut ? tut.title : tutorialId,
      isCompleted,
      completed: isCompleted,
      isAvailable,
      available: isAvailable,
      isActive,
      active: isActive,
      isSkipped,
      skipped: isSkipped,
      currentStepIndex: isActive ? this.tutorialRegistry.getActiveStepIndex() : 0,
      totalSteps: tut ? tut.steps.length : 0,
    };
  }

  public setTutorialPreferences(preferences: Partial<TutorialPreferences>): void {
    this.tutorialRegistry.setPreferences(preferences);
    this.contextualHelpService.setPreferences(preferences);
  }

  // =========================================================================
  // NARRATIVE INTRODUCTION
  // =========================================================================

  public isNarrativeIntroCompleted(): boolean {
    return this.progressionEngine.getState().hasCompletedNarrativeIntro;
  }

  public completeNarrativeIntro(): void {
    const state = this.progressionEngine.getState();
    state.hasCompletedNarrativeIntro = true;
    state.narrativeIntroSkipped = false;
    this.progressionEngine.applyLoadedState(state);
    this.save();
    Logger.info('CAMPAIGN_MANAGER', 'Narrative introduction completed by Director.');
  }

  public skipNarrativeIntro(): void {
    const state = this.progressionEngine.getState();
    state.hasCompletedNarrativeIntro = true;
    state.narrativeIntroSkipped = true;
    this.progressionEngine.applyLoadedState(state);
    this.save();
    Logger.info('CAMPAIGN_MANAGER', 'Narrative introduction skipped by Director.');
  }

  // =========================================================================
  // REWARDS, EVENT BUS & SERVICES ACCESSORS
  // =========================================================================

  private disburseRewards(reward: NonNullable<CampaignObjective['unlockRewards']>): void {
    if (this.coreEventBus) {
      const bus = this.coreEventBus as any;
      if (reward.credits) {
        bus.emit('economy:add-credits', { amount: reward.credits });
      }
      if (reward.researchData) {
        bus.emit('research:add-data', { amount: reward.researchData });
      }
      if (reward.technologyPoints) {
        bus.emit('research:add-tech-points', { amount: reward.technologyPoints });
      }
      if (reward.agencyPrestige) {
        bus.emit('agency:prestige-gained', { amount: reward.agencyPrestige });
      }
    }
  }

  public getEventBus(): CampaignEventBus {
    return this.campaignEventBus;
  }

  public getProgressionEngine(): CampaignProgressionEngine {
    return this.progressionEngine;
  }

  public getTutorialRegistry(): TutorialRegistry {
    return this.tutorialRegistry;
  }

  public getContextualHelpService(): ContextualHelpService {
    return this.contextualHelpService;
  }

  public getSaveAdapter(): CampaignSaveAdapter {
    return this.saveAdapter;
  }

  public getMissionAdapter(): MissionCompletionAdapter {
    return this.missionAdapter;
  }

  public getRocketAdapter(): RocketEngineeringAdapter {
    return this.rocketAdapter;
  }

  public getResearchAdapter(): ResearchProgressionAdapter {
    return this.researchAdapter;
  }

  public getContractsAdapter(): ContractsAdapter {
    return this.contractsAdapter;
  }

  public getSolarSystemAdapter(): SolarSystemAdapter {
    return this.solarSystemAdapter;
  }

  public getOrganisationAdapter(): OrganisationAdapter {
    return this.organisationAdapter;
  }

  public getHeadquartersAdapter(): HeadquartersAdapter {
    return this.headquartersAdapter;
  }

  // =========================================================================
  // PERSISTENCE (SAVE / LOAD)
  // =========================================================================

  public save(): boolean {
    const fullState = this.getCampaignState();
    return this.saveAdapter.saveCampaignState(fullState);
  }

  public load(): boolean {
    const loaded = this.saveAdapter.loadCampaignState();
    if (!loaded) return false;

    this.progressionEngine.applyLoadedState(loaded);
    this.tutorialRegistry.setPreferences(loaded.tutorialPreferences || {});
    this.contextualHelpService.setPreferences(loaded.tutorialPreferences || {});

    return true;
  }

  public loadFromLegacySave(legacySave: {
    completedMissions?: string[];
    unlockedTechnologies?: string[];
  }): void {
    const migrated = this.saveAdapter.migrateFromLegacySave(legacySave);
    this.progressionEngine.applyLoadedState(migrated);
    this.save();
  }

  public reset(): void {
    this.progressionEngine.reset();
    this.tutorialRegistry.reset();
    this.contextualHelpService.reset();
    this.saveAdapter.clearSave();
  }
}
