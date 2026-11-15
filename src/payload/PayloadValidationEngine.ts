/**
 * INTERSTELLAR CONTINUUM - Payload Validation Engine
 * Evaluates vehicle capacity constraints, compatibility tags, fairing clearances,
 * inventory availability, technology prerequisites, and mission delivery requirements.
 * 
 * NOTE: All rules use educational fictional gameplay ratings.
 */

import { DestinationId } from '../destinations/DestinationTypes';
import {
  VehicleCapacity,
  VehiclePayloadManifest,
  PayloadValidationResult,
  PayloadValidationIssue,
  PayloadValidationSeverity,
  PayloadValidationCode,
  RemainingCapacityMetrics,
  PayloadDefinition,
} from './PayloadTypes';
import { PayloadRegistry, PlayerProgressionContext } from './PayloadRegistry';
import { PayloadInventoryManager } from './PayloadInventoryManager';
import { IVehiclePayloadTarget } from './adapters/SpacecraftAdapter';

export interface MissionPayloadRequirementItem {
  payloadId: string;
  requiredQuantity: number;
}

export interface ValidationContext {
  destinationId?: DestinationId;
  requiredMissionPayloads?: MissionPayloadRequirementItem[];
  playerProgression?: PlayerProgressionContext;
}

export class PayloadValidationEngine {
  private static instance?: PayloadValidationEngine;
  private registry: PayloadRegistry;
  private inventoryManager: PayloadInventoryManager;

  constructor(
    registry?: PayloadRegistry,
    inventoryManager?: PayloadInventoryManager
  ) {
    this.registry = registry ?? PayloadRegistry.getInstance();
    this.inventoryManager = inventoryManager ?? PayloadInventoryManager.getInstance();
  }

  public static getInstance(
    registry?: PayloadRegistry,
    inventoryManager?: PayloadInventoryManager
  ): PayloadValidationEngine {
    if (!PayloadValidationEngine.instance) {
      PayloadValidationEngine.instance = new PayloadValidationEngine(
        registry,
        inventoryManager
      );
    }
    return PayloadValidationEngine.instance;
  }

  public static resetInstance(): void {
    PayloadValidationEngine.instance = undefined;
  }

  /**
   * Computes capacity metrics for a given manifest against vehicle capacity limits.
   */
  public computeCapacityMetrics(
    manifest: VehiclePayloadManifest,
    capacity: VehicleCapacity
  ): RemainingCapacityMetrics {
    const remainingMass = capacity.maxPayloadMassRating - manifest.totalMassRating;
    const remainingPower = capacity.maxPowerRating - manifest.totalPowerRequirement;
    const remainingStorage = capacity.maxStorageSlots - manifest.totalStorageUsed;

    const massRatio =
      capacity.maxPayloadMassRating > 0
        ? manifest.totalMassRating / capacity.maxPayloadMassRating
        : 1.0;
    const powerRatio =
      capacity.maxPowerRating > 0
        ? manifest.totalPowerRequirement / capacity.maxPowerRating
        : 1.0;
    const storageRatio =
      capacity.maxStorageSlots > 0
        ? manifest.totalStorageUsed / capacity.maxStorageSlots
        : 1.0;

    const isWithinMass = remainingMass >= 0;
    const isWithinPower = remainingPower >= 0;
    const isWithinStorage = remainingStorage >= 0;

    return {
      remainingMassRating: remainingMass,
      remainingPowerRating: remainingPower,
      remainingStorageSlots: remainingStorage,
      massCapacityRatio: Math.round(massRatio * 100) / 100,
      powerCapacityRatio: Math.round(powerRatio * 100) / 100,
      storageCapacityRatio: Math.round(storageRatio * 100) / 100,
      isWithinMassLimit: isWithinMass,
      isWithinPowerLimit: isWithinPower,
      isWithinStorageLimit: isWithinStorage,
      isFullyWithinLimits: isWithinMass && isWithinPower && isWithinStorage,
    };
  }

