/**
 * INTERSTELLAR CONTINUUM - Rover Exploration Engine
 * Central execution pipeline orchestrating physics, collision, autonomous behavior,
 * POI discovery, and objective completion.
 */

import {
  ExplorationObjective,
  ExplorationObjectiveType,
  ObjectiveCompletionResult,
  ObservationResult,
  PointOfInterest,
  ReturnResult,
  RoverControlInput,
  RoverOperationalStatus,
  RoverRecord,
  ScientificDiscoveryLocation,
  Vector2D,
} from './ExplorationTypes';
import { RoverMovementController } from './RoverMovementController';
import { RoverCollisionHandler } from './RoverCollisionHandler';
import { RoverEnergyManager } from './RoverEnergyManager';
import { RoverInstrumentManager } from './RoverInstrumentManager';
import { RoverAutonomousController } from './RoverAutonomousController';
import { PlanetaryEnvironmentAdapter } from './adapters/PlanetaryEnvironmentAdapter';
import { ExplorationEventBus } from './ExplorationEventBus';

export class RoverExplorationEngine {
  private movementController: RoverMovementController = new RoverMovementController();
  private collisionHandler: RoverCollisionHandler = new RoverCollisionHandler();
  private energyManager: RoverEnergyManager = new RoverEnergyManager();
  private instrumentManager: RoverInstrumentManager = new RoverInstrumentManager();
  private autonomousController: RoverAutonomousController = new RoverAutonomousController();
  private environmentAdapter: PlanetaryEnvironmentAdapter;
  private eventBus: ExplorationEventBus;

  // Active inputs per rover ID
  private playerInputs: Map<string, RoverControlInput> = new Map();

  // Exploration objectives map per destination
  private objectives: Map<string, ExplorationObjective[]> = new Map();

  constructor(environmentAdapter: PlanetaryEnvironmentAdapter, eventBus: ExplorationEventBus) {
    this.environmentAdapter = environmentAdapter;
    this.eventBus = eventBus;
    this.initializeObjectives();
  }

  private initializeObjectives(): void {
    // Clone default sector objectives
    const destinations = ['DEST_MOON', 'DEST_MARS', 'DEST_EUROPA'];
    for (const d of destinations) {
      const sector = this.environmentAdapter.getSector(d);
      if (sector) {
        this.objectives.set(d, JSON.parse(JSON.stringify(sector.objectives)));
      }
    }
  }

  public setRoverInput(roverId: string, input: RoverControlInput): void {
    this.playerInputs.set(roverId, { ...input });
  }

  public getObjectivesForDestination(destinationId: string): ExplorationObjective[] {
    return this.objectives.get(destinationId) || [];
  }

  public setRoverAutonomousTarget(_roverId: string, rover: RoverRecord, target: Vector2D): boolean {
    this.autonomousController.setTarget(rover, target);
    return true;
  }

  public activateAutonomousMode(_roverId: string, rover: RoverRecord, enabled: boolean): boolean {
    if (enabled) {
      if (rover.autonomousTarget) {
        this.autonomousController.setTarget(rover, rover.autonomousTarget);
      } else {
        rover.autonomousMode = true;
        rover.operationalStatus = RoverOperationalStatus.AUTONOMOUS;
      }
    } else {
      this.autonomousController.stopAutonomousMode(rover);
    }
    return true;
  }

