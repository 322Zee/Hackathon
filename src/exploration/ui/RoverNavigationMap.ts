/**
 * INTERSTELLAR CONTINUUM - Rover Navigation Radar Minimap
 * 2D vector tactical overview of planetary surface, sector boundaries,
 * points of interest, obstacles, and autonomous waypoint plotting.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import {
  ExplorationBoundary,
  PointOfInterest,
  RoverRecord,
  ScientificDiscoveryLocation,
  SurfaceObstacle,
  Vector2D,
} from '../ExplorationTypes';
import { UI_COLORS } from '../../ui/core/UIDesignTokens';

export class RoverNavigationMap {
  public readonly container: Container = new Container();

  private background: Graphics = new Graphics();
  private mapContent: Graphics = new Graphics();
  private titleText: Text;
  private coordText: Text;

  private readonly MAP_WIDTH = 260;
  private readonly MAP_HEIGHT = 200;

  // Callback when player clicks map to plot autonomous waypoint
  public onWaypointClicked?: (targetWorldCoords: Vector2D) => void;

  private currentBoundary: ExplorationBoundary = { minX: 0, maxX: 3000, minY: 0, maxY: 2000 };

  constructor() {
    this.container.label = 'RoverNavigationMap';
    this.container.addChild(this.background);
    this.container.addChild(this.mapContent);

    const titleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 10,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
      letterSpacing: 1,
    });

    const coordStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 9,
      fill: UI_COLORS.TEXT_MUTED,
    });

    this.titleText = new Text({ text: 'TACTICAL SURFACE RADAR', style: titleStyle });
    this.titleText.position.set(12, 8);
    this.container.addChild(this.titleText);

    this.coordText = new Text({ text: 'POS: (0, 0)', style: coordStyle });
    this.coordText.position.set(12, this.MAP_HEIGHT - 16);
    this.container.addChild(this.coordText);

    this.container.eventMode = 'static';
    this.container.cursor = 'crosshair';

    this.container.on('pointerdown', (event) => {
      const local = event.getLocalPosition(this.container);
      if (
        local.x >= 10 &&
        local.x <= this.MAP_WIDTH - 10 &&
        local.y >= 26 &&
        local.y <= this.MAP_HEIGHT - 24
      ) {
        const worldCoords = this.mapToWorld(local.x, local.y);
        if (this.onWaypointClicked) {
          this.onWaypointClicked(worldCoords);
        }
      }
    });

    this.drawBackground();
  }

  private drawBackground(): void {
    this.background.clear();
    this.background.roundRect(0, 0, this.MAP_WIDTH, this.MAP_HEIGHT, 6);
    this.background.fill({ color: UI_COLORS.BG_DARK, alpha: 0.92 });
    this.background.stroke({ color: UI_COLORS.BORDER_DEFAULT, width: 1.5 });

    // Inner radar grid rect
    this.background.rect(10, 26, this.MAP_WIDTH - 20, this.MAP_HEIGHT - 50);
    this.background.stroke({ color: 0x1e3a5f, width: 1.0 });

    // Grid crosslines
    const midX = 10 + (this.MAP_WIDTH - 20) * 0.5;
    const midY = 26 + (this.MAP_HEIGHT - 50) * 0.5;
    this.background.moveTo(10, midY);
    this.background.lineTo(this.MAP_WIDTH - 10, midY);
    this.background.stroke({ color: 0x1e293b, width: 0.75 });

    this.background.moveTo(midX, 26);
    this.background.lineTo(midX, this.MAP_HEIGHT - 24);
    this.background.stroke({ color: 0x1e293b, width: 0.75 });
  }

  private worldToMap(wx: number, wy: number): { x: number; y: number } {
    const bw = this.currentBoundary.maxX - this.currentBoundary.minX;
    const bh = this.currentBoundary.maxY - this.currentBoundary.minY;

    const innerW = this.MAP_WIDTH - 20;
    const innerH = this.MAP_HEIGHT - 50;

    const normX = (wx - this.currentBoundary.minX) / Math.max(1, bw);
    const normY = (wy - this.currentBoundary.minY) / Math.max(1, bh);

    return {
      x: 10 + normX * innerW,
      y: 26 + normY * innerH,
    };
  }

  private mapToWorld(mx: number, my: number): Vector2D {
    const innerW = this.MAP_WIDTH - 20;
    const innerH = this.MAP_HEIGHT - 50;

    const normX = Math.max(0, Math.min(1, (mx - 10) / innerW));
    const normY = Math.max(0, Math.min(1, (my - 26) / innerH));

    const bw = this.currentBoundary.maxX - this.currentBoundary.minX;
    const bh = this.currentBoundary.maxY - this.currentBoundary.minY;

    return {
      x: this.currentBoundary.minX + normX * bw,
      y: this.currentBoundary.minY + normY * bh,
    };
  }

  public updateRadar(
    rover: RoverRecord,
    boundary: ExplorationBoundary,
    obstacles: SurfaceObstacle[],
    pois: PointOfInterest[],
    scientificLocations: ScientificDiscoveryLocation[],
    landingSite: Vector2D
  ): void {
    this.currentBoundary = boundary;
    this.coordText.text = `POS: (${rover.location.x.toFixed(0)}, ${rover.location.y.toFixed(0)}) // DISCOVERIES: ${rover.stats.observationsCollected}`;

    this.mapContent.clear();

    // 1. Draw Landing Site / Base Marker
    const landPt = this.worldToMap(landingSite.x, landingSite.y);
    this.mapContent.circle(landPt.x, landPt.y, 4.5);
    this.mapContent.stroke({ color: UI_COLORS.GREEN, width: 1.5 });
    this.mapContent.circle(landPt.x, landPt.y, 1.5);
    this.mapContent.fill({ color: UI_COLORS.GREEN });

    // 2. Draw Obstacles
    for (const obs of obstacles) {
      const pt = this.worldToMap(obs.x, obs.y);
      this.mapContent.circle(pt.x, pt.y, 2.5);
      this.mapContent.fill({ color: 0x475569, alpha: 0.8 });
    }

    // 3. Draw Points of Interest
    for (const poi of pois) {
      const pt = this.worldToMap(poi.x, poi.y);
      if (poi.isDiscovered) {
        // Discovered POI is bright diamond
        this.mapContent.moveTo(pt.x, pt.y - 4);
        this.mapContent.lineTo(pt.x + 4, pt.y);
        this.mapContent.lineTo(pt.x, pt.y + 4);
        this.mapContent.lineTo(pt.x - 4, pt.y);
        this.mapContent.closePath();
        this.mapContent.fill({ color: UI_COLORS.AMBER });
      } else {
        // Undiscovered is subtle ring
        this.mapContent.circle(pt.x, pt.y, 3);
        this.mapContent.stroke({ color: 0x64748b, width: 1.0, alpha: 0.6 });
      }
    }

    // 4. Draw Scientific Discovery Sites
    for (const sci of scientificLocations) {
      const pt = this.worldToMap(sci.x, sci.y);
      this.mapContent.circle(pt.x, pt.y, 3);
      this.mapContent.stroke({ color: sci.isSampled ? UI_COLORS.TEXT_MUTED : UI_COLORS.CYAN, width: 1.2 });
    }

    // 5. Draw Autonomous Target & Path Line
    if (rover.autonomousTarget) {
      const roverPt = this.worldToMap(rover.location.x, rover.location.y);
      const targetPt = this.worldToMap(rover.autonomousTarget.x, rover.autonomousTarget.y);

      this.mapContent.moveTo(roverPt.x, roverPt.y);
      this.mapContent.lineTo(targetPt.x, targetPt.y);
      this.mapContent.stroke({ color: UI_COLORS.CYAN, width: 1.0, alpha: 0.7 });

      // Target reticle
      this.mapContent.circle(targetPt.x, targetPt.y, 5);
      this.mapContent.stroke({ color: UI_COLORS.CYAN, width: 1.5 });
      this.mapContent.circle(targetPt.x, targetPt.y, 1.5);
      this.mapContent.fill({ color: UI_COLORS.CYAN });
    }

    // 6. Draw Rover Position Reticle with Heading Arrow
    const rPt = this.worldToMap(rover.location.x, rover.location.y);
    const headingRad = ((rover.location.headingDeg - 90) * Math.PI) / 180;
    const arrowX = rPt.x + Math.cos(headingRad) * 8;
    const arrowY = rPt.y + Math.sin(headingRad) * 8;

    this.mapContent.circle(rPt.x, rPt.y, 4);
    this.mapContent.fill({ color: UI_COLORS.TEXT_PRIMARY });
    this.mapContent.stroke({ color: UI_COLORS.CYAN, width: 1.5 });

    this.mapContent.moveTo(rPt.x, rPt.y);
    this.mapContent.lineTo(arrowX, arrowY);
    this.mapContent.stroke({ color: UI_COLORS.CYAN, width: 2.0 });
  }
}
