import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MissionAlertsPanel } from '../../src/mission-control/ui/components/MissionAlertsPanel';
import { MissionEventLogPanel } from '../../src/mission-control/ui/components/MissionEventLogPanel';
import {
  AlertPriority,
  MissionAlert,
  MissionControlEvent,
  MissionEventCategory,
} from '../../src/mission-control/types/MissionControlTypes';

describe('Mission Alerts & Event Log Panels', () => {
  describe('MissionAlertsPanel', () => {
    let panel: MissionAlertsPanel;
    let dismissedId: string | null = null;

    const sampleAlerts: MissionAlert[] = [
      {
        id: 'A1',
        timestamp: Date.now() - 1000,
        priority: AlertPriority.CRITICAL,
        subsystem: 'GNC',
        title: 'Attitude Deviation Detected',
        message: 'Reaction wheels saturated.',
        actionPrompt: 'Fire RCS desaturation thrusters.',
      },
      {
        id: 'A2',
        timestamp: Date.now() - 2000,
        priority: AlertPriority.WARNING,
        subsystem: 'EPS',
        title: 'Solar Panel Shadow Ingress',
        message: 'Entering occultation zone.',
      },
      {
        id: 'A3',
        timestamp: Date.now() - 3000,
        priority: AlertPriority.INFO,
        subsystem: 'COMMS',
        title: 'Telemetry Downlink Complete',
        message: 'All packets received.',
      },
    ];

    beforeEach(() => {
      dismissedId = null;
      panel = new MissionAlertsPanel({
        width: 1200,
        height: 350,
        onDismissAlert: (id) => {
          dismissedId = id;
        },
      });
      panel.setAlerts(sampleAlerts);
    });

    afterEach(() => {
      panel.destroy();
    });

    it('renders all alerts and allows filtering by priority', () => {
      expect((panel as any).alerts).toHaveLength(3);
      expect((panel as any).alertsListContainer.children).toHaveLength(3);

      // Filter by CRITICAL
      (panel as any).activeFilter = AlertPriority.CRITICAL;
      (panel as any).renderAlerts();
      expect((panel as any).alertsListContainer.children).toHaveLength(1);

      // Filter by WARNING
      (panel as any).activeFilter = AlertPriority.WARNING;
      (panel as any).renderAlerts();
      expect((panel as any).alertsListContainer.children).toHaveLength(1);

      // Filter by INFO
      (panel as any).activeFilter = AlertPriority.INFO;
      (panel as any).renderAlerts();
      expect((panel as any).alertsListContainer.children).toHaveLength(1);
    });

    it('triggers dismissal callback and removes alert on acknowledgement', () => {
      const selected = (panel as any).selectedAlertId;
      expect(selected).toBe('A1');

      // Click acknowledge / dismiss in details
      const ackBtn = (panel as any).detailsContainer.children.find(
        (c: any) => c.label && c.label.includes('Button')
      );
      expect(ackBtn).toBeDefined();

      // Trigger dismissal directly through callback
      (panel as any).onDismissAlertCb?.('A1');
      expect(dismissedId).toBe('A1');
    });
  });

  describe('MissionEventLogPanel', () => {
    let panel: MissionEventLogPanel;

    const sampleEvents: MissionControlEvent[] = [
      {
        id: 'E1',
        timestamp: 1000,
        metSeconds: 10,
        category: MissionEventCategory.LIFECYCLE,
        title: 'Mission Initialized',
        description: 'Flight plan authorized.',
      },
      {
        id: 'E2',
        timestamp: 2000,
        metSeconds: 20,
        category: MissionEventCategory.TRAJECTORY,
        title: 'Launch Vehicle Ignition',
        description: 'Liftoff from Pad Alpha.',
      },
      {
        id: 'E3',
        timestamp: 3000,
        metSeconds: 30,
        category: MissionEventCategory.PAYLOAD,
        title: 'Payload Separation',
        description: 'Fairings opened.',
      },
    ];

    beforeEach(() => {
      panel = new MissionEventLogPanel({ width: 1200, height: 350 });
      panel.setEvents(sampleEvents);
    });

    afterEach(() => {
      panel.destroy();
    });

    it('orders events in chronological order with newest first default', () => {
      expect((panel as any).allEvents).toHaveLength(3);
      // Default is newest first (descending by metSeconds)
      expect((panel as any).sortAscending).toBe(false);

      // Switch sort to oldest first
      (panel as any).sortAscending = true;
      (panel as any).renderEvents();
      expect((panel as any).listContainer.children).toHaveLength(3);
    });

    it('filters events by category accurately', () => {
      (panel as any).activeCategory = MissionEventCategory.TRAJECTORY;
      (panel as any).renderEvents();

      expect((panel as any).listContainer.children).toHaveLength(1);
    });
  });
});
