/**
 * INTERSTELLAR CONTINUUM - Earth Orbit Sub-Navigation Display
 * Navigational hierarchy visualizing Earth's primary orbital corridors
 * (LEO, MEO, GEO, HEO, and Luna) with altitude metrics and mission zoning.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../../ui/core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS } from '../../ui/core/UIDesignTokens';
import { UIButton } from '../../ui/components/UIButton';
import { DestinationRegistry } from '../DestinationRegistry';
import { DestinationRecord, DestinationId } from '../DestinationTypes';

export interface EarthOrbitDisplayOptions {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  onSelectDestination?: (dest: DestinationRecord) => void;
  onReturnToSolarSystem?: () => void;
}

export class EarthOrbitDisplay extends UIComponent {
  private displayWidth: number;
  private displayHeight: number;
  private registry: DestinationRegistry;

  private canvasGfx: Graphics;
  private orbitsContainer: Container;
  private nodesContainer: Container;
  private headerContainer: Container;
  private returnBtn: UIButton;

  private selectedDestinationId: string | null = null;
  private onSelectCb?: (dest: DestinationRecord) => void;
  private onReturnCb?: () => void;

  private animationTimer: number = 0;

  constructor(options: EarthOrbitDisplayOptions = {}) {
    super('EarthOrbitDisplay');

    this.displayWidth = options.width ?? 1280;
    this.displayHeight = options.height ?? 860;
    this.container.position.set(options.x ?? 60, options.y ?? 140);

    this.registry = DestinationRegistry.getInstance();
    this.onSelectCb = options.onSelectDestination;
    this.onReturnCb = options.onReturnToSolarSystem;

    // 1. Background tactical frame
    this.canvasGfx = new Graphics();
    this.canvasGfx.eventMode = 'static';
    this.container.addChild(this.canvasGfx);

    // 2. Orbits & Earth graphics
    this.orbitsContainer = new Container();
    this.orbitsContainer.position.set(this.displayWidth / 2, this.displayHeight / 2);
    this.container.addChild(this.orbitsContainer);

    // 3. Clickable nodes container
    this.nodesContainer = new Container();
    this.nodesContainer.position.set(this.displayWidth / 2, this.displayHeight / 2);
    this.container.addChild(this.nodesContainer);

    // 4. Header title
    this.headerContainer = new Container();
    this.headerContainer.position.set(24, 20);
    this.container.addChild(this.headerContainer);

    const titleStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 15,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
      letterSpacing: 1.5,
    });
    const title = new Text({
      text: 'EARTH PROXIMITY TELEMETRY // ORBITAL FLIGHT REGIMES',
      style: titleStyle,
    });
    this.headerContainer.addChild(title);

    const subStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10.5,
      fill: UI_COLORS.TEXT_MUTED,
      letterSpacing: 0.8,
    });
    const sub = new Text({
      text: 'SCHEMATIC ALTITUDE PROFILES: LEO, MEO, GEO, HEO & TRANSLUNAR CORRIDOR',
      style: subStyle,
    });
    sub.position.set(0, 24);
    this.headerContainer.addChild(sub);

    // 5. Return to Solar System Button
    this.returnBtn = new UIButton({
      label: '◀ SOLAR SYSTEM MAP',
      variant: 'OUTLINE',
      width: 200,
      height: 36,
      onClick: () => {
        if (this.onReturnCb) this.onReturnCb();
      },
    });
    this.returnBtn.container.position.set(this.displayWidth - 224, 20);
    this.container.addChild(this.returnBtn.container);

    this.renderFrame();
    this.buildOrbitalNodes();
  }

  public setSelectedDestination(id: string | null): void {
    if (this.selectedDestinationId === id) return;
    this.selectedDestinationId = id;
    this.buildOrbitalNodes();
  }

  public update(deltaSeconds: number): void {
    this.animationTimer += deltaSeconds;
    this.renderOrbits();
  }

  private renderFrame(): void {
    this.canvasGfx.clear();

    // Dark technical backdrop
    this.canvasGfx.roundRect(0, 0, this.displayWidth, this.displayHeight, UI_RADIUS.MD);
    this.canvasGfx.fill({ color: 0x020714, alpha: 0.96 });
    this.canvasGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.5 });

    // Grid crosshairs
    const cx = this.displayWidth / 2;
    const cy = this.displayHeight / 2;
    this.canvasGfx.moveTo(cx - 380, cy).lineTo(cx + 380, cy);
    this.canvasGfx.moveTo(cx, cy - 340).lineTo(cx, cy + 340);
    this.canvasGfx.stroke({ color: 0x0c223c, width: 1.0, alpha: 0.4 });
  }

  private renderOrbits(): void {
    this.orbitsContainer.removeChildren();

    const g = new Graphics();
    this.orbitsContainer.addChild(g);

    // 1. Earth Body at Center
    g.circle(0, 0, 48);
    g.fill({ color: 0x1d4ed8, alpha: 0.9 });
    g.stroke({ color: 0x38bdf8, width: 2.5 });

    // Subtle Earth atmosphere glow
    g.circle(0, 0, 54);
    g.stroke({ color: 0x00f0ff, width: 1.5, alpha: 0.4 });

    const earthLabel = new Text({
      text: 'EARTH',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: 0xffffff,
      }),
    });
    earthLabel.anchor.set(0.5, 0.5);
    this.orbitsContainer.addChild(earthLabel);

    // 2. Orbital Rings
    const ringConfigs = [
      { r: 90, color: 0x00f0ff, label: 'LEO (160–2,000 km)' },
      { r: 160, color: 0x4ade80, label: 'MEO (2,000–35,786 km)' },
      { r: 240, color: 0xf59e0b, label: 'GEO (35,786 km Synchronous)' },
      { r: 320, color: 0xa855f7, label: 'HEO (Molniya 500×40,000 km)' },
      { r: 380, color: 0xe2e8f0, label: 'LUNAR TRANSIT (384,400 km)' },
    ];

    for (const ring of ringConfigs) {
      g.circle(0, 0, ring.r);
      g.stroke({ color: ring.color, width: 1.2, alpha: 0.35 });

      // Subtle pulse marker
      const angle = this.animationTimer * 0.3 + ring.r;
      const blipX = Math.cos(angle) * ring.r;
      const blipY = Math.sin(angle) * ring.r;
      g.circle(blipX, blipY, 2.5);
      g.fill({ color: ring.color, alpha: 0.8 });
    }
  }

  private buildOrbitalNodes(): void {
    this.nodesContainer.removeChildren();

    const regions = this.registry.getEarthOrbitalRegions();
    const luna = this.registry.getDestination(DestinationId.MOON);
    const allEarthDestinations = [...regions];
    if (luna) allEarthDestinations.push(luna);

    const nodeOffsets: Record<string, { r: number; angle: number }> = {
      [DestinationId.EARTH_ORBIT_LEO]: { r: 90, angle: -Math.PI / 4 },
      [DestinationId.EARTH_ORBIT_MEO]: { r: 160, angle: Math.PI / 6 },
      [DestinationId.EARTH_ORBIT_GEO]: { r: 240, angle: -3 * Math.PI / 4 },
      [DestinationId.EARTH_ORBIT_HEO]: { r: 320, angle: 3 * Math.PI / 4 },
      [DestinationId.MOON]: { r: 380, angle: 0 },
    };

    for (const dest of allEarthDestinations) {
      const offset = nodeOffsets[dest.id] ?? { r: 100, angle: 0 };
      const x = Math.cos(offset.angle) * offset.r;
      const y = Math.sin(offset.angle) * offset.r;

      const isSelected = this.selectedDestinationId === dest.id;
      const isUnlocked = this.registry.isUnlocked(dest.id);

      const node = new Container();
      node.position.set(x, y);
      node.eventMode = 'static';
      node.cursor = 'pointer';

      const gfx = new Graphics();

      // Node base
      const nodeColor = isUnlocked ? dest.color : 0x475569;
      gfx.circle(0, 0, isSelected ? 14 : 10);
      gfx.fill({ color: nodeColor, alpha: 0.9 });
      gfx.stroke({
        color: isSelected ? 0xffffff : (isUnlocked ? dest.accentColor : 0x64748b),
        width: isSelected ? 2.5 : 1.5,
      });

      if (isSelected) {
        // Selection reticle ring
        gfx.circle(0, 0, 22);
        gfx.stroke({ color: UI_COLORS.CYAN, width: 2, alpha: 0.9 });
      }

      node.addChild(gfx);

      // Node Text Label
      const txtStyle = new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: isSelected ? UI_COLORS.CYAN : (isUnlocked ? UI_COLORS.TEXT_PRIMARY : UI_COLORS.TEXT_MUTED),
        letterSpacing: 0.8,
      });
      const label = new Text({
        text: `${dest.name} ${isUnlocked ? '' : '🔒'}`,
        style: txtStyle,
      });
      label.position.set(16, -6);
      node.addChild(label);

      node.on('pointertap', () => {
        this.selectedDestinationId = dest.id;
        this.buildOrbitalNodes();
        if (this.onSelectCb) {
          this.onSelectCb(dest);
        }
      });

      this.nodesContainer.addChild(node);
    }
  }

  public override destroy(): void {
    super.destroy();
  }
}
