/**
 * INTERSTELLAR CONTINUUM - Payload Assignment Service
 * Coordinates assigning, modifying, removing, and validating payloads mounted
 * onto spacecraft platforms and launch vehicles, tracking capacity consumption,
 * compatibility constraints, and dispatching typed domain events.
 */

import {
  VehiclePayloadManifest,
  AssignedPayloadItem,
  RemainingCapacityMetrics,
  PayloadFilter,
  PayloadDefinition,
  PayloadValidationResult,
} from './PayloadTypes';
import { PayloadRegistry } from './PayloadRegistry';
import { PayloadInventoryManager } from './PayloadInventoryManager';
import { SpacecraftAdapterRegistry, IVehiclePayloadTarget } from './adapters/SpacecraftAdapter';
import {
  PayloadValidationEngine,
  ValidationContext,
  MissionPayloadRequirementItem,
} from './PayloadValidationEngine';
import { PayloadEventBus } from './events/PayloadEventBus';

export interface AssignmentOperationResult {
  success: boolean;
  vehicleId: string;
  payloadId: string;
  quantity: number;
  manifest: VehiclePayloadManifest;
  errorMessage?: string;
}

export interface CompatibilityFeedbackResult {
  isCompatible: boolean;
  vehicleName: string;
  payloadName: string;
  missingTags: string[];
  matchedTags: string[];
  fairingClearanceOk: boolean;
  requiredFairingM: number;
  vehicleFairingM: number;
  details: string;
}

export interface MissingRequirementAnalysis {
  isComplete: boolean;
  allRequirementsMet: boolean;
  missingItems: {
    payloadId: string;
    payloadName: string;
    requiredQuantity: number;
    assignedQuantity: number;
    deficit: number;
  }[];
}

export class PayloadAssignmentService {
  private static instance?: PayloadAssignmentService;

  private registry: PayloadRegistry;
  private inventoryManager: PayloadInventoryManager;
  private vehicleAdapterRegistry: SpacecraftAdapterRegistry;
  private validationEngine: PayloadValidationEngine;
  private eventBus: PayloadEventBus;

  private manifests: Map<string, VehiclePayloadManifest> = new Map();

  constructor(
    registry?: PayloadRegistry,
    inventoryManager?: PayloadInventoryManager,
    vehicleAdapterRegistry?: SpacecraftAdapterRegistry,
    validationEngine?: PayloadValidationEngine,
    eventBus?: PayloadEventBus
  ) {
    this.registry = registry ?? PayloadRegistry.getInstance();
    this.inventoryManager = inventoryManager ?? PayloadInventoryManager.getInstance(this.registry);
    this.vehicleAdapterRegistry =
      vehicleAdapterRegistry ?? SpacecraftAdapterRegistry.getInstance();
    this.validationEngine =
      validationEngine ??
      PayloadValidationEngine.getInstance(this.registry, this.inventoryManager);
    this.eventBus = eventBus ?? PayloadEventBus.getInstance();
  }

  public static getInstance(
    registry?: PayloadRegistry,
    inventoryManager?: PayloadInventoryManager,
    vehicleAdapterRegistry?: SpacecraftAdapterRegistry,
    validationEngine?: PayloadValidationEngine,
    eventBus?: PayloadEventBus
  ): PayloadAssignmentService {
    if (!PayloadAssignmentService.instance) {
      PayloadAssignmentService.instance = new PayloadAssignmentService(
        registry,
        inventoryManager,
        vehicleAdapterRegistry,
        validationEngine,
        eventBus
      );
    }
    return PayloadAssignmentService.instance;
  }

  public static resetInstance(): void {
    PayloadAssignmentService.instance = undefined;
  }

  /**
   * Retrieves or initializes the payload manifest for a vehicle.
   */
  public getVehicleManifest(vehicleId: string): VehiclePayloadManifest {
    let manifest = this.manifests.get(vehicleId);
    if (!manifest) {
      const vehicle = this.vehicleAdapterRegistry.getVehicle(vehicleId);
      const vehicleName = vehicle?.name ?? vehicleId;

      manifest = {
        vehicleId,
        vehicleName,
        assignedPayloads: new Map(),
        totalMassRating: 0,
        totalPowerRequirement: 0,
        totalStorageUsed: 0,
        lastUpdatedTimestamp: Date.now(),
      };
      this.manifests.set(vehicleId, manifest);
    }
    return manifest;
  }

