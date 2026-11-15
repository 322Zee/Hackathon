/**
 * INTERSTELLAR CONTINUUM - Rover Registry
 * Master data store for rover models, definitions, and active vehicle records.
 */

import {
  RoverConfig,
  RoverModelDefinition,
  RoverModelType,
  RoverOperationalStatus,
  RoverRecord,
  RoverCommStatus,
  RoverInstrumentSlot,
  TerrainType,
} from './ExplorationTypes';
import { DEFAULT_ROVER_MODELS } from './data/DefaultRoverModels';
import { DEFAULT_INSTRUMENTS } from './data/DefaultInstruments';

export class RoverRegistry {
  private static instance: RoverRegistry | null = null;
  private roverModels: Map<string, RoverModelDefinition> = new Map();
  private rovers: Map<string, RoverRecord> = new Map();

  private constructor() {
    this.initializeDefaultModels();
    this.initializeDefaultRovers();
  }

  public static getInstance(): RoverRegistry {
    if (!RoverRegistry.instance) {
      RoverRegistry.instance = new RoverRegistry();
    }
    return RoverRegistry.instance;
  }

  public static resetInstance(): void {
    RoverRegistry.instance = null;
  }

  private initializeDefaultModels(): void {
    for (const [key, model] of Object.entries(DEFAULT_ROVER_MODELS)) {
      this.roverModels.set(key, model);
      this.roverModels.set(model.modelId, model);
    }
  }

  private initializeDefaultRovers(): void {
    // 1. Pathfinder Scout Rover (Moon/Mars general explorer)
    this.createRoverRecord({
      id: 'ROVER_SCOUT_01',
      name: 'Ares Pathfinder I',
      model: RoverModelType.SCOUT,
      destinationId: 'DEST_MARS',
      installedInstrumentIds: ['INST_MASTCAM_STEREO', 'INST_METEOROLOGY_STATION'],
      initialLocation: { x: 600, y: 1900 },
      initialHeadingDeg: 0,
    });

    // 2. Curiosity / Prometheus Scientific Rover
    this.createRoverRecord({
      id: 'ROVER_SCIENCE_01',
      name: 'Prometheus Astrobiology Lab',
      model: RoverModelType.SCIENTIFIC,
      destinationId: 'DEST_MARS',
      installedInstrumentIds: [
        'INST_MASTCAM_STEREO',
        'INST_APXS_SPECTROMETER',
        'INST_CORE_DRILL_SYSTEM',
        'INST_GROUND_RADAR',
      ],
      initialLocation: { x: 650, y: 1950 },
      initialHeadingDeg: 45,
    });

    // 3. Heavy Utility Rover
    this.createRoverRecord({
      id: 'ROVER_HEAVY_01',
      name: 'Colossus Regolith Hauler',
      model: RoverModelType.HEAVY_UTILITY,
      destinationId: 'DEST_MOON',
      installedInstrumentIds: ['INST_MASTCAM_STEREO', 'INST_CORE_DRILL_SYSTEM'],
      initialLocation: { x: 800, y: 1600 },
      initialHeadingDeg: 90,
    });

    // 4. Advanced Autonomous Rover
    this.createRoverRecord({
      id: 'ROVER_AUTO_01',
      name: 'Vanguard Cyber-Explorer',
      model: RoverModelType.ADVANCED_AUTONOMOUS,
      destinationId: 'DEST_EUROPA',
      installedInstrumentIds: [
        'INST_MASTCAM_STEREO',
        'INST_LASER_CHEMCAM',
        'INST_GROUND_RADAR',
      ],
      initialLocation: { x: 700, y: 1700 },
      initialHeadingDeg: 180,
    });
  }

  public getModel(modelTypeOrId: string): RoverModelDefinition | undefined {
    return this.roverModels.get(modelTypeOrId);
  }

  public listModels(): RoverModelDefinition[] {
    const set = new Set<RoverModelDefinition>();
    for (const m of this.roverModels.values()) {
      set.add(m);
    }
    return Array.from(set);
  }

