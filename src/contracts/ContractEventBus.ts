/**
 * INTERSTELLAR CONTINUUM - Contracts Event Bus
 * Strongly typed subscription manager with optional non-invasive bridge to central EventBus.
 */

import { ContractsFundingEvents } from './ContractEvents';
import { EventBus } from '../core/EventBus';

export type ContractEventCallback<T = any> = (payload: T) => void;

export interface ContractSubscription {
  unsubscribe(): void;
}

export class ContractEventBus {
  private listeners: Map<string, Set<ContractEventCallback>> = new Map();
  private coreEventBus?: EventBus;

  constructor(coreEventBus?: EventBus) {
    this.coreEventBus = coreEventBus;
  }

  public setCoreEventBus(coreEventBus?: EventBus): void {
    this.coreEventBus = coreEventBus;
  }

  public on<K extends keyof ContractsFundingEvents>(
    event: K,
    callback: ContractEventCallback<ContractsFundingEvents[K]>
  ): ContractSubscription {
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

  public once<K extends keyof ContractsFundingEvents>(
    event: K,
    callback: ContractEventCallback<ContractsFundingEvents[K]>
  ): ContractSubscription {
    let sub: ContractSubscription;
    const onceWrapper = (payload: ContractsFundingEvents[K]) => {
      sub.unsubscribe();
      callback(payload);
    };
    sub = this.on(event, onceWrapper);
    return sub;
  }

  public off<K extends keyof ContractsFundingEvents>(
    event: K,
    callback: ContractEventCallback<ContractsFundingEvents[K]>
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

  public emit<K extends keyof ContractsFundingEvents>(
    event: K,
    payload: ContractsFundingEvents[K]
  ): void {
    const eventName = event as string;
    const set = this.listeners.get(eventName);
    if (set) {
      const activeListeners = Array.from(set);
      for (const cb of activeListeners) {
        try {
          cb(payload);
        } catch (err) {
          console.error(`[CONTRACT_EVENT_BUS] Error in listener for ${eventName}:`, err);
        }
      }
    }

    // Optional non-destructive bridge to core EventBus if available
    if (this.coreEventBus && typeof (this.coreEventBus as any).emit === 'function') {
      try {
        (this.coreEventBus as any).emit(`contracts:${eventName.toLowerCase()}`, payload);
      } catch {
        // Non-blocking bridge catch
      }
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}