  /**
   * Browse available payloads in the registry.
   */
  public browseAvailablePayloads(filter?: PayloadFilter): PayloadDefinition[] {
    return this.registry.listPayloads(filter);
  }

  /**
   * View details of a specific payload.
   */
  public getPayloadInfo(payloadId: string): PayloadDefinition | undefined {
    return this.registry.getPayload(payloadId);
  }

  /**
   * Assigns a payload to a target spacecraft or launch vehicle.
   */
  public assignPayload(
    vehicleId: string,
    payloadId: string,
    quantity: number = 1,
    missionId?: string
  ): AssignmentOperationResult {
    const payload = this.registry.getPayload(payloadId);
    const manifest = this.getVehicleManifest(vehicleId);

    if (!payload) {
      return {
        success: false,
        vehicleId,
        payloadId,
        quantity,
        manifest,
        errorMessage: `Payload "${payloadId}" not recognized in Agency Registry.`,
      };
    }

    if (quantity <= 0) {
      return {
        success: false,
        vehicleId,
        payloadId,
        quantity,
        manifest,
        errorMessage: 'Quantity to assign must be greater than zero.',
      };
    }

    // 1. Transactionally allocate inventory
    const tx = this.inventoryManager.assignPayload(payloadId, quantity, vehicleId, missionId);
    if (!tx.success) {
      return {
        success: false,
        vehicleId,
        payloadId,
        quantity,
        manifest,
        errorMessage: tx.errorMessage ?? 'Insufficient inventory to assign payload.',
      };
    }

    // 2. Update Manifest
    let existingItem = manifest.assignedPayloads.get(payloadId);
    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.totalMassRating = existingItem.quantity * payload.massRating;
      existingItem.totalPowerRequirement = existingItem.quantity * payload.powerRequirementRating;
      existingItem.totalStorageRequirement = existingItem.quantity * payload.storageRequirement;
      existingItem.assignedTimestamp = Date.now();
    } else {
      const newItem: AssignedPayloadItem = {
        payloadId,
        quantity,
        unitMassRating: payload.massRating,
        totalMassRating: quantity * payload.massRating,
        unitPowerRequirement: payload.powerRequirementRating,
        totalPowerRequirement: quantity * payload.powerRequirementRating,
        unitStorageRequirement: payload.storageRequirement,
        totalStorageRequirement: quantity * payload.storageRequirement,
        assignedTimestamp: Date.now(),
        missionId,
      };
      manifest.assignedPayloads.set(payloadId, newItem);
    }

    this.recalculateManifestTotals(manifest);

    // 3. Dispatch Typed Domain Event
    this.eventBus.emit('PayloadAssigned', {
      payloadId: payload.id,
      payloadName: payload.name,
      vehicleId,
      vehicleName: manifest.vehicleName,
      quantity,
      totalMassRating: manifest.totalMassRating,
      totalPowerRequirement: manifest.totalPowerRequirement,
      totalStorageUsed: manifest.totalStorageUsed,
      missionId,
      timestamp: Date.now(),
    });

