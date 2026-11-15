/**
 * INTERSTELLAR CONTINUUM - Robotic Rover Manager
 * Authoritative central manager and facade exposing modular public APIs
 * for planetary rover operations, exploration loops, and remote teleoperation.
 */

import {
  AutonomousBehaviorMode,
  MaintenanceResult,
  ObjectiveCompletionResult,
  ObservationResult,
  ReturnResult,
  RoverConfig,
  RoverControlInput,
  RoverDeploymentResult,
  RoverMaintenanceAction,
  RoverOperationalStatus,
  RoverRecord,
  RoverTelemetryStatus,
  Vector2D,
} from './ExplorationTypes';
import { RoverRegistry } from './RoverRegistry';
import { RoverExplorationEngine } from './RoverExplorationEngine';
import { ExplorationEventBus } from './ExplorationEventBus';
import { PlanetaryEnvironmentAdapter } from './adapters/PlanetaryEnvironmentAdapter';
import { CommunicationsNetworkAdapter } from './adapters/CommunicationsNetworkAdapter';
import { ScientificDataAdapter } from './adapters/ScientificDataAdapter';
import { MissionSimulationAdapter } from './adapters/MissionSimulationAdapter';
import { PayloadDeliveryAdapter } from './adapters/PayloadDeliveryAdapter';
import { EventBus } from '../core/EventBus';

export interface ExplorationSaveState {
  rovers: RoverRecord[];
  timestamp: number;
}

export class RoboticRoverManager {
  private static instance: RoboticRoverManager | null = null;

  private registry: RoverRegistry;
  private engine: RoverExplorationEngine;
  private eventBus: ExplorationEventBus;

  // Modular adapters
  public readonly environmentAdapter: PlanetaryEnvironmentAdapter;
  public readonly commsAdapter: CommunicationsNetworkAdapter;
  public readonly scienceAdapter: ScientificDataAdapter;
  public readonly missionAdapter: MissionSimulationAdapter;
  public readonly payloadAdapter: PayloadDeliveryAdapter;

  private isDaytime: boolean = true;

  private constructor(coreEventBus?: EventBus) {
    this.eventBus = new ExplorationEventBus(coreEventBus);
    this.registry = RoverRegistry.getInstance();
    this.environmentAdapter = new PlanetaryEnvironmentAdapter();
    this.commsAdapter = new CommunicationsNetworkAdapter();
    this.scienceAdapter = new ScientificDataAdapter();
    this.missionAdapter = new MissionSimulationAdapter();
    this.payloadAdapter = new PayloadDeliveryAdapter();

    this.engine = new RoverExplorationEngine(this.environmentAdapter, this.eventBus);
  }

  public static getInstance(coreEventBus?: EventBus): RoboticRoverManager {
    if (!RoboticRoverManager.instance) {
      RoboticRoverManager.instance = new RoboticRoverManager(coreEventBus);
    }
    return RoboticRoverManager.instance;
  }

  public static resetInstance(): void {
    if (RoboticRoverManager.instance) {
      RoboticRoverManager.instance.eventBus.clear();
      RoverRegistry.resetInstance();
      RoboticRoverManager.instance = null;
    }
  }

  public getEventBus(): ExplorationEventBus {
    return this.eventBus;
  }

  public setDaytime(isDay: boolean): void {
    this.isDaytime = isDay;
  }

  // =========================================================================
  // 1. REGISTER ROVER
  // =========================================================================
  public registerRover(config: RoverConfig): RoverRecord {
    const rover = this.registry.registerRover(config);

    this.eventBus.emit('RoverRegistered', {
      rover: { ...rover },
      timestamp: Date.now(),
    });

    return rover;
  }

  // =========================================================================
  // 2. GET ROVER
  // =========================================================================
  public getRover(roverId: string): RoverRecord | undefined {
    return this.registry.getRover(roverId);
  }

  // =========================================================================
  // 3. LIST AVAILABLE ROVERS
  // =========================================================================
  public listAvailableRovers(destinationId?: string): RoverRecord[] {
    const filter = destinationId ? { destinationId } : undefined;
    return this.registry.listRovers(filter);
  }

