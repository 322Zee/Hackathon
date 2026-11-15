/**
 * INTERSTELLAR CONTINUUM - Contextual Help & Guidance Service
 * Provides searchable help index, first-use explanations, field tooltips,
 * dismissible hints, and cross-linking to interactive tutorials.
 */

import {
  ContextualHelpTopic,
  TutorialCategory,
  TutorialPreferences,
  DEFAULT_TUTORIAL_PREFERENCES,
} from './CampaignTypes';
import { CONTEXTUAL_HELP_TOPICS } from './data/ContextualHelpData';
import { CampaignEventBus } from './CampaignEventBus';
import { Logger } from '../core/logging/Logger';

export interface ContextualHelpServiceConfig {
  eventBus: CampaignEventBus;
  preferences?: TutorialPreferences;
  viewedTopicIds?: string[];
  dismissedTopicIds?: string[];
}

export class ContextualHelpService {
  private eventBus: CampaignEventBus;
  private topics: Map<string, ContextualHelpTopic> = new Map();
  private viewedTopicIds: Set<string> = new Set();
  private dismissedTopicIds: Set<string> = new Set();
  private preferences: TutorialPreferences;

  constructor(config: ContextualHelpServiceConfig) {
    this.eventBus = config.eventBus;
    this.preferences = config.preferences
      ? { ...config.preferences }
      : { ...DEFAULT_TUTORIAL_PREFERENCES };

    if (config.viewedTopicIds) {
      this.viewedTopicIds = new Set(config.viewedTopicIds);
    }
    if (config.dismissedTopicIds) {
      this.dismissedTopicIds = new Set(config.dismissedTopicIds);
    }

    this.initializeTopics();
  }

  private initializeTopics(): void {
    this.topics.clear();
    for (const topic of CONTEXTUAL_HELP_TOPICS) {
      this.topics.set(topic.id, JSON.parse(JSON.stringify(topic)));
    }
    Logger.info(
      'CONTEXTUAL_HELP',
      `Initialized Contextual Help Service with ${this.topics.size} indexed topics.`
    );
  }

  // =========================================================================
  // LOOKUP & SEARCH
  // =========================================================================

  public getTopic(id: string): ContextualHelpTopic | undefined {
    return this.topics.get(id);
  }

  public getAllTopics(): ContextualHelpTopic[] {
    return Array.from(this.topics.values());
  }

  public getTopicsByCategory(category: TutorialCategory): ContextualHelpTopic[] {
    return Array.from(this.topics.values()).filter((t) => t.category === category);
  }

  /**
   * Search topics by keyword across titles, summaries, tags, and detailed explanations.
   */
  public search(query: string): ContextualHelpTopic[] {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return this.getAllTopics();
    }

    return Array.from(this.topics.values()).filter((topic) => {
      if (topic.title.toLowerCase().includes(trimmed)) return true;
      if (topic.summary.toLowerCase().includes(trimmed)) return true;
      if (topic.detailedExplanation.toLowerCase().includes(trimmed)) return true;
      if (topic.tags.some((tag) => tag.toLowerCase().includes(trimmed))) return true;
      return false;
    });
  }

  // =========================================================================
  // FIRST-USE GUIDANCE & DISMISSAL
  // =========================================================================

  /**
   * Checks if a first-use prompt should be shown to the player.
   */
  public shouldShowFirstUse(topicId: string): boolean {
    if (!this.preferences.showContextualHints || !this.preferences.autoDisplayFirstUseHelp) {
      return false;
    }

    if (this.viewedTopicIds.has(topicId) || this.dismissedTopicIds.has(topicId)) {
      return false;
    }

    return this.topics.has(topicId);
  }

  public markTopicViewed(topicId: string): void {
    this.viewedTopicIds.add(topicId);
    this.eventBus.emit('ContextualHelpViewed', {
      topicId,
      timestamp: Date.now(),
    });
  }

  public dismissTopic(topicId: string): void {
    this.dismissedTopicIds.add(topicId);
    Logger.debug('CONTEXTUAL_HELP', `Topic '${topicId}' dismissed by player.`);
  }

  public isTopicViewed(topicId: string): boolean {
    return this.viewedTopicIds.has(topicId);
  }

  public isTopicDismissed(topicId: string): boolean {
    return this.dismissedTopicIds.has(topicId);
  }

  // =========================================================================
  // PREFERENCES & PERSISTENCE
  // =========================================================================

  public setPreferences(newPrefs: Partial<TutorialPreferences>): void {
    this.preferences = {
      ...this.preferences,
      ...newPrefs,
    };
  }

  public getPreferences(): TutorialPreferences {
    return { ...this.preferences };
  }

  public getViewedTopicIds(): string[] {
    return Array.from(this.viewedTopicIds);
  }

  public getDismissedTopicIds(): string[] {
    return Array.from(this.dismissedTopicIds);
  }

  public reset(): void {
    this.viewedTopicIds.clear();
    this.dismissedTopicIds.clear();
    this.preferences = { ...DEFAULT_TUTORIAL_PREFERENCES };
    this.initializeTopics();
  }
}