    return {
      success: true,
      vehicleId,
      payloadId,
      quantity,
      manifest,
    };
  }

  /**
   * Removes a quantity of a payload from a vehicle manifest.
   */
  public removePayload(
    vehicleId: string,
    payloadId: string,
    quantity?: number,
    missionId?: string
  ): AssignmentOperationResult {
    const manifest = this.getVehicleManifest(vehicleId);
    const item = manifest.assignedPayloads.get(payloadId);

    if (!item) {
      return {
        success: false,
        vehicleId,
        payloadId,
        quantity: quantity ?? 0,
        manifest,
        errorMessage: `Payload "${payloadId}" is not currently assigned to vehicle "${manifest.vehicleName}".`,
      };
    }

    const payload = this.registry.getPayload(payloadId);
    const qtyToRemove = quantity !== undefined ? Math.min(quantity, item.quantity) : item.quantity;

    if (qtyToRemove <= 0) {
      return {
        success: false,
        vehicleId,
        payloadId,
        quantity: 0,
        manifest,
        errorMessage: 'Removal quantity must be greater than zero.',
      };
    }

    // 1. Transactionally return to warehouse inventory
    const tx = this.inventoryManager.unassignPayload(payloadId, qtyToRemove, vehicleId, missionId);
    if (!tx.success) {
      return {
        success: false,
        vehicleId,
        payloadId,
        quantity: qtyToRemove,
        manifest,
        errorMessage: tx.errorMessage ?? 'Failed to unassign inventory.',
      };
    }

    // 2. Update Manifest
    item.quantity -= qtyToRemove;
    if (item.quantity <= 0) {
      manifest.assignedPayloads.delete(payloadId);
    } else if (payload) {
      item.totalMassRating = item.quantity * payload.massRating;
      item.totalPowerRequirement = item.quantity * payload.powerRequirementRating;
      item.totalStorageRequirement = item.quantity * payload.storageRequirement;
    }

    this.recalculateManifestTotals(manifest);

    // 3. Dispatch Typed Event
    this.eventBus.emit('PayloadRemoved', {
      payloadId,
      payloadName: payload?.name ?? payloadId,
      vehicleId,
      quantity: qtyToRemove,
      missionId,
      timestamp: Date.now(),
    });

    return {
      success: true,
      vehicleId,
      payloadId,
      quantity: qtyToRemove,
      manifest,
    };
  }

  /**
   * Adjusts the exact assigned quantity of a payload on a vehicle.
   */
  public setPayloadQuantity(
    vehicleId: string,
    payloadId: string,
    targetQuantity: number,
    missionId?: string
  ): AssignmentOperationResult {
    const manifest = this.getVehicleManifest(vehicleId);
    const currentItem = manifest.assignedPayloads.get(payloadId);
    const currentQty = currentItem ? currentItem.quantity : 0;

    if (targetQuantity === currentQty) {
      return {
        success: true,
        vehicleId,
        payloadId,
        quantity: targetQuantity,
        manifest,
      };
    }

    if (targetQuantity > currentQty) {
      const delta = targetQuantity - currentQty;
      return this.assignPayload(vehicleId, payloadId, delta, missionId);
    } else {
      const delta = currentQty - targetQuantity;
      return this.removePayload(vehicleId, payloadId, delta, missionId);
    }
  }

  /**
   * Completely clears all assigned payloads from a vehicle manifest,
   * unassigning them back to warehouse storage.
   */
  public clearVehicleManifest(vehicleId: string, missionId?: string): void {
    const manifest = this.getVehicleManifest(vehicleId);
    const assignedIds = Array.from(manifest.assignedPayloads.keys());

    for (const pId of assignedIds) {
      const item = manifest.assignedPayloads.get(pId);
      if (item && item.quantity > 0) {
        this.inventoryManager.unassignPayload(pId, item.quantity, vehicleId, missionId);
      }
    }

    manifest.assignedPayloads.clear();
    this.recalculateManifestTotals(manifest);
  }

  /**
   * Computes the remaining capacity metrics for a vehicle.
   */
  public getRemainingCapacity(vehicleId: string): RemainingCapacityMetrics {
    const manifest = this.getVehicleManifest(vehicleId);
    const vehicle = this.vehicleAdapterRegistry.getVehicle(vehicleId);

    const defaultCapacity = {
      vehicleId,
      vehicleName: manifest.vehicleName,
      maxPayloadMassRating: 150,
      maxPowerRating: 150,
      maxStorageSlots: 4,
      fairingDiameterM: 1.8,
      supportedTags: [],
    };

    const capacity = vehicle?.capacity ?? defaultCapacity;
    return this.validationEngine.computeCapacityMetrics(manifest, capacity);
  }

  /**
   * Evaluates compatibility feedback between a vehicle and a potential payload.
   */
  public getCompatibilityFeedback(
    vehicleId: string,
    payloadId: string
  ): CompatibilityFeedbackResult {
    const payload = this.registry.getPayload(payloadId);
    const vehicle = this.vehicleAdapterRegistry.getVehicle(vehicleId);

    if (!payload || !vehicle) {
      return {
        isCompatible: false,
        vehicleName: vehicle?.name ?? vehicleId,
        payloadName: payload?.name ?? payloadId,
        missingTags: [],
        matchedTags: [],
        fairingClearanceOk: false,
        requiredFairingM: 1.8,
        vehicleFairingM: vehicle?.capacity.fairingDiameterM ?? 1.8,
        details: 'Vehicle or Payload definition not found.',
      };
    }

    const tagFeedback = this.validationEngine.evaluateItemCompatibility(payload, vehicle);

    // Fairing diameter check
    let requiredFairing = 1.8;
    if (payload.compatibilityTags.includes('FAIRING_5_0M')) requiredFairing = 5.0;
    else if (payload.compatibilityTags.includes('FAIRING_3_8M')) requiredFairing = 3.8;
    else if (payload.compatibilityTags.includes('FAIRING_2_5M')) requiredFairing = 2.5;

    const fairingOk = vehicle.capacity.fairingDiameterM >= requiredFairing;
    const isOverallCompatible = tagFeedback.isCompatible && fairingOk;

    let details = 'Compatible with vehicle mounting structure.';
    if (!tagFeedback.isCompatible) {
      details = `Incompatible platform classification: requires ${tagFeedback.missingTags.join(', ')}.`;
    } else if (!fairingOk) {
      details = `Fairing envelope deficit: requires ${requiredFairing}m fairing; vehicle has ${vehicle.capacity.fairingDiameterM}m.`;
    }

    return {
      isCompatible: isOverallCompatible,
      vehicleName: vehicle.name,
      payloadName: payload.name,
      missingTags: tagFeedback.missingTags,
      matchedTags: tagFeedback.matchedTags,
      fairingClearanceOk: fairingOk,
      requiredFairingM: requiredFairing,
      vehicleFairingM: vehicle.capacity.fairingDiameterM,
      details,
    };
  }

  /**
   * Checks for missing required payloads for a mission contract.
   */
  public getMissingRequirements(
    vehicleId: string,
    requiredPayloads: MissionPayloadRequirementItem[]
  ): MissingRequirementAnalysis {
    const manifest = this.getVehicleManifest(vehicleId);
    const missingItems: MissingRequirementAnalysis['missingItems'] = [];

    for (const req of requiredPayloads) {
      const assigned = manifest.assignedPayloads.get(req.payloadId);
      const assignedQty = assigned ? assigned.quantity : 0;
      if (assignedQty < req.requiredQuantity) {
        const payload = this.registry.getPayload(req.payloadId);
        missingItems.push({
          payloadId: req.payloadId,
          payloadName: payload?.name ?? req.payloadId,
          requiredQuantity: req.requiredQuantity,
          assignedQuantity: assignedQty,
          deficit: req.requiredQuantity - assignedQty,
        });
      }
    }

    return {
      isComplete: missingItems.length === 0,
      allRequirementsMet: missingItems.length === 0,
      missingItems,
    };
  }

  /**
   * Validates the assigned payload manifest of a vehicle against capacity and constraints.
   */
  public validateVehicleAssignment(
    vehicleId: string,
    context: ValidationContext = {}
  ): PayloadValidationResult {
    const manifest = this.getVehicleManifest(vehicleId);
    const vehicle = this.vehicleAdapterRegistry.getVehicle(vehicleId);

    if (!vehicle) {
      return {
        isValid: false,
        errors: [
          {
            code: PayloadValidationCode.PAYLOAD_NOT_FOUND,
            severity: 1 as any,
            message: `Target vehicle "${vehicleId}" is not registered.`,
            remedyRecommendation: 'Select an authorized spacecraft platform or rocket project.',
          },
        ],
        warnings: [],
        metrics: this.getRemainingCapacity(vehicleId),
        evaluatedAt: Date.now(),
      };
    }

    return this.validationEngine.validateManifest(manifest, vehicle, context);
  }

  private recalculateManifestTotals(manifest: VehiclePayloadManifest): void {
    let mass = 0;
    let power = 0;
    let storage = 0;

    for (const item of manifest.assignedPayloads.values()) {
      mass += item.totalMassRating;
      power += item.totalPowerRequirement;
      storage += item.totalStorageRequirement;
    }

    manifest.totalMassRating = mass;
    manifest.totalPowerRequirement = power;
    manifest.totalStorageUsed = storage;
    manifest.lastUpdatedTimestamp = Date.now();
  }
}
