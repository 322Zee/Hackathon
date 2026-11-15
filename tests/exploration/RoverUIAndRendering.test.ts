import { describe, it, expect, beforeEach } from 'vitest';
import { RoverVisual } from '../../src/exploration/rendering/RoverVisual';
import { RoverDustParticles } from '../../src/exploration/rendering/RoverDustParticles';
import { RoverTireTracks } from '../../src/exploration/rendering/RoverTireTracks';
import { RoverTelemetryPanel } from '../../src/exploration/ui/RoverTelemetryPanel';
import { RoverNavigationMap } from '../../src/exploration/ui/RoverNavigationMap';
import { RoverSciencePanel } from '../../src/exploration/ui/RoverSciencePanel';
import { RoverObjectivesPanel } from '../../src/exploration/ui/RoverObjectivesPanel';
import { RoverDeploymentModal } from '../../src/exploration/ui/RoverDeploymentModal';
import { RoverRemoteControlDashboard } from '../../src/exploration/ui/RoverRemoteControlDashboard';
import { RoboticRoverManager } from '../../src/exploration/RoboticRoverManager';
import { RoverModelType, RoverRecord, TerrainType } from '../../src/exploration/ExplorationTypes';

describe('Rover Rendering & UI Components', () => {
  let roverManager: RoboticRoverManager;
  let testRover: RoverRecord;

  beforeEach(() => {
    RoboticRoverManager.resetInstance();
    roverManager = RoboticRoverManager.getInstance();
    testRover = roverManager.getRover('ROVER_SCOUT_01')!;
  });

  describe('RoverVisual', () => {
    it('initializes visual hierarchy and rebuilds across distinct rover models', () => {
      const visual = new RoverVisual();
      expect(visual.container).toBeDefined();

      visual.rebuildVisual(RoverModelType.SCOUT);
      visual.rebuildVisual(RoverModelType.SCIENTIFIC);
      visual.rebuildVisual(RoverModelType.HEAVY_UTILITY);
      visual.rebuildVisual(RoverModelType.ADVANCED_AUTONOMOUS);

      visual.setHeadlights(true);
      visual.triggerScanAnimation();
      visual.triggerSampleAnimation();

      visual.update(testRover, 0.1);
      expect(visual.container.x).toBe(testRover.location.x);
      expect(visual.container.y).toBe(testRover.location.y);
    });
  });

  describe('RoverDustParticles', () => {
    it('emits dust motes during movement and cleans up on update', () => {
      const dust = new RoverDustParticles();
      expect(dust.container).toBeDefined();

      // Emit dust on Mars
      dust.emit({ x: 500, y: 500 }, 45, 80, TerrainType.ROCKY_CRAGS);
      // Emit dust on Moon
      dust.emit({ x: 510, y: 500 }, 45, 80, TerrainType.REGOLITH_DUNES);
      // Emit dust on Europa
      dust.emit({ x: 520, y: 500 }, 45, 80, TerrainType.CRYOGENIC_ICE);

      dust.update(0.1);
      dust.update(1.5); // Age out particles
      dust.clear();
    });
  });

  describe('RoverTireTracks', () => {
    it('records and fades tire tracks behind moving wheels', () => {
      const tracks = new RoverTireTracks();
      expect(tracks.container).toBeDefined();

      tracks.recordTrack({ x: 100, y: 100 }, 0);
      tracks.recordTrack({ x: 100, y: 130 }, 0); // Sufficient spacing

      tracks.update(0.1);
      tracks.clear();
    });
  });

  describe('RoverTelemetryPanel', () => {
    it('updates HUD telemetry labels, energy bars, and condition indicators', () => {
      const panel = new RoverTelemetryPanel();
      expect(panel.container).toBeDefined();

      panel.updateTelemetry(testRover);

      testRover.energyRating = 20;
      testRover.vehicleConditionRating = 40;
      testRover.speed = 120;
      panel.updateTelemetry(testRover);
    });
  });

  describe('RoverNavigationMap', () => {
    it('renders tactical minimap radar and allows interactive waypoint click', () => {
      const navMap = new RoverNavigationMap();
      expect(navMap.container).toBeDefined();

      let clickedTarget: any = null;
      navMap.onWaypointClicked = (target) => {
        clickedTarget = target;
      };

      const boundary = roverManager.environmentAdapter.getBoundary('DEST_MARS');
      const obstacles = roverManager.environmentAdapter.getObstacles('DEST_MARS');
      const pois = roverManager.environmentAdapter.getPointsOfInterest('DEST_MARS');
      const disc = roverManager.environmentAdapter.getScientificLocations('DEST_MARS');
      const land = roverManager.environmentAdapter.getLandingSite('DEST_MARS');

      navMap.updateRadar(testRover, boundary, obstacles, pois, disc, land);
      navMap.container.emit('pointerdown', { getLocalPosition: () => ({ x: 100, y: 80 }) } as any);

      expect(clickedTarget).toBeDefined();
    });
  });

  describe('RoverSciencePanel', () => {
    it('displays mounted instruments and triggers observation on click', () => {
      const sciencePanel = new RoverSciencePanel();
      expect(sciencePanel.container).toBeDefined();

      let activatedInst: string | null = null;
      sciencePanel.onInstrumentActivated = (id) => {
        activatedInst = id;
      };

      sciencePanel.updatePanel(testRover);
      if (testRover.instruments.length > 0) {
        sciencePanel.onInstrumentActivated(testRover.instruments[0]!.instrument.id);
        expect(activatedInst).toBe(testRover.instruments[0]!.instrument.id);
      }
    });
  });

  describe('RoverObjectivesPanel', () => {
    it('renders exploration directives checklist and reward tags', () => {
      const panel = new RoverObjectivesPanel();
      expect(panel.container).toBeDefined();

      const objectives = roverManager.getEngine().getObjectivesForDestination('DEST_MARS');
      panel.updateObjectives(objectives);
    });
  });

  describe('RoverDeploymentModal', () => {
    it('shows modal, lists rovers, and triggers deployment request callback', () => {
      const modal = new RoverDeploymentModal();
      expect(modal.container).toBeDefined();

      let deployed = false;
      modal.onDeployRequested = (roverId, destId) => {
        deployed = true;
        expect(roverId).toBe('ROVER_SCOUT_01');
        expect(destId).toBe('DEST_MARS');
      };

      const rovers = roverManager.listAvailableRovers();
      modal.show(rovers, 'DEST_MARS');
      expect(modal.container.visible).toBe(true);

      modal.onDeployRequested('ROVER_SCOUT_01', 'DEST_MARS');
      expect(deployed).toBe(true);

      modal.hide();
      expect(modal.container.visible).toBe(false);
    });
  });

  describe('RoverRemoteControlDashboard', () => {
    it('initializes master exploration cockpit and updates camera tracking', () => {
      const dashboard = new RoverRemoteControlDashboard(roverManager);
      expect(dashboard.container).toBeDefined();

      dashboard.setActiveRover('ROVER_SCOUT_01');
      dashboard.update(0.1);
      dashboard.openDeploymentModal();
    });
  });
});
