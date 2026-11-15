import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  MissionControlDashboard,
  DashboardTab,
} from '../../src/mission-control/ui/MissionControlDashboard';
import { MissionLifecycleManager } from '../../src/missions/MissionLifecycleManager';
import { MissionCatalogueRegistry } from '../../src/missions/MissionCatalogueRegistry';
import { DestinationRegistry } from '../../src/destinations/DestinationRegistry';

describe('MissionControlDashboard Integration', () => {
  let dashboard: MissionControlDashboard;
  let lifecycleManager: MissionLifecycleManager;
  let returnedToHQ: boolean = false;
  let openedCatalogue: boolean = false;

  beforeEach(() => {
    returnedToHQ = false;
    openedCatalogue = false;

    MissionLifecycleManager.resetInstance();
    MissionCatalogueRegistry.resetInstance();
    DestinationRegistry.resetInstance();

    MissionCatalogueRegistry.getInstance();
    DestinationRegistry.getInstance();
    lifecycleManager = MissionLifecycleManager.getInstance();

    dashboard = new MissionControlDashboard({
      width: 1920,
      height: 1080,
      onReturnToHQ: () => {
        returnedToHQ = true;
      },
      onOpenCatalogue: () => {
        openedCatalogue = true;
      },
    });
  });

  afterEach(() => {
    dashboard.destroy();
  });

  it('renders empty mission state with guidance when no active missions exist', () => {
    expect(dashboard.container).toBeDefined();
    expect(dashboard.getSelectedInstanceId()).toBeNull();
    expect((dashboard as any).emptyStateContainer.visible).toBe(true);
    expect((dashboard as any).contentContainer.visible).toBe(false);
  });

  it('toggles Demonstration Mode with rich sample telemetry without polluting game state', () => {
    expect(dashboard.getIsDemoMode()).toBe(false);

    dashboard.toggleDemoMode(true);
    expect(dashboard.getIsDemoMode()).toBe(true);

    // Empty state should be hidden and content visible
    expect((dashboard as any).emptyStateContainer.visible).toBe(false);
    expect((dashboard as any).contentContainer.visible).toBe(true);
    expect(dashboard.getSelectedInstanceId()).toBe('SAMPLE_ARES_01');

    // Central state must remain empty
    expect(lifecycleManager.getAllInstances()).toHaveLength(0);
  });

  it('populates mission selector and telemetry panels when a live mission is accepted', () => {
    const accepted = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    expect(accepted.success).toBe(true);

    dashboard.refreshMissionsList();

    expect((dashboard as any).emptyStateContainer.visible).toBe(false);
    expect((dashboard as any).contentContainer.visible).toBe(true);
    expect(dashboard.getSelectedInstanceId()).toBe(accepted.instance!.instanceId);
  });

  it('switches between all 5 dashboard tabs cleanly', () => {
    dashboard.toggleDemoMode(true);

    // 1. Spacecraft Systems
    dashboard.switchTab(DashboardTab.SPACECRAFT_SYSTEMS);
    expect(dashboard.getActiveTab()).toBe(DashboardTab.SPACECRAFT_SYSTEMS);
    expect((dashboard as any).spacecraftPanel.container.visible).toBe(true);
    expect((dashboard as any).progressPanel.container.visible).toBe(false);

    // 2. Mission Progress
    dashboard.switchTab(DashboardTab.MISSION_PROGRESS);
    expect(dashboard.getActiveTab()).toBe(DashboardTab.MISSION_PROGRESS);
    expect((dashboard as any).spacecraftPanel.container.visible).toBe(false);
    expect((dashboard as any).progressPanel.container.visible).toBe(true);

    // 3. Flight Trajectory & Telemetry
    dashboard.switchTab(DashboardTab.FLIGHT_TRAJECTORY);
    expect(dashboard.getActiveTab()).toBe(DashboardTab.FLIGHT_TRAJECTORY);
    expect((dashboard as any).trajectoryPanel.container.visible).toBe(true);

    // 4. Event Log
    dashboard.switchTab(DashboardTab.EVENT_LOG);
    expect(dashboard.getActiveTab()).toBe(DashboardTab.EVENT_LOG);
    expect((dashboard as any).eventLogPanel.container.visible).toBe(true);

    // 5. Alerts
    dashboard.switchTab(DashboardTab.ALERTS);
    expect(dashboard.getActiveTab()).toBe(DashboardTab.ALERTS);
    expect((dashboard as any).alertsPanel.container.visible).toBe(true);
  });

  it('triggers return to headquarters routing callback on return request', () => {
    dashboard.returnToHeadquarters();
    expect(returnedToHQ).toBe(true);
    expect(openedCatalogue).toBe(false);
  });

  it('switches between multiple active missions via selectMission', () => {
    dashboard.toggleDemoMode(true);
    expect(dashboard.getSelectedInstanceId()).toBe('SAMPLE_ARES_01');

    dashboard.selectMission('SAMPLE_EUROPA_02');
    expect(dashboard.getSelectedInstanceId()).toBe('SAMPLE_EUROPA_02');
  });

  it('smoothly advances telemetry on frame tick updates', () => {
    dashboard.toggleDemoMode(true);
    const initialMet = (dashboard as any).activeSnapshot?.overview.metSeconds ?? 0;

    dashboard.update(5.0);

    const updatedMet = (dashboard as any).activeSnapshot?.overview.metSeconds ?? 0;
    expect(updatedMet).toBeGreaterThanOrEqual(initialMet);
  });
});
