/**
 * INTERSTELLAR CONTINUUM - Payload & Transportation Domain Service Facade
 * Master integration contract exposing all required capabilities specified in Prompt 29:
 * 
 * - getPayload(...)
 * - listPayloads(...)
 * - getAvailablePayloads(...)
 * - assignPayload(...)
 * - removePayload(...)
 * - validatePayloadAssignment(...)
 * - createTransportationMission(...)
 * - getTransportationMission(...)
 * - updateDeliveryProgress(...)
 * - confirmPayloadDelivery(...)
 * 
 * Coordinates Registry, Inventory, Assignment, Validation, and Mission managers.
 */

import { EventBus } from '../core/EventBus';
import {
  PayloadDefinition,
  PayloadFilter,
  PayloadValidationResult,
  VehiclePayloadManifest,
  RemainingCapacityMetrics,
} from './PayloadTypes';
import { PayloadRegistry } from './PayloadRegistry';
import { PayloadCategoryRegistry } from './PayloadCategoryRegistry';
import { PayloadInventoryManager } from './PayloadInventoryManager';
import { SpacecraftAdapterRegistry, IVehiclePayloadTarget } from './adapters/SpacecraftAdapter';
import {
  PayloadAssignmentService,
  AssignmentOperationResult,
  CompatibilityFeedbackResult,
  MissingRequirementAnalysis,
} from './PayloadAssignmentService';
import { PayloadValidationEngine, ValidationContext } from './PayloadValidationEngine';
import {
  TransportationMissionDefinition,
  TransportationMissionInstance,
} from './TransportationMissionTypes';
import {
  TransportationMissionManager,
  DeliveryConfirmationResult,
} from './TransportationMissionManager';
import { PayloadEventBus } from './events/PayloadEventBus';

export class PayloadTransportationService {
  private static instance?: PayloadTransportationService;

  public readonly registry: PayloadRegistry;
  public readonly categoryRegistry: PayloadCategoryRegistry;
  public readonly inventoryManager: PayloadInventoryManager;
  public readonly spacecraftAdapters: SpacecraftAdapterRegistry;
  public readonly assignmentService: PayloadAssignmentService;
  public readonly validationEngine: PayloadValidationEngine;
  public readonly missionManager: TransportationMissionManager;
  public readonly eventBus: PayloadEventBus;

  constructor(globalEventBus?: EventBus) {
    this.eventBus = PayloadEventBus.getInstance(globalEventBus);
    this.categoryRegistry = PayloadCategoryRegistry.getInstance();
    this.registry = PayloadRegistry.getInstance(this.categoryRegistry);
    this.inventoryManager = PayloadInventoryManager.getInstance(this.registry);
    this.spacecraftAdapters = SpacecraftAdapterRegistry.getInstance();
    this.validationEngine = PayloadValidationEngine.getInstance(
      this.registry,
      this.inventoryManager
    );
    this.assignmentService = PayloadAssignmentService.getInstance(
      this.registry,
      this.inventoryManager,
      this.spacecraftAdapters,
      this.validationEngine,
      this.eventBus
    );
    this.missionManager = TransportationMissionManager.getInstance(
      this.registry,
      this.inventoryManager,
      this.assignmentService,
      this.eventBus
    );
  }

  public static getInstance(globalEventBus?: EventBus): PayloadTransportationService {
    if (!PayloadTransportationService.instance) {
      PayloadTransportationService.instance = new PayloadTransportationService(globalEventBus);
    }
    return PayloadTransportationService.instance;
  }

  public static resetInstance(): void {
    PayloadTransportationService.instance = undefined;
    PayloadRegistry.resetInstance();
    PayloadCategoryRegistry.resetInstance();
    PayloadInventoryManager.resetInstance();
    SpacecraftAdapterRegistry.resetInstance();
    PayloadAssignmentService.resetInstance();
    PayloadValidationEngine.resetInstance();
    TransportationMissionManager.resetInstance();
    PayloadEventBus.resetInstance();
  }

  // =========================================================================
  // 1. getPayload(...)
  // =========================================================================
  public getPayload(payloadId: string): PayloadDefinition | undefined {
    return this.registry.getPayload(payloadId);
  }

