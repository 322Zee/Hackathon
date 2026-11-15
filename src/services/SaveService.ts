import { createDefaultGameState, GameSaveSchema } from '../core/GameState';

export class SaveService {
  private static readonly STORAGE_PREFIX = 'interstellar_continuum_save_';
  private static readonly CURRENT_SCHEMA_VERSION = 1;
  private static inMemoryStore: Map<string, string> = new Map();

  private getStorage(): Storage | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
    return null;
  }

  public saveToSlot(slot: number, state: GameSaveSchema): boolean {
    try {
      const storage = this.getStorage();
      const dataToSave: GameSaveSchema = {
        ...state,
        schemaVersion: SaveService.CURRENT_SCHEMA_VERSION,
        timestamp: Date.now(),
      };
      const serialized = JSON.stringify(dataToSave);
      const key = `${SaveService.STORAGE_PREFIX}${slot}`;
      if (storage) {
        storage.setItem(key, serialized);
      } else {
        SaveService.inMemoryStore.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error(`[SaveService] Failed to save state to slot ${slot}:`, error);
      return false;
    }
  }

  public loadFromSlot(slot: number): GameSaveSchema | null {
    try {
      const storage = this.getStorage();
      const key = `${SaveService.STORAGE_PREFIX}${slot}`;
      const raw = storage ? storage.getItem(key) : SaveService.inMemoryStore.get(key) || null;
      if (!raw) return null;
      const parsed: GameSaveSchema = JSON.parse(raw);
      return this.migrateSchema(parsed);
    } catch (error) {
      console.error(`[SaveService] Failed to load state from slot ${slot}:`, error);
      return null;
    }
  }

  public hasSave(slot: number): boolean {
    const storage = this.getStorage();
    const key = `${SaveService.STORAGE_PREFIX}${slot}`;
    if (storage) {
      return storage.getItem(key) !== null;
    }
    return SaveService.inMemoryStore.has(key);
  }

  public deleteSlot(slot: number): void {
    const storage = this.getStorage();
    const key = `${SaveService.STORAGE_PREFIX}${slot}`;
    if (storage) {
      storage.removeItem(key);
    }
    SaveService.inMemoryStore.delete(key);
  }

  public exportSaveToJson(state: GameSaveSchema): string {
    return JSON.stringify(state, null, 2);
  }

  public importSaveFromJson(jsonString: string): GameSaveSchema {
    const parsed = JSON.parse(jsonString) as GameSaveSchema;
    if (!parsed.agency || !parsed.resources) {
      throw new Error('Invalid save data format: missing required agency or resources root');
    }
    return this.migrateSchema(parsed);
  }

  private migrateSchema(saveData: GameSaveSchema): GameSaveSchema {
    if (!saveData.schemaVersion) {
      saveData.schemaVersion = 1;
    }
    // Future migrations between schema versions go here
    return saveData;
  }

  public createNewGame(): GameSaveSchema {
    return createDefaultGameState();
  }
}
