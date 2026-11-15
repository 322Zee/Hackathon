/**
 * INTERSTELLAR CONTINUUM - Scientific Event Bus
 * Strongly typed subscription manager with optional non-destructive bridge to central EventBus.
 */

import { ScientificEvents } from './ScientificEvents';
import { EventBus } from '../core/EventBus';

export type ScientificEventCallback<T = any> = (payload: T) => void;

export interface ScientificSubscription {
  unsubscribe(): void;
}

export class ScientificEventBus {
  private listeners: Map<string, Set<ScientificEventCallback>> = new Map();
  private coreEventBus?: EventBus;

  constructor(coreEventBus?: EventBus) {
    this.coreEventBus = coreEventBus;
  }

  public setCoreEventBus(coreEventBus?: EventBus): void {
    this.coreEventBus = coreEventBus;
  }

  public on<K extends keyof ScientificEvents>(
    event: K,
    callback: ScientificEventCallback<ScientificEvents[K]>
  ): ScientificSubscription {
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

  public once<K extends keyof ScientificEvents>(
    event: K,
    callback: ScientificEventCallback<ScientificEvents[K]>
  ): ScientificSubscription {
    let sub: ScientificSubscription;
    const onceWrapper = (payload: ScientificEvents[K]) => {
      sub.unsubscribe();
      callback(payload);
    };
    sub = this.on(event, onceWrapper);
    return sub;
  }

  public off<K extends keyof ScientificEvents>(
    event: K,
    callback: ScientificEventCallback<ScientificEvents[K]>
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

  public emit<K extends keyof ScientificEvents>(
    event: K,
    payload: ScientificEvents[K]
  ): void {
    const eventName = event as string;
    const set = this.listeners.get(eventName);
    if (set) {
      const activeListeners = Array.from(set);
      for (const cb of activeListeners) {
        try {
          cb(payload);
        } catch (err) {
          console.error(`[SCIENTIFIC_EVENT_BUS] Error in listener for ${eventName}:`, err);
        }
      }
    }

    // Optional non-destructive bridge to core EventBus if available
    if (this.coreEventBus && typeof (this.coreEventBus as any).emit === 'function') {
      try {
        (this.coreEventBus as any).emit(`science:${eventName.toLowerCase()}`, payload);
      } catch {
        // Non-blocking bridge catch
      }
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}
