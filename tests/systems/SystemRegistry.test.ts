import { describe, it, expect, beforeEach } from 'vitest';
import { SystemRegistry } from '../../src/systems/SystemRegistry';
import { IGameSystem, SystemId } from '../../src/systems/interfaces/IGameSystem';

class DummySystem implements IGameSystem {
  public readonly id: string;
  public readonly priority: number;
  public initialized = false;
  public updated = false;
  public shutDown = false;

  constructor(id: string, priority: number) {
    this.id = id;
    this.priority = priority;
  }

  public initialize(): void {
    this.initialized = true;
  }

  public update(_deltaSeconds: number): void {
    this.updated = true;
  }

  public shutdown(): void {
    this.shutDown = true;
  }
}

describe('SystemRegistry', () => {
  let registry: SystemRegistry;

  beforeEach(() => {
    registry = new SystemRegistry();
  });

  it('registers and retrieves systems with priority ordering', () => {
    const inputSys = new DummySystem(SystemId.INPUT, 10);
    const audioSys = new DummySystem(SystemId.AUDIO, 30);
    const renderSys = new DummySystem(SystemId.RENDERING, 5);

    registry.register(inputSys);
    registry.register(audioSys);
    registry.register(renderSys);

    expect(registry.has(SystemId.INPUT)).toBe(true);
    expect(registry.has(SystemId.MISSION)).toBe(false);

    const all = registry.getAll();
    expect(all.length).toBe(3);
    // Should be sorted by priority: 5 (render), 10 (input), 30 (audio)
    expect(all[0]?.id).toBe(SystemId.RENDERING);
    expect(all[1]?.id).toBe(SystemId.INPUT);
    expect(all[2]?.id).toBe(SystemId.AUDIO);
  });

  it('coordinates lifecycle methods (initialize, update, shutdown)', async () => {
    const sys1 = new DummySystem('Sys1', 1);
    const sys2 = new DummySystem('Sys2', 2);

    registry.register(sys1);
    registry.register(sys2);

    await registry.initializeAll();
    expect(sys1.initialized).toBe(true);
    expect(sys2.initialized).toBe(true);

    registry.updateAll(0.016);
    expect(sys1.updated).toBe(true);
    expect(sys2.updated).toBe(true);

    await registry.shutdownAll();
    expect(sys1.shutDown).toBe(true);
    expect(sys2.shutDown).toBe(true);
  });

  it('throws when requesting unregistered system', () => {
    expect(() => registry.get('NonExistentSystem')).toThrowError('Requested system not found');
  });
});
