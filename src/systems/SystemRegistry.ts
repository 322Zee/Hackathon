import { IGameSystem, SystemId } from './interfaces/IGameSystem';
import { Logger } from '../core/logging/Logger';

export interface ISystemRegistry {
  register<T extends IGameSystem>(system: T): void;
  get<T extends IGameSystem>(id: SystemId | string): T;
  has(id: SystemId | string): boolean;
  getAll(): readonly IGameSystem[];
  initializeAll(): Promise<void>;
  updateAll(deltaSeconds: number): void;
  shutdownAll(): Promise<void>;
  clear(): void;
}

export class SystemRegistry implements ISystemRegistry {
  private systems: Map<string, IGameSystem> = new Map();
  private sortedSystems: IGameSystem[] = [];
  private isInitialized = false;

  public register<T extends IGameSystem>(system: T): void {
    if (this.systems.has(system.id)) {
      Logger.warn('SYSTEM_REGISTRY', `System "${system.id}" already registered. Overwriting existing entry.`);
    }

    this.systems.set(system.id, system);
    this.rebuildSortedList();
    Logger.info('SYSTEM_REGISTRY', `System registered: "${system.id}" (Priority: ${system.priority})`);
  }

  public get<T extends IGameSystem>(id: SystemId | string): T {
    const system = this.systems.get(id);
    if (!system) {
      throw new Error(`[SystemRegistry] Requested system not found: "${id}"`);
    }
    return system as T;
  }

  public has(id: SystemId | string): boolean {
    return this.systems.has(id);
  }

  public getAll(): readonly IGameSystem[] {
    return this.sortedSystems;
  }

  public async initializeAll(): Promise<void> {
    if (this.isInitialized) return;

    Logger.info('SYSTEM_REGISTRY', 'Initializing all registered systems...');
    for (const system of this.sortedSystems) {
      try {
        Logger.debug('SYSTEM_REGISTRY', `Initializing system: ${system.id}`);
        await system.initialize();
      } catch (err) {
        Logger.error('SYSTEM_REGISTRY', `Failed to initialize system "${system.id}":`, err);
        throw err;
      }
    }

    this.isInitialized = true;
    Logger.info('SYSTEM_REGISTRY', 'All systems initialized successfully.');
  }

  public updateAll(deltaSeconds: number): void {
    if (!this.isInitialized) return;

    for (const system of this.sortedSystems) {
      if (system.update) {
        try {
          system.update(deltaSeconds);
        } catch (err) {
          Logger.error('SYSTEM_REGISTRY', `Error during update in system "${system.id}":`, err);
        }
      }
    }
  }

  public async shutdownAll(): Promise<void> {
    Logger.info('SYSTEM_REGISTRY', 'Shutting down all registered systems...');
    // Reverse priority order for shutdown
    const reversed = [...this.sortedSystems].reverse();

    for (const system of reversed) {
      try {
        Logger.debug('SYSTEM_REGISTRY', `Shutting down system: ${system.id}`);
        await system.shutdown();
      } catch (err) {
        Logger.error('SYSTEM_REGISTRY', `Error shutting down system "${system.id}":`, err);
      }
    }

    this.isInitialized = false;
    Logger.info('SYSTEM_REGISTRY', 'All systems shut down.');
  }

  public clear(): void {
    this.systems.clear();
    this.sortedSystems = [];
    this.isInitialized = false;
  }

  private rebuildSortedList(): void {
    this.sortedSystems = Array.from(this.systems.values()).sort((a, b) => a.priority - b.priority);
  }
}