  public registerRover(config: RoverConfig): RoverRecord {
    if (this.rovers.has(config.id)) {
      throw new Error(`Rover with identifier "${config.id}" is already registered.`);
    }
    return this.createRoverRecord(config);
  }

  public getRover(id: string): RoverRecord | undefined {
    return this.rovers.get(id);
  }

  public listRovers(filter?: {
    destinationId?: string;
    modelType?: RoverModelType;
    operationalStatus?: RoverOperationalStatus;
  }): RoverRecord[] {
    let list = Array.from(this.rovers.values());

    if (filter) {
      if (filter.destinationId) {
        list = list.filter((r) => r.destinationId === filter.destinationId);
      }
      if (filter.modelType) {
        list = list.filter((r) => r.model === filter.modelType);
      }
      if (filter.operationalStatus) {
        list = list.filter((r) => r.operationalStatus === filter.operationalStatus);
      }
    }

    return list;
  }

  public updateRover(rover: RoverRecord): void {
    this.rovers.set(rover.id, rover);
  }

  public removeRover(id: string): boolean {
    return this.rovers.delete(id);
  }

  public createRoverRecord(config: RoverConfig): RoverRecord {
    const modelDef = this.getModel(String(config.model)) || DEFAULT_ROVER_MODELS[RoverModelType.SCOUT];

    // Build instrument slots
    const slots: RoverInstrumentSlot[] = [];
    const instrumentIds = config.installedInstrumentIds || [];

    for (let i = 0; i < modelDef.maxInstrumentSlots; i++) {
      const instId = instrumentIds[i];
      if (instId) {
        const found = DEFAULT_INSTRUMENTS.find((inst) => inst.id === instId);
        if (found) {
          slots.push({
            slotIndex: i,
            instrument: { ...found },
            isReady: true,
            cooldownRemaining: 0,
          });
        }
      }
    }

    // Default to at least the mastcam if no instruments were assigned
    if (slots.length === 0) {
      const mastcam = DEFAULT_INSTRUMENTS.find((inst) => inst.id === 'INST_MASTCAM_STEREO')!;
      slots.push({
        slotIndex: 0,
        instrument: { ...mastcam },
        isReady: true,
        cooldownRemaining: 0,
      });
    }

    const locX = config.initialLocation?.x ?? 500;
    const locY = config.initialLocation?.y ?? 500;

    const record: RoverRecord = {
      id: config.id,
      name: config.name,
      model: modelDef.modelType,
      modelId: modelDef.modelId,
      destinationId: config.destinationId,
      deploymentMissionId: config.deploymentMissionId,
      vehicleConditionRating: modelDef.baseCondition,
      energyRating: 100.0,
      maxEnergy: modelDef.baseMaxEnergy,
      communicationStatus: RoverCommStatus.CONNECTED,
      communicationFidelity: 95.0,
      storageCapacity: {
        usedSlots: 0,
        maxSlots: modelDef.maxStorageSlots,
        collectedSamples: [],
      },
      instruments: slots,
      movementConfig: JSON.parse(JSON.stringify(modelDef.defaultMovementConfig)),
      upgradeLevel: 1,
      location: {
        x: locX,
        y: locY,
        headingDeg: config.initialHeadingDeg ?? 0,
        currentTerrain: TerrainType.SMOOTH_PLAINS,
      },
      velocity: { x: 0, y: 0 },
      speed: 0,
      operationalStatus: RoverOperationalStatus.ACTIVE,
      powerSource: modelDef.powerSource,
      solarGenerationRate: modelDef.solarGenerationRate,
      rtgGenerationRate: modelDef.rtgGenerationRate,
      dustAccumulationPercent: 0,
      autonomousMode: false,
      autonomousBehavior: 0 as any, // AutonomousBehaviorMode.IDLE
      autonomousWaypoints: [],
      stats: {
        distanceTraveledMeters: 0,
        observationsCollected: 0,
        objectivesCompleted: 0,
        timeInOperationSeconds: 0,
      },
    };

    this.rovers.set(record.id, record);
    return record;
  }

  public clear(): void {
    this.rovers.clear();
  }
}
