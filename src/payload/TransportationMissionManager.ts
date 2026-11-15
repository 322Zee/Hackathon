/**
 * INTERSTELLAR CONTINUUM - Transportation Mission Lifecycle & Objective Manager
 * Authoritative lifecycle management for cargo and payload delivery operations,
 * multi-payload progress tracking, destination conditions, follow-up exploration phases,
 * and typed domain event notifications.
 */

import { DestinationId } from '../destinations/DestinationTypes';
import {
  TransportationMissionDefinition,
  TransportationMissionInstance,
  TransportationMissionStatus,
  FollowUpExplorationObjective,
} from './TransportationMissionTypes';
import { INITIAL_TRANSPORTATION_MISSIONS } from './TransportationMissionData';
import { PayloadRegistry } from './PayloadRegistry';
import { PayloadInventoryManager } from './PayloadInventoryManager';
import { PayloadAssignmentService } from './PayloadAssignmentService';
import { PayloadEventBus } from './events/PayloadEventBus';

export interface TransportationMissionFilter {
  destinationId?: DestinationId;
  difficulty?: string;
  status?: TransportationMissionStatus;
  onlyUnlocked?: boolean;
}

export interface DeliveryConfirmationResult {
  success: boolean;
  missionId: string;
  payloadId: string;
  quantityDelivered: number;
  isPayloadRequirementComplete: boolean;
  allDeliveriesComplete: boolean;
  enteredExplorationPhase: boolean;
  isMissionFullyComplete: boolean;
  errorMessage?: string;
}

export class TransportationMissionManager {
  private static instance?: TransportationMissionManager;

  private registry: PayloadRegistry;
  private inventoryManager: PayloadInventoryManager;
  private assignmentService: PayloadAssignmentService;
  private eventBus: PayloadEventBus;

  private missionDefinitions: Map<string, TransportationMissionDefinition> = new Map();
  private activeInstances: Map<string, TransportationMissionInstance> = new Map();
  private completedMissionIds: Set<string> = new Set();

  constructor(
    registry?: PayloadRegistry,
    inventoryManager?: PayloadInventoryManager,
    assignmentService?: PayloadAssignmentService,
    eventBus?: PayloadEventBus
  ) {
    this.registry = registry ?? PayloadRegistry.getInstance();
    this.inventoryManager = inventoryManager ?? PayloadInventoryManager.getInstance(this.registry);
    this.assignmentService =
      assignmentService ??
      PayloadAssignmentService.getInstance(this.registry, this.inventoryManager);
    this.eventBus = eventBus ?? PayloadEventBus.getInstance();

    this.initializeDefaultMissions();
  }

  public static getInstance(
    registry?: PayloadRegistry,
    inventoryManager?: PayloadInventoryManager,
    assignmentService?: PayloadAssignmentService,
    eventBus?: PayloadEventBus
  ): TransportationMissionManager {
    if (!TransportationMissionManager.instance) {
      TransportationMissionManager.instance = new TransportationMissionManager(
        registry,
        inventoryManager,
        assignmentService,
        eventBus
      );
    }
    return TransportationMissionManager.instance;
  }

  public static resetInstance(): void {
    TransportationMissionManager.instance = undefined;
  }

  private initializeDefaultMissions(): void {
    for (const def of INITIAL_TRANSPORTATION_MISSIONS) {
      this.registerTransportationMission(def);
    }
  }

  /**
   * Registers a transportation mission definition in the catalogue.
   */
  public registerTransportationMission(def: TransportationMissionDefinition): boolean {
    if (!def.id || !def.name) return false;
    this.missionDefinitions.set(def.id, JSON.parse(JSON.stringify(def)));
    return true;
  }

  /**
   * Retrieves a mission definition by ID.
   */
  public getTransportationMission(missionId: string): TransportationMissionDefinition | undefined {
    const def = this.missionDefinitions.get(missionId);
    return def ? JSON.parse(JSON.stringify(def)) : undefined;
  }

