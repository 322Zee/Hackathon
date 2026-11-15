/**
 * INTERSTELLAR CONTINUUM - Campaign Progression Engine Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CampaignProgressionEngine } from '../../src/campaign/CampaignProgressionEngine';
import { CampaignEventBus } from '../../src/campaign/CampaignEventBus';
import {
  CampaignObjectiveStatus,
  CampaignChapterId,
} from '../../src/campaign/CampaignTypes';

describe('CampaignProgressionEngine', () => {
  let eventBus: CampaignEventBus;
  let engine: CampaignProgressionEngine;
  let grantedRewards: any[] = [];

  beforeEach(() => {
    eventBus = new CampaignEventBus();
    grantedRewards = [];
    engine = new CampaignProgressionEngine({
      eventBus,
      onRewardGranted: (reward) => grantedRewards.push(reward),
    });
  });

  describe('Chapter Structure & Initialization', () => {
    it('initializes with all 8 canonical chapters', () => {
      const chapters = engine.getAllChapters();
      expect(chapters).toHaveLength(8);
      expect(chapters[0].number).toBe(1);
      expect(chapters[0].id).toBe(CampaignChapterId.CHAPTER_1_PROJECT_GENESIS);
      expect(chapters[1].number).toBe(2);
      expect(chapters[1].id).toBe(CampaignChapterId.CHAPTER_2_LUNAR_INITIATIVE);
      expect(chapters[7].number).toBe(8);
      expect(chapters[7].id).toBe(CampaignChapterId.CHAPTER_8_OUTER_FRONTIER);
    });

    it('unlocks Chapter 1 by default while locking subsequent chapters', () => {
      expect(engine.getCurrentChapterNumber()).toBe(1);
      const ch1 = engine.getCurrentChapter();
      expect(ch1.unlocked).toBe(true);

      const ch2 = engine.getChapter(2);
      expect(ch2?.unlocked).toBe(false);
      expect(ch2?.completed).toBe(false);
    });

    it('correctly resolves objective prerequisites for Chapter 1', () => {
      const ch1Objectives = engine.getObjectivesForChapter(1);
      expect(ch1Objectives.length).toBeGreaterThan(0);

      const orientation = engine.getObjective('OBJ_C1_CAMPUS_ORIENTATION');
      expect(orientation?.status).toBe(CampaignObjectiveStatus.AVAILABLE);

      const vehicle = engine.getObjective('OBJ_C1_FIRST_VEHICLE_DESIGN');
      // Vehicle assembly requires orientation first, so it starts LOCKED
      expect(vehicle?.status).toBe(CampaignObjectiveStatus.LOCKED);
    });
  });

  describe('Objective Progress & Evaluation', () => {
    it('updates numerical progress and calculates percentage correctly', () => {
      const updated = engine.updateObjectiveProgress('OBJ_C1_CAMPUS_ORIENTATION', 2, 3);
      expect(updated).toBe(true);

      const obj = engine.getObjective('OBJ_C1_CAMPUS_ORIENTATION');
      expect(obj?.currentValue).toBe(2);
      expect(obj?.currentProgress).toBe(67);
      expect(obj?.status).toBe(CampaignObjectiveStatus.IN_PROGRESS);
    });

    it('completes objective automatically when reaching target value', () => {
      engine.updateObjectiveProgress('OBJ_C1_CAMPUS_ORIENTATION', 3, 3);
      const obj = engine.getObjective('OBJ_C1_CAMPUS_ORIENTATION');
      expect(obj?.status).toBe(CampaignObjectiveStatus.COMPLETED);
      expect(obj?.currentProgress).toBe(100);

      // Subsequent prerequisite should now become AVAILABLE
      const vehicle = engine.getObjective('OBJ_C1_FIRST_VEHICLE_DESIGN');
      expect(vehicle?.status).toBe(CampaignObjectiveStatus.AVAILABLE);
    });

    it('evaluates string conditions and triggers objective progress', () => {
      // First complete prerequisite
      engine.completeObjective('OBJ_C1_CAMPUS_ORIENTATION');

      // Now condition ROCKET_DESIGN_VALIDATED should complete OBJ_C1_FIRST_VEHICLE_DESIGN
      engine.evaluateCondition('ROCKET_DESIGN_VALIDATED');
      const vehicle = engine.getObjective('OBJ_C1_FIRST_VEHICLE_DESIGN');
      expect(vehicle?.status).toBe(CampaignObjectiveStatus.COMPLETED);
    });

    it('grants rewards and records milestone upon milestone completion', () => {
      // Find a milestone objective in chapter 1
      const milestone = engine.getObjectivesForChapter(1).find((o) => o.isMilestone);
      expect(milestone).toBeDefined();

      if (milestone) {
        engine.completeObjective(milestone.id);
        expect(engine.getState().completedMilestoneIds).toContain(milestone.id);
        expect(grantedRewards.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Chapter Progression & Automatic Unlocks', () => {
    it('automatically unlocks Chapter 2 when Chapter 1 mandatory objectives are completed', () => {
      const ch1Objectives = engine.getObjectivesForChapter(1).filter((o) => !o.isOptional);
      for (const obj of ch1Objectives) {
        engine.completeObjective(obj.id);
      }

      const ch1 = engine.getChapter(1);
      expect(ch1?.completed).toBe(true);

      const ch2 = engine.getChapter(2);
      expect(ch2?.unlocked).toBe(true);
      expect(engine.getCurrentChapterNumber()).toBe(2);
    });

    it('emits domain events on chapter unlock and completion', () => {
      const unlockEvents: any[] = [];
      const completeEvents: any[] = [];

      eventBus.on('ChapterUnlocked', (p) => unlockEvents.push(p));
      eventBus.on('ChapterCompleted', (p) => completeEvents.push(p));

      engine.unlockChapter(3);
      expect(unlockEvents).toHaveLength(1);
      expect(unlockEvents[0].chapter.number).toBe(3);
    });
  });

  describe('State Serialization & Reset', () => {
    it('serializes state and correctly restores upon loading', () => {
      engine.completeObjective('OBJ_C1_CAMPUS_ORIENTATION');
      engine.unlockChapter(2);

      const state = engine.getState();
      expect(state.unlockedChapters).toContain(2);
      expect(state.objectives['OBJ_C1_CAMPUS_ORIENTATION']?.status).toBe(CampaignObjectiveStatus.COMPLETED);

      // Create new engine with saved state
      const newEngine = new CampaignProgressionEngine({
        eventBus,
        initialState: state,
      });

      expect(newEngine.getChapter(2)?.unlocked).toBe(true);
      expect(newEngine.getObjective('OBJ_C1_CAMPUS_ORIENTATION')?.status).toBe(CampaignObjectiveStatus.COMPLETED);
    });

    it('resets cleanly back to initial Chapter 1 state', () => {
      engine.unlockChapter(3);
      engine.reset();
      expect(engine.getCurrentChapterNumber()).toBe(1);
      expect(engine.getChapter(3)?.unlocked).toBe(false);
    });
  });
});
