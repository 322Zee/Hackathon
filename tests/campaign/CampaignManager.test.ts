/**
 * INTERSTELLAR CONTINUUM - Campaign Manager Facade Unit Tests
 * Validates the full Section 12 Public API, domain adapters, and persistence.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CampaignManager } from '../../src/campaign/CampaignManager';
import { EventBus } from '../../src/core/EventBus';
import { CampaignObjectiveStatus } from '../../src/campaign/CampaignTypes';

describe('CampaignManager', () => {
  let coreBus: EventBus;
  let manager: CampaignManager;

  beforeEach(() => {
    CampaignManager.resetInstance();
    coreBus = new EventBus();
    manager = new CampaignManager({
      coreEventBus: coreBus,
      autoLoad: false,
    });
  });

  describe('Section 12 Public API Contract', () => {
    it('implements getCampaignState() returning full persistent model', () => {
      const state = manager.getCampaignState();
      expect(state).toBeDefined();
      expect(state.schemaVersion).toBe(1);
      expect(state.currentChapter).toBe(1);
      expect(state.unlockedChapters).toContain(1);
      expect(Array.isArray(state.completedTutorialIds)).toBe(true);
      expect(state.tutorialPreferences.tutorialsEnabled).toBe(true);
    });

    it('implements getCurrentChapter() and listCampaignObjectives()', () => {
      const chapter = manager.getCurrentChapter();
      expect(chapter.number).toBe(1);
      expect(chapter.unlocked).toBe(true);

      const allObjectives = manager.listCampaignObjectives();
      expect(allObjectives.length).toBeGreaterThan(0);

      const ch1Objectives = manager.listCampaignObjectives(1);
      expect(ch1Objectives.length).toBeGreaterThan(0);
      expect(ch1Objectives.every((o) => o.chapter === 1)).toBe(true);
    });

    it('implements getObjective() and updateObjectiveProgress()', () => {
      const obj = manager.getObjective('OBJ_C1_CAMPUS_ORIENTATION');
      expect(obj).not.toBeNull();

      manager.updateObjectiveProgress('OBJ_C1_CAMPUS_ORIENTATION', 1, 3);
      const updated = manager.getObjective('OBJ_C1_CAMPUS_ORIENTATION');
      expect(updated?.currentValue).toBe(1);
      expect(updated?.status).toBe(CampaignObjectiveStatus.IN_PROGRESS);
    });

    it('implements completeCampaignObjective() and unlockCampaignChapter()', () => {
      manager.completeCampaignObjective('OBJ_C1_CAMPUS_ORIENTATION');
      const obj = manager.getObjective('OBJ_C1_CAMPUS_ORIENTATION');
      expect(obj?.status).toBe(CampaignObjectiveStatus.COMPLETED);

      manager.unlockCampaignChapter(3);
      const ch3 = manager.listCampaignObjectives(3);
      expect(ch3.length).toBeGreaterThan(0);
      expect(manager.getCampaignState().unlockedChapters).toContain(3);
    });

    it('implements getCampaignOverview() with key metrics', () => {
      const overview = manager.getCampaignOverview();
      expect(overview.currentChapter.number).toBe(1);
      expect(overview.allChapters.length).toBe(8);
      expect(overview.totalObjectivesCount).toBeGreaterThan(0);
      expect(typeof overview.campaignProgressPercentage).toBe('number');
      expect(Array.isArray(overview.availableExplorationOpportunities)).toBe(true);
    });

    it('implements tutorial controls (start, advance, complete, skip, status)', () => {
      manager.startTutorial('TUT_HEADQUARTERS');
      let status = manager.getTutorialStatus('TUT_HEADQUARTERS');
      expect(status.active).toBe(true);
      expect(status.completed).toBe(false);

      manager.completeTutorial('TUT_HEADQUARTERS');
      status = manager.getTutorialStatus('TUT_HEADQUARTERS');
      expect(status.active).toBe(false);
      expect(status.completed).toBe(true);

      manager.skipTutorial('TUT_ROCKET_ENGINEERING');
      const rocketStatus = manager.getTutorialStatus('TUT_ROCKET_ENGINEERING');
      expect(rocketStatus.skipped).toBe(true);
    });

    it('implements setTutorialPreferences()', () => {
      manager.setTutorialPreferences({ tutorialsEnabled: false, showContextualHints: false });
      const prefs = manager.getCampaignState().tutorialPreferences;
      expect(prefs.tutorialsEnabled).toBe(false);
      expect(prefs.showContextualHints).toBe(false);
    });
  });

  describe('Narrative Introduction Flow', () => {
    it('tracks completion and skip states', () => {
      expect(manager.isNarrativeIntroCompleted()).toBe(false);

      manager.skipNarrativeIntro();
      expect(manager.isNarrativeIntroCompleted()).toBe(true);
      expect(manager.getCampaignState().narrativeIntroSkipped).toBe(true);

      manager.completeNarrativeIntro();
      expect(manager.isNarrativeIntroCompleted()).toBe(true);
      expect(manager.getCampaignState().narrativeIntroSkipped).toBe(false);
    });
  });

  describe('Adapter Integrations', () => {
    it('bridges core mission completion events into objective completion', () => {
      coreBus.emit('mission:completed', { missionId: 'EARTH_LEO_DEPLOYMENT_01', score: 95 });
      const satelliteObj = manager.getObjective('OBJ_C1_LAUNCH_PIONEER_SATELLITE');
      expect(satelliteObj?.status).toBe(CampaignObjectiveStatus.COMPLETED);
    });

    it('bridges headquarters facility visits into campus orientation progress', () => {
      manager.getHeadquartersAdapter().recordFacilityVisited('mission_operations');
      manager.getHeadquartersAdapter().recordFacilityVisited('rocket_engineering');
      manager.getHeadquartersAdapter().recordFacilityVisited('launch_pad_alpha');

      const orientationObj = manager.getObjective('OBJ_C1_CAMPUS_ORIENTATION');
      expect(orientationObj?.status).toBe(CampaignObjectiveStatus.COMPLETED);
    });
  });

  describe('Legacy Save Migration', () => {
    it('seamlessly migrates legacy saves without campaign state', () => {
      manager.loadFromLegacySave({
        completedMissions: ['EARTH_LEO_DEPLOYMENT_01', 'MOON_ORBIT_SURVEY_01', 'MARS_ORBITER_01'],
        unlockedTechnologies: ['tech_rocketry', 'tech_telemetry', 'tech_ion'],
      });

      const state = manager.getCampaignState();
      expect(state.currentChapter).toBeGreaterThanOrEqual(4);
      expect(state.unlockedChapters).toContain(4);
      expect(state.hasCompletedNarrativeIntro).toBe(true);
    });
  });
});
