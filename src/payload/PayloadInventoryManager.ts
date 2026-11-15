/**
 * INTERSTELLAR CONTINUUM - Authoritative Payload Inventory & Delivery State Manager
 * Strictly manages inventory quantities across the 7 canonical delivery states:
 * AVAILABLE, RESERVED, ASSIGNED, IN_TRANSIT, DELIVERED, RETURNED, and LOST.
 * 
 * Enforces transaction-like operations with mathematical invariant integrity:
 * totalOwned = available + reserved + assigned + inTransit + delivered + returned + lost.
 * Prevents inventory duplication during mission restarts, crashes, or save restoration.
 */

import { PayloadDeliveryState, PayloadInventoryRecord } from './PayloadTypes';
import { PayloadRegistry } from './PayloadRegistry';

export interface InventoryTransactionResult {
  success: boolean;
  payloadId: string;
  fromState: PayloadDeliveryState;
  toState: PayloadDeliveryState;
  quantity: number;
  newRecord: PayloadInventoryRecord;
  errorMessage?: string;
}

export interface MissionInventoryBinding {
  missionId: string;
  reserved: Map<string, number>; // payloadId -> quantity
  assigned: Map<string, number>; // payloadId -> quantity
  inTransit: Map<string, number>; // payloadId -> quantity
  delivered: Map<string, number>; // payloadId -> quantity
}

export interface InventorySaveData {
  version: string;
  records: Record<string, PayloadInventoryRecord>;
  missionBindings: Record<
    string,
    {
      missionId: string;
      reserved: Record<string, number>;
      assigned: Record<string, number>;
      inTransit: Record<string, number>;
      delivered: Record<string, number>;
    }
  >;
  timestamp: number;
}

export class PayloadInventoryManager {
  private static instance?: PayloadInventoryManager;
  private inventory: Map<string, PayloadInventoryRecord> = new Map();
  private missionBindings: Map<string, MissionInventoryBinding> = new Map();
  private registry: PayloadRegistry;

  private constructor(registry?: PayloadRegistry) {
    this.registry = registry ?? PayloadRegistry.getInstance();
    this.initializeFromRegistry();
  }

  public static getInstance(registry?: PayloadRegistry): PayloadInventoryManager {
    if (!PayloadInventoryManager.instance) {
      PayloadInventoryManager.instance = new PayloadInventoryManager(registry);
    }
    return PayloadInventoryManager.instance;
  }

  public static resetInstance(): void {
    PayloadInventoryManager.instance = undefined;
  }

  /**
   * Initializes inventory records from the registered payloads.
   */
  public initializeFromRegistry(): void {
    const allPayloads = this.registry.listPayloads();
    for (const p of allPayloads) {
      if (!this.inventory.has(p.id)) {
        this.inventory.set(p.id, {
          payloadId: p.id,
          totalOwned: p.quantity,
          available: p.quantity,
          reserved: 0,
          assigned: 0,
          inTransit: 0,
          delivered: 0,
          returned: 0,
          lost: 0,
        });
      }
    }
  }

  /**
   * Verifies mathematical invariant: totalOwned === sum of all state buckets.
   */
  private verifyInvariant(record: PayloadInventoryRecord): boolean {
    const sum =
      record.available +
      record.reserved +
      record.assigned +
      record.inTransit +
      record.delivered +
      record.returned +
      record.lost;
    return record.totalOwned === sum;
  }

  /**
   * Retrieves an inventory record for a payload.
   */
  public getInventoryRecord(payloadId: string): PayloadInventoryRecord | undefined {
    const r = this.inventory.get(payloadId);
    return r ? { ...r } : undefined;
  }

  /**
   * Gets available quantity ready for assignment or reservation.
   */
  public getAvailableQuantity(payloadId: string): number {
    return this.inventory.get(payloadId)?.available ?? 0;
  }

  /**
   * Gets total quantity currently owned across all states.
   */
  public getTotalOwnedQuantity(payloadId: string): number {
    return this.inventory.get(payloadId)?.totalOwned ?? 0;
  }

