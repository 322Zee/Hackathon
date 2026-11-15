import { describe, it, expect, beforeEach } from 'vitest';
import { ScientificDataManager } from '../../src/science/ScientificDataManager';
import {
  ScientificCategory,
  AnalysisStatus,
  ResearchProjectStatus,
  CollectionSource,
} from '../../src/science/ScientificTypes';
import { DestinationId } from '../../src/destinations/DestinationTypes';
import { EconomyService } from '../../src/services/EconomyService';
import { ResearchService } from '../../src/services/ResearchService';
import { EventBus } from '../../src/core/EventBus';

describe('ResearchProgression', () => {
  let manager: ScientificDataManager;
  let coreEventBus: EventBus;
  let economyService: EconomyService;
  let researchService: ResearchService;

  beforeEach(() => {
    ScientificDataManager.resetInstance();
    coreEventBus = new EventBus();
    economyService = new EconomyService(
      { credits: 100000, researchData: 50, rawMaterials: 50, technologyPoints: 0 },
      coreEventBus
    );
    researchService = new ResearchService(coreEventBus, ['tech_basic_rocketry']);

    manager = ScientificDataManager.getInstance();
    manager.getEconomyAdapter().setEconomyService(economyService);
    manager.getResearchAdapter().setResearchService(researchService);
  });

  describe('Finding Analysis Progression', () => {
    it('advances finding analysis progress incrementally from UNANALYSED to ANALYSED', () => {
      // Find an unanalysed finding
      const unanalysed = manager.listScientificFindings({
        analysisStatus: AnalysisStatus.UNANALYSED,
      })[0];
      expect(unanalysed).toBeDefined();

      const initialResearchData = economyService.getResearchData();

      // Step 1: Advance by 50%
      const step1 = manager.analyseFinding(unanalysed.id, 50);
      expect(step1.analysisStatus).toBe(AnalysisStatus.IN_PROGRESS);
      expect(step1.analysisProgress).toBe(50);
      expect(economyService.getResearchData()).toBe(initialResearchData); // Not awarded until complete

      // Step 2: Advance by 50% to complete
      const step2 = manager.analyseFinding(unanalysed.id, 50);
      expect(step2.analysisStatus).toBe(AnalysisStatus.ANALYSED);
      expect(step2.analysisProgress).toBe(100);

      // Verify research points were awarded to EconomyService
      expect(economyService.getResearchData()).toBe(initialResearchData + step2.researchValue);
    });

    it('verifies an analysed finding and awards bonus points', () => {
      const analysed = manager.listScientificFindings({
        analysisStatus: AnalysisStatus.ANALYSED,
      })[0];
      expect(analysed).toBeDefined();

      const initialPoints = economyService.getResearchData();
      const verified = manager.verifyFinding(analysed.id);

      expect(verified.analysisStatus).toBe(AnalysisStatus.VERIFIED);
      expect(economyService.getResearchData()).toBeGreaterThan(initialPoints);
    });

    it('rejects verification if finding is not yet analysed', () => {
      const unanalysed = manager.registerScientificFinding({
        name: 'Unprocessed Regolith Core',
        destinationId: DestinationId.MOON,
        category: ScientificCategory.MINERAL_COMPOSITION,
        description: 'Pristine lunar core sample.',
        collectionSource: CollectionSource.DEEP_CORE_DRILL,
        missionId: 'MIS_DRILL_01',
      });

      expect(() => {
        manager.verifyFinding(unanalysed.id);
      }).toThrow('must be analysed before it can be verified');
    });

    it('emits FindingAnalysisStarted and FindingAnalysisCompleted events', () => {
      let startedEmitted = false;
      let completedEmitted = false;

      const sub1 = manager.getEventBus().on('FindingAnalysisStarted', () => {
        startedEmitted = true;
      });
      const sub2 = manager.getEventBus().on('FindingAnalysisCompleted', () => {
        completedEmitted = true;
      });

      const finding = manager.registerScientificFinding({
        name: 'Titan Atmospheric Nitrogen Assay',
        destinationId: DestinationId.TITAN,
        category: ScientificCategory.ATMOSPHERIC_OBSERVATIONS,
        description: 'Gas chromatography isotopic profile.',
        collectionSource: CollectionSource.ATMOSPHERIC_PROBE,
        missionId: 'MIS_ATM_01',
      });

      manager.analyseFinding(finding.id, 100);

      expect(startedEmitted).toBe(true);
      expect(completedEmitted).toBe(true);

      sub1.unsubscribe();
      sub2.unsubscribe();
    });
  });

  describe('Research Project Creation & Missing Requirements', () => {
    it('creates a new research project with specified findings requirements', () => {
      const project = manager.createResearchProject({
        title: 'Lunar Polar Hydro-Geology Synthesis',
        description: 'Synthesize permanently shadowed ice and highland anorthosite geology.',
        category: ScientificCategory.ICE_AND_WATER,
        requiredFindingIds: [
          'FINDING_MOON_WATER_ICE_SHACKLETON',
          'FINDING_MOON_ANORTHOSITE_HIGHLANDS',
        ],
        unlockableTechIds: ['tech_lunar_cryo_drill'],
        rewards: {
          researchData: 200,
          technologyPoints: 3,
          credits: 300000,
        },
      });

      expect(project.id).toBeDefined();
      expect(project.title).toBe('Lunar Polar Hydro-Geology Synthesis');
      expect(project.unlockableTechIds).toContain('tech_lunar_cryo_drill');
      expect(project.status).toBe(ResearchProjectStatus.IN_PROGRESS); // Both findings are already analysed/verified in default data
      expect(project.progress).toBe(100);
    });

    it('rejects creation without title or category', () => {
      expect(() => {
        manager.createResearchProject({
          title: '',
          description: 'test',
          category: ScientificCategory.SURFACE_GEOLOGY,
        });
      }).toThrow('title is required');

      expect(() => {
        manager.createResearchProject({
          title: 'Valid Title',
          description: 'test',
          category: '' as any,
        });
      }).toThrow('category is required');
    });

    it('correctly tracks missing requirements for research projects', () => {
      // Register a new unanalysed finding
      const unanalysedFinding = manager.registerScientificFinding({
        name: 'Raw Phobos Surface Regolith',
        destinationId: DestinationId.PHOBOS,
        category: ScientificCategory.ASTEROID_COMPOSITION,
        description: 'Unprocessed surface capture.',
        collectionSource: CollectionSource.SURFACE_LANDER,
        missionId: 'MIS_PHOBOS_02',
      });

      const project = manager.createResearchProject({
        title: 'Phobos Origin & Composition Analysis',
        description: 'Investigate whether Phobos is a captured asteroid.',
        category: ScientificCategory.ASTEROID_COMPOSITION,
        requiredFindingIds: [unanalysedFinding.id],
      });

      const missing = manager.getMissingRequirements(project.id);
      expect(missing).toContain(unanalysedFinding.id);

      // Attempting to complete project before analysing requirements must fail
      expect(() => {
        manager.completeResearchProject(project.id);
      }).toThrow('missing analyzed findings');

      // Now analyse the finding
      manager.analyseFinding(unanalysedFinding.id, 100);

      const missingAfter = manager.getMissingRequirements(project.id);
      expect(missingAfter.length).toBe(0);

      // Now completion must succeed
      const completed = manager.completeResearchProject(project.id);
      expect(completed.status).toBe(ResearchProjectStatus.COMPLETED);
    });
  });

  describe('Research Project Completion & Reward Payouts', () => {
    it('awards research data, TP, credits, and unlocks technologies upon completion', () => {
      const initialCredits = economyService.getCredits();
      const initialTP = economyService.getTechnologyPoints();
      const initialRD = economyService.getResearchData();

      // Create and complete a project where all findings are ready
      const project = manager.createResearchProject({
        title: 'Shackleton Volatile Utilization Initiative',
        description: 'Complete research into polar ice harvesting.',
        category: ScientificCategory.ICE_AND_WATER,
        requiredFindingIds: ['FINDING_MOON_WATER_ICE_SHACKLETON'],
        unlockableTechIds: ['tech_lunar_ice_purifier'],
        rewards: {
          researchData: 500,
          technologyPoints: 5,
          credits: 450000,
        },
      });

      const completed = manager.completeResearchProject(project.id);
      expect(completed.status).toBe(ResearchProjectStatus.COMPLETED);

      // Verify EconomyService received payouts
      expect(economyService.getCredits()).toBe(initialCredits + 450000);
      expect(economyService.getTechnologyPoints()).toBe(initialTP + 5);
      expect(economyService.getResearchData()).toBe(initialRD + 500);

      // Verify ResearchService received unlocked technology
      expect(researchService.isUnlocked('tech_lunar_ice_purifier')).toBe(true);
    });

    it('emits ResearchProjectCompleted event upon completion', () => {
      let eventProjectTitle = '';
      const sub = manager.getEventBus().on('ResearchProjectCompleted', (payload) => {
        eventProjectTitle = payload.project.title;
      });

      const project = manager.createResearchProject({
        title: 'Solar Flare Reconnection Survey',
        description: 'Analyze coronal mass ejection shocks.',
        category: ScientificCategory.GENERAL_ASTRONOMICAL,
        requiredFindingIds: ['FINDING_SUN_CORONAL_MASS_EJECTION_SHOCK'],
      });

      manager.completeResearchProject(project.id);
      expect(eventProjectTitle).toBe('Solar Flare Reconnection Survey');
      sub.unsubscribe();
    });
  });

  describe('Comparative Analysis Lab', () => {
    it('compares two findings and determines shared category and relationships', () => {
      const comparison = manager.compareDiscoveries(
        'FINDING_MOON_WATER_ICE_SHACKLETON',
        'FINDING_MOON_SOUTH_POLE_ELEVATION'
      );

      expect(comparison.findingA.name).toBe('Permanently Shadowed Crater Regolith Volatiles');
      expect(comparison.findingB.name).toBe('Shackleton Rim Peak of Eternal Light');
      expect(comparison.areRelated).toBe(true);
      expect(comparison.sharedCategory).toBe(false); // ICE_AND_WATER vs PLANETARY_IMAGING
    });

    it('throws error when comparing non-existent finding IDs', () => {
      expect(() => {
        manager.compareDiscoveries('FINDING_MOON_WATER_ICE_SHACKLETON', 'NON_EXISTENT');
      }).toThrow('Both findings must exist');
    });
  });
});
