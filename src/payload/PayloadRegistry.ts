/**
 * INTERSTELLAR CONTINUUM - Authoritative Payload Registry
 * Central repository of all payload definitions, category associations,
 * query filtering, unlock evaluation, and inventory default bindings.
 */

import { DestinationId } from '../destinations/DestinationTypes';
import {
  PayloadDefinition,
  PayloadCategory,
  PayloadFilter,
  PayloadAvailabilityStatus,
} from './PayloadTypes';
import { PayloadCategoryRegistry } from './PayloadCategoryRegistry';
import { INITIAL_PAYLOAD_DEFINITIONS } from './PayloadData';

export interface PlayerProgressionContext {
  directorRank?: number;
  unlockedTechNodeIds?: Set<string>;
  completedMissionIds?: Set<string>;
  unlockedDestinationIds?: Set<DestinationId>;
}

export class PayloadRegistry {
  private static instance?: PayloadRegistry;
  private payloads: Map<string, PayloadDefinition> = new Map();
  private categoryRegistry: PayloadCategoryRegistry;

  private constructor(categoryRegistry?: PayloadCategoryRegistry) {
    this.categoryRegistry = categoryRegistry ?? PayloadCategoryRegistry.getInstance();
    this.initializeDefaultPayloads();
  }

  public static getInstance(categoryRegistry?: PayloadCategoryRegistry): PayloadRegistry {
    if (!PayloadRegistry.instance) {
      PayloadRegistry.instance = new PayloadRegistry(categoryRegistry);
    }
    return PayloadRegistry.instance;
  }

  public static resetInstance(): void {
    PayloadRegistry.instance = undefined;
  }

  /**
   * Initializes registry with the authoritative default payload definitions.
   */
  private initializeDefaultPayloads(): void {
    for (const payload of INITIAL_PAYLOAD_DEFINITIONS) {
      this.registerPayload(payload);
    }
  }

  /**
   * Registers a payload in the registry.
   */
  public registerPayload(payload: PayloadDefinition): boolean {
    if (!payload.id || !payload.name) {
      return false;
    }

    // Ensure category is recognized or auto-registered
    if (!this.categoryRegistry.hasCategory(payload.category)) {
      this.categoryRegistry.registerCategory({
        id: payload.category,
        displayName: payload.category,
        description: `Custom category ${payload.category}`,
        iconKey: 'icon_custom_payload',
        defaultStorageType: 'INTERNAL_RACK',
        isCustom: true,
      });
    }

    // Store deep copy to prevent mutation leaks
    this.payloads.set(payload.id, JSON.parse(JSON.stringify(payload)));
    return true;
  }

  /**
   * Retrieves a payload definition by its unique identifier.
   */
  public getPayload(payloadId: string): PayloadDefinition | undefined {
    const p = this.payloads.get(payloadId);
    return p ? JSON.parse(JSON.stringify(p)) : undefined;
  }

  /**
   * Checks whether a payload exists in the registry.
   */
  public hasPayload(payloadId: string): boolean {
    return this.payloads.has(payloadId);
  }

  /**
   * Unregisters a payload.
   */
  public unregisterPayload(payloadId: string): boolean {
    return this.payloads.delete(payloadId);
  }

  /**
   * Lists all payloads, optionally filtered by criteria.
   */
  public listPayloads(filter?: PayloadFilter): PayloadDefinition[] {
    let result = Array.from(this.payloads.values()).map((p) =>
      JSON.parse(JSON.stringify(p))
    );

    if (!filter) {
      return result;
    }

    if (filter.category) {
      result = result.filter((p) => p.category === filter.category);
    }

    if (filter.searchQuery && filter.searchQuery.trim().length > 0) {
      const q = filter.searchQuery.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.purpose.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
      );
    }

    if (filter.maxMassRating !== undefined) {
      result = result.filter((p) => p.massRating <= filter.maxMassRating!);
    }

    if (filter.maxPowerRequirement !== undefined) {
      result = result.filter((p) => p.powerRequirementRating <= filter.maxPowerRequirement!);
    }

    if (filter.compatibilityTag) {
      result = result.filter((p) =>
        p.compatibilityTags.includes(filter.compatibilityTag!)
      );
    }

    if (filter.destination) {
      result = result.filter((p) => {
        if (!p.destinationRestrictions || p.destinationRestrictions.length === 0) {
          return true; // No restrictions = deliverable anywhere
        }
        return p.destinationRestrictions.includes(filter.destination!);
      });
    }

    if (filter.onlyAvailable) {
      result = result.filter(
        (p) => p.availabilityStatus === PayloadAvailabilityStatus.AVAILABLE && p.quantity > 0
      );
    }

    return result;
  }

  /**
   * Returns all payloads currently marked available with stock > 0.
   */
  public getAvailablePayloads(): PayloadDefinition[] {
    return this.listPayloads({ onlyAvailable: true });
  }

  /**
   * Returns all payloads belonging to a specific category.
   */
  public getPayloadsByCategory(category: PayloadCategory | string): PayloadDefinition[] {
    return this.listPayloads({ category });
  }

  /**
   * Evaluates unlock requirements of a payload against player progression.
   */
  public isPayloadUnlocked(
    payloadId: string,
    context: PlayerProgressionContext = {}
  ): boolean {
    const payload = this.payloads.get(payloadId);
    if (!payload) return false;

    const req = payload.unlockRequirements;
    if (req.isUnlockedByDefault) {
      return true;
    }

    if (req.directorRank !== undefined) {
      const currentRank = context.directorRank ?? 1;
      if (currentRank < req.directorRank) {
        return false;
      }
    }

    if (req.techNodeId) {
      if (!context.unlockedTechNodeIds || !context.unlockedTechNodeIds.has(req.techNodeId)) {
        return false;
      }
    }

    if (req.requiredMissionId) {
      if (!context.completedMissionIds || !context.completedMissionIds.has(req.requiredMissionId)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Updates the availability status and quantity for a payload in the catalog.
   */
  public updateCatalogStock(
    payloadId: string,
    quantity: number,
    status?: PayloadAvailabilityStatus
  ): boolean {
    const payload = this.payloads.get(payloadId);
    if (!payload) return false;

    payload.quantity = Math.max(0, quantity);
    if (status) {
      payload.availabilityStatus = status;
    } else if (payload.quantity === 0) {
      payload.availabilityStatus = PayloadAvailabilityStatus.OUT_OF_STOCK;
    } else {
      payload.availabilityStatus = PayloadAvailabilityStatus.AVAILABLE;
    }
    return true;
  }

  /**
   * Returns the count of registered payloads.
   */
  public getPayloadCount(): number {
    return this.payloads.size;
  }
}
