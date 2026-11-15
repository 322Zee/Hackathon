import { describe, it, expect, beforeEach } from 'vitest';
import { RoverAutonomousController } from '../../src/exploration/RoverAutonomousController';
import { RoverExplorationEngine } from '../../src/exploration/RoverExplorationEngine';
import { RoverRegistry } from '../../src/exploration/RoverRegistry';
import { PlanetaryEnvironmentAdapter } from '../../src/exploration/adapters/PlanetaryEnvironmentAdapter';
import { ExplorationEventBus } from '../../src/exploration/ExplorationEventBus';
import {
  AutonomousBehaviorMode,
  RoverOperationalStatus,
  RoverRecord,
  SurfaceObstacle,
  TerrainType,
} from '../../src/exploration/ExplorationTypes';

describe('RoverAutonomousController and Exploration Loop', () => {
  let autoController: RoverAutonomousController;
  let engine: RoverExplorationEngine;
  let envAdapter: PlanetaryEnvironmentAdapter;
  let eventBus: ExplorationEventBus;
  let rover: RoverRecord;

  beforeEach(() => {
    RoverRegistry.resetInstance();
    const registry = RoverRegistry.getInstance();
    rover = registry.getRover('ROVER_AUTO_01')!;
    rover.location = { x: 500, y: 500, headingDeg: 0, currentTerrain: TerrainType.SMOOTH_PLAINS };
    rover.autonomousMode = false;
    rover.autonomousWaypoints = [];
    rover.speed = 0;

    autoController = new RoverAutonomousController();
    envAdapter = new PlanetaryEnvironmentAdapter();
    eventBus = new ExplorationEventBus();
    engine = new RoverExplorationEngine(envAdapter, eventBus);
  });

  it('sets autonomous waypoint target and steers toward destination', () => {
    const target = { x: 800, y: 500 }; // Due East (heading 90°)
    autoController.setTarget(rover, target, AutonomousBehaviorMode.NAVIGATE_TO_WAYPOINT);

    expect(rover.autonomousMode).toBe(true);
    expect(rover.operationalStatus).toBe(RoverOperationalStatus.AUTONOMOUS);
    expect(rover.autonomousWaypoints.length).toBe(1);

    const result = autoController.computeAutonomousInput(rover, [], []);
    expect(result.input.forward).toBeGreaterThan(0);
    expect(result.input.steer).toBeGreaterThan(0); // Heading is 0°, target is 90° East -> steer right
  });

  it('detects arrival at autonomous target coordinate and halts', () => {
    // Rover is right at the target coordinate
    const target = { x: 510, y: 500 };
    autoController.setTarget(rover, target);

    const result = autoController.computeAutonomousInput(rover, [], []);
    expect(result.hasArrivedAtTarget).toBe(true);
    expect(result.input.brake).toBe(true);
    expect(rover.autonomousMode).toBe(false);
  });

  it('deflects steering away when an obstacle blocks the forward path', () => {
    rover.location = { x: 500, y: 500, headingDeg: 0, currentTerrain: TerrainType.SMOOTH_PLAINS };
    const target = { x: 500, y: 300 }; // Straight North
    autoController.setTarget(rover, target);

    // Boulder slightly right of heading in path
    const obstacle: SurfaceObstacle = {
      id: 'obs_blocking',
      name: 'Blocking Boulder',
      x: 520,
      y: 430,
      radius: 30,
      obstacleType: 'BOULDER',
      hardnessRating: 0.8,
    };

    const result = autoController.computeAutonomousInput(rover, [obstacle], []);
    // Steers left away from obstacle
    expect(result.input.steer).toBeLessThan(0);
  });

  it('auto-stops when approaching an undiscovered Point of Interest', () => {
    const target = { x: 500, y: 100 };
    autoController.setTarget(rover, target);

    const undiscoveredPoi = {
      id: 'poi_ancient_crater',
      name: 'Ancient Impact Basin',
      category: 'LANDMARK' as any,
      x: 520,
      y: 420,
      discoveryRadius: 150,
      isDiscovered: false,
      description: 'Ancient crater with exposed breccia',
      scienceBonus: 50,
    };

    const result = autoController.computeAutonomousInput(rover, [], [undiscoveredPoi]);
    expect(result.stoppedAtPoi).toBeDefined();
    expect(result.stoppedAtPoi?.id).toBe('poi_ancient_crater');
    expect(result.input.brake).toBe(true);
  });

  it('completes exploration objectives and awards rewards', () => {
    let objectiveCompletedEventFired = false;
    eventBus.on('ExplorationObjectiveCompleted', () => {
      objectiveCompletedEventFired = true;
    });

    const objectives = engine.getObjectivesForDestination(rover.destinationId);
    expect(objectives.length).toBeGreaterThan(0);

    const targetObj = objectives[0]!;
    const result = engine.completeObjective(rover, targetObj.id);

    expect(result.success).toBe(true);
    expect(result.rewardCredits).toBeGreaterThan(0);
    expect(result.rewardResearchData).toBeGreaterThan(0);
    expect(targetObj.isCompleted).toBe(true);
    expect(objectiveCompletedEventFired).toBe(true);
  });

  it('returns rover to landing base and unloads collected samples', () => {
    let roverReturnedEventFired = false;
    eventBus.on('RoverReturned', () => {
      roverReturnedEventFired = true;
    });

    // Add a sample into storage
    rover.storageCapacity.collectedSamples.push({
      id: 'sample_test',
      name: 'Basalt Core #1',
      sourceLocationId: 'loc_1',
      dataRating: 120,
      massKg: 2.0,
      collectedAtTimestamp: Date.now(),
    });
    rover.storageCapacity.usedSlots = 1;

    const returnResult = engine.returnRover(rover);

    expect(returnResult.success).toBe(true);
    expect(returnResult.samplesRecoveredCount).toBe(1);
    expect(returnResult.totalDataSecured).toBe(120);
    expect(rover.storageCapacity.usedSlots).toBe(0);
    expect(rover.operationalStatus).toBe(RoverOperationalStatus.RECOVERED);
    expect(roverReturnedEventFired).toBe(true);
  });
});
