/**
 * INTERSTELLAR CONTINUUM - Rover Remote Control Dashboard
 * Master cockpit interface for operating robotic rovers on planetary surfaces.
 * Integrates camera tracking, 2D terrain visuals, rover rendering, dust motes, and HUD panels.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import {
  ExplorationBoundary,
  PointOfInterest,
  RoverControlInput,
  ScientificDiscoveryLocation,
  SurfaceObstacle,
  Vector2D,
} from '../ExplorationTypes';
import { RoverVisual } from '../rendering/RoverVisual';
import { RoverDustParticles } from '../rendering/RoverDustParticles';
import { RoverTireTracks } from '../rendering/RoverTireTracks';
import { RoverTelemetryPanel } from './RoverTelemetryPanel';
import { RoverNavigationMap } from './RoverNavigationMap';
import { RoverSciencePanel } from './RoverSciencePanel';
import { RoverObjectivesPanel } from './RoverObjectivesPanel';
import { RoverDeploymentModal } from './RoverDeploymentModal';
import { RoboticRoverManager } from '../RoboticRoverManager';
import { UI_COLORS } from '../../ui/core/UIDesignTokens';

export class RoverRemoteControlDashboard {
  public readonly container: Container = new Container();

  // World layer containers (moved by camera)
  private worldContainer: Container = new Container();
  private groundGraphics: Graphics = new Graphics();
  private obstaclesGraphics: Graphics = new Graphics();
  private poisGraphics: Graphics = new Graphics();
  private landingPadGraphics: Graphics = new Graphics();
  private tireTracks: RoverTireTracks = new RoverTireTracks();
  private dustParticles: RoverDustParticles = new RoverDustParticles();
  private roverVisual: RoverVisual = new RoverVisual();

  // Screen-space HUD layer
  private hudContainer: Container = new Container();
  private telemetryPanel: RoverTelemetryPanel = new RoverTelemetryPanel();
  private navigationMap: RoverNavigationMap = new RoverNavigationMap();
  private sciencePanel: RoverSciencePanel = new RoverSciencePanel();
  private objectivesPanel: RoverObjectivesPanel = new RoverObjectivesPanel();
  private deploymentModal: RoverDeploymentModal = new RoverDeploymentModal();
  private controlPromptBar: Graphics = new Graphics();
  private controlPromptText: Text;
  private missionClockText: Text;

  // Active rover reference
  private activeRoverId: string = 'ROVER_SCOUT_01';
  private currentInput: RoverControlInput = { forward: 0, steer: 0, brake: false };
  private activeKeys: Set<string> = new Set();

  // Camera coordinates
  private cameraX: number = 0;
  private cameraY: number = 0;

  private roverManager: RoboticRoverManager;

  constructor(roverManager?: RoboticRoverManager) {
    this.roverManager = roverManager || RoboticRoverManager.getInstance();
    this.container.label = 'RoverRemoteControlDashboard';

    // 1. Build World Scene Graph
    this.container.addChild(this.worldContainer);
    this.worldContainer.addChild(this.groundGraphics);
    this.worldContainer.addChild(this.landingPadGraphics);
    this.worldContainer.addChild(this.tireTracks.container);
    this.worldContainer.addChild(this.dustParticles.container);
    this.worldContainer.addChild(this.obstaclesGraphics);
    this.worldContainer.addChild(this.poisGraphics);
    this.worldContainer.addChild(this.roverVisual.container);

    // 2. Build HUD Scene Graph
    this.container.addChild(this.hudContainer);

    // Position HUD Panels
    this.telemetryPanel.container.position.set(24, 24);
    this.hudContainer.addChild(this.telemetryPanel.container);

    this.navigationMap.container.position.set(1920 - 284, 24);
    this.hudContainer.addChild(this.navigationMap.container);

    this.sciencePanel.container.position.set(24, 1080 - 254);
    this.hudContainer.addChild(this.sciencePanel.container);

    this.objectivesPanel.container.position.set(1920 - 364, 1080 - 224);
    this.hudContainer.addChild(this.objectivesPanel.container);

    // Bottom prompt bar
    this.hudContainer.addChild(this.controlPromptBar);
    const promptStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 11,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_PRIMARY,
      letterSpacing: 1,
    });
    this.controlPromptText = new Text({
      text: '[W/S] THROTTLE/REVERSE   [A/D] STEER   [SPACE] BRAKE   [SHIFT] BOOST   [C] CRAWL   [E] SCAN   [AUTONOMOUS: CLICK MAP]',
      style: promptStyle,
    });
    this.controlPromptText.anchor.set(0.5, 0.5);
    this.controlPromptText.position.set(960, 1055);
    this.hudContainer.addChild(this.controlPromptText);

    // Top Header Banner
    const clockStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 12,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
    });
    this.missionClockText = new Text({ text: 'REMOTE SURFACE OPERATIONS // TELECOMMAND LINK ACTIVE', style: clockStyle });
    this.missionClockText.anchor.set(0.5, 0);
    this.missionClockText.position.set(960, 16);
    this.hudContainer.addChild(this.missionClockText);

    // Deployment Modal on top
    this.hudContainer.addChild(this.deploymentModal.container);

    // Wire callbacks
    this.setupInteractivity();
    this.setupKeyboardListeners();
    this.drawPromptBar();
  }

  private drawPromptBar(): void {
    this.controlPromptBar.clear();
    this.controlPromptBar.roundRect(380, 1040, 1160, 30, 4);
    this.controlPromptBar.fill({ color: UI_COLORS.BG_PANEL, alpha: 0.90 });
    this.controlPromptBar.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
  }

  private setupInteractivity(): void {
    // Click on radar minimap sets autonomous waypoint
    this.navigationMap.onWaypointClicked = (targetWorld) => {
      this.roverManager.setRoverTarget(this.activeRoverId, targetWorld);
    };

    // Instrument activated
    this.sciencePanel.onInstrumentActivated = (instrumentId) => {
      this.roverVisual.triggerScanAnimation();
      if (instrumentId.includes('DRILL')) {
        this.roverVisual.triggerSampleAnimation();
      }
      this.roverManager.collectRoverObservation(this.activeRoverId, instrumentId);
    };

    // Modal deploy callback
    this.deploymentModal.onDeployRequested = (roverId, destId) => {
      this.activeRoverId = roverId;
      this.roverManager.deployRover(roverId, destId);
      const r = this.roverManager.getRover(roverId);
      if (r) {
        this.roverVisual.rebuildVisual(r.model);
      }
    };
  }

  private setupKeyboardListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', (e) => {
      this.activeKeys.add(e.code);
      this.updateInputFromKeys();

      // Quick action keys
      if (e.code === 'KeyE') {
        const rover = this.roverManager.getRover(this.activeRoverId);
        if (rover && rover.instruments.length > 0) {
          const instId = rover.instruments[0]!.instrument.id;
          this.sciencePanel.onInstrumentActivated?.(instId);
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.activeKeys.delete(e.code);
      this.updateInputFromKeys();
    });
  }

  private updateInputFromKeys(): void {
    let forward = 0;
    let steer = 0;

    if (this.activeKeys.has('KeyW') || this.activeKeys.has('ArrowUp')) forward += 1.0;
    if (this.activeKeys.has('KeyS') || this.activeKeys.has('ArrowDown')) forward -= 1.0;
    if (this.activeKeys.has('KeyD') || this.activeKeys.has('ArrowRight')) steer += 1.0;
    if (this.activeKeys.has('KeyA') || this.activeKeys.has('ArrowLeft')) steer -= 1.0;

    const brake = this.activeKeys.has('Space');
    const boost = this.activeKeys.has('ShiftLeft') || this.activeKeys.has('ShiftRight');
    const crawl = this.activeKeys.has('KeyC');

    this.currentInput = { forward, steer, brake, boost, crawl };
    this.roverManager.controlRover(this.activeRoverId, this.currentInput);
  }

  public setActiveRover(roverId: string): void {
    this.activeRoverId = roverId;
    const r = this.roverManager.getRover(roverId);
    if (r) {
      this.roverVisual.rebuildVisual(r.model);
    }
  }

  public openDeploymentModal(): void {
    const rovers = this.roverManager.listAvailableRovers();
    this.deploymentModal.show(rovers);
  }

  /**
   * Main per-frame update loop for the operations dashboard.
   */
  public update(deltaSeconds: number): void {
    // 1. Tick Rover Simulation Engine
    this.roverManager.update(deltaSeconds);

    const rover = this.roverManager.getRover(this.activeRoverId);
    if (!rover) return;

    // 2. Camera Tracking with deadzone damping
    const targetCamX = 960 - rover.location.x;
    const targetCamY = 540 - rover.location.y;
    this.cameraX += (targetCamX - this.cameraX) * Math.min(1.0, 5.0 * deltaSeconds);
    this.cameraY += (targetCamY - this.cameraY) * Math.min(1.0, 5.0 * deltaSeconds);

    this.worldContainer.position.set(this.cameraX, this.cameraY);

    // 3. Update Visuals
    this.roverVisual.update(rover, deltaSeconds);

    // Dust particles & tire tracks
    if (Math.abs(rover.speed) > 10) {
      this.dustParticles.emit(
        rover.location,
        rover.location.headingDeg,
        rover.speed,
        rover.location.currentTerrain
      );
      this.tireTracks.recordTrack(rover.location, rover.location.headingDeg);
    }

    this.dustParticles.update(deltaSeconds);
    this.tireTracks.update(deltaSeconds);

    // 4. Render Surface Environment Graphics (Ground, Obstacles, POIs)
    const destinationId = rover.destinationId;
    const boundary = this.roverManager.environmentAdapter.getBoundary(destinationId);
    const obstacles = this.roverManager.environmentAdapter.getObstacles(destinationId);
    const pois = this.roverManager.environmentAdapter.getPointsOfInterest(destinationId);
    const discoveries = this.roverManager.environmentAdapter.getScientificLocations(destinationId);
    const landingSite = this.roverManager.environmentAdapter.getLandingSite(destinationId);

    this.drawTerrain(destinationId, boundary, landingSite);
    this.drawObstacles(obstacles);
    this.drawPointsOfInterest(pois, discoveries);

    // 5. Update HUD Panels
    this.telemetryPanel.updateTelemetry(rover);
    this.navigationMap.updateRadar(rover, boundary, obstacles, pois, discoveries, landingSite);
    this.sciencePanel.updatePanel(rover);

    const objectives = this.roverManager.getEngine().getObjectivesForDestination(destinationId);
    this.objectivesPanel.updateObjectives(objectives);
  }

  private drawTerrain(destinationId: string, boundary: ExplorationBoundary, landingSite: Vector2D): void {
    this.groundGraphics.clear();

    // Determine planet surface base color
    let groundColor = 0xb45309; // Mars terracotta / reddish amber
    let gridColor = 0x92400e;
    if (destinationId === 'DEST_MOON') {
      groundColor = 0x334155; // Moon regolith slate
      gridColor = 0x1e293b;
    } else if (destinationId === 'DEST_EUROPA') {
      groundColor = 0x0284c7; // Europa cryo-ice blue
      gridColor = 0x0369a1;
    }

    // Outer boundary fill
    this.groundGraphics.rect(boundary.minX, boundary.minY, boundary.maxX - boundary.minX, boundary.maxY - boundary.minY);
    this.groundGraphics.fill({ color: groundColor });
    this.groundGraphics.stroke({ color: UI_COLORS.CYAN, width: 3.0 });

    // Grid coordinate lines
    for (let x = boundary.minX; x <= boundary.maxX; x += 200) {
      this.groundGraphics.moveTo(x, boundary.minY);
      this.groundGraphics.lineTo(x, boundary.maxY);
      this.groundGraphics.stroke({ color: gridColor, width: 0.5, alpha: 0.4 });
    }
    for (let y = boundary.minY; y <= boundary.maxY; y += 200) {
      this.groundGraphics.moveTo(boundary.minX, y);
      this.groundGraphics.lineTo(boundary.maxX, y);
      this.groundGraphics.stroke({ color: gridColor, width: 0.5, alpha: 0.4 });
    }

    // Landing Pad Area
    this.landingPadGraphics.clear();
    this.landingPadGraphics.circle(landingSite.x, landingSite.y, 70);
    this.landingPadGraphics.fill({ color: 0x1e293b, alpha: 0.85 });
    this.landingPadGraphics.stroke({ color: UI_COLORS.GREEN, width: 2.0 });

    // Landing Pad Cross & Compass
    this.landingPadGraphics.moveTo(landingSite.x - 50, landingSite.y);
    this.landingPadGraphics.lineTo(landingSite.x + 50, landingSite.y);
    this.landingPadGraphics.stroke({ color: UI_COLORS.GREEN, width: 1.5 });

    this.landingPadGraphics.moveTo(landingSite.x, landingSite.y - 50);
    this.landingPadGraphics.lineTo(landingSite.x, landingSite.y + 50);
    this.landingPadGraphics.stroke({ color: UI_COLORS.GREEN, width: 1.5 });
  }

  private drawObstacles(obstacles: SurfaceObstacle[]): void {
    this.obstaclesGraphics.clear();
    for (const obs of obstacles) {
      // Drop shadow for boulder
      this.obstaclesGraphics.ellipse(obs.x + 4, obs.y + 6, obs.radius * 0.9, obs.radius * 0.55);
      this.obstaclesGraphics.fill({ color: 0x000000, alpha: 0.45 });

      // Obstacle rock body
      this.obstaclesGraphics.circle(obs.x, obs.y, obs.radius);
      this.obstaclesGraphics.fill({ color: 0x475569 });
      this.obstaclesGraphics.stroke({ color: 0x1e293b, width: 2.0 });

      // Highlight bevel
      this.obstaclesGraphics.circle(obs.x - obs.radius * 0.3, obs.y - obs.radius * 0.3, obs.radius * 0.35);
      this.obstaclesGraphics.fill({ color: 0x64748b, alpha: 0.6 });
    }
  }

  private drawPointsOfInterest(pois: PointOfInterest[], discoveries: ScientificDiscoveryLocation[]): void {
    this.poisGraphics.clear();

    // Render POIs
    for (const poi of pois) {
      const color = poi.isDiscovered ? UI_COLORS.AMBER : 0x64748b;

      // Range ring
      this.poisGraphics.circle(poi.x, poi.y, poi.discoveryRadius);
      this.poisGraphics.stroke({ color, width: 1.0, alpha: 0.3 });

      // Center marker
      this.poisGraphics.circle(poi.x, poi.y, 8);
      this.poisGraphics.fill({ color });
      this.poisGraphics.stroke({ color: UI_COLORS.TEXT_PRIMARY, width: 1.5 });
    }

    // Render Scientific Discovery Sites
    for (const sci of discoveries) {
      const color = sci.isSampled ? UI_COLORS.TEXT_MUTED : UI_COLORS.CYAN;

      this.poisGraphics.circle(sci.x, sci.y, sci.samplingRadius);
      this.poisGraphics.stroke({ color, width: 1.0, alpha: sci.isSampled ? 0.2 : 0.5 });

      // Core icon
      this.poisGraphics.rect(sci.x - 4, sci.y - 6, 8, 12);
      this.poisGraphics.fill({ color });
      this.poisGraphics.stroke({ color: 0x0f172a, width: 1.0 });
    }
  }
}
