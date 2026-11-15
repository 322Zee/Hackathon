/**
 * INTERSTELLAR CONTINUUM - Domain Event Bus for Payload & Transportation Systems
 * Provides strongly typed event subscription, unsubscription, and dispatching for
 * payload events while optionally bridging to the project-wide EventBus without
 * modifying shared global files.
 */

import { EventBus, EventSubscription } from '../../core/EventBus';
import { PayloadDomainEvents } from './PayloadEvents';

export type PayloadEventCallback<T = any> = (payload: T) => void;

export class PayloadEventBus {
  private static instance?: PayloadEventBus;
  private listeners: Map<string, Set<PayloadEventCallback>> = new Map();
  private globalEventBus?: EventBus;

  constructor(globalEventBus?: EventBus) {
    this.globalEventBus = globalEventBus;
  }

  public static getInstance(globalEventBus?: EventBus): PayloadEventBus {
    if (!PayloadEventBus.instance) {
      PayloadEventBus.instance = new PayloadEventBus(globalEventBus);
    } else if (globalEventBus && !PayloadEventBus.instance.globalEventBus) {
      PayloadEventBus.instance.globalEventBus = globalEventBus;
    }
    return PayloadEventBus.instance;
  }

  public static resetInstance(): void {
    PayloadEventBus.instance = undefined;
  }

  public setGlobalEventBus(bus: EventBus): void {
    this.globalEventBus = bus;
  }

  public on<K extends keyof PayloadDomainEvents>(
    event: K,
    callback: PayloadEventCallback<PayloadDomainEvents[K]>
  ): EventSubscription {
    const eventName = event as string;
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    const set = this.listeners.get(eventName)!;
    set.add(callback);

    let isSubscribed = true;
    return {
      unsubscribe: () => {
        if (!isSubscribed) return;
        isSubscribed = false;
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(eventName);
        }
      },
    };
  }

  public once<K extends keyof PayloadDomainEvents>(
    event: K,
    callback: PayloadEventCallback<PayloadDomainEvents[K]>
  ): EventSubscription {
    let sub: EventSubscription;
    const onceWrapper = (payload: PayloadDomainEvents[K]) => {
      sub.unsubscribe();
      callback(payload);
    };
    sub = this.on(event, onceWrapper);
    return sub;
  }

  public off<K extends keyof PayloadDomainEvents>(
    event: K,
    callback: PayloadEventCallback<PayloadDomainEvents[K]>
  ): void {
    const eventName = event as string;
    const set = this.listeners.get(eventName);
    if (set) {
      set.delete(callback);
      if (set.size === 0) {
        this.listeners.delete(eventName);
      }
    }
  }

  public emit<K extends keyof PayloadDomainEvents>(
    event: K,
    payload: PayloadDomainEvents[K]
  ): void {
    const eventName = event as string;
    const set = this.listeners.get(eventName);
    if (set) {
      const activeListeners = Array.from(set);
      for (const cb of activeListeners) {
        try {
          cb(payload);
        } catch (err) {
          console.error(`[PayloadEventBus] Error handling event "${eventName}":`, err);
        }
      }
    }

    // Bridge notification to global EventBus if attached (via untyped cast)
    if (this.globalEventBus) {
      try {
        (this.globalEventBus as any).emit(eventName, payload);
      } catch {
        // Shared global bus may not register domain-specific events, safe ignore
      }
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}
