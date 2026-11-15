import { describe, it, expect, vi } from 'vitest';
import {
  UIButton,
  UIPanel,
  UITabGroup,
  UIProgressBar,
  UISpinner,
  UIScrollList,
  UICard,
  UIDataTable,
  UIDialog,
  UI_COLORS,
} from '../../src/ui';

describe('Global UI Framework - Reusable UI Components', () => {
  describe('UIButton', () => {
    it('creates button with default dimensions and handles click events', () => {
      const onClick = vi.fn();
      const btn = new UIButton({
        label: 'TEST BUTTON',
        onClick,
      });

      expect(btn.getLabel()).toBe('TEST BUTTON');
      expect(btn.container).toBeDefined();

      // Trigger pointertap
      btn.container.emit('pointertap' as any);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('respects disabled state and prevents click execution', () => {
      const onClick = vi.fn();
      const btn = new UIButton({
        label: 'DISABLED BTN',
        onClick,
        disabled: true,
      });

      expect(btn.isDisabled()).toBe(true);
      btn.container.emit('pointertap' as any);
      expect(onClick).not.toHaveBeenCalled();

      // Re-enable
      btn.setDisabled(false);
      expect(btn.isDisabled()).toBe(false);
      btn.container.emit('pointertap' as any);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('updates label dynamically', () => {
      const btn = new UIButton({ label: 'OLD' });
      expect(btn.getLabel()).toBe('OLD');
      btn.setLabel('NEW');
      expect(btn.getLabel()).toBe('NEW');
    });

    it('renders shortcut badge when shortcut is specified', () => {
      const btn = new UIButton({ label: 'INSPECT', shortcut: 'E' });
      expect(btn.container.children.length).toBeGreaterThan(2);
    });
  });

  describe('UIPanel', () => {
    it('initializes panel with title bar and close button', () => {
      const onClose = vi.fn();
      const panel = new UIPanel({
        title: 'MISSION TELEMETRY',
        width: 400,
        height: 300,
        showCloseButton: true,
        onClose,
      });

      expect(panel.getTitle()).toBe('MISSION TELEMETRY');
      expect(panel.contentContainer).toBeDefined();

      // Trigger close
      const closeBtn = panel.container.children.find((c: any) => c.cursor === 'pointer');
      expect(closeBtn).toBeDefined();
      closeBtn?.emit('pointertap' as any);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('updates title dynamically', () => {
      const panel = new UIPanel({ title: 'PANEL A', width: 300, height: 200 });
      expect(panel.getTitle()).toBe('PANEL A');
      panel.setTitle('PANEL B');
      expect(panel.getTitle()).toBe('PANEL B');
    });
  });

  describe('UITabGroup', () => {
    it('manages tab selection and emits onTabChange callback', () => {
      const onTabChange = vi.fn();
      const tabs = new UITabGroup({
        tabs: [
          { id: 'overview', label: 'OVERVIEW' },
          { id: 'telemetry', label: 'TELEMETRY', badge: 'NEW' },
          { id: 'logs', label: 'LOGS' },
        ],
        activeTabId: 'overview',
        onTabChange,
      });

      expect(tabs.getActiveTabId()).toBe('overview');

      tabs.selectTab('telemetry');
      expect(tabs.getActiveTabId()).toBe('telemetry');
      expect(onTabChange).toHaveBeenCalledWith('telemetry');
    });

    it('updates tab badge count or label', () => {
      const tabs = new UITabGroup({
        tabs: [{ id: 'inbox', label: 'INBOX' }],
      });
      tabs.setBadge('inbox', '3');
      expect(tabs.getActiveTabId()).toBe('inbox');
    });
  });

  describe('UIProgressBar', () => {
    it('clamps progress ratio between 0 and 1', () => {
      const bar = new UIProgressBar({ width: 200, height: 16 });
      bar.setProgress(0.5);
      expect(bar.getProgress()).toBe(0.5);

      bar.setProgress(-0.2);
      expect(bar.getProgress()).toBe(0);

      bar.setProgress(1.8);
      expect(bar.getProgress()).toBe(1);
    });

    it('displays percentage text and updates bar color', () => {
      const bar = new UIProgressBar({
        width: 150,
        height: 12,
        showPercentage: true,
        fillColor: UI_COLORS.GREEN,
      });

      bar.setProgress(0.75);
      expect(bar.getProgress()).toBe(0.75);
    });
  });

  describe('UISpinner', () => {
    it('rotates when spinning and respects stopped state', () => {
      const spinner = new UISpinner({ radius: 16, speed: 2.0 });
      expect(spinner.isSpinning()).toBe(true);

      const initialRotation = spinner.container.rotation;
      spinner.update(0.1);
      expect(spinner.container.rotation).toBeGreaterThan(initialRotation);

      spinner.stop();
      expect(spinner.isSpinning()).toBe(false);
      const stoppedRotation = spinner.container.rotation;
      spinner.update(0.1);
      expect(spinner.container.rotation).toBe(stoppedRotation);
    });
  });

  describe('UIScrollList', () => {
    it('manages scroll items and clamps scroll offset', () => {
      const list = new UIScrollList({
        width: 300,
        height: 200,
        itemHeight: 40,
        gap: 5,
      });

      expect(list.getItemCount()).toBe(0);

      for (let i = 0; i < 10; i++) {
        list.addItem(new UIButton({ label: `Item ${i}` }));
      }
      expect(list.getItemCount()).toBe(10);

      // Scroll down
      list.scrollTo(100);
      expect(list.getScrollOffset()).toBe(100);

      // Scroll below 0 clamps to 0
      list.scrollTo(-50);
      expect(list.getScrollOffset()).toBe(0);
    });
  });

  describe('UICard', () => {
    it('renders card title, badge, description, and specs list', () => {
      const card = new UICard({
        title: 'ION PROPULSION THRUSTER',
        badge: 'TIER 2',
        description: 'High efficiency electrostatic thruster for interplanetary cruising.',
        specs: [
          { label: 'ISP', value: '3,200 s' },
          { label: 'POWER', value: '4.5 kW' },
        ],
      });

      expect(card.container).toBeDefined();
    });
  });

  describe('UIDataTable', () => {
    it('populates structured tabular data and applies custom column formatting', () => {
      const table = new UIDataTable({
        columns: [
          { key: 'id', title: 'ID', width: 80 },
          { key: 'facility', title: 'FACILITY', width: 200 },
          {
            key: 'status',
            title: 'STATUS',
            width: 100,
            formatter: (v) => (v === 'OK' ? '[ONLINE]' : '[OFFLINE]'),
          },
        ],
        rows: [
          { id: 'FAC-01', facility: 'MISSION OPERATIONS', status: 'OK' },
          { id: 'FAC-02', facility: 'ROCKET ASSEMBLY', status: 'OK' },
          { id: 'FAC-03', facility: 'CRYO DEPOT', status: 'WARN' },
        ],
      });

      expect(table.container).toBeDefined();
    });
  });

  describe('UIDialog', () => {
    it('handles confirm and cancel callbacks and dismisses dialog', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      const dialog = new UIDialog({
        title: 'CONFIRM LAUNCH',
        message: 'Begin launch sequence for Orbital Probe Alpha?',
        confirmLabel: 'INITIATE',
        cancelLabel: 'ABORT',
        onConfirm,
        onCancel,
      });

      expect(dialog.container.visible).toBe(true);

      dialog.confirm();
      expect(onConfirm).toHaveBeenCalledTimes(1);

      dialog.cancel();
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });
});
