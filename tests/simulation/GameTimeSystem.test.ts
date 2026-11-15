import { describe, it, expect, beforeEach } from 'vitest';
import { GameTimeSystem } from '../../src/simulation/GameTimeSystem';

describe('GameTimeSystem', () => {
  let timeSystem: GameTimeSystem;

  beforeEach(() => {
    timeSystem = new GameTimeSystem({
      fixedTimeStep: 0.05,
      maxDeltaClamping: 0.25,
      timeScale: 1.0,
      isPaused: false,
    });
  });

  it('initializes with default and custom configurations', () => {
    const defaultSys = new GameTimeSystem();
    const config = defaultSys.getConfig();
    expect(config.timeScale).toBe(1.0);
    expect(config.isPaused).toBe(false);
    expect(config.fixedTimeStep).toBe(0.05);

    const customSys = new GameTimeSystem({
      timeScale: 5.0,
      isPaused: true,
      fixedTimeStep: 0.02,
      maxDeltaClamping: 0.5,
    });
    const customConfig = customSys.getConfig();
    expect(customConfig.timeScale).toBe(5.0);
    expect(customConfig.isPaused).toBe(true);
    expect(customConfig.fixedTimeStep).toBe(0.02);
    expect(customConfig.maxDeltaClamping).toBe(0.5);
  });

  it('pauses and resumes time progression correctly', () => {
    expect(timeSystem.isTimePaused()).toBe(false);

    timeSystem.pause();
    expect(timeSystem.isTimePaused()).toBe(true);

    // Advancing when paused should not advance game time
    const progressed = timeSystem.advance(1.0);
    expect(progressed).toBe(0);
    expect(timeSystem.getElapsedGameTimeSeconds()).toBe(0);

    timeSystem.resume();
    expect(timeSystem.isTimePaused()).toBe(false);

    const progressedAfterResume = timeSystem.advance(0.1);
    expect(progressedAfterResume).toBeGreaterThan(0);
    expect(timeSystem.getElapsedGameTimeSeconds()).toBeGreaterThan(0);
  });

  it('toggles pause state', () => {
    expect(timeSystem.isTimePaused()).toBe(false);
    expect(timeSystem.togglePause()).toBe(true);
    expect(timeSystem.isTimePaused()).toBe(true);
    expect(timeSystem.togglePause()).toBe(false);
    expect(timeSystem.isTimePaused()).toBe(false);
  });

  it('scales time progression accurately based on timeScale multiplier', () => {
    timeSystem.setTimeScale(2.0);
    expect(timeSystem.getTimeScale()).toBe(2.0);

    // Advance 0.1 real seconds at 2.0x = 0.2 game seconds
    let fixedTicks = 0;
    timeSystem.advance(0.1, () => {
      fixedTicks++;
    });

    expect(timeSystem.getElapsedGameTimeSeconds()).toBeCloseTo(0.2, 2);
    expect(fixedTicks).toBe(4); // 0.2 / 0.05 = 4 ticks
  });

  it('handles simulation speed of 0 by halting time progression', () => {
    timeSystem.setTimeScale(0);
    const progressed = timeSystem.advance(0.2);
    expect(progressed).toBe(0);
    expect(timeSystem.getElapsedGameTimeSeconds()).toBe(0);
  });

  it('ensures frame-rate-independent progression', () => {
    // Advancing 1.0 real seconds in one step vs ten 0.1s steps
    const sysA = new GameTimeSystem({ fixedTimeStep: 0.05, maxDeltaClamping: 1.0 });
    const sysB = new GameTimeSystem({ fixedTimeStep: 0.05, maxDeltaClamping: 1.0 });

    sysA.advance(1.0);

    for (let i = 0; i < 10; i++) {
      sysB.advance(0.1);
    }

    expect(sysA.getElapsedGameTimeSeconds()).toBeCloseTo(1.0, 2);
    expect(sysB.getElapsedGameTimeSeconds()).toBeCloseTo(1.0, 2);
    expect(sysA.getTotalTicks()).toBe(sysB.getTotalTicks());
  });

  it('clamps unusually large frame deltas to prevent spiral-of-death', () => {
    // 5.0 seconds real delta should be clamped to maxDeltaClamping (0.25s)
    const progressed = timeSystem.advance(5.0);
    expect(progressed).toBeCloseTo(0.25, 2);
    expect(timeSystem.getElapsedGameTimeSeconds()).toBeCloseTo(0.25, 2);
  });

  it('formats Mission Elapsed Time (MET) accurately', () => {
    expect(timeSystem.formatMET(0)).toBe('T+ 00d 00h 00m 00s');
    expect(timeSystem.formatMET(65)).toBe('T+ 00d 00h 01m 05s');
    expect(timeSystem.formatMET(3665)).toBe('T+ 00d 01h 01m 05s');
    expect(timeSystem.formatMET(90065)).toBe('T+ 01d 01h 01m 05s');
  });

  it('resets and restores time system state', () => {
    timeSystem.advance(0.2);
    expect(timeSystem.getElapsedGameTimeSeconds()).toBeGreaterThan(0);

    timeSystem.reset();
    expect(timeSystem.getElapsedGameTimeSeconds()).toBe(0);
    expect(timeSystem.getTotalTicks()).toBe(0);

    timeSystem.restore({
      elapsedGameTimeSeconds: 450.5,
      totalRealTimeSeconds: 300,
      totalTicks: 9010,
      timeScale: 5.0,
      isPaused: true,
    });

    const state = timeSystem.getState();
    expect(state.elapsedGameTimeSeconds).toBe(450.5);
    expect(state.totalTicks).toBe(9010);
    expect(state.timeScale).toBe(5.0);
    expect(state.isPaused).toBe(true);
  });
});