  // =========================================================================
  // 2. listPayloads(...)
  // =========================================================================
  public listPayloads(filter?: PayloadFilter): PayloadDefinition[] {
    return this.registry.listPayloads(filter);
  }

  // =========================================================================
  // 3. getAvailablePayloads(...)
  // =========================================================================
  public getAvailablePayloads(): PayloadDefinition[] {
    return this.registry.getAvailablePayloads();
  }

  // =========================================================================
  // 4. assignPayload(...)
  // =========================================================================
  public assignPayload(
    vehicleId: string,
    payloadId: string,
    quantity: number = 1,
    missionId?: string
  ): AssignmentOperationResult {
    return this.assignmentService.assignPayload(vehicleId, payloadId, quantity, missionId);
  }

  // =========================================================================
  // 5. removePayload(...)
  // =========================================================================
  public removePayload(
    vehicleId: string,
    payloadId: string,
    quantity?: number,
    missionId?: string
  ): AssignmentOperationResult {
    return this.assignmentService.removePayload(vehicleId, payloadId, quantity, missionId);
  }

  // =========================================================================
  // 6. validatePayloadAssignment(...)
  // =========================================================================
  public validatePayloadAssignment(
    vehicleId: string,
    context?: ValidationContext
  ): PayloadValidationResult {
    return this.assignmentService.validateVehicleAssignment(vehicleId, context);
  }

  // =========================================================================
  // 7. createTransportationMission(...)
  // =========================================================================
  public createTransportationMission(
    definition: TransportationMissionDefinition
  ): boolean {
    return this.missionManager.registerTransportationMission(definition);
  }

  // =========================================================================
  // 8. getTransportationMission(...)
  // =========================================================================
  public getTransportationMission(
    missionId: string
  ): TransportationMissionDefinition | undefined {
    return this.missionManager.getTransportationMission(missionId);
  }

  // =========================================================================
  // 9. updateDeliveryProgress(...)
  // =========================================================================
  public updateDeliveryProgress(
    missionId: string,
    payloadId: string,
    deltaQuantity: number
  ): DeliveryConfirmationResult {
    return this.missionManager.updateDeliveryProgress(missionId, payloadId, deltaQuantity);
  }

  // =========================================================================
  // 10. confirmPayloadDelivery(...)
  // =========================================================================
  public confirmPayloadDelivery(
    missionId: string,
    payloadId: string,
    quantity: number
  ): DeliveryConfirmationResult {
    return this.missionManager.confirmPayloadDelivery(missionId, payloadId, quantity);
  }

  // =========================================================================
  // Auxiliary Convenience Operations
  // =========================================================================
  public getVehicleManifest(vehicleId: string): VehiclePayloadManifest {
    return this.assignmentService.getVehicleManifest(vehicleId);
  }

  public getRemainingCapacity(vehicleId: string): RemainingCapacityMetrics {
    return this.assignmentService.getRemainingCapacity(vehicleId);
  }

  public getCompatibilityFeedback(
    vehicleId: string,
    payloadId: string
  ): CompatibilityFeedbackResult {
    return this.assignmentService.getCompatibilityFeedback(vehicleId, payloadId);
  }

  public getMissingRequirements(
    vehicleId: string,
    missionId: string
  ): MissingRequirementAnalysis {
    const mission = this.missionManager.getTransportationMission(missionId);
    if (!mission) {
      return { isComplete: false, allRequirementsMet: false, missingItems: [] };
    }
    return this.assignmentService.getMissingRequirements(
      vehicleId,
      mission.requiredPayloads.map((r) => ({
        payloadId: r.payloadId,
        requiredQuantity: r.requiredQuantity,
      }))
    );
  }

  public acceptTransportationMission(
    missionId: string,
    vehicleId?: string
  ): TransportationMissionInstance | undefined {
    return this.missionManager.acceptMission(missionId, vehicleId);
  }

  public registerVehicle(target: IVehiclePayloadTarget): void {
    this.spacecraftAdapters.registerCustomVehicle(target);
  }
}
