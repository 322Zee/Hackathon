/**
 * INTERSTELLAR CONTINUUM - Tutorial Registry Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TutorialRegistry } from '../../src/campaign/TutorialRegistry';
import { CampaignEventBus } from '../../src/campaign/CampaignEventBus';
import { TutorialCategory } from '../../src/campaign/CampaignTypes';

describe('TutorialRegistry', () => {
  let eventBus: CampaignEventBus;
  let registry: TutorialRegistry;

  beforeEach(() => {
    eventBus = new CampaignEventBus();
    registry = new TutorialRegistry({ eventBus });
  });

  describe('Catalog & Categories', () => {
    it('loads tutorials across all 7 canonical categories', () => {
      const all = registry.getAllTutorials();
      expect(all.length).toBeGreaterThanOrEqual(7);

      const categories = [
        TutorialCategory.HEADQUARTERS,
        TutorialCategory.ROCKET_ENGINEERING,
        TutorialCategory.MISSION_OPERATIONS,
        TutorialCategory.LAUNCH_OPERATIONS,
        TutorialCategory.MISSION_CONTROL,
        TutorialCategory.PLANETARY_EXPLORATION,
        TutorialCategory.ORGANISATION_MANAGEMENT,
      ];

      for (const cat of categories) {
        const found = registry.getTutorialsByCategory(cat);
        expect(found.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('retrieves specific tutorial by id', () => {
      const tut = registry.getTutorial('TUT_HEADQUARTERS');
      expect(tut).toBeDefined();
      expect(tut?.category).toBe(TutorialCategory.HEADQUARTERS);
      expect(tut?.steps.length).toBeGreaterThan(0);
    });
  });

  describe('Tutorial Execution Lifecycle', () => {
    it('starts a tutorial and exposes the active step', () => {
      const started = registry.startTutorial('TUT_HEADQUARTERS');
      expect(started).toBe(true);

      const active = registry.getActiveTutorial();
      expect(active?.id).toBe('TUT_HEADQUARTERS');

      const step = registry.getActiveStep();
      expect(step).toBeDefined();
      expect(step?.stepIndex).toBe(1);
      expect(registry.getActiveStepIndex()).toBe(0);
    });

    it('advances through steps until completion', () => {
      registry.startTutorial('TUT_HEADQUARTERS');
      const tut = registry.getTutorial('TUT_HEADQUARTERS')!;
      const totalSteps = tut.steps.length;

      // Advance through all steps
      for (let i = 0; i < totalSteps - 1; i++) {
        expect(registry.advanceStep()).toBe(true);
      }

      // Final step advance should complete the tutorial
      const completed = registry.advanceStep();
      expect(completed).toBe(true);
      expect(registry.getActiveTutorial()).toBeNull();
      expect(registry.isTutorialCompleted('TUT_HEADQUARTERS')).toBe(true);
    });

    it('allows skipping active tutorial', () => {
      registry.startTutorial('TUT_HEADQUARTERS');
      const skipped = registry.skipActiveTutorial();
      expect(skipped).toBe(true);
      expect(registry.getActiveTutorial()).toBeNull();
      expect(registry.isTutorialSkipped('TUT_HEADQUARTERS')).toBe(true);
    });

    it('allows replaying an already completed tutorial with forceReplay', () => {
      registry.completeTutorial('TUT_HEADQUARTERS');
      expect(registry.isTutorialCompleted('TUT_HEADQUARTERS')).toBe(true);

      // Normal start without forceReplay returns false
      expect(registry.startTutorial('TUT_HEADQUARTERS', false)).toBe(false);

      // With forceReplay or replayTutorial returns true
      const replayed = registry.replayTutorial('TUT_HEADQUARTERS');
      expect(replayed).toBe(true);
      expect(registry.getActiveTutorial()?.id).toBe('TUT_HEADQUARTERS');
      expect(registry.getReplayedTutorialIds()).toContain('TUT_HEADQUARTERS');
    });
  });

  describe('Preferences & Settings Integration', () => {
    it('respects tutorialsEnabled toggle', () => {
      registry.setPreferences({ tutorialsEnabled: false });
      expect(registry.getPreferences().tutorialsEnabled).toBe(false);

      const started = registry.startTutorial('TUT_HEADQUARTERS', false);
      expect(started).toBe(false);

      // Force replay still works for manual review from help menu
      expect(registry.replayTutorial('TUT_HEADQUARTERS')).toBe(true);
    });
  });
});
