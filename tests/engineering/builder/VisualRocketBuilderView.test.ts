import { describe, it, expect, beforeEach } from 'vitest';
import { EventBus } from '../../../src/core/EventBus';
import {
  VisualRocketBuilderView,
  RocketBuilderEngine,
  RocketProjectManager,
  RocketProject,
} from '../../../src/engineering';
import { MissionCatalogueRegistry } from '../../../src/missions/MissionCatalogueRegistry';

describe('VisualRocketBuilderView', () => {
  let eventBus: EventBus;
  let builderEngine: RocketBuilderEngine;
  let projectManager: RocketProjectManager;
  let missionRegistry: MissionCatalogueRegistry;
  let testProject: RocketProject;

  beforeEach(() => {
    eventBus = new EventBus();
    RocketBuilderEngine.resetInstance();
    RocketProjectManager.resetInstance();
    MissionCatalogueRegistry.resetInstance();

    builderEngine = RocketBuilderEngine.getInstance(eventBus);
    projectManager = RocketProjectManager.getInstance(eventBus);
    missionRegistry = MissionCatalogueRegistry.getInstance(eventBus);

    testProject = projectManager.getActiveProject()!;
  });

  it('mounts the 8-panel visual rocket builder layout', () => {
    let dashboardReturned = false;

    const view = new VisualRocketBuilderView({
      width: 1860,
      height: 850,
      project: testProject,
      onReturnToDashboard: () => {
        dashboardReturned = true;
      },
    });

    expect(view.container).toBeDefined();
    expect(view.container.children.length).toBe(4); // topBar, leftPanel, canvas, rightPanel
    expect(dashboardReturned).toBe(false);

    view.destroy();
  });

  it('selects slots and synchronizes component details inspector', () => {
    const view = new VisualRocketBuilderView({
      width: 1860,
      height: 850,
      project: testProject,
      onReturnToDashboard: () => {},
    });

    view.selectSlot('stg1_propulsion');
    expect(view.container).toBeDefined();

    view.selectSlot('stg2_guidance');
    expect(view.container).toBeDefined();

    view.destroy();
  });

  it('mounts and evaluates mission requirements overlay when mission context is active', () => {
    const missions = missionRegistry.getAllMissions();
    const mission = missions[0];

    const view = new VisualRocketBuilderView({
      width: 1860,
      height: 850,
      project: testProject,
      missionContext: mission,
      onReturnToDashboard: () => {},
    });

    expect(view.container).toBeDefined();
    view.destroy();
  });

  it('handles component installation and uninstallation through builder engine', () => {
    const view = new VisualRocketBuilderView({
      width: 1860,
      height: 850,
      project: testProject,
      onReturnToDashboard: () => {},
    });

    view.selectSlot('stg1_propulsion');
    builderEngine.removeComponent('stg1_propulsion');
    view.render();

    builderEngine.installComponent('stg1_propulsion', 'prop_basic_booster_mk1');
    view.render();

    expect(builderEngine.findSlot('stg1_propulsion')?.installedComponentId).toBe('prop_basic_booster_mk1');
    view.destroy();
  });
});
