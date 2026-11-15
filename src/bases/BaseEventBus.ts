/**
 * INTERSTELLAR CONTINUUM - Planetary Base Event Bus
 * Strongly typed subscription bus with optional bridge to central EventBus.
 */

import { PlanetaryBaseEvents } from './BaseEvents';
import { EventBus } from '../core/EventBus';

export type BaseEventCallback<T = any> = (payload: T) => void;

export interface BaseSubscription {
  unsubscribe(): void;
}

export class BaseEventBus {
  private listeners: Map<string, Set<BaseEventCallback>> = new Map();
  private coreEventBus?: EventBus;

  constructor(coreEventBus?: EventBus) {
    this.coreEventBus = coreEventBus;
  }

  public setCoreEventBus(coreEventBus?: EventBus): void {
    this.coreEventBus = coreEventBus;
  }

  public on<K extends keyof PlanetaryBaseEvents>(
    event: K,
    callback: BaseEventCallback<PlanetaryBaseEvents[K]>
  ): BaseSubscription {
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

  public once<K extends keyof PlanetaryBaseEvents>(
    event: K,
    callback: BaseEventCallback<PlanetaryBaseEvents[K]>
  ): BaseSubscription {
    let sub: BaseSubscription;
    const onceWrapper = (payload: PlanetaryBaseEvents[K]) => {
      sub.unsubscribe();
      callback(payload);
    };
    sub = this.on(event, onceWrapper);
    return sub;
  }

  public off<K extends keyof PlanetaryBaseEvents>(
    event: K,
    callback: BaseEventCallback<PlanetaryBaseEvents[K]>
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

  public emit<K extends keyof PlanetaryBaseEvents>(
    event: K,
    payload: PlanetaryBaseEvents[K]
  ): void {
    const eventName = event as string;
    const set = this.listeners.get(eventName);
    if (set) {
      const callbacks = Array.from(set);
      for (const cb of callbacks) {
        try {
          cb(payload);
        } catch (err) {
          console.error(`[BASE_EVENT_BUS] Error executing callback for event "${eventName}":`, err);
        }
      }
    }

    // Bridge out to core EventBus under namespaced event name
    if (this.coreEventBus) {
      try {
        this.coreEventBus.emit(`bases:${eventName}`, payload);
      } catch (err) {
        console.warn(`[BASE_EVENT_BUS] Failed to bridge event "${eventName}" to core EventBus:`, err);
      }
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}