  /**
   * Procures additional units into the warehouse inventory.
   */
  public procurePayload(payloadId: string, quantity: number): boolean {
    if (quantity <= 0) return false;
    let rec = this.inventory.get(payloadId);
    if (!rec) {
      rec = {
        payloadId,
        totalOwned: 0,
        available: 0,
        reserved: 0,
        assigned: 0,
        inTransit: 0,
        delivered: 0,
        returned: 0,
        lost: 0,
      };
      this.inventory.set(payloadId, rec);
    }

    rec.totalOwned += quantity;
    rec.available += quantity;
    return this.verifyInvariant(rec);
  }

  /**
   * 1. Transaction: Reserve payload for a planned mission.
   * Moves quantity from AVAILABLE -> RESERVED.
   */
  public reservePayload(
    payloadId: string,
    quantity: number,
    missionId: string
  ): InventoryTransactionResult {
    const rec = this.inventory.get(payloadId);
    if (!rec) {
      return this.failResult(payloadId, PayloadDeliveryState.AVAILABLE, PayloadDeliveryState.RESERVED, quantity, 'Payload not in inventory.');
    }
    if (quantity <= 0) {
      return this.failResult(payloadId, PayloadDeliveryState.AVAILABLE, PayloadDeliveryState.RESERVED, quantity, 'Quantity must be positive.');
    }
    if (rec.available < quantity) {
      return this.failResult(
        payloadId,
        PayloadDeliveryState.AVAILABLE,
        PayloadDeliveryState.RESERVED,
        quantity,
        `Insufficient available quantity (Requested: ${quantity}, Available: ${rec.available}).`
      );
    }

    rec.available -= quantity;
    rec.reserved += quantity;

    // Track mission binding
    const binding = this.getOrCreateBinding(missionId);
    binding.reserved.set(payloadId, (binding.reserved.get(payloadId) ?? 0) + quantity);

    return {
      success: true,
      payloadId,
      fromState: PayloadDeliveryState.AVAILABLE,
      toState: PayloadDeliveryState.RESERVED,
      quantity,
      newRecord: { ...rec },
    };
  }

  /**
   * 2. Transaction: Release reservation back to available storage.
   * Moves quantity from RESERVED -> AVAILABLE.
   */
  public releaseReservation(
    payloadId: string,
    quantity: number,
    missionId: string
  ): InventoryTransactionResult {
    const rec = this.inventory.get(payloadId);
    if (!rec) {
      return this.failResult(payloadId, PayloadDeliveryState.RESERVED, PayloadDeliveryState.AVAILABLE, quantity, 'Payload not in inventory.');
    }
    if (quantity <= 0) {
      return this.failResult(payloadId, PayloadDeliveryState.RESERVED, PayloadDeliveryState.AVAILABLE, quantity, 'Quantity must be positive.');
    }

    const binding = this.missionBindings.get(missionId);
    const missionReserved = binding?.reserved.get(payloadId) ?? 0;
    const actualQtyToRelease = Math.min(quantity, rec.reserved, missionReserved);

    if (actualQtyToRelease <= 0) {
      return this.failResult(payloadId, PayloadDeliveryState.RESERVED, PayloadDeliveryState.AVAILABLE, quantity, 'No active reservation found for this mission.');
    }

    rec.reserved -= actualQtyToRelease;
    rec.available += actualQtyToRelease;

    if (binding) {
      const remaining = missionReserved - actualQtyToRelease;
      if (remaining <= 0) {
        binding.reserved.delete(payloadId);
      } else {
        binding.reserved.set(payloadId, remaining);
      }
    }

    return {
      success: true,
      payloadId,
      fromState: PayloadDeliveryState.RESERVED,
      toState: PayloadDeliveryState.AVAILABLE,
      quantity: actualQtyToRelease,
      newRecord: { ...rec },
    };
  }