  /**
   * Lists all transportation mission definitions with optional filters.
   */
  public listTransportationMissions(
    filter?: TransportationMissionFilter
  ): TransportationMissionDefinition[] {
    let list = Array.from(this.missionDefinitions.values()).map((d) =>
      JSON.parse(JSON.stringify(d))
    );

    if (!filter) return list;

    if (filter.destinationId) {
      list = list.filter((d) => d.destinationId === filter.destinationId);
    }

    if (filter.difficulty) {
      list = list.filter((d) => d.difficulty === filter.difficulty);
    }

    return list;
  }

  /**
   * Accepts and instantiates a transportation mission.
   */
  public acceptMission(
    missionId: string,
    vehicleId?: string
  ): TransportationMissionInstance | undefined {
    const def = this.missionDefinitions.get(missionId);
    if (!def) return undefined;

    const instanceId = `inst_${missionId}_${Date.now()}`;
    const payloadProgress = new Map<string, { required: number; delivered: number; isSatisfied: boolean }>();

    for (const req of def.requiredPayloads) {
      payloadProgress.set(req.payloadId, {
        required: req.requiredQuantity,
        delivered: 0,
        isSatisfied: false,
      });

      // Earmark inventory reservation
      this.inventoryManager.reservePayload(req.payloadId, req.requiredQuantity, missionId);
      this.eventBus.emit('PayloadReserved', {
        payloadId: req.payloadId,
        payloadName: this.registry.getPayload(req.payloadId)?.name ?? req.payloadId,
        missionId,
        quantity: req.requiredQuantity,
        timestamp: Date.now(),
      });
    }

    const explorationProgress = new Map<string, FollowUpExplorationObjective>();
    if (def.explorationObjectives) {
      for (const exp of def.explorationObjectives) {
        explorationProgress.set(exp.id, { ...exp });
      }
    }

    const instance: TransportationMissionInstance = {
      instanceId,
      missionId,
      definition: def,
      status: TransportationMissionStatus.ACCEPTED,
      acceptedTimestamp: Date.now(),
      assignedVehicleId: vehicleId,
      payloadProgress,
      explorationProgress,
      allDeliveriesComplete: false,
      allExplorationsComplete: explorationProgress.size === 0,
    };

    this.activeInstances.set(missionId, instance);
    return instance;
  }

  /**
   * Retrieves the active runtime instance of a mission.
   */
  public getActiveInstance(missionId: string): TransportationMissionInstance | undefined {
    return this.activeInstances.get(missionId);
  }

  /**
   * Updates delivery progress for a specific payload in an active mission.
   */
  public updateDeliveryProgress(
    missionId: string,
    payloadId: string,
    deltaQuantity: number
  ): DeliveryConfirmationResult {
    return this.confirmPayloadDelivery(missionId, payloadId, deltaQuantity);
  }

