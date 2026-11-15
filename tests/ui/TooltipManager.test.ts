import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Container } from 'pixi.js';
import { TooltipManager } from '../../src/ui';

describe('Global UI Framework - Tooltip System', () => {
  let rootContainer: Container;
  let manager: TooltipManager;

  beforeEach(() => {
    vi.useFakeTimers();
    rootContainer = new Container();
    manager = new TooltipManager(rootContainer);
  });

  afterEach(() => {
    manager.destroy();
    vi.useRealTimers();
  });

  it('attaches tooltip to overlay container and is initially hidden', () => {
    expect(rootContainer.children).toContain(manager.tooltip.container);
    expect(manager.tooltip.container.visible).toBe(false);
  });

  it('shows tooltip immediately with show() and positions it within viewport', () => {
    manager.show(
      {
        title: 'RADIOISOTOPE GENERATOR',
        text: 'Nuclear power source for deep-space probes.',
        shortcut: 'T',
      },
      500,
      300
    );

    expect(manager.tooltip.container.visible).toBe(true);
    expect(manager.tooltip.container.position.x).toBeGreaterThan(500);
    expect(manager.tooltip.container.position.y).toBeGreaterThan(300);
  });

  it('clamps tooltip position inside 1920x1080 virtual boundaries', () => {
    manager.show(
      {
        text: 'Edge boundary test',
      },
      1910,
      1070
    );

    expect(manager.tooltip.container.position.x).toBeLessThan(1910);
    expect(manager.tooltip.container.position.y).toBeLessThan(1070);
  });

  it('handles target registration, hover delay, and pointerout dismiss', () => {
    const target = new Container();
    rootContainer.addChild(target);

    manager.register(target, {
      title: 'LAUNCH CLAMPS',
      text: 'Hold-down arms releasing vehicle at T-0.',
    });

    // Simulate pointerover
    target.emit('pointerover' as any, { global: { x: 200, y: 150 } });

    // Not yet visible before delay
    expect(manager.tooltip.container.visible).toBe(false);

    // Advance hover timer (250ms)
    vi.advanceTimersByTime(260);
    expect(manager.tooltip.container.visible).toBe(true);

    // Simulate pointerout
    target.emit('pointerout' as any);
    expect(manager.tooltip.container.visible).toBe(false);
  });

  it('hides tooltip cleanly on manager.hide()', () => {
    manager.show({ text: 'Active tooltip' }, 100, 100);
    expect(manager.tooltip.container.visible).toBe(true);

    manager.hide();
    expect(manager.tooltip.container.visible).toBe(false);
  });
});