  /**
   * 3. Transaction: Assign payload to vehicle/spacecraft.
   * Moves quantity from AVAILABLE (or RESERVED if earmarked) -> ASSIGNED.
   */
  public assignPayload(
    payloadId: string,
    quantity: number,
    vehicleId: string,
    missionId?: string
  ): InventoryTransactionResult {
    const rec = this.inventory.get(payloadId);
    if (!rec) {
      return this.failResult(payloadId, PayloadDeliveryState.AVAILABLE, PayloadDeliveryState.ASSIGNED, quantity, 'Payload not found in inventory.');
    }
    if (quantity <= 0) {
      return this.failResult(payloadId, PayloadDeliveryState.AVAILABLE, PayloadDeliveryState.ASSIGNED, quantity, 'Quantity must be positive.');
    }

    // Check if reserved for this mission
    let fromState = PayloadDeliveryState.AVAILABLE;
    if (missionId) {
      const binding = this.missionBindings.get(missionId);
      const reservedCount = binding?.reserved.get(payloadId) ?? 0;
      if (reservedCount >= quantity && rec.reserved >= quantity) {
        // Consume from reservation
        rec.reserved -= quantity;
        fromState = PayloadDeliveryState.RESERVED;
        const remaining = reservedCount - quantity;
        if (remaining <= 0) {
          binding!.reserved.delete(payloadId);
        } else {
          binding!.reserved.set(payloadId, remaining);
        }
      } else if (rec.available >= quantity) {
        // Consume directly from available stock
        rec.available -= quantity;
      } else {
        return this.failResult(
          payloadId,
          PayloadDeliveryState.AVAILABLE,
          PayloadDeliveryState.ASSIGNED,
          quantity,
          `Insufficient stock to assign (Requested: ${quantity}, Available: ${rec.available}, Reserved: ${rec.reserved}).`
        );
      }
    } else {
      if (rec.available < quantity) {
        return this.failResult(
          payloadId,
          PayloadDeliveryState.AVAILABLE,
          PayloadDeliveryState.ASSIGNED,
          quantity,
          `Insufficient available stock (Requested: ${quantity}, Available: ${rec.available}).`
        );
      }
      rec.available -= quantity;
    }

    rec.assigned += quantity;

    if (missionId) {
      const binding = this.getOrCreateBinding(missionId);
      binding.assigned.set(payloadId, (binding.assigned.get(payloadId) ?? 0) + quantity);
    }

    return {
      success: true,
      payloadId,
      fromState,
      toState: PayloadDeliveryState.ASSIGNED,
      quantity,
      newRecord: { ...rec },
    };
  }

  /**
   * 4. Transaction: Unassign payload from vehicle.
   * Moves quantity from ASSIGNED -> AVAILABLE.
   */
  public unassignPayload(
    payloadId: string,
    quantity: number,
    vehicleId: string,
    missionId?: string
  ): InventoryTransactionResult {
    const rec = this.inventory.get(payloadId);
    if (!rec) {
      return this.failResult(payloadId, PayloadDeliveryState.ASSIGNED, PayloadDeliveryState.AVAILABLE, quantity, 'Payload not in inventory.');
    }
    if (quantity <= 0) {
      return this.failResult(payloadId, PayloadDeliveryState.ASSIGNED, PayloadDeliveryState.AVAILABLE, quantity, 'Quantity must be positive.');
    }
    if (rec.assigned < quantity) {
      return this.failResult(
        payloadId,
        PayloadDeliveryState.ASSIGNED,
        PayloadDeliveryState.AVAILABLE,
        quantity,
        `Cannot unassign ${quantity} units; only ${rec.assigned} currently assigned.`
      );
    }

    rec.assigned -= quantity;
    rec.available += quantity;

    if (missionId) {
      const binding = this.missionBindings.get(missionId);
      if (binding) {
        const assignedCount = binding.assigned.get(payloadId) ?? 0;
        const remaining = assignedCount - quantity;
        if (remaining <= 0) {
          binding.assigned.delete(payloadId);
        } else {
          binding.assigned.set(payloadId, remaining);
        }
      }
    }

    return {
      success: true,
      payloadId,
      fromState: PayloadDeliveryState.ASSIGNED,
      toState: PayloadDeliveryState.AVAILABLE,
      quantity,
      newRecord: { ...rec },
    };
  }

