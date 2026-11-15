import { describe, it, expect, beforeEach } from 'vitest';
import { RoboticRoverManager } from '../../src/exploration/RoboticRoverManager';
import { EventBus } from '../../src/core/EventBus';
import {
  AutonomousBehaviorMode,
  RoverMaintenanceAction,
  RoverModelType,
  RoverOperationalStatus,
} from '../../src/exploration/ExplorationTypes';

describe('RoboticRoverManager Public Integration APIs', () => {
  let manager: RoboticRoverManager;
  let coreEventBus: EventBus;

  beforeEach(() => {
    coreEventBus = new EventBus();
    RoboticRoverManager.resetInstance();
    manager = RoboticRoverManager.getInstance(coreEventBus);
  });

  // 1. REGISTER ROVER
  it('1. registerRover - registers a new exploration vehicle and emits RoverRegistered', () => {
    let eventFired = false;
    manager.getEventBus().on('RoverRegistered', (payload) => {
      eventFired = true;
      expect(payload.rover.id).toBe('ROVER_NEW_01');
    });

    const rover = manager.registerRover({
      id: 'ROVER_NEW_01',
      name: 'Curiosity Vanguard',
      model: RoverModelType.SCIENTIFIC,
      destinationId: 'DEST_MARS',
    });

    expect(rover.id).toBe('ROVER_NEW_01');
    expect(rover.name).toBe('Curiosity Vanguard');
    expect(eventFired).toBe(true);
  });

  // 2. GET ROVER
  it('2. getRover - retrieves rover record by unique identifier', () => {
    const rover = manager.getRover('ROVER_SCOUT_01');
    expect(rover).toBeDefined();
    expect(rover?.model).toBe(RoverModelType.SCOUT);

    const nonExistent = manager.getRover('ROVER_GHOST');
    expect(nonExistent).toBeUndefined();
  });

  // 3. LIST AVAILABLE ROVERS
  it('3. listAvailableRovers - lists rovers with optional destination filtering', () => {
    const all = manager.listAvailableRovers();
    expect(all.length).toBeGreaterThanOrEqual(4);

    const marsRovers = manager.listAvailableRovers('DEST_MARS');
    expect(marsRovers.length).toBeGreaterThanOrEqual(2);
    expect(marsRovers.every((r) => r.destinationId === 'DEST_MARS')).toBe(true);
  });

  // 4. DEPLOY ROVER
  it('4. deployRover - deploys rover to destination landing site and emits RoverDeployed', () => {
    let deployedFired = false;
    manager.getEventBus().on('RoverDeployed', (payload) => {
      deployedFired = true;
      expect(payload.roverId).toBe('ROVER_SCOUT_01');
      expect(payload.destinationId).toBe('DEST_MOON');
    });

    const deployResult = manager.deployRover('ROVER_SCOUT_01', 'DEST_MOON', 'MSN_LUNAR_01');
    expect(deployResult.success).toBe(true);
    expect(deployResult.destinationId).toBe('DEST_MOON');
    expect(deployedFired).toBe(true);

    const status = manager.getRoverStatus('ROVER_SCOUT_01');
    expect(status?.destinationId).toBe('DEST_MOON');
  });

  // 5. CONTROL ROVER
  it('5. controlRover - applies throttle, steering, and braking input', () => {
    manager.controlRover('ROVER_SCOUT_01', {
      forward: 1.0,
      steer: 0.5,
      brake: false,
    });

    // Advance simulation tick
    manager.update(0.5);

    const status = manager.getRoverStatus('ROVER_SCOUT_01');
    expect(status?.speedMps).toBeGreaterThan(0);
  });

  // 6. SET ROVER TARGET
  it('6. setRoverTarget - sets autonomous target by coordinate vector or POI string ID', () => {
    const coordSuccess = manager.setRoverTarget('ROVER_AUTO_01', { x: 900, y: 900 });
    expect(coordSuccess).toBe(true);

    const rover = manager.getRover('ROVER_AUTO_01')!;
    expect(rover.autonomousMode).toBe(true);
    expect(rover.autonomousTarget?.x).toBe(900);

    // Target by POI ID
    const poiSuccess = manager.setRoverTarget('ROVER_AUTO_01', 'poi_eur_cryogeyser_vent');
    expect(poiSuccess).toBe(true);
  });

  // 7. ACTIVATE AUTONOMOUS MODE
  it('7. activateAutonomousMode - toggles autonomous navigation mode', () => {
    manager.activateAutonomousMode('ROVER_AUTO_01', true, AutonomousBehaviorMode.NAVIGATE_TO_WAYPOINT);
    let status = manager.getRoverStatus('ROVER_AUTO_01');
    expect(status?.autonomousMode).toBe(true);

    manager.activateAutonomousMode('ROVER_AUTO_01', false);
    status = manager.getRoverStatus('ROVER_AUTO_01');
    expect(status?.autonomousMode).toBe(false);
  });

  // 8. GET ROVER STATUS
  it('8. getRoverStatus - returns comprehensive telemetry summary', () => {
    const status = manager.getRoverStatus('ROVER_SCIENCE_01');
    expect(status).toBeDefined();
    expect(status?.roverId).toBe('ROVER_SCIENCE_01');
    expect(typeof status?.energyPercent).toBe('number');
    expect(typeof status?.conditionPercent).toBe('number');
    expect(typeof status?.commFidelity).toBe('number');
    expect(status?.activeInstrumentCount).toBeGreaterThan(0);
  });

  // 9. COLLECT ROVER OBSERVATION
  it('9. collectRoverObservation - collects scientific data and submits to research ledger', () => {
    let obsFired = false;
    manager.getEventBus().on('ScientificObservationCollected', () => {
      obsFired = true;
    });

    const result = manager.collectRoverObservation(
      'ROVER_SCIENCE_01',
      'INST_MASTCAM_STEREO'
    );

    expect(result.success).toBe(true);
    expect(result.dataCollected).toBeGreaterThan(0);
    expect(obsFired).toBe(true);
  });

  // 10. COMPLETE EXPLORATION OBJECTIVE
  it('10. completeExplorationObjective - completes objective and awards credits and research data', () => {
    let objFired = false;
    manager.getEventBus().on('ExplorationObjectiveCompleted', () => {
      objFired = true;
    });

    const result = manager.completeExplorationObjective(
      'ROVER_SCOUT_01',
      'obj_mars_delta_formation'
    );

    expect(result.success).toBe(true);
    expect(result.rewardCredits).toBeGreaterThan(0);
    expect(result.rewardResearchData).toBeGreaterThan(0);
    expect(objFired).toBe(true);
  });

  // 11. RETURN ROVER
  it('11. returnRover - returns vehicle to lander base and unloads collected samples', () => {
    let returnFired = false;
    manager.getEventBus().on('RoverReturned', () => {
      returnFired = true;
    });

    const result = manager.returnRover('ROVER_SCOUT_01');
    expect(result.success).toBe(true);
    expect(returnFired).toBe(true);

    const status = manager.getRoverStatus('ROVER_SCOUT_01');
    expect(status?.operationalStatus).toBe(RoverOperationalStatus.RECOVERED);
  });

  // MAINTENANCE
  it('performs maintenance procedures and emits RoverMaintenancePerformed', () => {
    let maintFired = false;
    manager.getEventBus().on('RoverMaintenancePerformed', () => {
      maintFired = true;
    });

    const result = manager.performMaintenance('ROVER_SCOUT_01', RoverMaintenanceAction.CLEAN_SOLAR_PANELS);
    expect(result.success).toBe(true);
    expect(maintFired).toBe(true);
  });

  // STATE SERIALIZATION & RESTORATION
  it('serializes and deserializes rover fleet state accurately', () => {
    // Modify a rover's state
    const rover = manager.getRover('ROVER_SCOUT_01')!;
    rover.energyRating = 42;
    rover.vehicleConditionRating = 78;
    rover.stats.distanceTraveledMeters = 850;

    const savedState = manager.serializeState();
    expect(savedState.rovers.length).toBeGreaterThan(0);

    // Reset and deserialize
    RoboticRoverManager.resetInstance();
    const newManager = RoboticRoverManager.getInstance();
    newManager.deserializeState(savedState);

    const restored = newManager.getRover('ROVER_SCOUT_01');
    expect(restored).toBeDefined();
    expect(restored?.energyRating).toBe(42);
    expect(restored?.vehicleConditionRating).toBe(78);
    expect(restored?.stats.distanceTraveledMeters).toBe(850);
  });

  // ADAPTERS INTEGRATION
  it('interfaces seamlessly with modular adapters (comms, environment, payload, science)', () => {
    // Communications adapter
    const commInfo = manager.commsAdapter.getCommStatusForRover('ROVER_SCOUT_01', 'DEST_MARS');
    expect(commInfo.status).toBeDefined();
    expect(commInfo.fidelity).toBeGreaterThan(0);

    // Environment adapter
    const boundary = manager.environmentAdapter.getBoundary('DEST_MARS');
    expect(boundary.maxX).toBeGreaterThan(0);

    // Payload delivery adapter
    const delivered = manager.payloadAdapter.getDeliveredRovers('DEST_MARS');
    expect(Array.isArray(delivered)).toBe(true);

    // Science submission adapter
    const submission = manager.scienceAdapter.submitScientificFindings(100, 20000);
    expect(submission.accepted).toBe(true);
    expect(submission.researchDataAdded).toBe(100);
  });
});
