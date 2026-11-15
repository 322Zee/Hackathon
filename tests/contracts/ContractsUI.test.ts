import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContractsFundingView } from '../../src/contracts/ui/ContractsFundingView';
import { ContractsFundingManager } from '../../src/contracts/ContractsFundingManager';

describe('ContractsFundingView UI', () => {
  beforeEach(() => {
    ContractsFundingManager.resetInstance();
  });

  it('instantiates cleanly and begins in hidden state', () => {
    const view = new ContractsFundingView();
    expect(view.container).toBeDefined();
    expect(view.isVisible()).toBe(false);
    expect(view.container.label).toBe('ContractsFundingView');
    view.destroy();
  });

  it('toggles visibility and fires onClose callback when hidden', () => {
    const onClose = vi.fn();
    const view = new ContractsFundingView({ onClose });

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

  it('renders without throwing and updates cleanly on animation ticks', () => {
    const view = new ContractsFundingView();
    view.show();

    expect(view.container.children.length).toBeGreaterThan(0);
    expect(() => view.update(0.016)).not.toThrow();

    view.destroy();
  });
});
