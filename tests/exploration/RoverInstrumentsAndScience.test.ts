import { describe, it, expect, beforeEach } from 'vitest';
import { RoverInstrumentManager } from '../../src/exploration/RoverInstrumentManager';
import { RoverRegistry } from '../../src/exploration/RoverRegistry';
import { RoverRecord } from '../../src/exploration/ExplorationTypes';

describe('RoverInstrumentManager and Scientific Data Collection', () => {
  let instrumentManager: RoverInstrumentManager;
  let scienceRover: RoverRecord;

  beforeEach(() => {
    RoverRegistry.resetInstance();
    const registry = RoverRegistry.getInstance();
    scienceRover = registry.getRover('ROVER_SCIENCE_01')!;
    scienceRover.location = { x: 100, y: 100, headingDeg: 0, currentTerrain: 0 as any };
    instrumentManager = new RoverInstrumentManager();
  });

  it('collects scientific observation successfully within operational range', () => {
    scienceRover.energyRating = 80;

    const target = { x: 120, y: 110 }; // 22m away, well within range
    const result = instrumentManager.collectObservation(scienceRover, 'INST_MASTCAM_STEREO', target);

    expect(result.success).toBe(true);
    expect(result.dataCollected).toBeGreaterThan(0);
    expect(result.energyConsumed).toBeGreaterThan(0);
    expect(scienceRover.energyRating).toBeLessThan(80);
    expect(scienceRover.stats.observationsCollected).toBe(1);
  });

  it('rejects observation when target is outside instrument operational range', () => {
    const farTarget = { x: 900, y: 900 }; // ~1130m away, far outside operational range

    const result = instrumentManager.collectObservation(scienceRover, 'INST_MASTCAM_STEREO', farTarget);
    expect(result.success).toBe(false);
    expect(result.message).toContain('out of range');
  });

  it('rejects firing instrument when rover energy is insufficient', () => {
    scienceRover.energyRating = 2.0; // Very low battery
    const target = { x: 105, y: 105 };

    const result = instrumentManager.collectObservation(scienceRover, 'INST_CORE_DRILL_SYSTEM', target);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Insufficient energy');
  });

  it('tracks instrument cooldown and prevents rapid spamming until recharged', () => {
    scienceRover.energyRating = 100;
    const target = { x: 105, y: 105 };

    const firstResult = instrumentManager.collectObservation(scienceRover, 'INST_MASTCAM_STEREO', target);
    expect(firstResult.success).toBe(true);

    // Second immediate attempt should fail due to cooldown
    const secondResult = instrumentManager.collectObservation(scienceRover, 'INST_MASTCAM_STEREO', target);
    expect(secondResult.success).toBe(false);
    expect(secondResult.message).toContain('recharging');

    // Advance time to clear cooldown
    instrumentManager.updateCooldowns(scienceRover, 3.0);

    const thirdResult = instrumentManager.collectObservation(scienceRover, 'INST_MASTCAM_STEREO', target);
    expect(thirdResult.success).toBe(true);
  });

  it('drilling instruments extract and cache physical rock core samples into storage', () => {
    scienceRover.energyRating = 100;
    scienceRover.storageCapacity.usedSlots = 0;
    scienceRover.storageCapacity.collectedSamples = [];

    const discovery = {
      id: 'sci_outcrop_test',
      name: 'Olivine Basalt Outcrop',
      x: 105,
      y: 105,
      samplingRadius: 50,
      requiredInstrumentCategory: 'GEOLOGICAL_ANALYSIS' as any,
      dataYield: 150,
      isSampled: false,
      sampleName: 'Olivine Core Cylinder #1',
      geologicalContext: 'Mantle-derived cumulate rock',
    };

    const result = instrumentManager.collectObservation(
      scienceRover,
      'INST_CORE_DRILL_SYSTEM',
      { x: 105, y: 105 },
      discovery
    );

    expect(result.success).toBe(true);
    expect(result.sampleCreated).toBeDefined();
    expect(result.sampleCreated?.name).toBe('Olivine Core Cylinder #1');
    expect(scienceRover.storageCapacity.usedSlots).toBe(1);
    expect(scienceRover.storageCapacity.collectedSamples.length).toBe(1);
  });
});
