/**
 * INTERSTELLAR CONTINUUM - Planetary Environment Event Bus
 * Strongly typed event dispatcher with bridging to central game EventBus.
 */

import { EventBus } from '../../core/EventBus';
import {
  PlanetaryEnvironmentEventMap,
} from './PlanetaryEnvironmentEvents';

export type PlanetaryEventListener<K extends keyof PlanetaryEnvironmentEventMap> = (
  payload: PlanetaryEnvironmentEventMap[K]
) => void;

export class PlanetaryEnvironmentEventBus {
  private listeners: Map<string, Set<(payload: any) => void>> = new Map();
  private coreEventBus?: EventBus;

  constructor(coreEventBus?: EventBus) {
    this.coreEventBus = coreEventBus;
  }

  public setCoreEventBus(coreEventBus: EventBus): void {
    this.coreEventBus = coreEventBus;
  }

  public on<K extends keyof PlanetaryEnvironmentEventMap>(
    event: K,
    listener: PlanetaryEventListener<K>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event)!;
    set.add(listener as (payload: any) => void);

    return () => {
      set.delete(listener as (payload: any) => void);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  public once<K extends keyof PlanetaryEnvironmentEventMap>(
    event: K,
    listener: PlanetaryEventListener<K>
  ): () => void {
    const unsubscribe = this.on(event, (payload) => {
      unsubscribe();
      listener(payload);
    });
    return unsubscribe;
  }

  public emit<K extends keyof PlanetaryEnvironmentEventMap>(
    event: K,
    payload: PlanetaryEnvironmentEventMap[K]
  ): void {
    const set = this.listeners.get(event);
    if (set) {
      for (const listener of Array.from(set)) {
        try {
          listener(payload);
        } catch (err) {
          console.error(`[PlanetaryEnvironmentEventBus] Error in listener for event ${String(event)}:`, err);
        }
      }
    }

    // Bridge to core EventBus
    if (this.coreEventBus) {
      try {
        (this.coreEventBus as any).emit(event, payload);
      } catch (err) {
        console.error(`[PlanetaryEnvironmentEventBus] Core EventBus bridge error for ${String(event)}:`, err);
      }
    }
  }

  public removeAllListeners(): void {
    this.listeners.clear();
  }
}