  /**
   * 5. Transaction: Mark assigned payload as IN_TRANSIT upon flight launch.
   * Moves quantity from ASSIGNED -> IN_TRANSIT.
   */
  public markInTransit(
    payloadId: string,
    quantity: number,
    missionId: string
  ): InventoryTransactionResult {
    const rec = this.inventory.get(payloadId);
    if (!rec) {
      return this.failResult(payloadId, PayloadDeliveryState.ASSIGNED, PayloadDeliveryState.IN_TRANSIT, quantity, 'Payload not in inventory.');
    }
    if (quantity <= 0) {
      return this.failResult(payloadId, PayloadDeliveryState.ASSIGNED, PayloadDeliveryState.IN_TRANSIT, quantity, 'Quantity must be positive.');
    }
    if (rec.assigned < quantity) {
      return this.failResult(
        payloadId,
        PayloadDeliveryState.ASSIGNED,
        PayloadDeliveryState.IN_TRANSIT,
        quantity,
        `Cannot dispatch ${quantity} units; only ${rec.assigned} assigned.`
      );
    }

    rec.assigned -= quantity;
    rec.inTransit += quantity;

    const binding = this.getOrCreateBinding(missionId);
    const assignedCount = binding.assigned.get(payloadId) ?? 0;
    const remainingAssigned = assignedCount - quantity;
    if (remainingAssigned <= 0) {
      binding.assigned.delete(payloadId);
    } else {
      binding.assigned.set(payloadId, remainingAssigned);
    }
    binding.inTransit.set(payloadId, (binding.inTransit.get(payloadId) ?? 0) + quantity);

    return {
      success: true,
      payloadId,
      fromState: PayloadDeliveryState.ASSIGNED,
      toState: PayloadDeliveryState.IN_TRANSIT,
      quantity,
      newRecord: { ...rec },
    };
  }

  /**
   * 6. Transaction: Confirm successful payload delivery at target destination.
   * Moves quantity from IN_TRANSIT -> DELIVERED.
   */
  public confirmDelivery(
    payloadId: string,
    quantity: number,
    missionId: string
  ): InventoryTransactionResult {
    const rec = this.inventory.get(payloadId);
    if (!rec) {
      return this.failResult(payloadId, PayloadDeliveryState.IN_TRANSIT, PayloadDeliveryState.DELIVERED, quantity, 'Payload not in inventory.');
    }
    if (quantity <= 0) {
      return this.failResult(payloadId, PayloadDeliveryState.IN_TRANSIT, PayloadDeliveryState.DELIVERED, quantity, 'Quantity must be positive.');
    }
    if (rec.inTransit < quantity) {
      return this.failResult(
        payloadId,
        PayloadDeliveryState.IN_TRANSIT,
        PayloadDeliveryState.DELIVERED,
        quantity,
        `Cannot deliver ${quantity} units; only ${rec.inTransit} currently in transit.`
      );
    }

    rec.inTransit -= quantity;
    rec.delivered += quantity;

    const binding = this.getOrCreateBinding(missionId);
    const transitCount = binding.inTransit.get(payloadId) ?? 0;
    const remainingTransit = transitCount - quantity;
    if (remainingTransit <= 0) {
      binding.inTransit.delete(payloadId);
    } else {
      binding.inTransit.set(payloadId, remainingTransit);
    }
    binding.delivered.set(payloadId, (binding.delivered.get(payloadId) ?? 0) + quantity);

    return {
      success: true,
      payloadId,
      fromState: PayloadDeliveryState.IN_TRANSIT,
      toState: PayloadDeliveryState.DELIVERED,
      quantity,
      newRecord: { ...rec },
    };
  }

