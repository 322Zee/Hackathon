import { describe, it, expect, beforeEach } from 'vitest';
import { EventBus } from '../../../src/core/EventBus';
import { ScopedEventSubscriber } from '../../../src/core/events/ScopedEventSubscriber';

describe('ScopedEventSubscriber & EventBus', () => {
  let eventBus: EventBus;
  let subscriber: ScopedEventSubscriber;

  beforeEach(() => {
    eventBus = new EventBus();
    subscriber = new ScopedEventSubscriber(eventBus, 'TestScope');
  });

  it('delivers typed events to subscribed listeners', () => {
    let receivedPayload: any = null;

    subscriber.subscribe('PlayerMoved', (payload) => {
      receivedPayload = payload;
    });

    eventBus.emit('PlayerMoved', {
      entityId: 'rover_01',
      x: 100,
      y: 200,
      heading: 45,
      velocity: { vx: 5, vy: 5 },
    });

    expect(receivedPayload).not.toBeNull();
    expect(receivedPayload.entityId).toBe('rover_01');
    expect(receivedPayload.x).toBe(100);
  });

  it('unsubscribes individual subscriptions cleanly', () => {
    let callCount = 0;
    const sub = subscriber.subscribe('CreditsChanged', () => {
      callCount++;
    });

    eventBus.emit('CreditsChanged', { current: 1000, delta: 500, reason: 'contract' });
    expect(callCount).toBe(1);

    sub.unsubscribe();
    eventBus.emit('CreditsChanged', { current: 1500, delta: 500, reason: 'contract' });
    expect(callCount).toBe(1);
  });

  it('cleans up all subscriptions on dispose to prevent memory leaks', () => {
    let countA = 0;
    let countB = 0;

    subscriber.subscribe('MissionStarted', () => {
      countA++;
    });
    subscriber.subscribe('ResearchUnlocked', () => {
      countB++;
    });

    expect(subscriber.getActiveSubscriptionCount()).toBe(2);
    expect(eventBus.getListenerCount()).toBe(2);

    // Dispose scope (simulating scene exit / entity destruction)
    subscriber.dispose();

    expect(subscriber.getActiveSubscriptionCount()).toBe(0);
    expect(eventBus.getListenerCount()).toBe(0);

    eventBus.emit('MissionStarted', { missionId: 'm1', launchTimestamp: Date.now() });
    eventBus.emit('ResearchUnlocked', { techId: 't1', category: 'Aero', cost: 100 });

    expect(countA).toBe(0);
    expect(countB).toBe(0);
  });

  it('handles subscribeOnce firing exactly once', () => {
    let callCount = 0;
    subscriber.subscribeOnce('BuildingEntered', () => {
      callCount++;
    });

    eventBus.emit('BuildingEntered', { buildingId: 'vab', interiorId: 'bay1' });
    eventBus.emit('BuildingEntered', { buildingId: 'vab', interiorId: 'bay2' });

    expect(callCount).toBe(1);
    expect(subscriber.getActiveSubscriptionCount()).toBe(0);
  });
});
