/**
 * INTERSTELLAR CONTINUUM - Results Persistence Adapter
 * Serializes and restores mission results archive, claims, and milestone states,
 * guaranteeing permanence across game restarts and slot saves.
 */

import { MissionResultRecord, MissionResultsSaveData } from '../ResultsTypes';
import { SaveService } from '../../services/SaveService';

export class ResultsPersistenceAdapter {
  private static readonly STORAGE_KEY = 'interstellar_continuum_mission_results';
  private static readonly SCHEMA_VERSION = 1;
  private saveService?: SaveService;
  private inMemoryFallback?: string;

  constructor(saveService?: SaveService) {
    this.saveService = saveService;
  }

  public setSaveService(service?: SaveService): void {
    this.saveService = service;
  }

  public getSaveService(): SaveService | undefined {
    return this.saveService;
  }

  private getStorage(): Storage | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
    return null;
  }

  /**
   * Persists results dictionary and claim records.
   */
  public saveResults(
    results: Map<string, MissionResultRecord>,
    claimedIds: Set<string>,
    unlockedMilestones: string[] = []
  ): boolean {
    try {
      const recordsObj: Record<string, MissionResultRecord> = {};
      for (const [id, r] of results.entries()) {
        recordsObj[id] = JSON.parse(JSON.stringify(r));
      }

      const saveData: MissionResultsSaveData = {
        schemaVersion: ResultsPersistenceAdapter.SCHEMA_VERSION,
        timestamp: Date.now(),
        results: recordsObj,
        claimedResultIds: Array.from(claimedIds),
        unlockedMilestones,
      };

      const serialized = JSON.stringify(saveData);
      const storage = this.getStorage();
      if (storage) {
        storage.setItem(ResultsPersistenceAdapter.STORAGE_KEY, serialized);
      } else {
        this.inMemoryFallback = serialized;
      }

      return true;
    } catch (err) {
      console.error('[RESULTS_PERSISTENCE] Failed to persist mission results:', err);
      return false;
    }
  }

  /**
   * Loads persisted results, claims, and milestones.
   */
  public loadResults(): {
    results: Map<string, MissionResultRecord>;
    claimedIds: Set<string>;
    unlockedMilestones: string[];
  } {
    const emptyResult = {
      results: new Map<string, MissionResultRecord>(),
      claimedIds: new Set<string>(),
      unlockedMilestones: [] as string[],
    };

    try {
      const storage = this.getStorage();
      const raw = storage
        ? storage.getItem(ResultsPersistenceAdapter.STORAGE_KEY)
        : this.inMemoryFallback;

      if (!raw) return emptyResult;

      const parsed: MissionResultsSaveData = JSON.parse(raw);
      const resultMap = new Map<string, MissionResultRecord>();

      if (parsed && parsed.results) {
        for (const [id, r] of Object.entries(parsed.results)) {
          resultMap.set(id, r);
        }
      }

      return {
        results: resultMap,
        claimedIds: new Set(parsed.claimedResultIds || []),
        unlockedMilestones: parsed.unlockedMilestones || [],
      };
    } catch (err) {
      console.error('[RESULTS_PERSISTENCE] Failed to load mission results:', err);
      return emptyResult;
    }
  }

  public clearStorage(): void {
    const storage = this.getStorage();
    if (storage) {
      storage.removeItem(ResultsPersistenceAdapter.STORAGE_KEY);
    }
    this.inMemoryFallback = undefined;
  }
}
