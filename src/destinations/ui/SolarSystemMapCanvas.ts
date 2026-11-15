/**
 * INTERSTELLAR CONTINUUM - Interactive 2D Solar System Map Canvas
 * Vector-rendered schematic map featuring all major planets, Sun corona,
 * Asteroid Belt, key destination moons, and targeting reticles.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../../ui/core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS } from '../../ui/core/UIDesignTokens';
import { UIButton } from '../../ui/components/UIButton';
import { DestinationRegistry } from '../DestinationRegistry';
import {
  DestinationRecord,
  DestinationId,
  DestinationCategory,
} from '../DestinationTypes';
import { ServiceLocator } from '../../core/ServiceLocator';
import { SettingsManager } from '../../settings/SettingsManager';

export interface SolarSystemMapOptions {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  onSelectDestination?: (destination: DestinationRecord) => void;
}

export class SolarSystemMapCanvas extends UIComponent {
  private mapWidth: number;
  private mapHeight: number;
  private registry: DestinationRegistry;

  private backgroundGfx: Graphics;
  private solarSystemContainer: Container;
  private orbitsGfx: Graphics;
  private sunGfx: Graphics;
  private asteroidBeltGfx: Graphics;
  private bodiesContainer: Container;
  private selectionReticleGfx: Graphics;
  private controlsContainer: Container;
  private schematicNoticeContainer: Container;

  private zoomLevel: number = 1.0;
  private panX: number = 0;
  private panY: number = 0;

  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;

  private selectedDestinationId: string | null = DestinationId.EARTH;
  private hoveredDestinationId: string | null = null;
  private animationTimer: number = 0;

  private onSelectCb?: (destination: DestinationRecord) => void;

  // Cached planet positions for reticle tracking
  private bodyScreenPositions: Map<string, { x: number; y: number; r: number }> = new Map();

  constructor(options: SolarSystemMapOptions = {}) {
    super('SolarSystemMapCanvas');

    this.mapWidth = options.width ?? 1340;
    this.mapHeight = options.height ?? 890;
    this.container.position.set(options.x ?? 30, options.y ?? 130);

    this.registry = DestinationRegistry.getInstance();
    this.onSelectCb = options.onSelectDestination;

    // 1. Background Frame
    this.backgroundGfx = new Graphics();
    this.backgroundGfx.eventMode = 'static';
    this.container.addChild(this.backgroundGfx);

    // 2. Solar System Transform Container (Panning & Zooming)
    this.solarSystemContainer = new Container();
    this.solarSystemContainer.position.set(this.mapWidth / 2, this.mapHeight / 2);
    this.container.addChild(this.solarSystemContainer);

    this.orbitsGfx = new Graphics();
    this.solarSystemContainer.addChild(this.orbitsGfx);

    this.asteroidBeltGfx = new Graphics();
    this.solarSystemContainer.addChild(this.asteroidBeltGfx);

    this.sunGfx = new Graphics();
    this.solarSystemContainer.addChild(this.sunGfx);

    this.bodiesContainer = new Container();
    this.solarSystemContainer.addChild(this.bodiesContainer);

    this.selectionReticleGfx = new Graphics();
    this.solarSystemContainer.addChild(this.selectionReticleGfx);

    // 3. Schematic Scale Notice Header
    this.schematicNoticeContainer = new Container();
    this.schematicNoticeContainer.position.set(20, 16);
    this.container.addChild(this.schematicNoticeContainer);

    const noticeStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_MUTED,
      letterSpacing: 1.2,
    });
    const noticeText = new Text({
      text: '// SCHEMATIC MAP: RELATIVE PROPORTIONS (NOT TO 1:1 PHYSICAL ORBITAL SCALE) //',
      style: noticeStyle,
    });
    this.schematicNoticeContainer.addChild(noticeText);

    // 4. Map Zoom / Navigation Controls
    this.controlsContainer = new Container();
    this.controlsContainer.position.set(20, this.mapHeight - 48);
    this.container.addChild(this.controlsContainer);

    this.setupControls();
    this.setupInteractivity();
    this.renderFrame();
    this.buildPlanetaryBodies();
  }

  private setupControls(): void {
    const zoomInBtn = new UIButton({
      label: '+ ZOOM',
      variant: 'SECONDARY',
      width: 80,
      height: 30,
      onClick: () => this.adjustZoom(0.2),
    });
    zoomInBtn.container.position.set(0, 0);
    this.controlsContainer.addChild(zoomInBtn.container);

    const zoomOutBtn = new UIButton({
      label: '– ZOOM',
      variant: 'SECONDARY',
      width: 80,
      height: 30,
      onClick: () => this.adjustZoom(-0.2),
    });
    zoomOutBtn.container.position.set(90, 0);
    this.controlsContainer.addChild(zoomOutBtn.container);

    const resetBtn = new UIButton({
      label: 'RESET [R]',
      variant: 'GHOST',
      width: 90,
      height: 30,
      onClick: () => this.resetView(),
    });
    resetBtn.container.position.set(180, 0);
    this.controlsContainer.addChild(resetBtn.container);

    const focusEarthBtn = new UIButton({
      label: 'CENTER EARTH',
      variant: 'OUTLINE',
      width: 120,
      height: 30,
      onClick: () => this.focusPlanet(DestinationId.EARTH),
    });
    focusEarthBtn.container.position.set(280, 0);
    this.controlsContainer.addChild(focusEarthBtn.container);
  }

  private setupInteractivity(): void {
    this.backgroundGfx.on('pointerdown', (e) => {
      this.isDragging = true;
      this.dragStartX = e.global.x - this.panX;
      this.dragStartY = e.global.y - this.panY;
    });

    this.backgroundGfx.on('pointermove', (e) => {
      if (!this.isDragging) return;
      this.panX = e.global.x - this.dragStartX;
      this.panY = e.global.y - this.dragStartY;
      this.updateTransform();
    });

    this.backgroundGfx.on('pointerup', () => {
      this.isDragging = false;
    });

    this.backgroundGfx.on('pointerupoutside', () => {
      this.isDragging = false;
    });

    // Mouse wheel zoom
    this.backgroundGfx.on('wheel' as any, (e: any) => {
      const delta = e.deltaY < 0 ? 0.15 : -0.15;
      this.adjustZoom(delta);
    });
  }

  public adjustZoom(delta: number): void {
    this.zoomLevel = Math.max(0.4, Math.min(2.5, this.zoomLevel + delta));
    this.updateTransform();
  }

  public resetView(): void {
    this.zoomLevel = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.updateTransform();
  }

  public focusPlanet(destinationId: string): void {
    const pos = this.bodyScreenPositions.get(destinationId);
    if (pos) {
      this.panX = -pos.x * this.zoomLevel;
      this.panY = -pos.y * this.zoomLevel;
      this.updateTransform();
    }
  }

  private updateTransform(): void {
    this.solarSystemContainer.scale.set(this.zoomLevel);
    this.solarSystemContainer.position.set(
      this.mapWidth / 2 + this.panX,
      this.mapHeight / 2 + this.panY
    );
  }

  public setSelectedDestination(id: string | null, notify: boolean = true): void {
    if (this.selectedDestinationId === id) return;
    this.selectedDestinationId = id;
    if (id && notify) {
      const dest = this.registry.getDestination(id);
      if (dest && this.onSelectCb) {
        this.onSelectCb(dest);
      }
    }
  }

  public getSelectedDestination(): string | null {
    return this.selectedDestinationId;
  }

  public getHoveredDestination(): string | null {
    return this.hoveredDestinationId;
  }

  public cycleNextPlanet(): void {
    const planets = this.registry.getPrimaryPlanets();
    if (planets.length === 0) return;

    let idx = planets.findIndex((p) => p.id === this.selectedDestinationId);
    idx = (idx + 1) % planets.length;
    const nextPlanet = planets[idx];
    if (nextPlanet) {
      this.setSelectedDestination(nextPlanet.id);
      this.focusPlanet(nextPlanet.id);
    }
  }

  public cyclePreviousPlanet(): void {
    const planets = this.registry.getPrimaryPlanets();
    if (planets.length === 0) return;

    let idx = planets.findIndex((p) => p.id === this.selectedDestinationId);
    if (idx <= 0) idx = planets.length - 1;
    else idx--;
    const prevPlanet = planets[idx];
    if (prevPlanet) {
      this.setSelectedDestination(prevPlanet.id);
      this.focusPlanet(prevPlanet.id);
    }
  }

  public update(deltaSeconds: number): void {
    let reducedMotion = false;
    if (ServiceLocator.has('SettingsManager')) {
      const sm = ServiceLocator.get<SettingsManager>('SettingsManager');
      reducedMotion = sm.getSettings().accessibility.reducedMotion;
    }

    if (!reducedMotion) {
      this.animationTimer += deltaSeconds;
    }

    this.renderOrbits();
    this.renderSunCorona(reducedMotion);
    this.renderAsteroidBelt();
    this.updateBodyPositions(reducedMotion);
    this.renderSelectionReticle(reducedMotion);
  }

  private renderFrame(): void {
    this.backgroundGfx.clear();

    // Deep space tactical canvas
    this.backgroundGfx.roundRect(0, 0, this.mapWidth, this.mapHeight, UI_RADIUS.MD);
    this.backgroundGfx.fill({ color: 0x020612, alpha: 0.96 });
    this.backgroundGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.5 });

    // Subtle coordinate lines
    this.backgroundGfx.moveTo(40, this.mapHeight / 2).lineTo(this.mapWidth - 40, this.mapHeight / 2);
    this.backgroundGfx.moveTo(this.mapWidth / 2, 40).lineTo(this.mapWidth / 2, this.mapHeight - 40);
    this.backgroundGfx.stroke({ color: 0x071a2f, width: 1.0, alpha: 0.3 });
  }

  private renderSunCorona(reducedMotion: boolean): void {
    this.sunGfx.clear();

    const sun = this.registry.getDestination(DestinationId.SUN);
    const r = sun?.radiusPixels ?? 34;

    // Corona Outer Glow
    const pulse = reducedMotion ? 1.0 : 1.0 + Math.sin(this.animationTimer * 2.0) * 0.08;
    this.sunGfx.circle(0, 0, (r + 14) * pulse);
    this.sunGfx.fill({ color: 0xffaa00, alpha: 0.15 });

    this.sunGfx.circle(0, 0, (r + 6) * pulse);
    this.sunGfx.fill({ color: 0xffdd44, alpha: 0.28 });

    // Sun Photosphere Body
    this.sunGfx.circle(0, 0, r);
    this.sunGfx.fill({ color: 0xffea00, alpha: 0.95 });
    this.sunGfx.stroke({ color: 0xffffff, width: 2.0, alpha: 0.9 });
  }

  private renderOrbits(): void {
    this.orbitsGfx.clear();

    const planets = this.registry.getPrimaryPlanets();
    for (const p of planets) {
      if (p.orbitRadiusPixels <= 0) continue;

      this.orbitsGfx.circle(0, 0, p.orbitRadiusPixels);
      this.orbitsGfx.stroke({
        color: p.id === this.selectedDestinationId ? UI_COLORS.CYAN : 0x1e3a5f,
        width: p.id === this.selectedDestinationId ? 1.5 : 1.0,
        alpha: p.id === this.selectedDestinationId ? 0.65 : 0.3,
      });
    }
  }

  private renderAsteroidBelt(): void {
    this.asteroidBeltGfx.clear();

    const belt = this.registry.getDestination(DestinationId.ASTEROID_BELT);
    const rBase = belt?.orbitRadiusPixels ?? 310;

    // Render schematic dotted particle ring
    const count = 48;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (this.animationTimer * 0.02);
      const rOffset = ((i % 5) - 2) * 4;
      const x = Math.cos(angle) * (rBase + rOffset);
      const y = Math.sin(angle) * (rBase + rOffset);

      this.asteroidBeltGfx.circle(x, y, (i % 3 === 0) ? 2.0 : 1.2);
      this.asteroidBeltGfx.fill({ color: 0x94a3b8, alpha: 0.55 });
    }
  }

  private buildPlanetaryBodies(): void {
    this.bodiesContainer.removeChildren();

    const destinations = this.registry.getAllDestinations();

    for (const dest of destinations) {
      // Orbital regions are inspected under EarthOrbitDisplay, skip placing as primary solar bodies
      if (dest.category === DestinationCategory.ORBITAL_REGION) continue;

      const bodyNode = new Container();
      bodyNode.label = dest.id;
      bodyNode.eventMode = 'static';
      bodyNode.cursor = 'pointer';

      // Hit area wrapper
      const hitAreaGfx = new Graphics();
      hitAreaGfx.circle(0, 0, Math.max(24, dest.radiusPixels + 12));
      hitAreaGfx.fill({ color: 0x000000, alpha: 0.001 });
      bodyNode.addChild(hitAreaGfx);

      // Visual Planet Body
      const bodyGfx = new Graphics();
      bodyGfx.label = 'Gfx';
      this.drawCelestialBody(bodyGfx, dest);
      bodyNode.addChild(bodyGfx);

      // Label text
      const nameLabel = new Text({
        text: dest.name,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: dest.category === DestinationCategory.NATURAL_SATELLITE ? 8.5 : 10.5,
          fontWeight: 'bold',
          fill: this.registry.isUnlocked(dest.id) ? UI_COLORS.TEXT_PRIMARY : UI_COLORS.TEXT_MUTED,
          letterSpacing: 0.6,
        }),
      });
      nameLabel.anchor.set(0.5, 0);
      nameLabel.position.set(0, dest.radiusPixels + 6);
      nameLabel.label = 'Label';
      bodyNode.addChild(nameLabel);

      // Interactivity
      bodyNode.on('pointertap', () => {
        this.setSelectedDestination(dest.id);
      });

      bodyNode.on('pointerover', () => {
        this.hoveredDestinationId = dest.id;
        nameLabel.style.fill = UI_COLORS.CYAN;
      });

      bodyNode.on('pointerout', () => {
        this.hoveredDestinationId = null;
        nameLabel.style.fill = this.registry.isUnlocked(dest.id)
          ? UI_COLORS.TEXT_PRIMARY
          : UI_COLORS.TEXT_MUTED;
      });

      this.bodiesContainer.addChild(bodyNode);
    }
  }

  private drawCelestialBody(g: Graphics, dest: DestinationRecord): void {
    g.clear();

    const r = dest.radiusPixels;
    const isUnlocked = this.registry.isUnlocked(dest.id);

    // Saturn planetary rings
    if (dest.id === DestinationId.SATURN) {
      g.ellipse(0, 0, r * 2.2, r * 0.6);
      g.stroke({ color: 0xfde047, width: 3.5, alpha: 0.6 });
      g.ellipse(0, 0, r * 2.6, r * 0.7);
      g.stroke({ color: 0xfef08a, width: 1.5, alpha: 0.4 });
    }

    // Uranus subtle rings
    if (dest.id === DestinationId.URANUS) {
      g.ellipse(0, 0, r * 0.5, r * 1.8);
      g.stroke({ color: 0x7dd3fc, width: 1.5, alpha: 0.5 });
    }

    // Main sphere
    g.circle(0, 0, r);
    g.fill({ color: dest.color, alpha: isUnlocked ? 0.95 : 0.6 });
    g.stroke({
      color: isUnlocked ? dest.accentColor : 0x475569,
      width: 1.5,
      alpha: 0.9,
    });

    // Subtle atmospheric crescent lighting
    if (dest.category === DestinationCategory.ROCKY_PLANET || dest.category === DestinationCategory.GAS_GIANT) {
      g.arc(0, 0, r - 1, -Math.PI / 2, Math.PI / 2);
      g.stroke({ color: 0xffffff, width: 1.2, alpha: 0.4 });
    }
  }

  private updateBodyPositions(reducedMotion: boolean): void {
    this.bodyScreenPositions.clear();

    const destinations = this.registry.getAllDestinations();

    for (const dest of destinations) {
      if (dest.category === DestinationCategory.ORBITAL_REGION) continue;

      const node = this.bodiesContainer.children.find((c) => c.label === dest.id) as Container | undefined;
      if (!node) continue;

      let x = 0;
      let y = 0;

      if (dest.parentId) {
        // Moon orbiting a parent planet (e.g. Moon around Earth, Europa around Jupiter)
        const parentDest = this.registry.getDestination(dest.parentId);
        let parentX = 0;
        let parentY = 0;
        if (parentDest) {
          const parentAngle = parentDest.initialAngle + (reducedMotion ? 0 : this.animationTimer * parentDest.orbitSpeed);
          parentX = Math.cos(parentAngle) * parentDest.orbitRadiusPixels;
          parentY = Math.sin(parentAngle) * parentDest.orbitRadiusPixels;
        }

        const moonAngle = dest.initialAngle + (reducedMotion ? 0 : this.animationTimer * dest.orbitSpeed);
        x = parentX + Math.cos(moonAngle) * dest.orbitRadiusPixels;
        y = parentY + Math.sin(moonAngle) * dest.orbitRadiusPixels;
      } else if (dest.orbitRadiusPixels > 0) {
        // Planet orbiting Sun
        const angle = dest.initialAngle + (reducedMotion ? 0 : this.animationTimer * dest.orbitSpeed);
        x = Math.cos(angle) * dest.orbitRadiusPixels;
        y = Math.sin(angle) * dest.orbitRadiusPixels;
      }

      node.position.set(x, y);
      this.bodyScreenPositions.set(dest.id, { x, y, r: dest.radiusPixels });
    }
  }

  private renderSelectionReticle(reducedMotion: boolean): void {
    this.selectionReticleGfx.clear();
    if (!this.selectedDestinationId) return;

    const pos = this.bodyScreenPositions.get(this.selectedDestinationId);
    if (!pos) return;

    const size = Math.max(28, pos.r + 14);
    const bracketLen = 8;
    const pulse = reducedMotion ? 0 : Math.sin(this.animationTimer * 4.0) * 2;

    this.selectionReticleGfx.position.set(pos.x, pos.y);

    // Cyan targeting box brackets
    const b = size + pulse;
    this.selectionReticleGfx
      // Top-Left
      .moveTo(-b, -b + bracketLen).lineTo(-b, -b).lineTo(-b + bracketLen, -b)
      // Top-Right
      .moveTo(b - bracketLen, -b).lineTo(b, -b).lineTo(b, -b + bracketLen)
      // Bottom-Right
      .moveTo(b, b - bracketLen).lineTo(b, b).lineTo(b - bracketLen, b)
      // Bottom-Left
      .moveTo(-b + bracketLen, b).lineTo(-b, b).lineTo(-b, b - bracketLen)
      .stroke({ color: UI_COLORS.CYAN, width: 2.0, alpha: 0.95 });

    // Center precision reticle ring
    this.selectionReticleGfx.circle(0, 0, b + 6);
    this.selectionReticleGfx.stroke({ color: UI_COLORS.CYAN, width: 1.0, alpha: 0.35 });
  }

  public override destroy(): void {
    this.backgroundGfx.removeAllListeners();
    super.destroy();
  }
}
