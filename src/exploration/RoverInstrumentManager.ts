/**
 * INTERSTELLAR CONTINUUM - Rover Scientific Instrument Manager
 * Handles instrument firing, power verification, target range checking,
 * observation yield, and sample caching.
 */

import {
  CollectedSample,
  InstrumentCategory,
  ObservationResult,
  PointOfInterest,
  RoverRecord,
  ScientificDiscoveryLocation,
  ScientificInstrument,
  Vector2D,
} from './ExplorationTypes';

export class RoverInstrumentManager {
  /**
   * Updates instrument cooldown timers.
   */
  public updateCooldowns(rover: RoverRecord, deltaSeconds: number): void {
    for (const slot of rover.instruments) {
      if (slot.cooldownRemaining > 0) {
        slot.cooldownRemaining = Math.max(0, slot.cooldownRemaining - deltaSeconds);
        if (slot.cooldownRemaining === 0) {
          slot.isReady = true;
        }
      }
    }
  }

  /**
   * Fires a specific instrument on the rover to perform an observation.
   */
  public collectObservation(
    rover: RoverRecord,
    instrumentId: string,
    targetLocation?: Vector2D,
    matchedDiscovery?: ScientificDiscoveryLocation,
    matchedPoi?: PointOfInterest
  ): ObservationResult {
    // 1. Find instrument slot
    const slot = rover.instruments.find((s) => s.instrument.id === instrumentId);
    if (!slot) {
      return {
        success: false,
        roverId: rover.id,
        instrumentId,
        dataCollected: 0,
        energyConsumed: 0,
        message: `Instrument "${instrumentId}" is not mounted on rover "${rover.name}".`,
      };
    }

    const inst: ScientificInstrument = slot.instrument;

    // 2. Readiness check
    if (!slot.isReady) {
      return {
        success: false,
        roverId: rover.id,
        instrumentId,
        dataCollected: 0,
        energyConsumed: 0,
        message: `Instrument "${inst.name}" is recharging (cooldown: ${slot.cooldownRemaining.toFixed(1)}s remaining).`,
      };
    }

    // 3. Energy check
    const energyCost = inst.powerConsumptionRating * 0.5; // Scaled to game energy percentage
    if (rover.energyRating < energyCost) {
      return {
        success: false,
        roverId: rover.id,
        instrumentId,
        dataCollected: 0,
        energyConsumed: 0,
        message: `Insufficient energy to operate "${inst.name}". Requires ${energyCost.toFixed(0)}%, available: ${rover.energyRating.toFixed(0)}%.`,
      };
    }

    // 4. Range check if a target coordinate is specified
    if (targetLocation) {
      const distance = Math.hypot(rover.location.x - targetLocation.x, rover.location.y - targetLocation.y);
      if (distance > inst.operationalRangeMeters) {
        return {
          success: false,
          roverId: rover.id,
          instrumentId,
          dataCollected: 0,
          energyConsumed: 0,
          message: `Target is out of range (${distance.toFixed(0)}m vs max ${inst.operationalRangeMeters}m). Move closer to observe.`,
        };
      }
    }

    // 5. Consume Energy & Trigger Cooldown
    rover.energyRating = Math.max(0, rover.energyRating - energyCost);
    slot.isReady = false;
    slot.cooldownRemaining = inst.samplingDurationSeconds;

    // 6. Calculate Science Data Yield
    let yieldMultiplier = 1.0;
    // Scientific rovers have enhanced data yield bonus
    if (rover.model === 'SCIENTIFIC') {
      yieldMultiplier = 1.35;
    }

    let baseData = inst.dataCollectionRating * yieldMultiplier;
    let sampleCreated: CollectedSample | undefined;

    // Context bonus if scanning a matched discovery site
    if (matchedDiscovery) {
      if (matchedDiscovery.requiredInstrumentCategory === inst.category) {
        baseData *= 1.5; // Matching instrument category bonus
      }
      matchedDiscovery.isSampled = true;

      // Geological drill instruments generate physical core samples
      if (
        inst.category === InstrumentCategory.GEOLOGICAL_ANALYSIS &&
        inst.id.includes('DRILL')
      ) {
        if (rover.storageCapacity.usedSlots < rover.storageCapacity.maxSlots) {
          sampleCreated = {
            id: `sample_${matchedDiscovery.id}_${Date.now()}`,
            name: matchedDiscovery.sampleName,
            sourceLocationId: matchedDiscovery.id,
            dataRating: Math.round(baseData * 0.8),
            massKg: 1.5,
            collectedAtTimestamp: Date.now(),
            rockClassification: matchedDiscovery.geologicalContext,
          };
          rover.storageCapacity.collectedSamples.push(sampleCreated);
          rover.storageCapacity.usedSlots += 1;
        }
      }
    } else if (matchedPoi) {
      baseData += matchedPoi.scienceBonus;
    }

    const finalData = Math.round(baseData);
    rover.stats.observationsCollected += 1;

    let msg = `Observation collected with ${inst.name}: +${finalData} Science Data.`;
    if (sampleCreated) {
      msg += ` Sample cached: "${sampleCreated.name}".`;
    }

    return {
      success: true,
      roverId: rover.id,
      instrumentId: inst.id,
      dataCollected: finalData,
      sampleCreated,
      objectiveUpdated: matchedPoi?.associatedObjectiveId,
      energyConsumed: energyCost,
      message: msg,
    };
  }
}
