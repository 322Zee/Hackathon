import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  ActiveMissionsDashboardView,
  ActiveMissionFilter,
} from '../../src/missions/ui/ActiveMissionsDashboardView';
import { MissionLifecycleManager } from '../../src/missions/MissionLifecycleManager';
import { MissionCatalogueRegistry } from '../../src/missions/MissionCatalogueRegistry';
import { MissionLifecycleState } from '../../src/missions/MissionLifecycleTypes';
import { FacilityId } from '../../src/facilities/FacilityTypes';

describe('ActiveMissionsDashboardView', () => {
  let view: ActiveMissionsDashboardView;
  let lifecycleManager: MissionLifecycleManager;

  beforeEach(() => {
    MissionLifecycleManager.resetInstance();
    MissionCatalogueRegistry.resetInstance();

    MissionCatalogueRegistry.getInstance();
    lifecycleManager = MissionLifecycleManager.getInstance();

    view = new ActiveMissionsDashboardView({
      x: 30,
      y: 130,
      width: 1860,
      height: 920,
    });
  });

  afterEach(() => {
    view.destroy();
  });

  it('renders container frame and empty state when no missions are active', () => {
    expect(view.container).toBeDefined();
    expect(view.container.children.length).toBeGreaterThanOrEqual(3);
    expect(view.getSelectedInstanceId()).toBeNull();
  });

  it('displays mission instance card and detailed dossier when a mission is accepted', () => {
    const accepted = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    expect(accepted.success).toBe(true);

    view.refresh();
    expect(view.getSelectedInstanceId()).toBe(accepted.instance?.instanceId);

    const instance = lifecycleManager.getInstance(accepted.instance!.instanceId);
    expect(instance?.status).toBe(MissionLifecycleState.ACCEPTED);
  });

  it('filters active instances by preparation, flight ready, and archive', () => {
    const pioneer = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    expect(pioneer.success).toBe(true);

    // Initial state: ACCEPTED belongs to ALL_ACTIVE and PREPARING
    view.refresh();
    expect(view.getSelectedInstanceId()).toBe(pioneer.instance!.instanceId);

    // Cancel mission to move to archive
    lifecycleManager.cancelMission(pioneer.instance!.instanceId);

    view.refresh();
    // Default filter is ALL_ACTIVE, cancelled mission should be excluded
    expect(view.getSelectedInstanceId()).toBeNull();

    // Switch to ARCHIVE filter
    (view as any).activeFilter = ActiveMissionFilter.ARCHIVE;
    view.refresh();
    expect(view.getSelectedInstanceId()).toBe(pioneer.instance!.instanceId);
  });

  it('triggers onNavigateToFacility callback with preserved mission context', () => {
    let routedFacility: FacilityId | null = null;
    let routedMissionId: string | null = null;

    const customView = new ActiveMissionsDashboardView({
      onNavigateToFacility: (facId, inst) => {
        routedFacility = facId;
        routedMissionId = inst.missionId;
      },
    });

    const accepted = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    customView.refresh();

    // Simulate clicking facility navigation
    (customView as any).onNavigateToFacilityCb?.(
      FacilityId.ROCKET_ENGINEERING,
      accepted.instance!
    );

    expect(routedFacility).toBe(FacilityId.ROCKET_ENGINEERING);
    expect(routedMissionId).toBe('EARTH_LEO_DEPLOYMENT_01');

    customView.destroy();
  });

  it('opens confirmation dialog on cancel mission request', () => {
    const accepted = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    view.refresh();

    (view as any).promptCancelMission(accepted.instance!);
    expect((view as any).cancelDialog).toBeDefined();

    // Confirm cancellation through dialog
    (view as any).cancelDialog['onConfirmCallback']?.();

    expect(lifecycleManager.getInstance(accepted.instance!.instanceId)?.status).toBe(
      MissionLifecycleState.CANCELLED
    );
  });
});
