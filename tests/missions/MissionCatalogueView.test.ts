import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MissionCatalogueView } from '../../src/missions/ui/MissionCatalogueView';
import { MissionCatalogueRegistry } from '../../src/missions/MissionCatalogueRegistry';
import { DestinationRegistry } from '../../src/destinations/DestinationRegistry';
import { DestinationId } from '../../src/destinations/DestinationTypes';
import { MissionCategory, MissionDefinition } from '../../src/missions/MissionTypes';

describe('MissionCatalogueView', () => {
  let view: MissionCatalogueView;
  let catalogueRegistry: MissionCatalogueRegistry;

  beforeEach(() => {
    MissionCatalogueRegistry.resetInstance();
    DestinationRegistry.resetInstance();
    catalogueRegistry = MissionCatalogueRegistry.getInstance();

    view = new MissionCatalogueView({
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

  it('initializes UI layout and selects an initial mission', () => {
    expect(view.container.position.x).toBe(30);
    expect(view.container.position.y).toBe(130);

    const selected = view.getSelectedMission();
    expect(selected).toBeDefined();
    expect(selected?.id).toBe('EARTH_LEO_DEPLOYMENT_01');
  });

  it('filters missions by destination ID', () => {
    view.setDestinationFilter(DestinationId.EARTH_ORBIT_LEO);
    expect(view.getDestinationFilter()).toBe(DestinationId.EARTH_ORBIT_LEO);

    const selected = view.getSelectedMission();
    expect(selected?.destinationId).toBe(DestinationId.EARTH_ORBIT_LEO);

    view.setDestinationFilter(null);
    expect(view.getDestinationFilter()).toBeNull();
  });

  it('selects specific missions and updates detailed dossier', () => {
    view.selectMission('MOON_ORBIT_SURVEY_01');
    const selected = view.getSelectedMission();
    expect(selected?.id).toBe('MOON_ORBIT_SURVEY_01');
    expect(selected?.name).toContain('Selene Prospect');
  });

  it('fires callbacks on mission selection and map navigation', () => {
    let selectedMissionId = '';
    let navDestinationId: DestinationId | null = null;

    const customView = new MissionCatalogueView({
      onSelectMission: (m: MissionDefinition) => {
        selectedMissionId = m.id;
      },
      onViewOnMap: (destId: DestinationId) => {
        navDestinationId = destId;
      },
    });

    customView.selectMission('MARS_ORBITER_01');
    expect(selectedMissionId).toBe('MARS_ORBITER_01');
    expect(navDestinationId).toBeNull();

    customView.destroy();
  });

  it('distinguishes COMBINED mission delivery and exploration objectives in dossier', () => {
    const combinedMissions = catalogueRegistry.getMissionsByCategory(MissionCategory.COMBINED);
    expect(combinedMissions.length).toBeGreaterThan(0);

    const combinedMission = combinedMissions[0]!;
    view.selectMission(combinedMission.id);

    expect(view.getSelectedMission()?.category).toBe(MissionCategory.COMBINED);
    const deliveryObjs = combinedMission.mainObjectives.filter((o) => o.isDeliveryObjective);
    const exploreObjs = combinedMission.mainObjectives.filter((o) => o.isExplorationObjective);

    expect(deliveryObjs.length).toBeGreaterThan(0);
    expect(exploreObjs.length).toBeGreaterThan(0);
  });
});
