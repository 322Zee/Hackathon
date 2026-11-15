/**
 * INTERSTELLAR CONTINUUM - Contextual Help Service Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ContextualHelpService } from '../../src/campaign/ContextualHelpService';
import { CampaignEventBus } from '../../src/campaign/CampaignEventBus';
import { TutorialCategory } from '../../src/campaign/CampaignTypes';

describe('ContextualHelpService', () => {
  let eventBus: CampaignEventBus;
  let service: ContextualHelpService;

  beforeEach(() => {
    eventBus = new CampaignEventBus();
    service = new ContextualHelpService({ eventBus });
  });

  describe('Catalog & Search', () => {
    it('initializes with indexed topics across aerospace mechanics', () => {
      const topics = service.getAllTopics();
      expect(topics.length).toBeGreaterThan(0);

      const deltaVTopic = service.getTopic('help_delta_v');
      expect(deltaVTopic).toBeDefined();
      expect(deltaVTopic?.category).toBe(TutorialCategory.ROCKET_ENGINEERING);
      expect(deltaVTopic?.tags).toContain('delta-v');
    });

    it('performs keyword searches matching titles, summaries, tags, and body', () => {
      const results = service.search('delta-v');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.id === 'help_delta_v')).toBe(true);

      const twrResults = service.search('TWR');
      expect(twrResults.length).toBeGreaterThan(0);
      expect(twrResults.some((r) => r.id === 'help_twr')).toBe(true);
    });

    it('returns all topics when query is empty', () => {
      const all = service.getAllTopics();
      const searched = service.search('');
      expect(searched).toHaveLength(all.length);
    });
  });

  describe('First-Use Guidance & Tracking', () => {
    it('identifies unviewed topics as eligible for first-use guidance', () => {
      expect(service.shouldShowFirstUse('help_first_use_vab')).toBe(true);

      service.markTopicViewed('help_first_use_vab');
      expect(service.isTopicViewed('help_first_use_vab')).toBe(true);

      // Now it should not trigger first-use again
      expect(service.shouldShowFirstUse('help_first_use_vab')).toBe(false);
    });

    it('supports dismissing topics permanently', () => {
      expect(service.shouldShowFirstUse('help_first_use_mission_control')).toBe(true);

      service.dismissTopic('help_first_use_mission_control');
      expect(service.isTopicDismissed('help_first_use_mission_control')).toBe(true);
      expect(service.shouldShowFirstUse('help_first_use_mission_control')).toBe(false);
    });

    it('respects preferences when contextual hints are disabled', () => {
      service.setPreferences({ showContextualHints: false });
      expect(service.shouldShowFirstUse('help_first_use_vab')).toBe(false);

      service.setPreferences({ showContextualHints: true, autoDisplayFirstUseHelp: false });
      expect(service.shouldShowFirstUse('help_first_use_vab')).toBe(false);
    });
  });
});
