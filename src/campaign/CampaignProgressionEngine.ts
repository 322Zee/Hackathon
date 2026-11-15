/**
 * INTERSTELLAR CONTINUUM - Campaign Progression Engine
 * Core domain service driving chapter advancement, objective evaluation,
 * prerequisite resolution, milestone tracking, and reward disbursement.
 */

import {
  CampaignChapter,
  CampaignObjective,
  CampaignObjectiveStatus,
  CampaignState,
  CampaignOverview,
  createInitialCampaignState,
} from './CampaignTypes';
import { CAMPAIGN_CHAPTERS } from './data/CampaignChaptersData';
import { CAMPAIGN_OBJECTIVES_DATA } from './data/CampaignObjectivesData';
import { CampaignEventBus } from './CampaignEventBus';
import { Logger } from '../core/logging/Logger';

export interface CampaignProgressionEngineConfig {
  eventBus: CampaignEventBus;
  initialState?: CampaignState;
  onRewardGranted?: (reward: NonNullable<CampaignObjective['unlockRewards']>) => void;
}

export class CampaignProgressionEngine {
  private eventBus: CampaignEventBus;
  private chapters: Map<number, CampaignChapter> = new Map();
  private objectives: Map<string, CampaignObjective> = new Map();
  private state: CampaignState;
  private onRewardGranted?: (reward: NonNullable<CampaignObjective['unlockRewards']>) => void;

  constructor(config: CampaignProgressionEngineConfig) {
    this.eventBus = config.eventBus;
    this.onRewardGranted = config.onRewardGranted;
    this.state = config.initialState ? { ...config.initialState } : createInitialCampaignState();

    this.initializeData();
    if (config.initialState) {
      this.applyLoadedState(config.initialState);
    } else {
      this.refreshObjectiveStatuses();
    }
  }

  private initializeData(): void {
    this.chapters.clear();
    for (const ch of CAMPAIGN_CHAPTERS) {
      this.chapters.set(ch.number, JSON.parse(JSON.stringify(ch)));
    }

    this.objectives.clear();
    for (const obj of CAMPAIGN_OBJECTIVES_DATA) {
      this.objectives.set(obj.id, JSON.parse(JSON.stringify(obj)));
    }
  }

  /**
   * Refreshes availability status of all objectives based on prerequisites and chapter unlocks.
   */
  public refreshObjectiveStatuses(): void {
    const unlockedChaptersSet = new Set(this.state.unlockedChapters);

    for (const obj of this.objectives.values()) {
      if (obj.status === CampaignObjectiveStatus.COMPLETED) {
        continue;
      }

      // If the chapter is not unlocked yet, objective is locked
      if (!unlockedChaptersSet.has(obj.chapter)) {
        obj.status = CampaignObjectiveStatus.LOCKED;
        continue;
      }

      // Check prerequisites
      const prerequisitesMet = (obj.prerequisites || []).every((prereqId) => {
        const prereq = this.objectives.get(prereqId);
        return prereq && prereq.status === CampaignObjectiveStatus.COMPLETED;
      });

      if (prerequisitesMet) {
        if (obj.status === CampaignObjectiveStatus.LOCKED) {
          obj.status = CampaignObjectiveStatus.AVAILABLE;
        }
      } else {
        obj.status = CampaignObjectiveStatus.LOCKED;
      }
    }
  }

  // =========================================================================
  // CHAPTER ACCESSORS & PROGRESSION
  // =========================================================================

  public getCurrentChapterNumber(): number {
    return this.state.currentChapter;
  }

  public getCurrentChapter(): CampaignChapter {
    const chapter = this.chapters.get(this.state.currentChapter);
    if (!chapter) {
      throw new Error(`Current chapter ${this.state.currentChapter} not found in catalog.`);
    }
    return chapter;
  }

  public getChapter(chapterNumber: number): CampaignChapter | undefined {
    return this.chapters.get(chapterNumber);
  }

  public getAllChapters(): CampaignChapter[] {
    return Array.from(this.chapters.values()).sort((a, b) => a.number - b.number);
  }

  public unlockChapter(chapterNumber: number): boolean {
    const chapter = this.chapters.get(chapterNumber);
    if (!chapter) {
      Logger.warn('PROGRESSION_ENGINE', `Cannot unlock non-existent chapter ${chapterNumber}`);
      return false;
    }

    if (!this.state.unlockedChapters.includes(chapterNumber)) {
      this.state.unlockedChapters.push(chapterNumber);
    }
    chapter.unlocked = true;
    chapter.unlockedTimestamp = chapter.unlockedTimestamp || Date.now();

    Logger.info('PROGRESSION_ENGINE', `Chapter ${chapterNumber} (${chapter.codename}) UNLOCKED.`);

    this.refreshObjectiveStatuses();

    this.eventBus.emit('ChapterUnlocked', {
      chapter,
      timestamp: Date.now(),
    });

    return true;
  }

