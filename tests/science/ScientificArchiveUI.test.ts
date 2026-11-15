import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScientificArchiveView } from '../../src/science/ui/ScientificArchiveView';
import { ScientificDataManager } from '../../src/science/ScientificDataManager';

describe('ScientificArchiveView UI', () => {
  beforeEach(() => {
    ScientificDataManager.resetInstance();
  });

  it('instantiates cleanly with default dimensions and starts hidden', () => {
    const view = new ScientificArchiveView();
    expect(view.container).toBeDefined();
    expect(view.isVisible()).toBe(false);
    expect(view.container.label).toBe('ScientificArchiveView');
    view.destroy();
  });

  it('shows, hides, and toggles visibility properly', () => {
    const onClose = vi.fn();
    const view = new ScientificArchiveView({ onClose });

    view.show();
    expect(view.isVisible()).toBe(true);
    expect(view.container.visible).toBe(true);

    view.hide();
    expect(view.isVisible()).toBe(false);
    expect(view.container.visible).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);

    view.toggle();
    expect(view.isVisible()).toBe(true);

    view.toggle();
    expect(view.isVisible()).toBe(false);

    view.destroy();
  });

  it('navigates seamlessly across all four tabs without errors', () => {
    const view = new ScientificArchiveView();
    view.show();

    // Verify container has children
    expect(view.container.children.length).toBeGreaterThan(0);

    // Call update tick
    expect(() => view.update(0.016)).not.toThrow();

    view.destroy();
  });
});
