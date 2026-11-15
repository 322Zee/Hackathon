import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TelemetryGauge } from '../../src/mission-control/ui/components/TelemetryGauge';
import { SignalStrengthMeter } from '../../src/mission-control/ui/components/SignalStrengthMeter';
import { MilestoneTracker } from '../../src/mission-control/ui/components/MilestoneTracker';
import { MilestoneState } from '../../src/mission-control/types/MissionControlTypes';

describe('Telemetry Visual Components & Gauges', () => {
  describe('TelemetryGauge', () => {
    let gauge: TelemetryGauge;

    beforeEach(() => {
      gauge = new TelemetryGauge({
        label: 'Main Battery',
        min: 0,
        max: 100,
        unit: '%',
        warningThreshold: 25,
        criticalThreshold: 10,
      });
    });

    afterEach(() => {
      gauge.destroy();
    });

    it('renders normal available telemetry value with units and nominal status', () => {
      gauge.setValue({
        available: true,
        value: 85,
        unit: '%',
      });

      expect(gauge.getIsAvailable()).toBe(true);
      expect(gauge.getCurrentValue()).toBe(85);
      expect((gauge as any).valueText.text).toBe('85 %');
      expect((gauge as any).statusText.text).toBe('NOMINAL');
    });

    it('evaluates warning and critical thresholds accurately', () => {
      gauge.setValue({
        available: true,
        value: 20, // Warning <= 25
      });
      expect((gauge as any).statusText.text).toBe('WARNING LEVEL');

      gauge.setValue({
        available: true,
        value: 5, // Critical <= 10
      });
      expect((gauge as any).statusText.text).toBe('CRITICAL LEVEL');
    });

    it('clearly distinguishes unavailable state from zero value without misleading values', () => {
      gauge.setValue({
        available: false,
        statusText: 'FEED DISCONNECTED [SIM REQUIRED]',
      });

      expect(gauge.getIsAvailable()).toBe(false);
      expect(gauge.getCurrentValue()).toBeUndefined();
      expect((gauge as any).valueText.text).toBe('N/A');
      expect((gauge as any).statusText.text).toContain('FEED DISCONNECTED');
    });
  });

  describe('SignalStrengthMeter', () => {
    let meter: SignalStrengthMeter;

    beforeEach(() => {
      meter = new SignalStrengthMeter({ width: 280, height: 80 });
    });

    afterEach(() => {
      meter.destroy();
    });

    it('renders radio carrier telemetry when comms signal is available', () => {
      meter.setSignal(
        { available: true, value: 78 },
        { available: true, value: -94.2 },
        { available: true, value: 14.5 },
        { available: true, value: 'DSN GOLDSTONE' }
      );

      expect((meter as any).dbmText.text).toBe('-94.2 dBm');
      expect((meter as any).delayText.text).toContain('14.5s');
      expect((meter as any).stationText.text).toContain('DSN GOLDSTONE');
    });

    it('renders NO CARRIER and UNLINKED when comms network is offline', () => {
      meter.setSignal(
        { available: false },
        { available: false },
        { available: false, statusText: 'UNLINKED' },
        { available: false, statusText: 'UNLINKED' }
      );

      expect((meter as any).dbmText.text).toBe('NO CARRIER');
      expect((meter as any).delayText.text).toContain('UNLINKED');
      expect((meter as any).stationText.text).toContain('UNLINKED');
    });
  });

  describe('MilestoneTracker', () => {
    let tracker: MilestoneTracker;

    beforeEach(() => {
      tracker = new MilestoneTracker({ width: 800, height: 100 });
    });

    afterEach(() => {
      tracker.destroy();
    });

    it('builds milestone timeline nodes with completed, in-progress, and pending states', () => {
      tracker.setMilestones([
        {
          id: 'MS_1',
          title: 'Launch',
          description: 'Ascent phase',
          scheduledMetSeconds: 0,
          state: MilestoneState.COMPLETED,
        },
        {
          id: 'MS_2',
          title: 'TMI Burn',
          description: 'Trans-Mars Injection',
          scheduledMetSeconds: 3600,
          state: MilestoneState.IN_PROGRESS,
        },
        {
          id: 'MS_3',
          title: 'Mars Insertion',
          description: 'Orbital capture',
          scheduledMetSeconds: 86400 * 200,
          state: MilestoneState.PENDING,
        },
      ]);

      expect((tracker as any).nodesContainer.children).toHaveLength(3);
    });
  });
});
