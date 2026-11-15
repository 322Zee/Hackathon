/**
 * INTERSTELLAR CONTINUUM - Campaign UI Components Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NarrativeIntroModal } from '../../src/campaign/ui/NarrativeIntroModal';
import { CampaignOverviewView } from '../../src/campaign/ui/CampaignOverviewView';
import { ContextualHelpModal } from '../../src/campaign/ui/ContextualHelpModal';
import { ChapterTransitionBanner } from '../../src/campaign/ui/ChapterTransitionBanner';
import { ContextualHelpService } from '../../src/campaign/ContextualHelpService';
import { CampaignEventBus } from '../../src/campaign/CampaignEventBus';
import { CampaignManager } from '../../src/campaign/CampaignManager';

describe('Campaign UI Components', () => {
  let eventBus: CampaignEventBus;
  let helpService: ContextualHelpService;
  let manager: CampaignManager;

  beforeEach(() => {
    CampaignManager.resetInstance();
    eventBus = new CampaignEventBus();
    helpService = new ContextualHelpService({ eventBus });
    manager = new CampaignManager({ autoLoad: false });
  });

  describe('NarrativeIntroModal', () => {
    it('initializes hidden and shows/hides on command', () => {
      let completed = false;
      let skipped = false;

      const modal = new NarrativeIntroModal({
        onComplete: () => {
          completed = true;
        },
        onSkip: () => {
          skipped = true;
        },
      });

      expect(modal.container).toBeDefined();
      expect(modal.getVisible()).toBe(false);

      modal.show();
      expect(modal.getVisible()).toBe(true);
      expect(modal.container.visible).toBe(true);

      modal.hide();
      expect(modal.getVisible()).toBe(false);
      expect(modal.container.visible).toBe(false);

      modal.destroy();
    });
  });

  describe('CampaignOverviewView', () => {
    it('renders overview dossier with chapter directives and journal entries', () => {
      let closed = false;
      const view = new CampaignOverviewView({
        onClose: () => {
          closed = true;
        },
      });

      expect(view.container).toBeDefined();
      expect(view.container.visible).toBe(false);

      const overview = manager.getCampaignOverview();
      view.setOverviewData(overview);
      view.show();

      expect(view.container.visible).toBe(true);
      expect(view.container.children.length).toBeGreaterThan(0);

      view.hide();
      expect(view.container.visible).toBe(false);

      view.destroy();
    });
  });

  describe('ContextualHelpModal', () => {
    it('presents selected topic details and links to tutorials', () => {
      let launchedTutorialId: string | null = null;
      let closed = false;

      const modal = new ContextualHelpModal(helpService, {
        onLaunchTutorial: (id) => {
          launchedTutorialId = id;
        },
        onClose: () => {
          closed = true;
        },
      });

      expect(modal.container).toBeDefined();

      // Show delta-v topic
      modal.showTopic('help_delta_v');
      expect(modal.container.visible).toBe(true);
      expect(helpService.isTopicViewed('help_delta_v')).toBe(true);

      modal.hide();
      expect(modal.container.visible).toBe(false);

      modal.destroy();
    });
  });

  describe('ChapterTransitionBanner', () => {
    it('displays celebratory banner upon chapter unlock', () => {
      const banner = new ChapterTransitionBanner();
      expect(banner.container).toBeDefined();
      expect(banner.getVisible()).toBe(false);

      banner.showBanner('CHAPTER 2: LUNAR INITIATIVE', 'Trans-Lunar Injection and Touchdown');
      expect(banner.getVisible()).toBe(true);
      expect(banner.container.visible).toBe(true);

      banner.hide();
      expect(banner.getVisible()).toBe(false);
      expect(banner.container.visible).toBe(false);

      banner.destroy();
    });
  });
});
