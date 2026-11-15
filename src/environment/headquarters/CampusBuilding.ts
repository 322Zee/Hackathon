/**
 * INTERSTELLAR CONTINUUM - 2.5D Campus Building Architecture
 * Procedural architectural generation for aerospace campus facilities, cleanrooms, hangars, and command centres
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { CampusFacilityData } from './CampusTypes';
import { BoxCollider } from '../../collision/BoxCollider';
import { CollisionCategory } from '../../collision/ColliderTypes';
import { BuildingEntrance } from '../../interaction/BuildingEntrance';
import { IInteractiveObject } from '../../interaction/InteractionTypes';

export class CampusBuilding {
  public readonly data: CampusFacilityData;
  public readonly container: Container;
  public readonly collider: BoxCollider;
  public readonly interactiveObject: IInteractiveObject;

  constructor(
    data: CampusFacilityData,
    onInteract?: (buildingId: string, context?: any) => Promise<any>
  ) {
    this.data = data;
    this.container = new Container();
    this.container.label = `Building_${data.id}`;

    // Depth sorting anchor at bottom edge of building footprint
    this.container.zIndex = data.y + data.height / 2;

    // Render architectural geometry
    this.renderBuilding();

    // 1. Establish Solid Footprint Collider
    // Solid collider covers upper 70% of building, leaving lower 30% for walkable entrance portico
    const colliderHeight = data.height * 0.75;
    const colliderY = data.y - data.height / 2;

    this.collider = new BoxCollider({
      id: `col_${data.id}`,
      x: data.x - data.width / 2,
      y: colliderY,
      width: data.width,
      height: colliderHeight,
      category: CollisionCategory.SOLID,
      tag: data.id,
      data: { displayName: data.name },
    });

    // 2. Establish Entrance Interactive Entity
    const actionLabel = this.getActionLabel(data);

    this.interactiveObject = new BuildingEntrance({
      id: `interact_${data.id}`,
      buildingId: data.id,
      interiorId: `${data.id}_INTERIOR`,
      displayName: data.name,
      actionText: actionLabel,
      x: data.entranceX,
      y: data.entranceY,
      interactionRadius: 95,
      priority: 5,
    });

    if (onInteract) {
      this.interactiveObject.onInteract = async (context) => {
        return onInteract(data.id, context);
      };
    }
  }

  private getActionLabel(data: CampusFacilityData): string {
    switch (data.id) {
      case 'FAC_CENTRAL_PLAZA_KIOSK':
        return 'Access Settings & Administration';
      case 'FAC_LAUNCH_COMPLEX_PAD_ALPHA':
        return 'Access Launch Complex Pad Alpha';
      case 'FAC_ARRIVAL_GATE':
        return 'Access Main Arrival & Security';
      case 'FAC_MISSION_OPERATIONS':
        return 'Enter Mission Operations';
      case 'FAC_ROCKET_ENGINEERING':
        return 'Enter Rocket Engineering';
      case 'FAC_SPACECRAFT_LAB':
        return 'Enter Spacecraft & Satellite Laboratory';
      case 'FAC_RESEARCH_DEVELOPMENT':
        return 'Enter Research & Development';
      case 'FAC_FINANCE_ADMIN':
        return 'Enter Finance & Administration';
      case 'FAC_MANUFACTURING_CENTRE':
        return 'Enter Resource & Manufacturing';
      case 'ROBOTICS_CENTRE':
      case 'FAC_ROBOTICS_CENTRE':
        return 'Enter Robotics & Exploration';
      case 'COMMUNICATIONS_CENTRE':
      case 'FAC_COMMUNICATIONS_CENTRE':
        return 'Enter Communication & Network Centre';
      case 'PLANETARY_DATA_CENTRE':
      case 'FAC_PLANETARY_DATA_CENTRE':
        return 'Enter Planetary Research & Data';
      default:
        return `Enter ${data.name.replace(/\s*\(.*?\)\s*/g, '')}`;
    }
  }

  private renderBuilding(): void {
    const gfx = new Graphics();
    this.container.addChild(gfx);

    const w = this.data.width;
    const h = this.data.height;
    const cx = this.data.x;
    const cy = this.data.y;
    const left = cx - w / 2;
    const top = cy - h / 2;

    // -------------------------------------------------------------
    // 1. GROUND AMBIENT OCCLUSION & DROP SHADOW
    // -------------------------------------------------------------
    gfx
      .roundRect(left - 12, top + h * 0.4, w + 24, h * 0.65, 12)
      .fill({ color: 0x050a12, alpha: 0.5 });

    // -------------------------------------------------------------
    // 2. MAIN 2.5D BUILDING PODIUM / BASE CLADDING
    // -------------------------------------------------------------
    const wallColor = 0x162232;
    const wallTrim = 0x2b3d54;

    // Base Wall Block
    gfx
      .roundRect(left, top, w, h, 8)
      .fill({ color: wallColor })
      .stroke({ color: wallTrim, width: 2.5 });

    // Architectural Facade Paneling (Horizontal architectural grooves)
    const panelSpacing = 24;
    for (let py = top + 20; py < top + h - 45; py += panelSpacing) {
      gfx
        .moveTo(left + 6, py)
        .lineTo(left + w - 6, py)
        .stroke({ color: 0x101a26, width: 1.5 });
    }

    // -------------------------------------------------------------
    // 3. TINTED GLASS CURTAIN WALLS & WINDOWS
    // -------------------------------------------------------------
    const windowY = top + 25;
    const windowHeight = h * 0.42;
    const windowWidth = w - 30;

    // Window frame
    gfx
      .roundRect(left + 15, windowY, windowWidth, windowHeight, 4)
      .fill({ color: 0x0a121e })
      .stroke({ color: this.data.accentColor, width: 1.5, alpha: 0.65 });

    // Vertical Mullions & Glowing Office/Lab Lights
    const numPanels = Math.floor(windowWidth / 35);
    const panelW = windowWidth / numPanels;
    for (let i = 0; i < numPanels; i++) {
      const wx = left + 15 + i * panelW;

      // Illuminated office glow
      const isLit = (i + (this.data.width % 3)) % 2 === 0;
      if (isLit) {
        gfx
          .rect(wx + 2, windowY + 2, panelW - 4, windowHeight - 4)
          .fill({ color: 0x38bdf8, alpha: 0.22 });
      }

      // Vertical mullion line
      if (i > 0) {
        gfx
          .moveTo(wx, windowY)
          .lineTo(wx, windowY + windowHeight)
          .stroke({ color: 0x1c2b3d, width: 1 });
      }
    }

    // -------------------------------------------------------------
    // 4. ROOF DECK & OVERHANG PARAPET
    // -------------------------------------------------------------
    const roofOverhang = 8;
    gfx
      .roundRect(left - roofOverhang, top - 8, w + roofOverhang * 2, 22, 4)
      .fill({ color: 0x1e2e42 })
      .stroke({ color: this.data.accentColor, width: 2 });

    // Glowing architectural roof edge strip
    gfx
      .rect(left - roofOverhang + 4, top + 10, w + roofOverhang * 2 - 8, 3)
      .fill({ color: this.data.accentColor, alpha: 0.85 });

    // Roof Fixtures according to roofDetails
    this.renderRoofDetails(gfx, cx, top, w);

    // -------------------------------------------------------------
    // 5. ENTRANCE PORTICO & AIRLOCK BULKHEAD DOORS
    // -------------------------------------------------------------
    const doorW = 54;
    const doorH = 38;
    const doorX = cx - doorW / 2;
    const doorY = top + h - doorH - 4;

    // Doorway canopy frame
    gfx
      .roundRect(doorX - 6, doorY - 8, doorW + 12, doorH + 10, 4)
      .fill({ color: 0x0c1420 })
      .stroke({ color: this.data.accentColor, width: 2 });

    // Glass / metallic sliding door panels
    gfx
      .rect(doorX, doorY, doorW / 2 - 1, doorH)
      .fill({ color: 0x18283d })
      .rect(doorX + doorW / 2 + 1, doorY, doorW / 2 - 1, doorH)
      .fill({ color: 0x18283d });

    // Threshold indicator light (Active Green / Cyan)
    gfx
      .circle(doorX + doorW / 2, doorY - 4, 3)
      .fill({ color: 0x4ade80 });

    // -------------------------------------------------------------
    // 6. GLOWING DEPARTMENT SIGNAGE LABEL
    // -------------------------------------------------------------
    const signBgW = Math.min(w - 20, 220);
    const signBgH = 20;
    const signX = cx - signBgW / 2;
    const signY = top + h * 0.72;

    gfx
      .roundRect(signX, signY, signBgW, signBgH, 3)
      .fill({ color: 0x070e18, alpha: 0.9 })
      .stroke({ color: this.data.accentColor, width: 1, alpha: 0.75 });

    const signStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 10,
      fontWeight: 'bold',
      fill: this.data.accentColor,
      letterSpacing: 1,
      align: 'center',
    });

    const signText = new Text({
      text: `[${this.data.shortCode}] ${this.data.name.substring(0, 20)}`,
      style: signStyle,
    });
    signText.anchor.set(0.5);
    signText.position.set(cx, signY + signBgH / 2);
    this.container.addChild(signText);
  }

  private renderRoofDetails(gfx: Graphics, cx: number, top: number, w: number): void {
    switch (this.data.roofDetails) {
      case 'RADOME':
        // Geodesic radar tracking dome
        gfx
          .circle(cx, top - 18, 22)
          .fill({ color: 0x24354a })
          .stroke({ color: 0x00f0ff, width: 2 });
        gfx.circle(cx, top - 24, 6).fill({ color: 0x00f0ff, alpha: 0.8 });
        break;

      case 'SOLAR':
        // Photovoltaic solar array bank
        const solarW = w * 0.45;
        gfx
          .rect(cx - solarW / 2, top - 16, solarW, 12)
          .fill({ color: 0x1d4ed8 })
          .stroke({ color: 0x60a5fa, width: 1.5 });
        break;

      case 'CRANE':
        // Heavy Industrial VAB Crane Rigging & Warning Beacon
        gfx
          .rect(cx - 50, top - 28, 100, 24)
          .stroke({ color: 0xf59e0b, width: 3 });
        // Yellow diagonal warning stripes
        for (let x = cx - 40; x <= cx + 40; x += 16) {
          gfx.moveTo(x, top - 4).lineTo(x + 10, top - 24).stroke({ color: 0xf59e0b, width: 2 });
        }
        // Red flashing warning beacon
        gfx.circle(cx, top - 32, 4).fill({ color: 0xef4444 });
        break;

      case 'ANTENNA':
        // Telemetry mast with dish
        gfx.moveTo(cx, top - 4).lineTo(cx, top - 38).stroke({ color: 0x94a3b8, width: 2.5 });
        gfx.moveTo(cx - 14, top - 20).lineTo(cx + 14, top - 20).stroke({ color: 0x94a3b8, width: 2 });
        gfx.circle(cx, top - 40, 3).fill({ color: 0xef4444 }); // Red beacon
        break;

      case 'DOME':
        // Optical & Infrared Telescope Observatory Dome
        gfx
          .circle(cx, top - 20, 26)
          .fill({ color: 0x2c3b4f })
          .stroke({ color: 0x8b5cf6, width: 2 });
        // Telescope viewing slit
        gfx
          .rect(cx - 4, top - 42, 8, 28)
          .fill({ color: 0x0c1017 });
        break;

      case 'STANDARD':
      default:
        // HVAC Chiller Units and Air Exhaust Fans
        gfx
          .rect(cx - 30, top - 16, 26, 12)
          .fill({ color: 0x223040 })
          .stroke({ color: 0x475569, width: 1.5 })
          .rect(cx + 4, top - 16, 26, 12)
          .fill({ color: 0x223040 })
          .stroke({ color: 0x475569, width: 1.5 });
        break;
    }
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
