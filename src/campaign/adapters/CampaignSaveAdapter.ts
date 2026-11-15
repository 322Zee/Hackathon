/**
 * INTERSTELLAR CONTINUUM - Campaign Persistence & Save Adapter
 * Handles serialization, backward-compatible migration, and storage of campaign state.
 */

import { CampaignState, createInitialCampaignState } from '../CampaignTypes';
import { Logger } from '../../core/logging/Logger';

export class CampaignSaveAdapter {
  private static readonly STORAGE_KEY = 'interstellar_continuum_campaign_save';
  private static inMemoryBackup: string | null = null;

  private getStorage(): Storage | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
    return null;
  }

  /**
   * Save campaign state to local storage or in-memory fallback.
   */
  public saveCampaignState(state: CampaignState): boolean {
    try {
      const payload = {
        ...state,
        lastSavedTimestamp: Date.now(),
      };
      const serialized = JSON.stringify(payload);
      const storage = this.getStorage();
      if (storage) {
        storage.setItem(CampaignSaveAdapter.STORAGE_KEY, serialized);
      } else {
        CampaignSaveAdapter.inMemoryBackup = serialized;
      }
      Logger.debug('CAMPAIGN_SAVE', 'Campaign state saved successfully.');
      return true;
    } catch (err) {
      Logger.error('CAMPAIGN_SAVE', 'Failed to save campaign state', err);
      return false;
    }
  }

  /**
   * Asynchronous non-blocking save helper.
   */
  public async saveCampaignStateAsync(state: CampaignState): Promise<boolean> {
    return Promise.resolve(this.saveCampaignState(state));
  }

  /**
   * Load campaign state from local storage or in-memory fallback.
   */
  public loadCampaignState(): CampaignState | null {
    try {
      const storage = this.getStorage();
      const raw = storage
        ? storage.getItem(CampaignSaveAdapter.STORAGE_KEY)
        : CampaignSaveAdapter.inMemoryBackup;

      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);
      return this.validateAndMigrate(parsed);
    } catch (err) {
      Logger.error('CAMPAIGN_SAVE', 'Failed to load campaign state, creating default', err);
      return null;
    }
  }

  /**
   * Asynchronous non-blocking load helper.
   */
  public async loadCampaignStateAsync(): Promise<CampaignState | null> {
    return Promise.resolve(this.loadCampaignState());
  }

  /**
   * Deletes saved campaign state (e.g. for reset/testing).
   */
  public clearSave(): void {
    const storage = this.getStorage();
    if (storage) {
      storage.removeItem(CampaignSaveAdapter.STORAGE_KEY);
    }
    CampaignSaveAdapter.inMemoryBackup = null;
  }

  /**
   * Validates schema and applies default values for any missing or newer fields.
   */
  public validateAndMigrate(data: Partial<CampaignState>): CampaignState {
    const defaultState = createInitialCampaignState();

    const migrated: CampaignState = {
      ...defaultState,
      ...data,
      unlockedChapters: Array.isArray(data.unlockedChapters) && data.unlockedChapters.length > 0
        ? data.unlockedChapters
        : defaultState.unlockedChapters,
      completedChapters: Array.isArray(data.completedChapters)
        ? data.completedChapters
        : [],
      objectives: data.objectives || {},
      completedMilestoneIds: Array.isArray(data.completedMilestoneIds)
        ? data.completedMilestoneIds
        : [],
      activeTutorialId: data.activeTutorialId ?? null,
      activeTutorialStepIndex: data.activeTutorialStepIndex ?? 0,
      completedTutorialIds: Array.isArray(data.completedTutorialIds)
        ? data.completedTutorialIds
        : [],
      skippedTutorialIds: Array.isArray(data.skippedTutorialIds)
        ? data.skippedTutorialIds
        : [],
      replayedTutorialIds: Array.isArray(data.replayedTutorialIds)
        ? data.replayedTutorialIds
        : [],
      viewedHelpTopicIds: Array.isArray(data.viewedHelpTopicIds)
        ? data.viewedHelpTopicIds
        : [],
      dismissedHelpTopicIds: Array.isArray(data.dismissedHelpTopicIds)
        ? data.dismissedHelpTopicIds
        : [],
      tutorialPreferences: {
        ...defaultState.tutorialPreferences,
        ...(data.tutorialPreferences || {}),
      },
      explorationJournal: Array.isArray(data.explorationJournal)
        ? data.explorationJournal
        : [],
    };

    return migrated;
  }

  /**
   * Migrates an older legacy save (e.g. from Prompts 1-36 without campaign state)
   * cleanly inferring progress from completed missions and unlocked technologies.
   */
  public migrateFromLegacySave(legacySave: {
    completedMissions?: string[];
    unlockedTechnologies?: string[];
  }): CampaignState {
    const state = createInitialCampaignState();
    const missions = legacySave.completedMissions || [];
    const techs = legacySave.unlockedTechnologies || [];

    // If the legacy player has already completed any missions or unlocked tech, skip narrative intro
    if (missions.length > 0 || techs.length > 2) {
      state.hasCompletedNarrativeIntro = true;
      state.narrativeIntroSkipped = true;
      state.completedTutorialIds.push('TUT_HQ_NAVIGATION', 'TUT_ROCKET_BUILDER', 'TUT_MISSION_SELECTION');
    }

    // Determine highest chapter unlocked from mission history
    let maxChapter = 1;
    for (const missionId of missions) {
      if (missionId.includes('URANUS') || missionId.includes('NEPTUNE') || missionId.includes('KUIPER')) {
        maxChapter = Math.max(maxChapter, 8);
      } else if (missionId.includes('JUPITER') || missionId.includes('SATURN') || missionId.includes('TITAN') || missionId.includes('EUROPA')) {
        maxChapter = Math.max(maxChapter, 7);
      } else if (missionId.includes('ASTEROID') || missionId.includes('CERES')) {
        maxChapter = Math.max(maxChapter, 6);
      } else if (missionId.includes('VENUS') || missionId.includes('MERCURY')) {
        maxChapter = Math.max(maxChapter, 5);
      } else if (missionId.includes('MARS')) {
        maxChapter = Math.max(maxChapter, 4);
      } else if (missionId.includes('GEO') || missionId.includes('COMM')) {
        maxChapter = Math.max(maxChapter, 3);
      } else if (missionId.includes('MOON') || missionId.includes('LUNAR')) {
        maxChapter = Math.max(maxChapter, 2);
      }
    }

    // Populate unlocked and completed chapters
    for (let ch = 1; ch <= maxChapter; ch++) {
      if (!state.unlockedChapters.includes(ch)) {
        state.unlockedChapters.push(ch);
      }
      if (ch < maxChapter && !state.completedChapters.includes(ch)) {
        state.completedChapters.push(ch);
      }
    }
    state.currentChapter = maxChapter;

    Logger.info(
      'CAMPAIGN_SAVE',
      `Migrated legacy save: Current Chapter ${state.currentChapter}, Unlocked [${state.unlockedChapters.join(', ')}]`
    );

    return state;
  }
}
