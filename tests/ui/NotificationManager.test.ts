import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NotificationManager } from '../../src/ui';
import { EventBus } from '../../src/core/EventBus';

describe('Global UI Framework - Notification System', () => {
  let eventBus: EventBus;
  let manager: NotificationManager;

  beforeEach(() => {
    eventBus = new EventBus();
    manager = new NotificationManager(eventBus);
  });

  afterEach(() => {
    manager.clearAll();
  });

  it('spawns and positions notifications in stack order', () => {
    expect(manager.getActiveCount()).toBe(0);

    manager.notify({
      title: 'Facility Unlocked',
      message: 'Rocket Engineering (VAB) is now available.',
      category: 'FACILITY',
      level: 'SUCCESS',
    });

    expect(manager.getActiveCount()).toBe(1);
    const active = manager.getActiveNotifications();
    expect(active[0]?.id).toBeDefined();
    expect(active[0]?.container.visible).toBe(true);
  });

  it('queues notifications when exceeding maximum visible limit (4)', () => {
    for (let i = 0; i < 6; i++) {
      manager.notify({
        title: `Alert ${i}`,
        message: `System status update #${i}`,
        category: 'SYSTEM',
        level: 'INFO',
      });
    }

    expect(manager.getActiveCount()).toBe(4);
    expect(manager.getQueueCount()).toBe(2);
  });

  it('suppresses duplicate notifications within deduplication window (2000ms)', () => {
    const notifyPayload = {
      title: 'Power Surge',
      message: 'Grid fluctuating at pad Alpha.',
      category: 'WARNING' as const,
      level: 'WARNING' as const,
    };

    manager.notify(notifyPayload);
    expect(manager.getActiveCount()).toBe(1);

    // Immediate duplicate attempt
    manager.notify(notifyPayload);
    expect(manager.getActiveCount()).toBe(1);
  });

  it('auto-dismisses notification after duration expires and dequeues next item', () => {
    manager.notify({
      title: 'Short Alert',
      message: 'Expires quickly.',
      duration: 1.0,
    });
    manager.notify({
      title: 'Short Alert 2',
      message: 'Expires quickly 2.',
      duration: 1.0,
    });

    expect(manager.getActiveCount()).toBe(2);

    // Advance duration by 1.1s
    manager.update(1.1);

    expect(manager.getActiveCount()).toBe(0);
  });

  it('subscribes to EventBus domain events and produces notifications', () => {
    // 1. facility:visited
    eventBus.emit('facility:visited', {
      facilityId: 'fac-ops',
      name: 'Mission Operations',
      visitCount: 3,
      timestamp: Date.now(),
    });
    expect(manager.getActiveCount()).toBe(1);

    // 2. save:saved
    eventBus.emit('save:saved', { slot: 1, timestamp: Date.now() });
    expect(manager.getActiveCount()).toBe(2);

    // 3. error:captured
    eventBus.emit('error:captured', { message: 'Network link timeout', fatal: false });
    expect(manager.getActiveCount()).toBe(3);
  });
});
