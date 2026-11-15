import { describe, it, expect, beforeEach } from 'vitest';
import { ScientificDataManager } from '../../src/science/ScientificDataManager';
import {
  ScientificCategory,
  DataQualityRating,
  AnalysisStatus,
  CollectionSource,
  SCIENTIFIC_DATA_SCHEMA_VERSION,
} from '../../src/science/ScientificTypes';
import { DestinationId } from '../../src/destinations/DestinationTypes';

describe('ScientificDataManager', () => {
  let manager: ScientificDataManager;

  beforeEach(() => {
    ScientificDataManager.resetInstance();
    manager = ScientificDataManager.getInstance();
  });

  describe('Initialization & Singleton', () => {
    it('returns the same singleton instance', () => {
      const another = ScientificDataManager.getInstance();
      expect(another).toBe(manager);
    });

    it('loads default canonical discoveries on initialization', () => {
      const findings = manager.listScientificFindings();
      expect(findings.length).toBeGreaterThan(10);
      expect(findings.some((f) => f.destinationId === DestinationId.MOON)).toBe(true);
      expect(findings.some((f) => f.destinationId === DestinationId.MARS)).toBe(true);
      expect(findings.some((f) => f.destinationId === DestinationId.EUROPA)).toBe(true);
    });

    it('loads default research projects on initialization', () => {
      const projects = manager.listResearchProjects();
      expect(projects.length).toBeGreaterThan(4);
    });
  });

  describe('Scientific Finding Registration & Duplicate Protection', () => {
    it('registers a new scientific finding with unique ID and default attributes', () => {
      const finding = manager.registerScientificFinding({
        name: 'Gale Crater Lacustrine Mudstone',
        destinationId: DestinationId.MARS,
        category: ScientificCategory.SURFACE_GEOLOGY,
        description: 'Fine laminations indicate quiet depositional lacustrine conditions.',
        collectionSource: CollectionSource.SURFACE_ROVER,
        missionId: 'MIS_CURIOSITY_01',
        dataQuality: DataQualityRating.HIGH_QUALITY,
        researchValue: 90,
      });

      expect(finding.id).toBeDefined();
      expect(finding.id.startsWith('FINDING_MARS_SURF_')).toBe(true);
      expect(finding.name).toBe('Gale Crater Lacustrine Mudstone');
      expect(finding.analysisStatus).toBe(AnalysisStatus.UNANALYSED);
      expect(finding.analysisProgress).toBe(0);
      expect(finding.researchValue).toBe(135); // 90 * 1.5 (HIGH_QUALITY multiplier)

      const retrieved = manager.getScientificFinding(finding.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.name).toBe('Gale Crater Lacustrine Mudstone');
    });

    it('rejects registration with missing mandatory fields', () => {
      expect(() => {
        manager.registerScientificFinding({
          name: '',
          destinationId: DestinationId.MARS,
          category: ScientificCategory.SURFACE_GEOLOGY,
          description: 'test',
          collectionSource: CollectionSource.SURFACE_ROVER,
          missionId: 'MIS_01',
        });
      }).toThrow('name is required');

      expect(() => {
        manager.registerScientificFinding({
          name: 'Valid Name',
          destinationId: '' as any,
          category: ScientificCategory.SURFACE_GEOLOGY,
          description: 'test',
          collectionSource: CollectionSource.SURFACE_ROVER,
          missionId: 'MIS_01',
        });
      }).toThrow('destinationId is required');
    });

    it('prevents accidental duplicate registrations and upgrades quality if higher', () => {
      const first = manager.registerScientificFinding({
        name: 'Olympus Mons Basalt Lava Flow',
        destinationId: DestinationId.MARS,
        category: ScientificCategory.SURFACE_GEOLOGY,
        description: 'Shield volcano flank basaltic flows.',
        collectionSource: CollectionSource.ORBITAL_SURVEY,
        missionId: 'MIS_MARS_ORBITER_01',
        dataQuality: DataQualityRating.STANDARD,
        researchValue: 60,
      });

      const initialCount = manager.listScientificFindings().length;

      // Re-observe the same finding with higher quality
      const second = manager.registerScientificFinding({
        name: 'Olympus Mons Basalt Lava Flow',
        destinationId: DestinationId.MARS,
        category: ScientificCategory.SURFACE_GEOLOGY,
        description: 'Updated higher resolution orbital sweep.',
        collectionSource: CollectionSource.ORBITAL_SURVEY,
        missionId: 'MIS_MARS_ORBITER_02',
        dataQuality: DataQualityRating.EXCEPTIONAL,
      });

      expect(second.id).toBe(first.id);
      expect(manager.listScientificFindings().length).toBe(initialCount);
      expect(second.dataQuality).toBe(DataQualityRating.EXCEPTIONAL);
      expect(second.researchValue).toBe(120); // 60 * (2.0 / 1.0)
    });

    it('allows registering multiple distinct findings from the same mission', () => {
      const missionId = 'MIS_MULTI_PAYLOAD_EXPEDITION';

      const f1 = manager.registerScientificFinding({
        name: 'Expedition Site Geology Scan',
        destinationId: DestinationId.MOON,
        category: ScientificCategory.SURFACE_GEOLOGY,
        description: 'Regolith breccia scan.',
        collectionSource: CollectionSource.SURFACE_LANDER,
        missionId,
      });

      const f2 = manager.registerScientificFinding({
        name: 'Expedition Site Radiation Survey',
        destinationId: DestinationId.MOON,
        category: ScientificCategory.RADIATION_ENVIRONMENT,
        description: 'Secondary neutron flux monitoring.',
        collectionSource: CollectionSource.SURFACE_LANDER,
        missionId,
      });

      const missionFindings = manager.getFindingsByMission(missionId);
      expect(missionFindings.length).toBe(2);
      expect(missionFindings.map((f) => f.id)).toContain(f1.id);
      expect(missionFindings.map((f) => f.id)).toContain(f2.id);
    });
  });

  describe('Finding Quality and Missing Records', () => {
    it('returns null when querying non-existent finding ID', () => {
      expect(manager.getScientificFinding('NON_EXISTENT_ID')).toBeNull();
    });

    it('updates finding quality and recalculates research value', () => {
      const finding = manager.registerScientificFinding({
        name: 'Calippus Rille High-Resolution Scan',
        destinationId: DestinationId.MOON,
        category: ScientificCategory.SURFACE_GEOLOGY,
        description: 'Lunar graben collapsed lava tube structure.',
        collectionSource: CollectionSource.ORBITAL_SURVEY,
        missionId: 'MIS_LUNAR_ORBITER',
        dataQuality: DataQualityRating.STANDARD,
        researchValue: 50,
      });

      const updated = manager.updateFindingQuality(finding.id, DataQualityRating.EXCEPTIONAL);
      expect(updated.dataQuality).toBe(DataQualityRating.EXCEPTIONAL);
      expect(updated.researchValue).toBe(100); // 50 * (2.0 / 1.0)
    });

    it('throws error when updating quality of non-existent finding', () => {
      expect(() => {
        manager.updateFindingQuality('UNKNOWN_FINDING', DataQualityRating.HIGH_QUALITY);
      }).toThrow('not found');
    });
  });

  describe('Serialization, Deserialization & Data Integrity', () => {
    it('safely serializes and restores complete scientific dataset', () => {
      const initialCount = manager.listScientificFindings().length;
      const initialProjects = manager.listResearchProjects().length;

      const serialized = manager.serialize();
      expect(serialized.schemaVersion).toBe(SCIENTIFIC_DATA_SCHEMA_VERSION);
      expect(serialized.findings.length).toBe(initialCount);
      expect(serialized.researchProjects.length).toBe(initialProjects);

      // Create a fresh instance and deserialize
      ScientificDataManager.resetInstance();
      const newManager = ScientificDataManager.getInstance();
      newManager.deserialize(serialized);

      expect(newManager.listScientificFindings().length).toBe(initialCount);
      expect(newManager.listResearchProjects().length).toBe(initialProjects);

      // Verify specific data survived
      const shackleton = newManager.getScientificFinding('FINDING_MOON_WATER_ICE_SHACKLETON');
      expect(shackleton).not.toBeNull();
      expect(shackleton?.category).toBe(ScientificCategory.ICE_AND_WATER);
      expect(shackleton?.analysisStatus).toBe(AnalysisStatus.ANALYSED);
    });

    it('rejects invalid or corrupted save states during deserialization', () => {
      expect(() => {
        manager.deserialize(null as any);
      }).toThrow('invalid state schema');

      expect(() => {
        manager.deserialize({ findings: null } as any);
      }).toThrow('invalid state schema');
    });
  });

  describe('Research Overview Metrics', () => {
    it('computes accurate totals and breakdown by category and status', () => {
      const overview = manager.getResearchOverview();

      expect(overview.totalFindings).toBeGreaterThan(0);
      expect(overview.totalProjects).toBeGreaterThan(0);
      expect(overview.overallProgress).toBeGreaterThanOrEqual(0);
      expect(overview.overallProgress).toBeLessThanOrEqual(100);

      // Sum of status breakdown equals total findings
      const statusSum = Object.values(overview.findingsByStatus).reduce((a, b) => a + b, 0);
      expect(statusSum).toBe(overview.totalFindings);

      // Sum of category breakdown equals total findings
      const catSum = Object.values(overview.findingsByCategory).reduce((a, b) => a + b, 0);
      expect(catSum).toBe(overview.totalFindings);
    });
  });
});
