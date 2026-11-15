import { describe, it, expect, beforeEach } from 'vitest';
import { SpaceTravelSystem } from '../../src/simulation/SpaceTravelSystem';
import { DestinationId } from '../../src/destinations/DestinationTypes';
import { TravelSubPhase } from '../../src/simulation/MissionSimulationTypes';

describe('SpaceTravelSystem', () => {
  let travelSystem: SpaceTravelSystem;

  beforeEach(() => {
    travelSystem = new SpaceTravelSystem({
      originId: DestinationId.EARTH,
      destinationId: DestinationId.MOON,
      estimatedDurationSeconds: 100,
      totalDistanceUnits: 1000,
    });
  });

  it('initializes with correct origin, destination, and parameters', () => {
    const progress = travelSystem.getProgress();
    expect(progress.originId).toBe(DestinationId.EARTH);
    expect(progress.destinationId).toBe(DestinationId.MOON);
    expect(progress.estimatedDurationSeconds).toBe(100);
    expect(progress.totalDistanceUnits).toBe(1000);
    expect(progress.progress).toBe(0);
    expect(progress.isArrived).toBe(false);
    expect(travelSystem.hasStarted()).toBe(false);
  });

  it('starts travel and sets initial departure subphase', () => {
    travelSystem.startTravel(10);
    expect(travelSystem.hasStarted()).toBe(true);

    const progress = travelSystem.getProgress();
    expect(progress.departureTime).toBe(10);
    expect(progress.travelSubPhase).toBe(TravelSubPhase.DEPARTING);
  });

  it('advances travel progress and transitions subphases accurately', () => {
    travelSystem.startTravel(0);

    // Advance 10% (10s) -> DEPARTING (<15%)
    travelSystem.advance(10);
    expect(travelSystem.getNormalizedProgress()).toBeCloseTo(0.1, 2);
    expect(travelSystem.getSubPhase()).toBe(TravelSubPhase.DEPARTING);

    // Advance to 50% (additional 40s) -> CRUISING (15% - 85%)
    travelSystem.advance(40);
    expect(travelSystem.getNormalizedProgress()).toBeCloseTo(0.5, 2);
    expect(travelSystem.getSubPhase()).toBe(TravelSubPhase.CRUISING);
    expect(travelSystem.getProgress().distanceTraveledUnits).toBeCloseTo(500, 1);

    // Advance to 90% (additional 40s) -> APPROACHING (>=85%)
    travelSystem.advance(40);
    expect(travelSystem.getNormalizedProgress()).toBeCloseTo(0.9, 2);
    expect(travelSystem.getSubPhase()).toBe(TravelSubPhase.APPROACHING);

    // Advance remaining 10s -> ARRIVED
    const arrived = travelSystem.advance(10);
    expect(arrived).toBe(true);
    expect(travelSystem.hasArrived()).toBe(true);
    expect(travelSystem.getNormalizedProgress()).toBe(1.0);
    expect(travelSystem.getSubPhase()).toBe(TravelSubPhase.ARRIVED);
  });

  it('does not advance progress if travel has not started', () => {
    const arrived = travelSystem.advance(50);
    expect(arrived).toBe(false);
    expect(travelSystem.getNormalizedProgress()).toBe(0);
  });

  it('does not advance further once arrived', () => {
    travelSystem.startTravel(0);
    travelSystem.advance(100);
    expect(travelSystem.hasArrived()).toBe(true);

    const extraAdvance = travelSystem.advance(20);
    expect(extraAdvance).toBe(false);
    expect(travelSystem.getNormalizedProgress()).toBe(1.0);
  });

  it('handles round-trip return journey initiation and completion', () => {
    travelSystem.startTravel(0);
    travelSystem.advance(100);
    expect(travelSystem.hasArrived()).toBe(true);

    // Initiate return journey
    travelSystem.initiateReturn(50, 100);
    const returnProgress = travelSystem.getProgress();
    expect(returnProgress.isReturnTrip).toBe(true);
    expect(returnProgress.originId).toBe(DestinationId.MOON);
    expect(returnProgress.destinationId).toBe(DestinationId.EARTH);
    expect(returnProgress.travelSubPhase).toBe(TravelSubPhase.RETURNING);
    expect(returnProgress.isArrived).toBe(false);

    // Advance return
    travelSystem.advance(25);
    expect(travelSystem.getNormalizedProgress()).toBeCloseTo(0.5, 2);
    expect(travelSystem.getSubPhase()).toBe(TravelSubPhase.RETURNING);

    // Complete return
    const arrivedHome = travelSystem.advance(25);
    expect(arrivedHome).toBe(true);
    expect(travelSystem.hasArrived()).toBe(true);
    expect(travelSystem.getSubPhase()).toBe(TravelSubPhase.RETURNED);
  });

  it('restores state accurately from serialized snapshot', () => {
    travelSystem.startTravel(5);
    travelSystem.advance(60);
    const snapshot = travelSystem.getProgress();

    const newSystem = new SpaceTravelSystem();
    newSystem.restore(snapshot);

    expect(newSystem.getNormalizedProgress()).toBeCloseTo(0.6, 2);
    expect(newSystem.hasStarted()).toBe(true);
    expect(newSystem.getSubPhase()).toBe(TravelSubPhase.CRUISING);
    expect(newSystem.getProgress().originId).toBe(DestinationId.EARTH);
    expect(newSystem.getProgress().destinationId).toBe(DestinationId.MOON);
  });
});