  // =========================================================================
  // 4. DEPLOY ROVER
  // =========================================================================
  public deployRover(
    roverId: string,
    destinationId: string,
    missionId?: string,
    landingSite?: Vector2D
  ): RoverDeploymentResult {
    const rover = this.getRover(roverId);
    if (!rover) {
      return {
        success: false,
        destinationId,
        landingCoordinates: { x: 0, y: 0 },
        message: `Rover "${roverId}" not found in registry.`,
      };
    }

    const defaultLanding = this.environmentAdapter.getLandingSite(destinationId);
    const targetLanding = landingSite || defaultLanding;

    rover.destinationId = destinationId;
    rover.deploymentMissionId = missionId;
    rover.location.x = targetLanding.x;
    rover.location.y = targetLanding.y;
    rover.operationalStatus = RoverOperationalStatus.ACTIVE;
    rover.speed = 0;
    rover.velocity = { x: 0, y: 0 };

    // Sync comms link to new destination
    const commInfo = this.commsAdapter.getCommStatusForRover(rover.id, destinationId);
    rover.communicationStatus = commInfo.status;
    rover.communicationFidelity = commInfo.fidelity;

    this.eventBus.emit('RoverDeployed', {
      roverId: rover.id,
      name: rover.name,
      destinationId,
      missionId,
      location: { ...targetLanding },
      timestamp: Date.now(),
    });

    return {
      success: true,
      rover,
      destinationId,
      landingCoordinates: targetLanding,
      message: `Rover "${rover.name}" successfully deployed to ${destinationId} at (${targetLanding.x}, ${targetLanding.y}).`,
    };
  }

  // =========================================================================
  // 5. CONTROL ROVER
  // =========================================================================
  public controlRover(roverId: string, input: RoverControlInput): void {
    const rover = this.getRover(roverId);
    if (!rover) return;

    if (rover.operationalStatus === RoverOperationalStatus.DEPLETED) {
      // Cannot drive while battery is completely dead
      return;
    }

    // Manual control automatically cancels autonomous navigation
    if (rover.autonomousMode && (input.forward !== 0 || input.steer !== 0)) {
      this.activateAutonomousMode(roverId, false);
    }

    this.engine.setRoverInput(roverId, input);
  }

  // =========================================================================
  // 6. SET ROVER TARGET
  // =========================================================================
  public setRoverTarget(roverId: string, target: Vector2D | string): boolean {
    const rover = this.getRover(roverId);
    if (!rover) return false;

    let targetCoords: Vector2D;

    if (typeof target === 'string') {
      // Search POIs or Discovery locations by ID
      const pois = this.environmentAdapter.getPointsOfInterest(rover.destinationId);
      const matchedPoi = pois.find((p) => p.id === target);

      if (matchedPoi) {
        targetCoords = { x: matchedPoi.x, y: matchedPoi.y };
      } else {
        const disc = this.environmentAdapter.getScientificLocations(rover.destinationId);
        const matchedDisc = disc.find((d) => d.id === target);
        if (matchedDisc) {
          targetCoords = { x: matchedDisc.x, y: matchedDisc.y };
        } else {
          return false;
        }
      }
    } else {
      targetCoords = { ...target };
    }

    return this.engine.setRoverAutonomousTarget(roverId, rover, targetCoords);
  }

  // =========================================================================
  // 7. ACTIVATE AUTONOMOUS MODE
  // =========================================================================
  public activateAutonomousMode(
    roverId: string,
    enabled: boolean,
    mode?: AutonomousBehaviorMode
  ): boolean {
    const rover = this.getRover(roverId);
    if (!rover) return false;

    if (mode) {
      rover.autonomousBehavior = mode;
    }

    return this.engine.activateAutonomousMode(roverId, rover, enabled);
  }

  // =========================================================================
  // 8. GET ROVER STATUS
  // =========================================================================
  public getRoverStatus(roverId: string): RoverTelemetryStatus | undefined {
    const rover = this.getRover(roverId);
    if (!rover) return undefined;

    // Refresh comms link
    const commInfo = this.commsAdapter.getCommStatusForRover(rover.id, rover.destinationId);
    rover.communicationStatus = commInfo.status;
    rover.communicationFidelity = commInfo.fidelity;

    return {
      roverId: rover.id,
      name: rover.name,
      model: rover.model,
      destinationId: rover.destinationId,
      location: { ...rover.location },
      speedMps: rover.speed * 0.1, // Approximate conversion
      headingDeg: rover.location.headingDeg,
      energyPercent: rover.energyRating,
      conditionPercent: rover.vehicleConditionRating,
      commStatus: rover.communicationStatus,
      commFidelity: rover.communicationFidelity,
      operationalStatus: rover.operationalStatus,
      activeInstrumentCount: rover.instruments.length,
      storageUsage: {
        used: rover.storageCapacity.usedSlots,
        max: rover.storageCapacity.maxSlots,
      },
      autonomousMode: rover.autonomousMode,
      autonomousTarget: rover.autonomousTarget,
      currentTerrain: rover.location.currentTerrain,
      distanceTraveledMeters: rover.stats.distanceTraveledMeters,
    };
  }

