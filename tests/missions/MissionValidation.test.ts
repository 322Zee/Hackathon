import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  validateMissionDefinition,
  validateMissionCatalogue,
} from '../../src/missions/MissionValidation';
import {
  MissionDefinition,
  MissionCategory,
  SpacecraftType,
  PayloadType,
  MissionDifficulty,
  MissionStageType,
  ObjectiveType,
  ScientificInstrument,
} from '../../src/missions/MissionTypes';
import { DestinationId } from '../../src/destinations/DestinationTypes';
import { DestinationRegistry } from '../../src/destinations/DestinationRegistry';

function createValidMission(overrides: Partial<MissionDefinition> = {}): MissionDefinition {
  return {
    id: 'test-mission-01',
    name: 'Test Atmospheric Sounder',
    shortCode: 'MSN-TEST-001',
    category: MissionCategory.SCIENTIFIC_EXPLORATION,
    summary: 'Suborbital Mesosphere atmospheric profile test.',
    description: 'Launch an atmospheric sounding probe into the upper mesosphere.',
    destinationId: DestinationId.EARTH,
    sequenceLevel: 1,
    stageType: MissionStageType.DEPLOYMENT,
    difficulty: MissionDifficulty.EASY,
    scientificPurpose: 'Characterize upper atmospheric density gradient.',
    mainObjectives: [
      {
        id: 'obj-1',
        title: 'Gather Telemetry',
        description: 'Record mesospheric pressure and temperature profile.',
        type: ObjectiveType.SCIENTIFIC_SURVEY,
        isCompleted: false,
        isDeliveryObjective: false,
        isExplorationObjective: true,
      },
    ],
    optionalObjectives: [],
    prerequisites: {
      requiredDirectorRank: 1,
      requiredMissionIds: [],
      requiredTechNodeIds: [],
      requiredDestinationUnlocked: true,
    },
    engineeringRequirements: {
      spacecraftType: SpacecraftType.ATMOSPHERIC_ENTRY_PROBE,
      payloadType: PayloadType.SCIENCE_INSTRUMENT_PACKAGE,
      requiredInstruments: [ScientificInstrument.ATMOSPHERIC_STRUCTURE_PROBE],
      minPayloadMassKg: 20,
      maxPayloadMassKg: 50,
      minPowerWatts: 15,
      minBatteryCapacityWh: 50,
      communicationBandwidthKbps: 128,
      relayRequired: false,
    },
    budget: {
      allocatedCredits: 150000,
      launchCostCapCredits: 120000,
    },
    estimatedDurationDays: 1,
    rewards: {
      credits: 200000,
      researchData: 40,
      rawMaterials: 0,
      technologyPoints: 10,
      agencyPrestige: 15,
    },
    failureConditions: ['Loss of vehicle telemetry', 'Premature structural breakup'],
    completionConditions: ['Apogee exceeds 85 km', 'Atmospheric telemetry returned'],
    isReplayable: false,
    educationalContent: {
      coreConcept: 'Sounding Rockets & Aeronomy',
      explanation: 'Sounding rockets probe the mesosphere without needing full orbital velocity.',
      realWorldParallel: 'NASA Aerobee sounding rockets launched in the 1950s.',
    },
    ...overrides,
  };
}

