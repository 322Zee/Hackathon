import { describe, it, expect, beforeEach } from 'vitest';
import {
  PayloadInventoryManager,
  PayloadRegistry,
  PayloadDeliveryState,
} from '../../src/payload';

describe('PayloadInventoryManager', () => {
  let inventoryManager: PayloadInventoryManager;
  let registry: PayloadRegistry;

  beforeEach(() => {
    PayloadRegistry.resetInstance();
    PayloadInventoryManager.resetInstance();
    registry = PayloadRegistry.getInstance();
    inventoryManager = PayloadInventoryManager.getInstance(registry);
  });

  it('initializes inventory from registered payloads and verifies mathematical invariant', () => {
    const pioneerRec = inventoryManager.getInventoryRecord('payload_sat_pioneer_transponder');
    expect(pioneerRec).toBeDefined();
    expect(pioneerRec?.totalOwned).toBe(3);
    expect(pioneerRec?.available).toBe(3);
    expect(pioneerRec?.reserved).toBe(0);
    expect(pioneerRec?.assigned).toBe(0);
    expect(pioneerRec?.inTransit).toBe(0);
    expect(pioneerRec?.delivered).toBe(0);
    expect(pioneerRec?.returned).toBe(0);
    expect(pioneerRec?.lost).toBe(0);

    const sum =
      pioneerRec!.available +
      pioneerRec!.reserved +
      pioneerRec!.assigned +
      pioneerRec!.inTransit +
      pioneerRec!.delivered +
      pioneerRec!.returned +
      pioneerRec!.lost;
    expect(sum).toBe(pioneerRec!.totalOwned);
  });

  it('safely reserves and releases payload allocations', () => {
    const res = inventoryManager.reservePayload('payload_sat_pioneer_transponder', 2, 'm_test_01');
    expect(res.success).toBe(true);
    expect(res.newRecord.available).toBe(1);
    expect(res.newRecord.reserved).toBe(2);
    expect(res.newRecord.totalOwned).toBe(3);

    // Attempting to reserve more than available should fail cleanly
    const overRes = inventoryManager.reservePayload(
      'payload_sat_pioneer_transponder',
      2,
      'm_test_01'
    );
    expect(overRes.success).toBe(false);
    expect(overRes.errorMessage).toContain('Insufficient available quantity');

    // Release 1 unit
    const releaseRes = inventoryManager.releaseReservation(
      'payload_sat_pioneer_transponder',
      1,
      'm_test_01'
    );
    expect(releaseRes.success).toBe(true);
    expect(releaseRes.newRecord.available).toBe(2);
    expect(releaseRes.newRecord.reserved).toBe(1);
  });

  it('tracks full delivery lifecycle: ASSIGN -> IN_TRANSIT -> DELIVERED', () => {
    const pId = 'payload_sat_pioneer_transponder';

    // 1. Assign 2 units to vehicle
    const assignRes = inventoryManager.assignPayload(pId, 2, 'veh_01', 'm_test_02');
    expect(assignRes.success).toBe(true);
    expect(assignRes.newRecord.available).toBe(1);
    expect(assignRes.newRecord.assigned).toBe(2);

    // 2. Launch flight -> IN_TRANSIT
    const transitRes = inventoryManager.markInTransit(pId, 2, 'm_test_02');
    expect(transitRes.success).toBe(true);
    expect(transitRes.newRecord.assigned).toBe(0);
    expect(transitRes.newRecord.inTransit).toBe(2);

    // 3. Confirm delivery -> DELIVERED
    const delivRes = inventoryManager.confirmDelivery(pId, 2, 'm_test_02');
    expect(delivRes.success).toBe(true);
    expect(delivRes.newRecord.inTransit).toBe(0);
    expect(delivRes.newRecord.delivered).toBe(2);
    expect(delivRes.newRecord.totalOwned).toBe(3);
  });

  it('handles loss recording and return to warehouse', () => {
    const pId = 'payload_sat_pioneer_transponder';

    inventoryManager.assignPayload(pId, 2, 'veh_01', 'm_test_03');
    inventoryManager.markInTransit(pId, 2, 'm_test_03');

    // 1 unit lost
    const lossRes = inventoryManager.recordLoss(
      pId,
      1,
      PayloadDeliveryState.IN_TRANSIT,
      'm_test_03'
    );
    expect(lossRes.success).toBe(true);
    expect(lossRes.newRecord.inTransit).toBe(1);
    expect(lossRes.newRecord.lost).toBe(1);

    // 1 unit returned safely
    const returnRes = inventoryManager.returnPayload(
      pId,
      1,
      PayloadDeliveryState.IN_TRANSIT,
      'm_test_03'
    );
    expect(returnRes.success).toBe(true);
    expect(returnRes.newRecord.inTransit).toBe(0);
    expect(returnRes.newRecord.available).toBe(2); // Initial 1 available + 1 returned
    expect(returnRes.newRecord.totalOwned).toBe(3);
  });

  it('prevents inventory duplication during mission cancellation and rollback', () => {
    const pId = 'payload_sat_pioneer_transponder';
    const missionId = 'm_rollback_test';

    // Reserve 2 units for this mission, then assign 1 unit (consuming 1 from reservation)
    inventoryManager.reservePayload(pId, 2, missionId);
    inventoryManager.assignPayload(pId, 1, 'veh_01', missionId);

    const midRec = inventoryManager.getInventoryRecord(pId)!;
    expect(midRec.available).toBe(1);
    expect(midRec.reserved).toBe(1);
    expect(midRec.assigned).toBe(1);
    expect(midRec.totalOwned).toBe(3);

    // Rollback mission
    inventoryManager.rollbackMissionAllocations(missionId);

    const rolledBackRec = inventoryManager.getInventoryRecord(pId)!;
    expect(rolledBackRec.available).toBe(3); // All returned to available
    expect(rolledBackRec.reserved).toBe(0);
    expect(rolledBackRec.assigned).toBe(0);
    expect(rolledBackRec.totalOwned).toBe(3); // Invariant maintained without duplication
  });

  it('serializes and deserializes state accurately maintaining invariant', () => {
    const pId = 'payload_sat_pioneer_transponder';
    inventoryManager.assignPayload(pId, 1, 'veh_01', 'm_save_01');
    inventoryManager.markInTransit(pId, 1, 'm_save_01');

    const savedData = inventoryManager.serialize();
    expect(savedData.records[pId].inTransit).toBe(1);

    // Reset and deserialize
    PayloadInventoryManager.resetInstance();
    const newManager = PayloadInventoryManager.getInstance(registry);
    newManager.deserialize(savedData);

    const restoredRec = newManager.getInventoryRecord(pId);
    expect(restoredRec).toBeDefined();
    expect(restoredRec?.inTransit).toBe(1);
    expect(restoredRec?.available).toBe(2);
    expect(restoredRec?.totalOwned).toBe(3);
  });
});
