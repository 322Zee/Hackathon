/**
 * INTERSTELLAR CONTINUUM - Central Notification Manager
 * Queues, de-duplicates, positions, and coordinates tactical notifications.
 */

import { Container } from 'pixi.js';
import {
  UINotification,
  NotificationPayload,
  NotificationLevel,
  NotificationCategory,
} from './UINotification';
import { EventBus } from '../../core/EventBus';
import { Logger } from '../../core/logging/Logger';

export class NotificationManager {
  private static instance: NotificationManager;

  public readonly container: Container;
  private activeNotifications: UINotification[] = [];
  private queue: NotificationPayload[] = [];
  private maxVisible: number = 4;
  private toastSpacing: number = 82;
  private startX: number = 1550;
  private startY: number = 80;

  private recentHistory: Map<string, number> = new Map();
  private readonly deduplicationWindowMs: number = 2000;

  constructor(eventBus?: EventBus) {
    this.container = new Container();
    this.container.label = 'NotificationManager';

    if (eventBus) {
      this.subscribeDomainEvents(eventBus);
    }

    NotificationManager.instance = this;
  }

  public static getInstance(eventBus?: EventBus): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager(eventBus);
    }
    return NotificationManager.instance;
  }

  public notify(options: {
    title: string;
    message: string;
    level?: NotificationLevel;
    category?: NotificationCategory;
    duration?: number;
  }): void {
    const dedupeKey = `${options.category}_${options.title}_${options.message}`;
    const now = Date.now();
    const lastSeen = this.recentHistory.get(dedupeKey);

    if (lastSeen && now - lastSeen < this.deduplicationWindowMs) {
      Logger.debug('NOTIFICATION_MANAGER', `Suppressed duplicate notification: "${options.title}"`);
      return;
    }

    this.recentHistory.set(dedupeKey, now);

    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const payload: NotificationPayload = {
      id,
      title: options.title,
      message: options.message,
      level: options.level ?? 'INFO',
      category: options.category ?? 'SYSTEM',
      duration: options.duration ?? (options.level === 'ERROR' ? 6.0 : 4.5),
    };

    if (this.activeNotifications.length < this.maxVisible) {
      this.spawnNotification(payload);
    } else {
      this.queue.push(payload);
    }
  }

  private spawnNotification(payload: NotificationPayload): void {
    const notif = new UINotification({
      ...payload,
      onDismiss: () => {
        this.removeNotification(notif.id);
      },
    });

    const index = this.activeNotifications.length;
    notif.container.position.set(this.startX, this.startY + index * this.toastSpacing);
    notif.targetY = this.startY + index * this.toastSpacing;

    this.activeNotifications.push(notif);
    this.container.addChild(notif.container);
  }

  private removeNotification(id: string): void {
    const index = this.activeNotifications.findIndex((n) => n.id === id);
    if (index === -1) return;

    const notif = this.activeNotifications[index];
    if (notif) {
      this.container.removeChild(notif.container);
      notif.destroy();
      this.activeNotifications.splice(index, 1);
    }

    // Shift remaining notifications upward
    this.activeNotifications.forEach((n, i) => {
      n.targetY = this.startY + i * this.toastSpacing;
    });

    // Dequeue next if pending
    if (this.queue.length > 0 && this.activeNotifications.length < this.maxVisible) {
      const next = this.queue.shift();
      if (next) this.spawnNotification(next);
    }
  }

  public subscribeDomainEvents(eventBus: EventBus): void {
    eventBus.on('facility:visited', ({ name, visitCount }) => {
      this.notify({
        title: 'Facility Visited',
        message: `${name} (Visit #${visitCount})`,
        category: 'FACILITY',
        level: 'INFO',
      });
    });

    eventBus.on('building:entered', ({ buildingId }) => {
      this.notify({
        title: 'Facility Interior Access',
        message: `Entered ${buildingId}`,
        category: 'FACILITY',
        level: 'INFO',
      });
    });

    eventBus.on('building:exited', ({ buildingId }) => {
      this.notify({
        title: 'Returned to Campus',
        message: `Exited ${buildingId}`,
        category: 'FACILITY',
        level: 'INFO',
      });
    });

    eventBus.on('interaction:executed', ({ targetId, success }) => {
      if (!success) {
        this.notify({
          title: 'Interaction Warning',
          message: `Action unavailable on ${targetId}`,
          category: 'INTERACTION',
          level: 'WARNING',
        });
      }
    });

    eventBus.on('save:saved', ({ slot }) => {
      this.notify({
        title: 'Venture Saved',
        message: `Organisation state saved to Slot ${slot}`,
        category: 'SYSTEM',
        level: 'SUCCESS',
      });
    });

    eventBus.on('error:captured', ({ message, fatal }) => {
      this.notify({
        title: fatal ? 'Critical System Error' : 'System Diagnostic Warning',
        message: message.substring(0, 80),
        category: fatal ? 'ERROR' : 'WARNING',
        level: fatal ? 'ERROR' : 'WARNING',
        duration: 7.0,
      });
    });
  }

  public update(deltaSeconds: number): void {
    for (let i = this.activeNotifications.length - 1; i >= 0; i--) {
      const notif = this.activeNotifications[i];
      if (notif) {
        notif.update(deltaSeconds);
        if (notif.isExpired()) {
          this.removeNotification(notif.id);
        }
      }
    }
  }

  public clearAll(): void {
    for (const notif of this.activeNotifications) {
      this.container.removeChild(notif.container);
      notif.destroy();
    }
    this.activeNotifications = [];
    this.queue = [];
    this.recentHistory.clear();
  }

  public getActiveCount(): number {
    return this.activeNotifications.length;
  }

  public getQueueCount(): number {
    return this.queue.length;
  }

  public getActiveNotifications(): readonly UINotification[] {
    return this.activeNotifications;
  }
}