  /**
   * 7. Transaction: Record payload loss due to launch anomaly or mission failure.
   * Moves quantity from (ASSIGNED or IN_TRANSIT) -> LOST.
   */
  public recordLoss(
    payloadId: string,
    quantity: number,
    fromState: PayloadDeliveryState.ASSIGNED | PayloadDeliveryState.IN_TRANSIT,
    missionId?: string
  ): InventoryTransactionResult {
    const rec = this.inventory.get(payloadId);
    if (!rec) {
      return this.failResult(payloadId, fromState, PayloadDeliveryState.LOST, quantity, 'Payload not in inventory.');
    }

    const availableInBucket = fromState === PayloadDeliveryState.ASSIGNED ? rec.assigned : rec.inTransit;
    const actualLoss = Math.min(quantity, availableInBucket);

    if (actualLoss <= 0) {
      return this.failResult(payloadId, fromState, PayloadDeliveryState.LOST, quantity, `No units in ${fromState} to mark lost.`);
    }

    if (fromState === PayloadDeliveryState.ASSIGNED) {
      rec.assigned -= actualLoss;
    } else {
      rec.inTransit -= actualLoss;
    }
    rec.lost += actualLoss;

    if (missionId) {
      const binding = this.missionBindings.get(missionId);
      if (binding) {
        if (fromState === PayloadDeliveryState.ASSIGNED) {
          binding.assigned.delete(payloadId);
        } else {
          binding.inTransit.delete(payloadId);
        }
      }
    }

    return {
      success: true,
      payloadId,
      fromState,
      toState: PayloadDeliveryState.LOST,
      quantity: actualLoss,
      newRecord: { ...rec },
    };
  }

  /**
   * 8. Transaction: Return payload back to warehouse.
   * Moves quantity from (ASSIGNED, IN_TRANSIT, or DELIVERED) -> RETURNED -> AVAILABLE.
   */
  public returnPayload(
    payloadId: string,
    quantity: number,
    fromState:
      | PayloadDeliveryState.ASSIGNED
      | PayloadDeliveryState.IN_TRANSIT
      | PayloadDeliveryState.DELIVERED,
    missionId?: string
  ): InventoryTransactionResult {
    const rec = this.inventory.get(payloadId);
    if (!rec) {
      return this.failResult(payloadId, fromState, PayloadDeliveryState.RETURNED, quantity, 'Payload not in inventory.');
    }

    let inSource = 0;
    if (fromState === PayloadDeliveryState.ASSIGNED) inSource = rec.assigned;
    else if (fromState === PayloadDeliveryState.IN_TRANSIT) inSource = rec.inTransit;
    else if (fromState === PayloadDeliveryState.DELIVERED) inSource = rec.delivered;

    const returnQty = Math.min(quantity, inSource);
    if (returnQty <= 0) {
      return this.failResult(payloadId, fromState, PayloadDeliveryState.RETURNED, quantity, `No units in ${fromState} to return.`);
    }

    if (fromState === PayloadDeliveryState.ASSIGNED) rec.assigned -= returnQty;
    else if (fromState === PayloadDeliveryState.IN_TRANSIT) rec.inTransit -= returnQty;
    else if (fromState === PayloadDeliveryState.DELIVERED) rec.delivered -= returnQty;

    // Returned items go back to available stock
    rec.returned += returnQty;
    rec.available += returnQty;
    rec.returned -= returnQty; // Balance back to available inventory

    if (missionId) {
      const binding = this.missionBindings.get(missionId);
      if (binding) {
        if (fromState === PayloadDeliveryState.ASSIGNED) binding.assigned.delete(payloadId);
        else if (fromState === PayloadDeliveryState.IN_TRANSIT) binding.inTransit.delete(payloadId);
        else if (fromState === PayloadDeliveryState.DELIVERED) binding.delivered.delete(payloadId);
      }
    }

    return {
      success: true,
      payloadId,
      fromState,
      toState: PayloadDeliveryState.AVAILABLE,
      quantity: returnQty,
      newRecord: { ...rec },
    };
  }