  public checkChapterCompletion(chapterNumber: number): boolean {
    const chapter = this.chapters.get(chapterNumber);
    if (!chapter || chapter.completed) {
      return false;
    }

    const chapterObjectives = this.getObjectivesForChapter(chapterNumber);
    const requiredObjectives = chapterObjectives.filter((o) => !o.isOptional);

    const allRequiredCompleted = requiredObjectives.length > 0 &&
      requiredObjectives.every((o) => o.status === CampaignObjectiveStatus.COMPLETED);

    if (allRequiredCompleted) {
      chapter.completed = true;
      chapter.completedTimestamp = Date.now();
      if (!this.state.completedChapters.includes(chapterNumber)) {
        this.state.completedChapters.push(chapterNumber);
      }

      Logger.info('PROGRESSION_ENGINE', `Chapter ${chapterNumber} (${chapter.codename}) COMPLETED!`);

      // Add to exploration journal
      this.addJournalEntry(
        `Chapter ${chapterNumber} Completed: ${chapter.codename}`,
        `Successfully achieved all mandatory flight, engineering, and scientific milestones for ${chapter.title}.`
      );

      const nextChapterNumber = chapterNumber + 1;
      const nextChapter = this.chapters.get(nextChapterNumber);

      this.eventBus.emit('ChapterCompleted', {
        chapter,
        nextChapter,
        timestamp: Date.now(),
      });

      // Automatically unlock next chapter if valid
      if (nextChapter) {
        this.unlockChapter(nextChapterNumber);
        this.state.currentChapter = nextChapterNumber;
      }

      return true;
    }

    return false;
  }

  // =========================================================================
  // OBJECTIVE ACCESSORS & UPDATES
  // =========================================================================

  public getObjective(id: string): CampaignObjective | undefined {
    return this.objectives.get(id);
  }

  public getAllObjectives(): CampaignObjective[] {
    return Array.from(this.objectives.values());
  }

  public getObjectivesForChapter(chapterNumber: number): CampaignObjective[] {
    return Array.from(this.objectives.values()).filter((obj) => obj.chapter === chapterNumber);
  }

  /**
   * Update numerical progress towards an objective.
   */
  public updateObjectiveProgress(
    objectiveId: string,
    currentValue: number,
    targetValue?: number
  ): boolean {
    const objective = this.objectives.get(objectiveId);
    if (!objective || objective.status === CampaignObjectiveStatus.COMPLETED) {
      return false;
    }

    if (objective.status === CampaignObjectiveStatus.LOCKED) {
      // Cannot progress a locked objective
      return false;
    }

    if (targetValue !== undefined && targetValue > 0) {
      objective.targetValue = targetValue;
    }

    const previousProgress = objective.currentProgress;
    const maxTarget = objective.targetValue || 1;
    objective.currentValue = Math.min(currentValue, maxTarget);
    const calculatedPercentage = Math.round((objective.currentValue / maxTarget) * 100);
    objective.currentProgress = calculatedPercentage;

    if (objective.status === CampaignObjectiveStatus.AVAILABLE) {
      objective.status = CampaignObjectiveStatus.IN_PROGRESS;
    }

    this.state.objectives[objectiveId] = {
      status: objective.status,
      currentProgress: objective.currentProgress,
      currentValue: objective.currentValue,
    };

    Logger.debug(
      'PROGRESSION_ENGINE',
      `Objective '${objective.title}' progress: ${objective.currentValue}/${maxTarget} (${calculatedPercentage}%)`
    );

    this.eventBus.emit('ObjectiveProgressUpdated', {
      objective,
      previousProgress,
      newProgress: objective.currentProgress,
      timestamp: Date.now(),
    });

    if (objective.currentValue >= maxTarget) {
      this.completeObjective(objectiveId);
    }

    return true;
  }

  /**
   * Evaluate a verified condition trigger from adapters.
   */
  public evaluateCondition(conditionKey: string, _payload?: Record<string, unknown>): void {
    for (const objective of this.objectives.values()) {
      if (
        objective.status === CampaignObjectiveStatus.COMPLETED ||
        objective.status === CampaignObjectiveStatus.LOCKED
      ) {
        continue;
      }

      if (objective.completionConditions.includes(conditionKey)) {
        Logger.info(
          'PROGRESSION_ENGINE',
          `Condition '${conditionKey}' matched objective '${objective.id}'`
        );

        if (objective.targetValue && objective.targetValue > 1) {
          const nextVal = (objective.currentValue || 0) + 1;
          this.updateObjectiveProgress(objective.id, nextVal, objective.targetValue);
        } else {
          this.completeObjective(objective.id);
        }
      }
    }
  }