  // =========================================================================
  // 9. COLLECT ROVER OBSERVATION
  // =========================================================================
  public collectRoverObservation(
    roverId: string,
    instrumentId: string,
    targetId?: string
  ): ObservationResult {
    const rover = this.getRover(roverId);
    if (!rover) {
      return {
        success: false,
        roverId,
        instrumentId,
        dataCollected: 0,
        energyConsumed: 0,
        message: `Rover "${roverId}" not found.`,
      };
    }

    const result = this.engine.collectObservation(rover, instrumentId, targetId);

    // If observation succeeded, submit research data via adapter
    if (result.success && result.dataCollected > 0) {
      this.scienceAdapter.submitScientificFindings(
        result.dataCollected,
        0,
        result.sampleCreated ? [result.sampleCreated] : []
      );
    }

    return result;
  }

  // =========================================================================
  // 10. COMPLETE EXPLORATION OBJECTIVE
  // =========================================================================
  public completeExplorationObjective(
    roverId: string,
    objectiveId: string
  ): ObjectiveCompletionResult {
    const rover = this.getRover(roverId);
    if (!rover) {
      return {
        success: false,
        objectiveId,
        rewardCredits: 0,
        rewardResearchData: 0,
        message: `Rover "${roverId}" not found.`,
      };
    }

    const result = this.engine.completeObjective(rover, objectiveId);

    if (result.success && (result.rewardCredits > 0 || result.rewardResearchData > 0)) {
      this.scienceAdapter.submitScientificFindings(
        result.rewardResearchData,
        result.rewardCredits
      );

      if (rover.deploymentMissionId) {
        this.missionAdapter.notifyObjectiveCompleted(rover.deploymentMissionId, objectiveId);
      }
    }

    return result;
  }

  // =========================================================================
  // 11. RETURN ROVER
  // =========================================================================
  public returnRover(roverId: string, returnLocationId?: string): ReturnResult {
    const rover = this.getRover(roverId);
    if (!rover) {
      return {
        success: false,
        roverId,
        returnLocation: { x: 0, y: 0 },
        samplesRecoveredCount: 0,
        totalDataSecured: 0,
        message: `Rover "${roverId}" not found.`,
      };
    }

    const result = this.engine.returnRover(rover, returnLocationId);

    // Submit secured research data
    if (result.success && result.totalDataSecured > 0) {
      this.scienceAdapter.submitScientificFindings(result.totalDataSecured, 15000);
    }

    return result;
  }

  // =========================================================================
  // MAINTENANCE
  // =========================================================================
  public performMaintenance(
    roverId: string,
    action: RoverMaintenanceAction
  ): MaintenanceResult {
    const rover = this.getRover(roverId);
    if (!rover) {
      return {
        success: false,
        roverId,
        action,
        conditionRestored: 0,
        energyRestored: 0,
        dustClearedPercent: 0,
        message: `Rover "${roverId}" not found.`,
      };
    }

    const result = this.engine.getEnergyManager().performMaintenance(rover, action);

    this.eventBus.emit('RoverMaintenancePerformed', {
      roverId: rover.id,
      action,
      conditionDelta: result.conditionRestored,
      energyDelta: result.energyRestored,
      timestamp: Date.now(),
    });

    return result;
  }

  // =========================================================================
  // ENGINE TICK UPDATE
  // =========================================================================
  public update(deltaSeconds: number): void {
    const activeRovers = this.registry.listRovers();
    for (const rover of activeRovers) {
      if (
        rover.operationalStatus !== RoverOperationalStatus.STANDBY &&
        rover.operationalStatus !== RoverOperationalStatus.RECOVERED
      ) {
        this.engine.updateRover(rover, this.isDaytime, deltaSeconds);
      }
    }
  }

  // =========================================================================
  // SAVE & RESTORATION SERIALIZATION
  // =========================================================================
  public serializeState(): ExplorationSaveState {
    const rovers = this.registry.listRovers();
    return {
      rovers: JSON.parse(JSON.stringify(rovers)),
      timestamp: Date.now(),
    };
  }

  public deserializeState(state: ExplorationSaveState): void {
    if (!state || !Array.isArray(state.rovers)) {
      throw new Error('Invalid exploration save state format.');
    }

    this.registry.clear();
    for (const r of state.rovers) {
      this.registry.updateRover(r);
    }
  }

  public getEngine(): RoverExplorationEngine {
    return this.engine;
  }
}
