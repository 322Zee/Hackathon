import { describe, it, expect, beforeEach } from 'vitest';
import { SaveService } from '../../src/services/SaveService';

describe('SaveService', () => {
  let saveService: SaveService;

  beforeEach(() => {
    // In-memory mock for localStorage if not provided natively in test runner
    const store = new Map<string, string>();
    const mockLocalStorage = {
      getItem: (key: string) => store.get(key) || null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    };
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    });

    saveService = new SaveService();
  });

  it('creates valid default game state', () => {
    const defaultState = saveService.createNewGame();
    expect(defaultState.schemaVersion).toBe(1);
    expect(defaultState.agency.agencyName).toBe('Astra Continuum Project');
    expect(defaultState.resources.credits).toBe(500000);
    expect(defaultState.facilities.mission_control).toBeDefined();
  });

  it('saves and loads game state cleanly to a slot', () => {
    const state = saveService.createNewGame();
    state.agency.directorName = 'Director Gene Kranz';
    state.resources.credits = 750000;

    const saveSuccess = saveService.saveToSlot(1, state);
    expect(saveSuccess).toBe(true);
    expect(saveService.hasSave(1)).toBe(true);

    const loaded = saveService.loadFromSlot(1);
    expect(loaded).not.toBeNull();
    expect(loaded?.agency.directorName).toBe('Director Gene Kranz');
    expect(loaded?.resources.credits).toBe(750000);
  });

  it('exports and imports JSON save data', () => {
    const original = saveService.createNewGame();
    original.resources.researchData = 999;

    const exportedJson = saveService.exportSaveToJson(original);
    expect(typeof exportedJson).toBe('string');

    const imported = saveService.importSaveFromJson(exportedJson);
    expect(imported.resources.researchData).toBe(999);
    expect(imported.agency.agencyName).toBe(original.agency.agencyName);
  });
});