describe('MissionValidation', () => {
  beforeEach(() => {
    DestinationRegistry.resetInstance();
  });

  afterEach(() => {
    DestinationRegistry.resetInstance();
  });

  describe('validateMissionDefinition', () => {
    it('validates a complete, valid mission definition', () => {
      const mission = createValidMission();
      const result = validateMissionDefinition(mission);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('flags missing or blank name and description', () => {
      const mission = createValidMission({
        name: '',
        description: '',
        mainObjectives: [
          {
            id: 'obj-1',
            title: '',
            description: '',
            type: ObjectiveType.ORBITAL_INSERTION,
            isCompleted: false,
          },
        ],
      });
      const result = validateMissionDefinition(mission);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'name')).toBe(true);
      expect(result.errors.some((e) => e.field === 'description')).toBe(true);
      expect(result.errors.some((e) => e.field.includes('mainObjectives'))).toBe(true);
    });

    it('flags nonexistent destination ID', () => {
      const mission = createValidMission({
        destinationId: 'NONEXISTENT_PLANET' as any,
      });
      const result = validateMissionDefinition(mission);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'destinationId')).toBe(true);
    });

    it('enforces COMBINED missions must have both delivery and exploration objectives', () => {
      const invalidCombined = createValidMission({
        id: 'test-combined-01',
        category: MissionCategory.COMBINED,
        mainObjectives: [
          {
            id: 'obj-1',
            title: 'Deploy Satellite',
            description: 'Put comms relay in orbit',
            type: ObjectiveType.DELIVERY,
            isCompleted: false,
            isDeliveryObjective: true,
            isExplorationObjective: false,
          },
        ],
      });
      const resultInvalid = validateMissionDefinition(invalidCombined);
      expect(resultInvalid.isValid).toBe(false);
      expect(resultInvalid.errors.some((e) => e.field === 'category')).toBe(true);
      expect(resultInvalid.errors.some((e) => e.message.includes('exploration objective'))).toBe(true);

      const validCombined = createValidMission({
        id: 'test-combined-02',
        category: MissionCategory.COMBINED,
        mainObjectives: [
          {
            id: 'obj-1',
            title: 'Deploy Satellite',
            description: 'Put comms relay in orbit',
            type: ObjectiveType.DELIVERY,
            isCompleted: false,
            isDeliveryObjective: true,
            isExplorationObjective: false,
          },
          {
            id: 'obj-2',
            title: 'Scan surface',
            description: 'Map surface topography',
            type: ObjectiveType.SCIENTIFIC_SURVEY,
            isCompleted: false,
            isDeliveryObjective: false,
            isExplorationObjective: true,
          },
        ],
      });
      const resultValid = validateMissionDefinition(validCombined);
      expect(resultValid.isValid).toBe(true);
    });

    it('flags invalid payload mass ranges', () => {
      const mission = createValidMission({
        engineeringRequirements: {
          spacecraftType: SpacecraftType.SATELLITE_BUS,
          payloadType: PayloadType.COMMUNICATION_RELAY,
          requiredInstruments: [],
          minPayloadMassKg: 500,
          maxPayloadMassKg: 200, // min > max
          minPowerWatts: 100,
          minBatteryCapacityWh: 200,
          communicationBandwidthKbps: 500,
          relayRequired: false,
        },
      });
      const result = validateMissionDefinition(mission);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field.includes('maxPayloadMassKg'))).toBe(true);
    });

    it('flags non-positive budget or excessive expenditure limits', () => {
      const mission = createValidMission({
        budget: {
          allocatedCredits: -5000,
          launchCostCapCredits: 20000,
        },
      });
      const result = validateMissionDefinition(mission);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field.includes('allocatedCredits'))).toBe(true);
    });
  });

  describe('validateMissionCatalogue', () => {
    it('detects duplicate mission IDs', () => {
      const m1 = createValidMission({ id: 'mission-alpha' });
      const m2 = createValidMission({ id: 'mission-alpha' });

      const result = validateMissionCatalogue([m1, m2]);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Duplicate mission ID'))).toBe(true);
    });

    it('detects unknown prerequisite IDs', () => {
      const m1 = createValidMission({
        id: 'mission-beta',
        prerequisites: {
          requiredDirectorRank: 1,
          requiredMissionIds: ['unknown-mission-xyz'],
          requiredTechNodeIds: [],
          requiredDestinationUnlocked: true,
        },
      });

      const result = validateMissionCatalogue([m1]);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('does not exist in the catalogue'))).toBe(true);
    });

    it('detects circular prerequisite dependencies', () => {
      const m1 = createValidMission({
        id: 'mission-cycle-1',
        prerequisites: {
          requiredDirectorRank: 1,
          requiredMissionIds: ['mission-cycle-2'],
          requiredTechNodeIds: [],
          requiredDestinationUnlocked: true,
        },
      });
      const m2 = createValidMission({
        id: 'mission-cycle-2',
        prerequisites: {
          requiredDirectorRank: 1,
          requiredMissionIds: ['mission-cycle-1'],
          requiredTechNodeIds: [],
          requiredDestinationUnlocked: true,
        },
      });

      const result = validateMissionCatalogue([m1, m2]);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Circular mission prerequisite dependency detected'))).toBe(true);
    });

    it('validates entire built-in mission catalogue successfully', async () => {
      const { BUILTIN_MISSIONS } = await import('../../src/missions/MissionData');
      const result = validateMissionCatalogue(BUILTIN_MISSIONS);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(BUILTIN_MISSIONS.length).toBeGreaterThanOrEqual(20);
    });
  });
});