  /**
   * Confirms delivery of a quantity of payload at the target destination.
   */
  public confirmPayloadDelivery(
    missionId: string,
    payloadId: string,
    quantity: number
  ): DeliveryConfirmationResult {
    const instance = this.activeInstances.get(missionId);
    if (!instance) {
      return {
        success: false,
        missionId,
        payloadId,
        quantityDelivered: 0,
        isPayloadRequirementComplete: false,
        allDeliveriesComplete: false,
        enteredExplorationPhase: false,
        isMissionFullyComplete: false,
        errorMessage: `Active mission instance "${missionId}" not found.`,
      };
    }

    const progress = instance.payloadProgress.get(payloadId);
    if (!progress) {
      return {
        success: false,
        missionId,
        payloadId,
        quantityDelivered: 0,
        isPayloadRequirementComplete: false,
        allDeliveriesComplete: false,
        enteredExplorationPhase: false,
        isMissionFullyComplete: false,
        errorMessage: `Payload "${payloadId}" is not part of mission "${missionId}".`,
      };
    }

    const actualQty = Math.max(0, quantity);
    progress.delivered += actualQty;
    if (progress.delivered >= progress.required) {
      progress.isSatisfied = true;
    }

    // 1. Transactionally confirm in inventory
    this.inventoryManager.confirmDelivery(payloadId, actualQty, missionId);

    // 2. Dispatch PayloadDelivered event
    const payload = this.registry.getPayload(payloadId);
    this.eventBus.emit('PayloadDelivered', {
      payloadId,
      payloadName: payload?.name ?? payloadId,
      missionId,
      destinationId: instance.definition.destinationId,
      quantity: actualQty,
      remainingRequired: Math.max(0, progress.required - progress.delivered),
      timestamp: Date.now(),
    });

    // 3. Check if all required payloads are delivered
    let allDeliveriesDone = true;
    for (const p of instance.payloadProgress.values()) {
      if (!p.isSatisfied) {
        allDeliveriesDone = false;
        break;
      }
    }
    instance.allDeliveriesComplete = allDeliveriesDone;

    // 4. Dispatch DeliveryObjectiveCompleted if this payload is complete
    if (progress.isSatisfied) {
      this.eventBus.emit('DeliveryObjectiveCompleted', {
        missionId,
        objectiveId: `obj_deliv_${payloadId}`,
        payloadId,
        requiredQuantity: progress.required,
        deliveredQuantity: progress.delivered,
        destinationId: instance.definition.destinationId,
        allDeliveryObjectivesComplete: allDeliveriesDone,
        timestamp: Date.now(),
      });
    }

    // 5. Evaluate state transition (Deliveries Complete -> Exploration Phase or Completed)
    let enteredExplorationPhase = false;
    let isFullyComplete = false;

    if (allDeliveriesDone) {
      if (instance.explorationProgress.size > 0 && !instance.allExplorationsComplete) {
        instance.status = TransportationMissionStatus.EXPLORATION_PHASE;
        enteredExplorationPhase = true;
      } else {
        instance.status = TransportationMissionStatus.COMPLETED;
        instance.completedTimestamp = Date.now();
        this.completedMissionIds.add(missionId);
        isFullyComplete = true;
      }
    }

    return {
      success: true,
      missionId,
      payloadId,
      quantityDelivered: actualQty,
      isPayloadRequirementComplete: progress.isSatisfied,
      allDeliveriesComplete: allDeliveriesDone,
      enteredExplorationPhase,
      isMissionFullyComplete: isFullyComplete,
    };
  }

  /**
   * Updates progress on follow-up exploration objectives (e.g. 5 km rover driving, sampling).
   */
  public updateExplorationObjectiveProgress(
    missionId: string,
    objectiveId: string,
    newValueOrProgress: number | string
  ): boolean {
    const instance = this.activeInstances.get(missionId);
    if (!instance) return false;

    const obj = instance.explorationProgress.get(objectiveId);
    if (!obj) return false;

    // Must be in exploration phase (or deliveries must be complete)
    if (!instance.allDeliveriesComplete && obj.activeOnlyAfterDelivery) {
      return false;
    }

    obj.currentValue = newValueOrProgress;
    if (typeof obj.targetValue === 'number' && typeof newValueOrProgress === 'number') {
      if (newValueOrProgress >= obj.targetValue) {
        obj.isCompleted = true;
      }
    } else if (String(newValueOrProgress) === String(obj.targetValue)) {
      obj.isCompleted = true;
    }

    // Check if all exploration objectives are satisfied
    let allExplorationDone = true;
    for (const exp of instance.explorationProgress.values()) {
      if (!exp.isCompleted) {
        allExplorationDone = false;
        break;
      }
    }
    instance.allExplorationsComplete = allExplorationDone;

    if (instance.allDeliveriesComplete && allExplorationDone) {
      instance.status = TransportationMissionStatus.COMPLETED;
      instance.completedTimestamp = Date.now();
      this.completedMissionIds.add(missionId);
    }

    return true;
  }

  /**
   * Aborts/cancels an active mission, releasing any reserved inventory.
   */
  public cancelMission(missionId: string, reason: string = 'User cancelled'): boolean {
    const instance = this.activeInstances.get(missionId);
    if (!instance) return false;

    instance.status = TransportationMissionStatus.CANCELLED;
    instance.failureReason = reason;

    // Rollback any inventory held by this mission
    this.inventoryManager.rollbackMissionAllocations(missionId);
    this.activeInstances.delete(missionId);
    return true;
  }

  public isMissionCompleted(missionId: string): boolean {
    return this.completedMissionIds.has(missionId);
  }

  public getAllCompletedMissions(): string[] {
    return Array.from(this.completedMissionIds);
  }
}
