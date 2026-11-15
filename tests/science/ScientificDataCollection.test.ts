import { describe, it, expect, beforeEach } from 'vitest';
import { ScientificDataManager } from '../../src/science/ScientificDataManager';
import {
  ScientificCategory,
  DataQualityRating,
  CollectionSource,
  CollectionConditions,
} from '../../src/science/ScientificTypes';
import { DestinationId } from '../../src/destinations/DestinationTypes';

describe('ScientificDataCollection', () => {
  let manager: ScientificDataManager;

  beforeEach(() => {
    ScientificDataManager.resetInstance();
    manager = ScientificDataManager.getInstance();
  });

  describe('Solar System Destination Support', () => {
    it('supports discoveries from all required planetary bodies and moons', () => {
      const requiredDestinations = [
        DestinationId.MOON,
        DestinationId.MARS,
        DestinationId.VENUS,
        DestinationId.MERCURY,
        DestinationId.ASTEROID_BELT,
        DestinationId.CERES,
        DestinationId.VESTA,
        DestinationId.JUPITER,
        DestinationId.EUROPA,
        DestinationId.IO,
        DestinationId.SATURN,
        DestinationId.TITAN,
        DestinationId.ENCELADUS,
        DestinationId.URANUS,
        DestinationId.NEPTUNE,
        DestinationId.TRITON,
        DestinationId.SUN,
        DestinationId.EARTH_ORBIT_MEO,
      ];

      const allFindings = manager.listScientificFindings();
      for (const dest of requiredDestinations) {
        const destFindings = allFindings.filter((f) => f.destinationId === dest);
        expect(destFindings.length, `Expected finding at destination ${dest}`).toBeGreaterThan(0);
      }
    });

    it('filters findings correctly by destination', () => {
      const moonFindings = manager.getFindingsByDestination(DestinationId.MOON);
      expect(moonFindings.length).toBeGreaterThan(0);
      expect(moonFindings.every((f) => f.destinationId === DestinationId.MOON)).toBe(true);

      const marsFindings = manager.getFindingsByDestination(DestinationId.MARS);
      expect(marsFindings.length).toBeGreaterThan(0);
      expect(marsFindings.every((f) => f.destinationId === DestinationId.MARS)).toBe(true);
    });
  });

  describe('Canonical Scientific Categories Support', () => {
    it('supports all 10 canonical scientific categories', () => {
      const requiredCategories = [
        ScientificCategory.SURFACE_GEOLOGY,
        ScientificCategory.ATMOSPHERIC_OBSERVATIONS,
        ScientificCategory.MINERAL_COMPOSITION,
        ScientificCategory.ENVIRONMENTAL_MEASUREMENTS,
        ScientificCategory.MAGNETIC_FIELD_OBSERVATIONS,
        ScientificCategory.ICE_AND_WATER,
        ScientificCategory.ASTEROID_COMPOSITION,
        ScientificCategory.PLANETARY_IMAGING,
        ScientificCategory.RADIATION_ENVIRONMENT,
        ScientificCategory.GENERAL_ASTRONOMICAL,
      ];

      const allFindings = manager.listScientificFindings();
      for (const cat of requiredCategories) {
        const catFindings = allFindings.filter((f) => f.category === cat);
        expect(catFindings.length, `Expected finding in category ${cat}`).toBeGreaterThan(0);
      }
    });

    it('filters findings correctly by category', () => {
      const waterFindings = manager.listScientificFindings({
        category: ScientificCategory.ICE_AND_WATER,
      });
      expect(waterFindings.length).toBeGreaterThan(0);
      expect(waterFindings.every((f) => f.category === ScientificCategory.ICE_AND_WATER)).toBe(true);

      const geologyFindings = manager.listScientificFindings({
        category: ScientificCategory.SURFACE_GEOLOGY,
      });
      expect(geologyFindings.length).toBeGreaterThan(0);
      expect(geologyFindings.every((f) => f.category === ScientificCategory.SURFACE_GEOLOGY)).toBe(true);
    });
  });

  describe('Educational Responsibility & Established Science', () => {
    it('clearly distinguishes established scientific knowledge from game discoveries', () => {
      const findings = manager.listScientificFindings();
      const established = findings.filter((f) => f.isEstablishedScience);
      expect(established.length).toBeGreaterThan(10);

      // Verify educational descriptions are descriptive and responsible
      for (const f of established) {
        expect(f.description.length).toBeGreaterThan(30);
        expect(f.description).not.toContain('invented fact');
      }
    });

    it('allows registering hypothetical game discoveries with isEstablishedScience: false', () => {
      const fictional = manager.registerScientificFinding({
        name: 'Hypothetical Xenocrystalline Monolith',
        destinationId: DestinationId.PHOBOS,
        category: ScientificCategory.MINERAL_COMPOSITION,
        description: 'Unusual geometric crystalline structure detected in Stickney Crater rim.',
        collectionSource: CollectionSource.SURFACE_ROVER,
        missionId: 'MIS_PHOBOS_01',
        isEstablishedScience: false,
      });

      expect(fictional.isEstablishedScience).toBe(false);
    });
  });

  describe('Collection Conditions Metadata', () => {
    it('records and retrieves collection conditions for a finding', () => {
      const conditions: CollectionConditions = {
        signalQuality: 92,
        instrumentFidelity: 98,
        hazardLevel: 'MODERATE',
        collectionDurationHours: 4.5,
        notes: 'Collected during local dust storm with minimal solar array degradation.',
      };

      const finding = manager.registerScientificFinding({
        name: 'Meridiani Planum Hematite Spherules',
        destinationId: DestinationId.MARS,
        category: ScientificCategory.MINERAL_COMPOSITION,
        description: 'Grey hematite blueberries confirming aqueous acidic groundwater history.',
        collectionSource: CollectionSource.SURFACE_ROVER,
        missionId: 'MIS_OPPORTUNITY_HERITAGE',
        conditions,
      });

      const retrievedConditions = manager.getCollectionConditions(finding.id);
      expect(retrievedConditions).not.toBeNull();
      expect(retrievedConditions?.signalQuality).toBe(92);
      expect(retrievedConditions?.instrumentFidelity).toBe(98);
      expect(retrievedConditions?.hazardLevel).toBe('MODERATE');
      expect(retrievedConditions?.collectionDurationHours).toBe(4.5);
    });

    it('rejects recording collection conditions for non-existent finding', () => {
      expect(() => {
        manager.setCollectionConditions('NON_EXISTENT_ID', {
          signalQuality: 50,
          instrumentFidelity: 50,
          hazardLevel: 'LOW',
          collectionDurationHours: 1,
        });
      }).toThrow('does not exist');
    });
  });

  describe('Scientific Domain Event Bus', () => {
    it('emits ScientificFindingRegistered event upon successful registration', () => {
      let emittedFindingId = '';
      const sub = manager.getEventBus().on('ScientificFindingRegistered', (payload) => {
        emittedFindingId = payload.finding.id;
      });

      const finding = manager.registerScientificFinding({
        name: 'Titan Cryodune Organic Tholins',
        destinationId: DestinationId.TITAN,
        category: ScientificCategory.SURFACE_GEOLOGY,
        description: 'Long linear organic polymer dunes shaped by methane breezes.',
        collectionSource: CollectionSource.ATMOSPHERIC_PROBE,
        missionId: 'MIS_TITAN_PROBE',
        dataQuality: DataQualityRating.HIGH_QUALITY,
      });

      expect(emittedFindingId).toBe(finding.id);
      sub.unsubscribe();
    });
  });
});
