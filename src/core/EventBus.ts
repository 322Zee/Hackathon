import { AllGameEvents } from './events/GameEvents';

export type EventCallback<T = any> = (payload: T) => void;

export interface EventSubscription {
  unsubscribe(): void;
}

export class EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  public on<K extends keyof AllGameEvents>(event: K, callback: EventCallback<AllGameEvents[K]>): EventSubscription {
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

  public once<K extends keyof AllGameEvents>(event: K, callback: EventCallback<AllGameEvents[K]>): EventSubscription {
    let sub: EventSubscription;
    const onceWrapper = (payload: AllGameEvents[K]) => {
      sub.unsubscribe();
      callback(payload);
    };
    sub = this.on(event, onceWrapper);
    return sub;
  }

  public off<K extends keyof AllGameEvents>(event: K, callback: EventCallback<AllGameEvents[K]>): void {
    const eventName = event as string;
    const set = this.listeners.get(eventName);
    if (set) {
      set.delete(callback);
      if (set.size === 0) {
        this.listeners.delete(eventName);
      }
    }
  }

  public emit<K extends keyof AllGameEvents>(event: K, payload: AllGameEvents[K]): void {
    const eventName = event as string;
    const set = this.listeners.get(eventName);
    if (set) {
      // Clone set to prevent issues if a listener unsubscribes during dispatch
      const activeListeners = Array.from(set);
      for (const cb of activeListeners) {
        try {
          cb(payload);
        } catch (err) {
          console.error(`[EventBus] Error in listener for event "${eventName}":`, err);
        }
      }
    }
  }

  public getListenerCount<K extends keyof AllGameEvents>(event?: K): number {
    if (event) {
      return this.listeners.get(event as string)?.size || 0;
    }
    let total = 0;
    for (const set of this.listeners.values()) {
      total += set.size;
    }
    return total;
  }

  public clear(): void {
    this.listeners.clear();
  }
}

export type { AllGameEvents as GameEvents };
export type ApplicationLifecycleState = 'UNINITIALIZED' | 'INITIALIZING' | 'RUNNING' | 'PAUSED' | 'SHUTDOWN' | 'ERROR';