  /**
   * Fully validates a vehicle payload manifest against vehicle capacity and optional mission context.
   */
  public validateManifest(
    manifest: VehiclePayloadManifest,
    vehicle: IVehiclePayloadTarget,
    context: ValidationContext = {}
  ): PayloadValidationResult {
    const errors: PayloadValidationIssue[] = [];
    const warnings: PayloadValidationIssue[] = [];
    const capacity = vehicle.capacity;
    const metrics = this.computeCapacityMetrics(manifest, capacity);

    // 1. Capacity Validations
    if (!metrics.isWithinMassLimit) {
      const excess = manifest.totalMassRating - capacity.maxPayloadMassRating;
      errors.push({
        code: PayloadValidationCode.CAPACITY_MASS_EXCEEDED,
        severity: PayloadValidationSeverity.ERROR,
        message: `Total payload mass (${manifest.totalMassRating} Mass Units) exceeds vehicle capacity of ${capacity.maxPayloadMassRating} MU by ${excess} MU.`,
        remedyRecommendation: 'Remove heavy cargo items or upgrade the launch vehicle to a higher booster tier.',
        metricValue: manifest.totalMassRating,
        limitValue: capacity.maxPayloadMassRating,
      });
    }

    if (!metrics.isWithinPowerLimit) {
      const deficit = manifest.totalPowerRequirement - capacity.maxPowerRating;
      errors.push({
        code: PayloadValidationCode.CAPACITY_POWER_EXCEEDED,
        severity: PayloadValidationSeverity.ERROR,
        message: `Payload power demand (${manifest.totalPowerRequirement} PWR) exceeds vehicle available electrical budget (${capacity.maxPowerRating} PWR) by ${deficit} PWR.`,
        remedyRecommendation: 'Install an auxiliary power module or remove high-power scientific instruments.',
        metricValue: manifest.totalPowerRequirement,
        limitValue: capacity.maxPowerRating,
      });
    }

    if (!metrics.isWithinStorageLimit) {
      const excessSlots = manifest.totalStorageUsed - capacity.maxStorageSlots;
      errors.push({
        code: PayloadValidationCode.CAPACITY_STORAGE_EXCEEDED,
        severity: PayloadValidationSeverity.ERROR,
        message: `Payload storage requirement (${manifest.totalStorageUsed} Slots) exceeds vehicle compartment volume (${capacity.maxStorageSlots} Slots) by ${excessSlots} Slots.`,
        remedyRecommendation: 'Reduce the quantity of assigned cargo containers or select a vehicle with a larger cargo bay.',
        metricValue: manifest.totalStorageUsed,
        limitValue: capacity.maxStorageSlots,
      });
    }

    // 2. Individual Payload Checks
    const assignedItems = Array.from(manifest.assignedPayloads.values());

    for (const item of assignedItems) {
      const payload = this.registry.getPayload(item.payloadId);

      if (!payload) {
        errors.push({
          code: PayloadValidationCode.PAYLOAD_NOT_FOUND,
          severity: PayloadValidationSeverity.ERROR,
          payloadId: item.payloadId,
          message: `Payload ID "${item.payloadId}" is not registered in the Agency Payload Registry.`,
          remedyRecommendation: 'Unassign the unknown payload module from this spacecraft.',
        });
        continue;
      }

      if (item.quantity <= 0) {
        errors.push({
          code: PayloadValidationCode.ZERO_QUANTITY_ASSIGNED,
          severity: PayloadValidationSeverity.ERROR,
          payloadId: payload.id,
          payloadName: payload.name,
          message: `Payload "${payload.name}" has an invalid assigned quantity of ${item.quantity}.`,
          remedyRecommendation: 'Remove the payload or assign a quantity of 1 or greater.',
        });
        continue;
      }

      // 2a. Vehicle Compatibility Tag Check
      const compatibilityFeedback = this.evaluateItemCompatibility(payload, vehicle);
      if (!compatibilityFeedback.isCompatible) {
        errors.push({
          code: PayloadValidationCode.INCOMPATIBLE_VEHICLE_TAG,
          severity: PayloadValidationSeverity.ERROR,
          payloadId: payload.id,
          payloadName: payload.name,
          message: `Payload "${payload.name}" is incompatible with vehicle "${vehicle.name}": missing tag ${compatibilityFeedback.missingTags.join(', ')}.`,
          remedyRecommendation: `Mount this payload on a platform with ${compatibilityFeedback.missingTags.join(', ')} certification.`,
        });
      }

      // 2b. Fairing Clearance Check
      const fairingIssue = this.checkFairingClearance(payload, vehicle);
      if (fairingIssue) {
        errors.push(fairingIssue);
      }

      // 2c. Technology Unlock Check
      if (context.playerProgression) {
        const isUnlocked = this.registry.isPayloadUnlocked(
          payload.id,
          context.playerProgression
        );
        if (!isUnlocked) {
          errors.push({
            code: PayloadValidationCode.TECHNOLOGY_LOCKED,
            severity: PayloadValidationSeverity.ERROR,
            payloadId: payload.id,
            payloadName: payload.name,
            message: `Required technology for payload "${payload.name}" is locked in the R&D Tech Tree.`,
            remedyRecommendation: `Unlock tech node "${payload.unlockRequirements.techNodeId || `Tier ${payload.unlockRequirements.techTier}`}" in the Research Facility.`,
          });
        }
      }

      // 2d. Destination Restrictions Check
      if (context.destinationId && payload.destinationRestrictions) {
        if (
          payload.destinationRestrictions.length > 0 &&
          !payload.destinationRestrictions.includes(context.destinationId)
        ) {
          errors.push({
            code: PayloadValidationCode.DESTINATION_RESTRICTION_UNMET,
            severity: PayloadValidationSeverity.ERROR,
            payloadId: payload.id,
            payloadName: payload.name,
            message: `Payload "${payload.name}" cannot be delivered to destination "${context.destinationId}". Restricted to: ${payload.destinationRestrictions.join(', ')}.`,
            remedyRecommendation: 'Select an alternate payload certified for this destination.',
          });
        }
      }

      // 2e. Inventory Check
      const invRecord = this.inventoryManager.getInventoryRecord(payload.id);
      if (invRecord) {
        // Total owned must cover assigned quantity
        if (invRecord.assigned > invRecord.totalOwned) {
          errors.push({
            code: PayloadValidationCode.INSUFFICIENT_INVENTORY,
            severity: PayloadValidationSeverity.ERROR,
            payloadId: payload.id,
            payloadName: payload.name,
            message: `Insufficient warehouse inventory for "${payload.name}". Assigned: ${item.quantity}, Owned: ${invRecord.totalOwned}.`,
            remedyRecommendation: 'Fabricate or acquire additional units in the Manufacturing Centre.',
          });
        }
      }
    }

    // 3. Mission Payload Completeness Check
    if (context.requiredMissionPayloads && context.requiredMissionPayloads.length > 0) {
      for (const req of context.requiredMissionPayloads) {
        const assignedItem = manifest.assignedPayloads.get(req.payloadId);
        const assignedQty = assignedItem ? assignedItem.quantity : 0;
        const requiredQty = req.requiredQuantity;

        if (assignedQty < requiredQty) {
          const reqPayload = this.registry.getPayload(req.payloadId);
          const reqName = reqPayload ? reqPayload.name : req.payloadId;
          const deficit = requiredQty - assignedQty;

          errors.push({
            code: PayloadValidationCode.MISSING_REQUIRED_PAYLOAD,
            severity: PayloadValidationSeverity.ERROR,
            payloadId: req.payloadId,
            payloadName: reqName,
            message: `Mission requires ${requiredQty}x "${reqName}", but only ${assignedQty}x is assigned (Missing ${deficit}).`,
            remedyRecommendation: `Assign ${deficit} more unit(s) of "${reqName}" to meet mission contract specifications.`,
            metricValue: assignedQty,
            limitValue: requiredQty,
          });
        }
      }
    }

    // 4. Warnings (e.g. Near-capacity threshold > 90%)
    if (metrics.isWithinMassLimit && metrics.massCapacityRatio >= 0.9) {
      warnings.push({
        code: PayloadValidationCode.CAPACITY_MASS_EXCEEDED,
        severity: PayloadValidationSeverity.WARNING,
        message: `Payload mass is at ${Math.round(metrics.massCapacityRatio * 100)}% of maximum capacity. Vehicle delta-V margins will be compressed.`,
        remedyRecommendation: 'Monitor propellant reserves carefully during orbital insertion.',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metrics,
      evaluatedAt: Date.now(),
    };
  }

  /**
   * Evaluates compatibility tags of a payload against a vehicle's supported tags.
   */
  public evaluateItemCompatibility(
    payload: PayloadDefinition,
    vehicle: IVehiclePayloadTarget
  ): { isCompatible: boolean; missingTags: string[]; matchedTags: string[] } {
    const supported = new Set(vehicle.capacity.supportedTags);
    const missing: string[] = [];
    const matched: string[] = [];

    // Filter tags to check (vehicle class and platform mounting tags)
    const tagsToCheck = payload.compatibilityTags.filter((t) =>
      t.endsWith('_VEHICLE') ||
      t.endsWith('_BUS') ||
      t.endsWith('_SURVEYOR') ||
      t.endsWith('_LANDER') ||
      t.endsWith('_ROVER') ||
      t.endsWith('_HABITAT') ||
      t.endsWith('_BAY')
    );

    if (tagsToCheck.length === 0) {
      return { isCompatible: true, missingTags: [], matchedTags: [] };
    }

    for (const tag of tagsToCheck) {
      if (supported.has(tag)) {
        matched.push(tag);
      } else {
        missing.push(tag);
      }
    }

    // Compatible if at least one matching platform/vehicle tag is supported
    const isCompatible = matched.length > 0;
    return { isCompatible, missingTags: isCompatible ? [] : missing, matchedTags: matched };
  }

  /**
   * Checks fairing diameter envelope between payload requirements and vehicle fairing.
   */
  private checkFairingClearance(
    payload: PayloadDefinition,
    vehicle: IVehiclePayloadTarget
  ): PayloadValidationIssue | null {
    const fairingTags = payload.compatibilityTags.filter((t) => t.startsWith('FAIRING_'));
    if (fairingTags.length === 0) return null;

    let requiredDiameter = 1.8;
    if (fairingTags.includes('FAIRING_5_0M')) requiredDiameter = 5.0;
    else if (fairingTags.includes('FAIRING_3_8M')) requiredDiameter = 3.8;
    else if (fairingTags.includes('FAIRING_2_5M')) requiredDiameter = 2.5;

    const vehicleFairing = vehicle.capacity.fairingDiameterM;
    if (vehicleFairing < requiredDiameter) {
      return {
        code: PayloadValidationCode.INSUFFICIENT_FAIRING_CLEARANCE,
        severity: PayloadValidationSeverity.ERROR,
        payloadId: payload.id,
        payloadName: payload.name,
        message: `Payload "${payload.name}" requires minimum ${requiredDiameter}m fairing envelope, but vehicle "${vehicle.name}" has only ${vehicleFairing}m fairing.`,
        remedyRecommendation: `Upgrade fairing adapter to ${requiredDiameter}m or larger in the Rocket Engineering Facility.`,
        metricValue: vehicleFairing,
        limitValue: requiredDiameter,
      };
    }

    return null;
  }
}
