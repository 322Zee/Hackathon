/**
 * INTERSTELLAR CONTINUUM - Campus Radar Minimap Component
 * Accurate real-time vector minimap displaying the Earth headquarters campus,
 * player coordinates, facing direction, facility locations, and camera frustum.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS, UI_SPACING } from '../core/UIDesignTokens';
import { CAMPUS_WIDTH, CAMPUS_HEIGHT, CAMPUS_FACILITIES } from '../../environment/headquarters/CampusTypes';

export class CampusMinimap extends UIComponent {
  private mapWidth: number = 240;
  private mapHeight: number = 160;
  private scaleX: number;
  private scaleY: number;

  private bgGfx: Graphics;
  private baseCampusGfx: Graphics;
  private facilitiesGfx: Graphics;
  private playerGfx: Graphics;
  private frustumGfx: Graphics;
  private locationText: Text;
  private toggleBtn: Container;

  private isCollapsed: boolean = false;
  private timeElapsed: number = 0;

  constructor(x: number = 1640, y: number = 880) {
    super('CampusMinimap');
    this.container.position.set(x, y);

    this.scaleX = this.mapWidth / CAMPUS_WIDTH;
    this.scaleY = this.mapHeight / CAMPUS_HEIGHT;

    this.bgGfx = new Graphics();
    this.baseCampusGfx = new Graphics();
    this.facilitiesGfx = new Graphics();
    this.frustumGfx = new Graphics();
    this.playerGfx = new Graphics();

    this.container.addChild(this.bgGfx);
    this.container.addChild(this.baseCampusGfx);
    this.container.addChild(this.facilitiesGfx);
    this.container.addChild(this.frustumGfx);
    this.container.addChild(this.playerGfx);

    // Current Zone text
    this.locationText = new Text({
      text: 'ZONE: CENTRAL PLAZA',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 9,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_ACCENT,
        letterSpacing: 0.8,
      }),
    });
    this.locationText.position.set(UI_SPACING.XS, this.mapHeight + 6);
    this.container.addChild(this.locationText);

    // Toggle button in header
    this.toggleBtn = new Container();
    this.setupToggle();
    this.container.addChild(this.toggleBtn);

    this.drawStaticCampus();
  }

  private setupToggle(): void {
    this.toggleBtn.position.set(this.mapWidth - 18, -18);
    this.toggleBtn.eventMode = 'static';
    this.toggleBtn.cursor = 'pointer';

    const icon = new Text({
      text: '▼',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fill: UI_COLORS.TEXT_MUTED,
      }),
    });
    this.toggleBtn.addChild(icon);

    this.toggleBtn.on('pointertap', (e) => {
      e.stopPropagation();
      this.toggleCollapse();
    });
  }

  public toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    this.baseCampusGfx.visible = !this.isCollapsed;
    this.facilitiesGfx.visible = !this.isCollapsed;
    this.frustumGfx.visible = !this.isCollapsed;
    this.playerGfx.visible = !this.isCollapsed;
    this.locationText.visible = !this.isCollapsed;

    this.drawStaticCampus();
  }

  public isMinimapCollapsed(): boolean {
    return this.isCollapsed;
  }

  private drawStaticCampus(): void {
    this.bgGfx.clear();
    this.baseCampusGfx.clear();
    this.facilitiesGfx.clear();

    const w = this.mapWidth;
    const h = this.isCollapsed ? 22 : this.mapHeight;

    // Minimap frame
    this.bgGfx.roundRect(0, 0, w, h, UI_RADIUS.SM);
    this.bgGfx.fill({ color: UI_COLORS.BG_PANEL_ELEVATED, alpha: 0.92 });
    this.bgGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });

    if (this.isCollapsed) return;

    // Ground lawn fill
    this.baseCampusGfx.rect(2, 2, w - 4, h - 4).fill({ color: 0x0a1a12, alpha: 0.7 });

    // Main Roads (West-to-East and North-to-South)
    // West to East arterial
    this.baseCampusGfx
      .rect(2, 1200 * this.scaleY - 3, w - 4, 6)
      .fill({ color: 0x1e293b, alpha: 0.8 });
    // North to South promenade
    this.baseCampusGfx
      .rect(1800 * this.scaleX - 3, 2, 6, h - 4)
      .fill({ color: 0x1e293b, alpha: 0.8 });

    // Central Plaza circle
    this.baseCampusGfx
      .circle(1800 * this.scaleX, 1200 * this.scaleY, 12)
      .fill({ color: 0x0f172a });
    this.baseCampusGfx
      .circle(1800 * this.scaleX, 1200 * this.scaleY, 12)
      .stroke({ color: UI_COLORS.CYAN, width: 0.8, alpha: 0.6 });

    // Pad Alpha launchpad apron (East)
    const padX = 2850 * this.scaleX;
    const padY = 1850 * this.scaleY;
    this.baseCampusGfx.rect(padX - 10, padY - 8, 20, 16).fill({ color: 0x334155 });
    this.baseCampusGfx.rect(padX - 10, padY - 8, 20, 16).stroke({ color: UI_COLORS.AMBER, width: 0.8 });

    // Draw all 12 facilities as miniature radar markers
    for (const fac of Object.values(CAMPUS_FACILITIES)) {
      const fx = fac.x * this.scaleX;
      const fy = fac.y * this.scaleY;
      const fw = Math.max(5, fac.width * this.scaleX);
      const fh = Math.max(4, fac.height * this.scaleY);

      this.facilitiesGfx.rect(fx - fw / 2, fy - fh / 2, fw, fh).fill({ color: 0x1e293b });
      this.facilitiesGfx
        .rect(fx - fw / 2, fy - fh / 2, fw, fh)
        .stroke({ color: fac.accentColor, width: 0.8, alpha: 0.7 });
    }
  }

  public updatePlayer(
    playerX: number,
    playerY: number,
    headingDeg: number,
    zoneName: string,
    cameraView?: { x: number; y: number; width: number; height: number }
  ): void {
    if (this.isCollapsed) return;

    this.locationText.text = `ZONE: ${zoneName.toUpperCase()}`;

    // Draw camera frustum rect
    this.frustumGfx.clear();
    if (cameraView) {
      const cx = (cameraView.x - cameraView.width / 2) * this.scaleX;
      const cy = (cameraView.y - cameraView.height / 2) * this.scaleY;
      const cw = cameraView.width * this.scaleX;
      const ch = cameraView.height * this.scaleY;

      this.frustumGfx
        .rect(cx, cy, cw, ch)
        .stroke({ color: UI_COLORS.TEXT_MUTED, width: 0.8, alpha: 0.4 });
    }

    // Draw player position blip
    this.playerGfx.clear();
    const px = Math.max(4, Math.min(this.mapWidth - 4, playerX * this.scaleX));
    const py = Math.max(4, Math.min(this.mapHeight - 4, playerY * this.scaleY));

    // Radar pulse ring
    const pulseR = 4 + Math.sin(this.timeElapsed * 5.0) * 2;
    this.playerGfx.circle(px, py, pulseR).stroke({ color: UI_COLORS.CYAN, width: 0.8, alpha: 0.5 });

    // Player blip
    this.playerGfx.circle(px, py, 3).fill({ color: UI_COLORS.CYAN });

    // Heading indicator arrow
    const rad = (headingDeg * Math.PI) / 180;
    const hx = px + Math.cos(rad) * 7;
    const hy = py + Math.sin(rad) * 7;
    this.playerGfx.moveTo(px, py).lineTo(hx, hy).stroke({ color: 0xffffff, width: 1.2 });
  }

  public override update(deltaSeconds: number): void {
    super.update(deltaSeconds);
    this.timeElapsed += deltaSeconds;
  }
}
