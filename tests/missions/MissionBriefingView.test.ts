import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  MissionBriefingView,
  BriefingSectionTab,
} from '../../src/missions/ui/MissionBriefingView';
import { MissionCatalogueRegistry } from '../../src/missions/MissionCatalogueRegistry';
import { DestinationRegistry } from '../../src/destinations/DestinationRegistry';
import { MissionDefinition } from '../../src/missions/MissionTypes';

describe('MissionBriefingView', () => {
  let view: MissionBriefingView;
  let catalogueRegistry: MissionCatalogueRegistry;

  beforeEach(() => {
    MissionCatalogueRegistry.resetInstance();
    DestinationRegistry.resetInstance();
    catalogueRegistry = MissionCatalogueRegistry.getInstance();

    view = new MissionBriefingView({
      x: 30,
      y: 130,
      width: 1860,
      height: 920,
    });
  });

  afterEach(() => {
    view.destroy();
    MissionCatalogueRegistry.resetInstance();
    DestinationRegistry.resetInstance();
  });

  it('initializes UI layout and components cleanly', () => {
    expect(view.container.position.x).toBe(30);
    expect(view.container.position.y).toBe(130);
    expect(view.getMission()).toBeNull();
    expect(view.getBriefingModel()).toBeNull();
  });

  it('loads mission and generates complete briefing presentation', () => {
    const mission = catalogueRegistry.getMissionById('EARTH_LEO_DEPLOYMENT_01');
    expect(mission).toBeDefined();

    view.setMission(mission!);

    expect(view.getMission()?.id).toBe('EARTH_LEO_DEPLOYMENT_01');
    expect(view.getBriefingModel()?.missionId).toBe('EARTH_LEO_DEPLOYMENT_01');
    expect(view.getActiveTab()).toBe(BriefingSectionTab.OVERVIEW_OBJECTIVES);
  });

  it('navigates seamlessly across all 4 briefing section tabs', () => {
    const mission = catalogueRegistry.getMissionById('EARTH_LEO_DEPLOYMENT_01');
    view.setMission(mission!);

    // Tab 2: Destination & Environment
    view.setActiveTab(BriefingSectionTab.DESTINATION_ENVIRONMENT);
    expect(view.getActiveTab()).toBe(BriefingSectionTab.DESTINATION_ENVIRONMENT);

    // Tab 3: Engineering Constraints & Trade-Offs
    view.setActiveTab(BriefingSectionTab.ENGINEERING_CONSTRAINTS);
    expect(view.getActiveTab()).toBe(BriefingSectionTab.ENGINEERING_CONSTRAINTS);

    // Tab 4: Prerequisites & Budget
    view.setActiveTab(BriefingSectionTab.PREREQUISITES_BUDGET);
    expect(view.getActiveTab()).toBe(BriefingSectionTab.PREREQUISITES_BUDGET);

    // Tab 1: Overview & Objectives
    view.setActiveTab(BriefingSectionTab.OVERVIEW_OBJECTIVES);
    expect(view.getActiveTab()).toBe(BriefingSectionTab.OVERVIEW_OBJECTIVES);
  });

  it('fires onReturnToCatalogue callback', () => {
    let returned = false;
    const customView = new MissionBriefingView({
      onReturnToCatalogue: () => {
        returned = true;
      },
    });

    const mission = catalogueRegistry.getMissionById('EARTH_LEO_DEPLOYMENT_01');
    customView.setMission(mission!);

    // Trigger callback
    (customView as any).onReturnToCatalogueCb?.();
    expect(returned).toBe(true);

    customView.destroy();
  });

  it('handles mission acceptance and transitions status state', () => {
    let acceptedMission: MissionDefinition | null = null;
    const customView = new MissionBriefingView({
      onMissionAccepted: (m) => {
        acceptedMission = m;
      },
    });

    const mission = catalogueRegistry.getMissionById('EARTH_LEO_DEPLOYMENT_01');
    customView.setMission(mission!);

    const acceptSuccess = customView.handleAcceptMission();
    expect(acceptSuccess).toBe(true);
    expect((acceptedMission as any)?.id).toBe('EARTH_LEO_DEPLOYMENT_01');
    expect(catalogueRegistry.isMissionActive('EARTH_LEO_DEPLOYMENT_01')).toBe(true);

    // Briefing model should now reflect active state
    expect(customView.getBriefingModel()?.isActive).toBe(true);

    customView.destroy();
  });

  it('rejects mission acceptance when prerequisites are unmet (Mars Orbiter)', () => {
    const customView = new MissionBriefingView();
    const marsMission = catalogueRegistry.getMissionById('MARS_ORBITER_01');
    customView.setMission(marsMission!);

    const acceptSuccess = customView.handleAcceptMission();
    expect(acceptSuccess).toBe(false);
    expect(catalogueRegistry.isMissionActive('MARS_ORBITER_01')).toBe(false);

    customView.destroy();
  });
});
