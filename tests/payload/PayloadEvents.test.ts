import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PayloadEventBus } from '../../src/payload';
import { EventBus } from '../../src/core/EventBus';

describe('PayloadEvents & PayloadEventBus', () => {
  let eventBus: PayloadEventBus;
  let globalBus: EventBus;

  beforeEach(() => {
    PayloadEventBus.resetInstance();
    globalBus = new EventBus();
    eventBus = PayloadEventBus.getInstance(globalBus);
  });

  it('subscribes, emits, and receives PayloadAssigned typed events', () => {
    const callback = vi.fn();
    const sub = eventBus.on('PayloadAssigned', callback);

    const payload = {
      payloadId: 'p_01',
      payloadName: 'Pioneer 1',
      vehicleId: 'veh_01',
      vehicleName: 'Astra-1',
      quantity: 1,
      totalMassRating: 45,
      totalPowerRequirement: 35,
      totalStorageUsed: 1,
      timestamp: Date.now(),
    };

    eventBus.emit('PayloadAssigned', payload);
    expect(callback).toHaveBeenCalledWith(payload);

    // Unsubscribe
    sub.unsubscribe();
    eventBus.emit('PayloadAssigned', payload);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('handles once() subscriptions cleanly', () => {
    const callback = vi.fn();
    eventBus.once('PayloadRemoved', callback);

    const payload = {
      payloadId: 'p_01',
      payloadName: 'Pioneer 1',
      vehicleId: 'veh_01',
      quantity: 1,
      timestamp: Date.now(),
    };

    eventBus.emit('PayloadRemoved', payload);
    eventBus.emit('PayloadRemoved', payload);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('emits all 6 required events accurately with correct payloads', () => {
    const assignedCb = vi.fn();
    const removedCb = vi.fn();
    const reservedCb = vi.fn();
    const inTransitCb = vi.fn();
    const deliveredCb = vi.fn();
    const objCompletedCb = vi.fn();

    eventBus.on('PayloadAssigned', assignedCb);
    eventBus.on('PayloadRemoved', removedCb);
    eventBus.on('PayloadReserved', reservedCb);
    eventBus.on('PayloadInTransit', inTransitCb);
    eventBus.on('PayloadDelivered', deliveredCb);
    eventBus.on('DeliveryObjectiveCompleted', objCompletedCb);

    eventBus.emit('PayloadAssigned', {
      payloadId: 'p1',
      payloadName: 'Sat',
      vehicleId: 'v1',
      vehicleName: 'Rocket',
      quantity: 1,
      totalMassRating: 50,
      totalPowerRequirement: 50,
      totalStorageUsed: 1,
      timestamp: 1000,
    });
    eventBus.emit('PayloadRemoved', {
      payloadId: 'p1',
      payloadName: 'Sat',
      vehicleId: 'v1',
      quantity: 1,
      timestamp: 1001,
    });
    eventBus.emit('PayloadReserved', {
      payloadId: 'p1',
      payloadName: 'Sat',
      missionId: 'm1',
      quantity: 1,
      timestamp: 1002,
    });
    eventBus.emit('PayloadInTransit', {
      payloadId: 'p1',
      payloadName: 'Sat',
      vehicleId: 'v1',
      missionId: 'm1',
      destinationId: 'DEST_EARTH_LEO',
      quantity: 1,
      timestamp: 1003,
    });
    eventBus.emit('PayloadDelivered', {
      payloadId: 'p1',
      payloadName: 'Sat',
      missionId: 'm1',
      destinationId: 'DEST_EARTH_LEO',
      quantity: 1,
      timestamp: 1004,
    });
    eventBus.emit('DeliveryObjectiveCompleted', {
      missionId: 'm1',
      objectiveId: 'obj1',
      payloadId: 'p1',
      requiredQuantity: 1,
      deliveredQuantity: 1,
      destinationId: 'DEST_EARTH_LEO',
      allDeliveryObjectivesComplete: true,
      timestamp: 1005,
    });

    expect(assignedCb).toHaveBeenCalledTimes(1);
    expect(removedCb).toHaveBeenCalledTimes(1);
    expect(reservedCb).toHaveBeenCalledTimes(1);
    expect(inTransitCb).toHaveBeenCalledTimes(1);
    expect(deliveredCb).toHaveBeenCalledTimes(1);
    expect(objCompletedCb).toHaveBeenCalledTimes(1);
  });
});
