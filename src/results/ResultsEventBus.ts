/**
 * INTERSTELLAR CONTINUUM - Results Event Bus
 * Strongly typed subscription manager and optional bridge to central EventBus.
 */

import { ResultsDomainEvents } from './ResultsEvents';
import { EventBus } from '../core/EventBus';

export type ResultsEventCallback<T = any> = (payload: T) => void;

export interface ResultsSubscription {
  unsubscribe(): void;
}

export class ResultsEventBus {
  private listeners: Map<string, Set<ResultsEventCallback>> = new Map();
  private coreEventBus?: EventBus;

  constructor(coreEventBus?: EventBus) {
    this.coreEventBus = coreEventBus;
  }

  public setCoreEventBus(coreEventBus?: EventBus): void {
    this.coreEventBus = coreEventBus;
  }

  public on<K extends keyof ResultsDomainEvents>(
    event: K,
    callback: ResultsEventCallback<ResultsDomainEvents[K]>
  ): ResultsSubscription {
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

  public once<K extends keyof ResultsDomainEvents>(
    event: K,
    callback: ResultsEventCallback<ResultsDomainEvents[K]>
  ): ResultsSubscription {
    let sub: ResultsSubscription;
    const onceWrapper = (payload: ResultsDomainEvents[K]) => {
      sub.unsubscribe();
      callback(payload);
    };
    sub = this.on(event, onceWrapper);
    return sub;
  }

  public off<K extends keyof ResultsDomainEvents>(
    event: K,
    callback: ResultsEventCallback<ResultsDomainEvents[K]>
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

  public emit<K extends keyof ResultsDomainEvents>(
    event: K,
    payload: ResultsDomainEvents[K]
  ): void {
    const eventName = event as string;
    const set = this.listeners.get(eventName);
    if (set) {
      const activeListeners = Array.from(set);
      for (const cb of activeListeners) {
        try {
          cb(payload);
        } catch (err) {
          console.error(`[RESULTS_EVENT_BUS] Error in listener for ${eventName}:`, err);
        }
      }
    }

    // Optional bridge to core EventBus if available
    if (this.coreEventBus && typeof (this.coreEventBus as any).emit === 'function') {
      try {
        (this.coreEventBus as any).emit(`results:${eventName.toLowerCase()}`, payload);
      } catch (err) {
        // Non-blocking bridge catch
      }
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}