  /**
   * Resets and cleans up any inventory bindings for a cancelled or failed mission,
   * returning reserved and assigned units safely back to available stock.
   */
  public rollbackMissionAllocations(missionId: string): void {
    const binding = this.missionBindings.get(missionId);
    if (!binding) return;

    // Release reservations
    for (const [pId, qty] of binding.reserved.entries()) {
      const rec = this.inventory.get(pId);
      if (rec) {
        rec.reserved = Math.max(0, rec.reserved - qty);
        rec.available += qty;
      }
    }

    // Release assignments
    for (const [pId, qty] of binding.assigned.entries()) {
      const rec = this.inventory.get(pId);
      if (rec) {
        rec.assigned = Math.max(0, rec.assigned - qty);
        rec.available += qty;
      }
    }

    // Transit or delivered items are not auto-rolled back without explicit return/loss
    this.missionBindings.delete(missionId);
  }

  private getOrCreateBinding(missionId: string): MissionInventoryBinding {
    let binding = this.missionBindings.get(missionId);
    if (!binding) {
      binding = {
        missionId,
        reserved: new Map(),
        assigned: new Map(),
        inTransit: new Map(),
        delivered: new Map(),
      };
      this.missionBindings.set(missionId, binding);
    }
    return binding;
  }

  private failResult(
    payloadId: string,
    fromState: PayloadDeliveryState,
    toState: PayloadDeliveryState,
    quantity: number,
    errorMessage: string
  ): InventoryTransactionResult {
    const rec = this.inventory.get(payloadId) ?? {
      payloadId,
      totalOwned: 0,
      available: 0,
      reserved: 0,
      assigned: 0,
      inTransit: 0,
      delivered: 0,
      returned: 0,
      lost: 0,
    };
    return {
      success: false,
      payloadId,
      fromState,
      toState,
      quantity,
      newRecord: { ...rec },
      errorMessage,
    };
  }

  /**
   * Serializes inventory state for save game persistence.
   */
  public serialize(): InventorySaveData {
    const records: Record<string, PayloadInventoryRecord> = {};
    for (const [id, rec] of this.inventory.entries()) {
      records[id] = { ...rec };
    }

    const missionBindings: InventorySaveData['missionBindings'] = {};
    for (const [mId, b] of this.missionBindings.entries()) {
      const reserved: Record<string, number> = {};
      b.reserved.forEach((v, k) => (reserved[k] = v));

      const assigned: Record<string, number> = {};
      b.assigned.forEach((v, k) => (assigned[k] = v));

      const inTransit: Record<string, number> = {};
      b.inTransit.forEach((v, k) => (inTransit[k] = v));

      const delivered: Record<string, number> = {};
      b.delivered.forEach((v, k) => (delivered[k] = v));

      missionBindings[mId] = {
        missionId: mId,
        reserved,
        assigned,
        inTransit,
        delivered,
      };
    }

    return {
      version: '1.0.0',
      records,
      missionBindings,
      timestamp: Date.now(),
    };
  }

  /**
   * Deserializes inventory state from save game data.
   */
  public deserialize(data?: Partial<InventorySaveData>): boolean {
    if (!data || !data.records) {
      this.initializeFromRegistry();
      return false;
    }

    this.inventory.clear();
    this.missionBindings.clear();

    for (const [id, rec] of Object.entries(data.records)) {
      if (this.verifyInvariant(rec)) {
        this.inventory.set(id, { ...rec });
      } else {
        // Correct invariant if corrupted
        const sum =
          rec.reserved +
          rec.assigned +
          rec.inTransit +
          rec.delivered +
          rec.returned +
          rec.lost;
        rec.available = Math.max(0, rec.totalOwned - sum);
        this.inventory.set(id, { ...rec });
      }
    }

    if (data.missionBindings) {
      for (const [mId, b] of Object.entries(data.missionBindings)) {
        const binding: MissionInventoryBinding = {
          missionId: mId,
          reserved: new Map(Object.entries(b.reserved || {})),
          assigned: new Map(Object.entries(b.assigned || {})),
          inTransit: new Map(Object.entries(b.inTransit || {})),
          delivered: new Map(Object.entries(b.delivered || {})),
        };
        this.missionBindings.set(mId, binding);
      }
    }

    // Ensure any newly added catalog payloads exist in inventory
    this.initializeFromRegistry();
    return true;
  }
}
