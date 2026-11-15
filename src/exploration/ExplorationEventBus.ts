/**
 * INTERSTELLAR CONTINUUM - Exploration Event Bus
 * Strongly typed subscription manager and optional bridge to central EventBus.
 */

import { ExplorationEvents } from './ExplorationEvents';
import { EventBus } from '../core/EventBus';

export type ExplorationEventCallback<T = any> = (payload: T) => void;

export interface ExplorationSubscription {
  unsubscribe(): void;
}

export class ExplorationEventBus {
  private listeners: Map<string, Set<ExplorationEventCallback>> = new Map();
  private coreEventBus?: EventBus;

  constructor(coreEventBus?: EventBus) {
    this.coreEventBus = coreEventBus;
  }

  public setCoreEventBus(coreEventBus?: EventBus): void {
    this.coreEventBus = coreEventBus;
  }

  public on<K extends keyof ExplorationEvents>(
    event: K,
    callback: ExplorationEventCallback<ExplorationEvents[K]>
  ): ExplorationSubscription {
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

  public once<K extends keyof ExplorationEvents>(
    event: K,
    callback: ExplorationEventCallback<ExplorationEvents[K]>
  ): ExplorationSubscription {
    let sub: ExplorationSubscription;
    const onceWrapper = (payload: ExplorationEvents[K]) => {
      sub.unsubscribe();
      callback(payload);
    };
    sub = this.on(event, onceWrapper);
    return sub;
  }

  public off<K extends keyof ExplorationEvents>(
    event: K,
    callback: ExplorationEventCallback<ExplorationEvents[K]>
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

  public emit<K extends keyof ExplorationEvents>(event: K, payload: ExplorationEvents[K]): void {
    const eventName = event as string;
    const set = this.listeners.get(eventName);
    if (set) {
      const activeListeners = Array.from(set);
      for (const cb of activeListeners) {
        try {
          cb(payload);
        } catch (error) {
          console.error(`[ExplorationEventBus] Error in listener for event ${eventName}:`, error);
        }
      }
    }

    // Bridge notification to core EventBus if connected
    if (this.coreEventBus) {
      try {
        const coreEventName = `exploration:${eventName.toLowerCase()}` as any;
        this.coreEventBus.emit(coreEventName, payload as any);
      } catch {
        // Silently tolerate unmapped core event types
      }
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}