  /**
   * Main per-frame update loop for an active rover.
   */
  public updateRover(rover: RoverRecord, isDaytime: boolean, deltaSeconds: number): void {
    if (deltaSeconds <= 0) return;

    // Advance operational timer
    rover.stats.timeInOperationSeconds += deltaSeconds;

    // Update instrument cooldowns
    this.instrumentManager.updateCooldowns(rover, deltaSeconds);

    const destinationId = rover.destinationId;
    const boundary = this.environmentAdapter.getBoundary(destinationId);
    const obstacles = this.environmentAdapter.getObstacles(destinationId);
    const pois = this.environmentAdapter.getPointsOfInterest(destinationId);

    // 1. Determine input (Autonomous vs Player)
    let currentInput: RoverControlInput;
    if (rover.autonomousMode) {
      const autoResult = this.autonomousController.computeAutonomousInput(
        rover,
        obstacles,
        pois
      );
      currentInput = autoResult.input;

      if (autoResult.hasArrivedAtTarget) {
        this.eventBus.emit('AutonomousTargetReached', {
          roverId: rover.id,
          targetLocation: { ...rover.location },
          timestamp: Date.now(),
        });
      }

      if (autoResult.stoppedAtPoi) {
        // Discovered POI during autonomous transit
        this.handlePoiDiscovery(rover, autoResult.stoppedAtPoi);
      }
    } else {
      currentInput = this.playerInputs.get(rover.id) || { forward: 0, steer: 0, brake: false };
    }

    // 2. Fetch Terrain Difficulty & Type
    const terrain = this.environmentAdapter.getTerrainTypeAt(destinationId, rover.location);
    const terrainDifficulty = this.environmentAdapter.getTerrainDifficulty(destinationId, rover.location);

    // Check if movement started
    const wasStationary = Math.abs(rover.speed) < 1.0;

    // 3. Update Kinematics
    const moveResult = this.movementController.updateMovement(
      rover,
      currentInput,
      terrainDifficulty,
      terrain,
      deltaSeconds
    );

    // 4. Resolve Collisions with Obstacles and Boundaries
    const collisionResult = this.collisionHandler.resolveCollisions(
      rover,
      moveResult.newLocation,
      moveResult.velocity,
      boundary,
      obstacles
    );

    // Apply resolved position and velocity
    rover.location = collisionResult.resolvedLocation;
    rover.velocity = collisionResult.resolvedVelocity;
    rover.speed = Math.hypot(rover.velocity.x, rover.velocity.y);
    rover.stats.distanceTraveledMeters += moveResult.displacement * 0.1; // 10px = 1 meter approx

    if (wasStationary && rover.speed > 2.0) {
      this.eventBus.emit('RoverMovementStarted', {
        roverId: rover.id,
        headingDeg: rover.location.headingDeg,
        speed: rover.speed,
        timestamp: Date.now(),
      });
    }

    // 5. Update Energy & Condition
    this.energyManager.updateEnergyAndCondition(
      rover,
      moveResult.energyDrained,
      collisionResult.damageInflicted,
      terrainDifficulty,
      isDaytime,
      deltaSeconds
    );

    // 6. Proximity POI Discovery
    for (const poi of pois) {
      const dist = Math.hypot(rover.location.x - poi.x, rover.location.y - poi.y);
      if (dist <= poi.discoveryRadius && !poi.isDiscovered) {
        this.handlePoiDiscovery(rover, poi);
      }
    }

    // 7. Area Survey Objective Accumulation
    const destObjectives = this.objectives.get(destinationId) || [];
    for (const obj of destObjectives) {
      if (obj.type === ExplorationObjectiveType.EXPLORE_REGION && !obj.isCompleted) {
        // Increment area survey based on distance traveled
        const surveyIncrement = (moveResult.displacement / 2500) * 100;
        obj.currentSurveyPercentage = Math.min(100, obj.currentSurveyPercentage + surveyIncrement);
        if (
          obj.requiredSurveyPercentage &&
          obj.currentSurveyPercentage >= obj.requiredSurveyPercentage
        ) {
          this.completeObjective(rover, obj.id);
        }
      }
    }

    // 8. Broadcast Position Update Event
    this.eventBus.emit('RoverPositionUpdated', {
      roverId: rover.id,
      location: { ...rover.location },
      speed: rover.speed,
      energyPercent: rover.energyRating,
      conditionPercent: rover.vehicleConditionRating,
      timestamp: Date.now(),
    });
  }

  private handlePoiDiscovery(rover: RoverRecord, poi: PointOfInterest): void {
    poi.isDiscovered = true;
    const distance = Math.hypot(rover.location.x - poi.x, rover.location.y - poi.y);

    this.eventBus.emit('PointOfInterestReached', {
      roverId: rover.id,
      poi: { ...poi },
      distance,
      timestamp: Date.now(),
    });

    // Check if any objective targets this POI
    const destObjectives = this.objectives.get(rover.destinationId) || [];
    for (const obj of destObjectives) {
      if (
        (obj.type === ExplorationObjectiveType.VISIT_LANDMARK ||
          obj.type === ExplorationObjectiveType.PHOTOGRAPH_POI) &&
        obj.targetId === poi.id &&
        !obj.isCompleted
      ) {
        this.completeObjective(rover, obj.id);
      }
    }
  }

