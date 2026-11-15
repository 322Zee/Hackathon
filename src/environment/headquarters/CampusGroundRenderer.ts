/**
 * INTERSTELLAR CONTINUUM - Headquarters Campus Ground & Pathway Renderer
 * Multi-layered procedural ground surfaces, asphalt roads, pedestrian promenades, plaza paving, and launch tracks
 */

import { Container, Graphics } from 'pixi.js';
import { CAMPUS_WIDTH, CAMPUS_HEIGHT, CAMPUS_FACILITIES } from './CampusTypes';

export class CampusGroundRenderer {
  public readonly container: Container;

  constructor() {
    this.container = new Container();
    this.container.label = 'CampusGroundLayer';
    this.render();
  }

  public render(): void {
    this.container.removeChildren();

    const groundGfx = new Graphics();
    this.container.addChild(groundGfx);

    // -------------------------------------------------------------------------
    // 1. BASE EARTH & MANICURED LAWN TERRAIN
    // -------------------------------------------------------------------------
    // Dark lush aerospace campus grass
    groundGfx.rect(0, 0, CAMPUS_WIDTH, CAMPUS_HEIGHT);
    groundGfx.fill({ color: 0x14271b });

    // Subtle grass grid texture / lawn mowing stripe pattern
    const stripeWidth = 60;
    groundGfx.stroke({ color: 0x172d20, width: 2 });
    for (let x = 0; x < CAMPUS_WIDTH; x += stripeWidth) {
      groundGfx
        .rect(x, 0, stripeWidth / 2, CAMPUS_HEIGHT)
        .fill({ color: 0x182f21, alpha: 0.35 });
    }

    // -------------------------------------------------------------------------
    // 2. VEHICULAR ASPHALT ROADS (Main Arteries)
    // -------------------------------------------------------------------------
    const roadColor = 0x17202c;
    const roadBorder = 0x2e3d4f;
    const roadWidth = 90;

    // A. Main West-East Arterial Road (y = 1420, from Arrival Gate to Launch Complex)
    this.drawRoadSegment(groundGfx, 200, 1420, 3100, 1420, roadWidth, roadColor, roadBorder);

    // B. Main North-South Central Boulevard (x = 1800, from North Labs through Plaza to MOC)
    this.drawRoadSegment(groundGfx, 1800, 300, 1800, 2100, roadWidth, roadColor, roadBorder);

    // C. West Wing Perimeter Road (x = 450, from Arrival Gate north to Spacecraft Lab)
    this.drawRoadSegment(groundGfx, 450, 450, 450, 2100, 80, roadColor, roadBorder);

    // D. East Wing Industrial Access Road (x = 2750, from Manufacturing to VAB)
    this.drawRoadSegment(groundGfx, 2750, 350, 2750, 1420, 80, roadColor, roadBorder);

    // -------------------------------------------------------------------------
    // 3. CENTRAL HEADQUARTERS PLAZA (Navigational Landmark)
    // -------------------------------------------------------------------------
    const plazaX = 1800;
    const plazaY = 1200;
    const plazaRadius = 240;

    // Base octagonal plaza slab
    groundGfx
      .circle(plazaX, plazaY, plazaRadius)
      .fill({ color: 0x1e2a38, alpha: 0.95 })
      .stroke({ color: 0x384a5c, width: 4 });

    // Inner concentric decorative paving rings
    groundGfx
      .circle(plazaX, plazaY, plazaRadius - 30)
      .stroke({ color: 0x00f0ff, width: 2, alpha: 0.4 })
      .circle(plazaX, plazaY, plazaRadius - 70)
      .fill({ color: 0x182230, alpha: 0.8 })
      .stroke({ color: 0x2e4157, width: 2 })
      .circle(plazaX, plazaY, plazaRadius - 130)
      .stroke({ color: 0x00f0ff, width: 1.5, alpha: 0.3 });

    // Center Inlaid Agency Compass Rose Emblem
    groundGfx
      .circle(plazaX, plazaY, 65)
      .fill({ color: 0x0c1420, alpha: 0.95 })
      .stroke({ color: 0x00f0ff, width: 2.5 });

    // Compass cardinal star arms
    groundGfx
      .moveTo(plazaX, plazaY - 55).lineTo(plazaX + 12, plazaY - 12).lineTo(plazaX + 55, plazaY)
      .lineTo(plazaX + 12, plazaY + 12).lineTo(plazaX, plazaY + 55).lineTo(plazaX - 12, plazaY + 12)
      .lineTo(plazaX - 55, plazaY).lineTo(plazaX - 12, plazaY - 12).closePath();
    groundGfx.fill({ color: 0x00f0ff, alpha: 0.65 });

    groundGfx.circle(plazaX, plazaY, 15).fill({ color: 0xffffff });

    // -------------------------------------------------------------------------
    // 4. PEDESTRIAN PROMENADES & RECESSED GUIDE PATHWAYS (50px wide)
    // -------------------------------------------------------------------------
    const walkColor = 0x223042;
    const walkBorder = 0x36485c;

    // Connect Central Plaza to each campus facility entrance
    for (const fac of Object.values(CAMPUS_FACILITIES)) {
      if (fac.id === 'FAC_CENTRAL_PLAZA_KIOSK') continue;

      this.drawWalkway(
        groundGfx,
        plazaX,
        plazaY,
        fac.entranceX,
        fac.entranceY,
        48,
        walkColor,
        walkBorder,
        fac.accentColor
      );

      // Apron slab in front of facility door
      groundGfx
        .roundRect(fac.entranceX - 45, fac.entranceY - 20, 90, 40, 6)
        .fill({ color: 0x2a3b50, alpha: 0.9 })
        .stroke({ color: fac.accentColor, width: 2, alpha: 0.8 });
    }

    // -------------------------------------------------------------------------
    // 5. ROCKET ASSEMBLY & CRAWLER ROLLOUT TRACK (VAB to Pad Alpha)
    // -------------------------------------------------------------------------
    const railStartX = 2750;
    const railStartY = 1250;
    const railEndX = 3050;
    const railEndY = 1750;

    // Concrete crawlerway bed
    groundGfx
      .moveTo(railStartX - 40, railStartY)
      .lineTo(railEndX - 40, railEndY)
      .lineTo(railEndX + 40, railEndY)
      .lineTo(railStartX + 40, railStartY)
      .closePath();
    groundGfx.fill({ color: 0x2c3540 }).stroke({ color: 0x475569, width: 3 });

    // Steel rails & railroad sleepers
    const numSleepers = 20;
    for (let i = 0; i <= numSleepers; i++) {
      const t = i / numSleepers;
      const sx = railStartX + (railEndX - railStartX) * t;
      const sy = railStartY + (railEndY - railStartY) * t;
      groundGfx
        .rect(sx - 35, sy - 3, 70, 6)
        .fill({ color: 0x1f242b })
        .stroke({ color: 0xf59e0b, width: 1, alpha: 0.4 });
    }

    // -------------------------------------------------------------------------
    // 6. PHYSICAL LAUNCH COMPLEX: PAD ALPHA APRON & FLAME DEFLECTOR TRENCH
    // -------------------------------------------------------------------------
    const pad = CAMPUS_FACILITIES.LAUNCH_COMPLEX_PAD_ALPHA!;
    const padX = pad.x;
    const padY = pad.y;

    // Blast-resistant heavy concrete hexagonal foundation
    groundGfx
      .poly([
        padX - 190, padY - 110,
        padX, padY - 210,
        padX + 190, padY - 110,
        padX + 190, padY + 110,
        padX, padY + 210,
        padX - 190, padY + 110,
      ])
      .fill({ color: 0x28313d })
      .stroke({ color: 0xd97706, width: 5 });

    // Inner Launch Mount Apron
    groundGfx
      .circle(padX, padY, 130)
      .fill({ color: 0x1c242e })
      .stroke({ color: 0xef4444, width: 3, alpha: 0.8 });

    // Flame Trench Pit (Deep black-orange heat-resistant opening)
    groundGfx
      .roundRect(padX - 60, padY - 80, 120, 160, 8)
      .fill({ color: 0x0a0c10 })
      .stroke({ color: 0xf97316, width: 3 });

    // Trench steel deflector grill slats
    for (let gy = padY - 70; gy <= padY + 70; gy += 15) {
      groundGfx.moveTo(padX - 55, gy).lineTo(padX + 55, gy).stroke({ color: 0x334155, width: 3 });
    }

    // Yellow hazard boundary stripes around pad
    groundGfx
      .circle(padX, padY, 175)
      .stroke({ color: 0xfbbf24, width: 2, alpha: 0.6 });

    // -------------------------------------------------------------------------
    // 7. ROBOTICS REGOLITH SURFACE SIMULATION YARD (South-West)
    // -------------------------------------------------------------------------
    const robYardX = 650;
    const robYardY = 2170;
    // Simulated red/gray Martian regolith obstacle terrain
    groundGfx
      .roundRect(robYardX - 140, robYardY - 60, 280, 120, 10)
      .fill({ color: 0x4a2a1e })
      .stroke({ color: 0xeab308, width: 2 });

    // Craters and boulders in yard
    groundGfx.circle(robYardX - 70, robYardY - 10, 22).fill({ color: 0x3d2015 });
    groundGfx.circle(robYardX + 60, robYardY + 15, 28).fill({ color: 0x3d2015 });
    groundGfx.circle(robYardX + 10, robYardY - 20, 14).fill({ color: 0x3d2015 });
  }