  /**
   * Mark an objective as completed and process rewards and unlocks.
   */
  public completeObjective(objectiveId: string, force: boolean = false): boolean {
    const objective = this.objectives.get(objectiveId);
    if (!objective) {
      Logger.warn('PROGRESSION_ENGINE', `Cannot complete non-existent objective: ${objectiveId}`);
      return false;
    }

    if (objective.status === CampaignObjectiveStatus.COMPLETED && !force) {
      return false;
    }

    objective.status = CampaignObjectiveStatus.COMPLETED;
    objective.currentProgress = 100;
    objective.currentValue = objective.targetValue || 1;
    objective.completedTimestamp = Date.now();

    this.state.objectives[objectiveId] = {
      status: CampaignObjectiveStatus.COMPLETED,
      currentProgress: 100,
      currentValue: objective.currentValue,
      completedTimestamp: objective.completedTimestamp,
    };

    if (objective.isMilestone && !this.state.completedMilestoneIds.includes(objectiveId)) {
      this.state.completedMilestoneIds.push(objectiveId);
      this.addJournalEntry(
        `Milestone Achieved: ${objective.title}`,
        objective.description
      );
    }

    Logger.info('PROGRESSION_ENGINE', `Objective COMPLETED: ${objective.title} (${objective.id})`);

    // Grant rewards if specified
    if (objective.unlockRewards) {
      if (this.onRewardGranted) {
        this.onRewardGranted(objective.unlockRewards);
      }
      Logger.info(
        'PROGRESSION_ENGINE',
        `Granted rewards for '${objective.title}': ${JSON.stringify(objective.unlockRewards)}`
      );
    }

    // Refresh unlocks for dependent objectives
    this.refreshObjectiveStatuses();

    // Check if the chapter completed
    const chapter = this.chapters.get(objective.chapter);
    const chapterCompleted = chapter ? chapter.completed : false;

    // Emit event
    this.eventBus.emit('CampaignObjectiveCompleted', {
      objective,
      unlockedRewards: objective.unlockRewards,
      chapterCompleted,
      timestamp: Date.now(),
    });

    // Check if the current chapter is now complete
    this.checkChapterCompletion(objective.chapter);

    return true;
  }

  // =========================================================================
  // OVERVIEW & JOURNAL
  // =========================================================================

  public getCampaignOverview(): CampaignOverview {
    const currentChapter = this.getCurrentChapter();
    const allObjectives = this.getAllObjectives();
    const completedCount = allObjectives.filter(
      (o) => o.status === CampaignObjectiveStatus.COMPLETED
    ).length;
    const overallProgressPercent = Math.round(
      (completedCount / Math.max(1, allObjectives.length)) * 100
    );

    const activeObjectives = this.getObjectivesForChapter(currentChapter.number).filter(
      (o) => o.status !== CampaignObjectiveStatus.LOCKED
    );

    const nextMilestone = activeObjectives.find(
      (o) => o.isMilestone && o.status !== CampaignObjectiveStatus.COMPLETED
    );

    return {
      currentChapter,
      allChapters: this.getAllChapters(),
      activeObjectives,
      completedObjectivesCount: completedCount,
      totalObjectivesCount: allObjectives.length,
      campaignProgressPercentage: overallProgressPercent,
      nextMilestoneTitle: nextMilestone ? nextMilestone.title : undefined,
      availableExplorationOpportunities: currentChapter.keyDestinations || [],
      completedMilestones: [...this.state.completedMilestoneIds],
      journalEntries: [...this.state.explorationJournal],
    };
  }

  public addJournalEntry(title: string, summary: string): void {
    this.state.explorationJournal.unshift({
      timestamp: Date.now(),
      chapter: this.state.currentChapter,
      title,
      summary,
    });
  }

  // =========================================================================
  // STATE PERSISTENCE
  // =========================================================================

  public getState(): CampaignState {
    return {
      ...this.state,
      lastSavedTimestamp: Date.now(),
    };
  }

  public applyLoadedState(loadedState: CampaignState): void {
    this.state = { ...loadedState };

    // Apply chapter states
    const unlockedSet = new Set(this.state.unlockedChapters);
    const completedSet = new Set(this.state.completedChapters);

    for (const chapter of this.chapters.values()) {
      chapter.unlocked = unlockedSet.has(chapter.number);
      chapter.completed = completedSet.has(chapter.number);
    }

    // Apply objective progress
    for (const [objId, savedObj] of Object.entries(this.state.objectives || {})) {
      const obj = this.objectives.get(objId);
      if (obj) {
        obj.currentProgress = savedObj.currentProgress;
        obj.currentValue = savedObj.currentValue;
        obj.status = savedObj.status;
        obj.completedTimestamp = savedObj.completedTimestamp;
      }
    }

    this.refreshObjectiveStatuses();
    Logger.info(
      'PROGRESSION_ENGINE',
      `Applied loaded campaign state: Chapter ${this.state.currentChapter}, ${this.state.completedMilestoneIds.length} milestones.`
    );
  }

  public reset(): void {
    this.state = createInitialCampaignState();
    this.initializeData();
    this.refreshObjectiveStatuses();
  }
}
