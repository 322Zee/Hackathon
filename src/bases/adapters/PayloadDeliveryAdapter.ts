/**
 * INTERSTELLAR CONTINUUM - Payload Delivery Adapter
 * Interacts with PayloadInventoryManager and PayloadRegistry to verify
 * module delivery readiness, assign required payloads, and confirm deployment kits.
 */

import { PayloadInventoryManager } from '../../payload/PayloadInventoryManager';
import { PayloadRegistry } from '../../payload/PayloadRegistry';
import { PayloadDeliveryState } from '../../payload/PayloadTypes';

export interface PayloadCheckResult {
  isAvailable: boolean;
  payloadId: string;
  requiredQuantity: number;
  availableQuantity: number;
}

export class PayloadDeliveryAdapter {
  private inventoryManager?: PayloadInventoryManager;
  private payloadRegistry?: PayloadRegistry;

  constructor(inventoryManager?: PayloadInventoryManager, payloadRegistry?: PayloadRegistry) {
    this.inventoryManager = inventoryManager;
    this.payloadRegistry = payloadRegistry;
  }

  public setInventoryManager(manager?: PayloadInventoryManager): void {
    this.inventoryManager = manager;
  }

  public setPayloadRegistry(registry?: PayloadRegistry): void {
    this.payloadRegistry = registry;
  }

  /**
   * Checks whether the specified payload is in stock in warehouse or delivered.
   */
  public checkPayloadAvailability(payloadId: string, quantity: number = 1): PayloadCheckResult {
    if (!this.inventoryManager) {
      // In standalone / test environments without initialized payload system, return true
      return {
        isAvailable: true,
        payloadId,
        requiredQuantity: quantity,
        availableQuantity: quantity,
      };
    }

    const record = this.inventoryManager.getInventoryRecord(payloadId);
    if (!record) {
      return {
        isAvailable: false,
        payloadId,
        requiredQuantity: quantity,
        availableQuantity: 0,
      };
    }

    // A payload is considered deployable if it is in AVAILABLE or DELIVERED status
    const usableQuantity = record.available + record.delivered;
    return {
      isAvailable: usableQuantity >= quantity,
      payloadId,
      requiredQuantity: quantity,
      availableQuantity: usableQuantity,
    };
  }

  /**
   * Consumes/deducts payload from inventory when module construction starts.
   */
  public consumePayload(payloadId: string, quantity: number = 1): boolean {
    if (!this.inventoryManager) {
      return true;
    }

    const record = this.inventoryManager.getInventoryRecord(payloadId);
    if (!record) return false;

    if (record.delivered >= quantity) {
      // Consume from delivered
      return this.inventoryManager.adjustCount(
        payloadId,
        PayloadDeliveryState.DELIVERED,
        -quantity
      );
    } else if (record.available >= quantity) {
      // Consume from available
      return this.inventoryManager.adjustCount(
        payloadId,
        PayloadDeliveryState.AVAILABLE,
        -quantity
      );
    }

    return false;
  }

  /**
   * Validates a list of required payloads for a base deployment plan.
   */
  public validatePayloadList(payloadIds: string[]): {
    allSatisfied: boolean;
    results: PayloadCheckResult[];
    missingPayloads: string[];
  } {
    const results: PayloadCheckResult[] = [];
    const missingPayloads: string[] = [];

    // Count occurrences
    const counts = new Map<string, number>();
    for (const id of payloadIds) {
      counts.set(id, (counts.get(id) || 0) + 1);
    }

    for (const [id, qty] of counts.entries()) {
      const res = this.checkPayloadAvailability(id, qty);
      results.push(res);
      if (!res.isAvailable) {
        missingPayloads.push(`${id} (Need ${qty}, Have ${res.availableQuantity})`);
      }
    }

    return {
      allSatisfied: missingPayloads.length === 0,
      results,
      missingPayloads,
    };
  }
}