  /**
   * Fires an instrument to collect observations.
   */
  public collectObservation(
    rover: RoverRecord,
    instrumentId: string,
    targetId?: string
  ): ObservationResult {
    const destinationId = rover.destinationId;
    const pois = this.environmentAdapter.getPointsOfInterest(destinationId);
    const discoveries = this.environmentAdapter.getScientificLocations(destinationId);

    let targetLocation: Vector2D | undefined;
    let matchedDiscovery: ScientificDiscoveryLocation | undefined;
    let matchedPoi: PointOfInterest | undefined;

    if (targetId) {
      matchedDiscovery = discoveries.find((d) => d.id === targetId);
      if (matchedDiscovery) {
        targetLocation = { x: matchedDiscovery.x, y: matchedDiscovery.y };
      } else {
        matchedPoi = pois.find((p) => p.id === targetId);
        if (matchedPoi) {
          targetLocation = { x: matchedPoi.x, y: matchedPoi.y };
        }
      }
    } else {
      // Find nearest discovery location or POI within range
      let nearestDist = Infinity;
      for (const d of discoveries) {
        const dist = Math.hypot(rover.location.x - d.x, rover.location.y - d.y);
        if (dist <= d.samplingRadius && dist < nearestDist) {
          nearestDist = dist;
          matchedDiscovery = d;
          targetLocation = { x: d.x, y: d.y };
        }
      }
    }

    const result = this.instrumentManager.collectObservation(
      rover,
      instrumentId,
      targetLocation,
      matchedDiscovery,
      matchedPoi
    );

    if (result.success) {
      this.eventBus.emit('ScientificObservationCollected', {
        roverId: rover.id,
        instrumentId,
        instrumentCategory:
          rover.instruments.find((s) => s.instrument.id === instrumentId)?.instrument.category || 'GENERAL',
        dataYield: result.dataCollected,
        targetId,
        sample: result.sampleCreated,
        timestamp: Date.now(),
      });

      // Update sample/observation objectives
      const destObjectives = this.objectives.get(destinationId) || [];
      for (const obj of destObjectives) {
        if (
          obj.type === ExplorationObjectiveType.COLLECT_OBSERVATION &&
          (!obj.targetId || obj.targetId === targetId || obj.targetId === matchedDiscovery?.id) &&
          !obj.isCompleted
        ) {
          obj.currentObservationsCount += 1;
          if (
            !obj.requiredObservationsCount ||
            obj.currentObservationsCount >= obj.requiredObservationsCount
          ) {
            this.completeObjective(rover, obj.id);
          }
        }
      }
    }

    return result;
  }

  /**
   * Completes an exploration objective and awards rewards.
   */
  public completeObjective(rover: RoverRecord, objectiveId: string): ObjectiveCompletionResult {
    const destObjectives = this.objectives.get(rover.destinationId) || [];
    const obj = destObjectives.find((o) => o.id === objectiveId);

    if (!obj) {
      return {
        success: false,
        objectiveId,
        rewardCredits: 0,
        rewardResearchData: 0,
        message: `Objective "${objectiveId}" was not found.`,
      };
    }

    if (obj.isCompleted) {
      return {
        success: true,
        objectiveId,
        rewardCredits: 0,
        rewardResearchData: 0,
        message: `Objective "${obj.title}" was already completed.`,
      };
    }

    obj.isCompleted = true;
    obj.completedAtTimestamp = Date.now();
    rover.stats.objectivesCompleted += 1;

    this.eventBus.emit('ExplorationObjectiveCompleted', {
      roverId: rover.id,
      objective: { ...obj },
      rewardCredits: obj.rewardCredits,
      rewardResearchData: obj.rewardResearchData,
      timestamp: Date.now(),
    });

    return {
      success: true,
      objectiveId,
      rewardCredits: obj.rewardCredits,
      rewardResearchData: obj.rewardResearchData,
      message: `Exploration objective "${obj.title}" completed! Received +${obj.rewardCredits} Credits, +${obj.rewardResearchData} Research Data.`,
    };
  }

  /**
   * Returns rover to base/lander and unloads collected findings.
   */
  public returnRover(rover: RoverRecord, returnLocationId?: string): ReturnResult {
    const landingSite = this.environmentAdapter.getLandingSite(rover.destinationId);

    const samplesCount = rover.storageCapacity.collectedSamples.length;
    let totalDataSecured = 0;
    for (const s of rover.storageCapacity.collectedSamples) {
      totalDataSecured += s.dataRating;
    }

    rover.storageCapacity.collectedSamples = [];
    rover.storageCapacity.usedSlots = 0;
    rover.operationalStatus = RoverOperationalStatus.RECOVERED;
    rover.autonomousMode = false;
    rover.speed = 0;
    rover.velocity = { x: 0, y: 0 };

    this.eventBus.emit('RoverReturned', {
      roverId: rover.id,
      returnLocationId: returnLocationId || 'LANDER_BASE',
      samplesRecoveredCount: samplesCount,
      totalDataSecured,
      timestamp: Date.now(),
    });

    return {
      success: true,
      roverId: rover.id,
      returnLocation: landingSite,
      samplesRecoveredCount: samplesCount,
      totalDataSecured,
      message: `Rover "${rover.name}" returned safely to lander. Unloaded ${samplesCount} samples (${totalDataSecured} Research Data).`,
    };
  }

  public getEnergyManager(): RoverEnergyManager {
    return this.energyManager;
  }
}