  private drawRoadSegment(
    gfx: Graphics,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    width: number,
    roadColor: number,
    borderColor: number
  ): void {
    const isHorizontal = Math.abs(y2 - y1) < Math.abs(x2 - x1);

    if (isHorizontal) {
      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      const y = (y1 + y2) / 2;

      // Base Asphalt
      gfx
        .rect(minX, y - width / 2, maxX - minX, width)
        .fill({ color: roadColor })
        .stroke({ color: borderColor, width: 2.5 });

      // Yellow dashed center stripe
      const dashLen = 30;
      const gapLen = 20;
      for (let curX = minX + 10; curX < maxX - 10; curX += dashLen + gapLen) {
        gfx
          .rect(curX, y - 2, Math.min(dashLen, maxX - curX), 4)
          .fill({ color: 0xf59e0b, alpha: 0.7 });
      }
    } else {
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);
      const x = (x1 + x2) / 2;

      // Base Asphalt
      gfx
        .rect(x - width / 2, minY, width, maxY - minY)
        .fill({ color: roadColor })
        .stroke({ color: borderColor, width: 2.5 });

      // Yellow dashed center stripe
      const dashLen = 30;
      const gapLen = 20;
      for (let curY = minY + 10; curY < maxY - 10; curY += dashLen + gapLen) {
        gfx
          .rect(x - 2, curY, 4, Math.min(dashLen, maxY - curY))
          .fill({ color: 0xf59e0b, alpha: 0.7 });
      }
    }
  }

  private drawWalkway(
    gfx: Graphics,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    width: number,
    walkColor: number,
    borderColor: number,
    glowAccentColor: number
  ): void {
    // 2-segment L-shaped or direct path
    const midX = x2;
    const midY = y1;

    // Horizontal arm
    const minX = Math.min(x1, midX);
    const maxX = Math.max(x1, midX);
    if (maxX - minX > 5) {
      gfx
        .rect(minX, y1 - width / 2, maxX - minX, width)
        .fill({ color: walkColor })
        .stroke({ color: borderColor, width: 1.5 });

      // Glowing center strip
      gfx
        .rect(minX, y1 - 1.5, maxX - minX, 3)
        .fill({ color: glowAccentColor, alpha: 0.3 });
    }

    // Vertical arm
    const minY = Math.min(midY, y2);
    const maxY = Math.max(midY, y2);
    if (maxY - minY > 5) {
      gfx
        .rect(midX - width / 2, minY, width, maxY - minY)
        .fill({ color: walkColor })
        .stroke({ color: borderColor, width: 1.5 });

      // Glowing center strip
      gfx
        .rect(midX - 1.5, minY, 3, maxY - minY)
        .fill({ color: glowAccentColor, alpha: 0.3 });
    }
  }
}
