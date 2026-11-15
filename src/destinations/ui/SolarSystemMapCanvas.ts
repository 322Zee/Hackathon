/**
 * INTERSTELLAR CONTINUUM - Interactive 2D Solar System Map Canvas
 * Vector-rendered tactical schematic map featuring multi-layer deep space starfield,
 * nebula haze, Sun corona, Asteroid Belt, planetary bodies, interactive sub-planetary
 * moon systems, targeting reticles, and real-time exploration status badges.
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
import { SolarSystemNavigationManager } from '../navigation/SolarSystemNavigationManager';
import {
  ExplorationStatusBadge,
  DestinationFilterOptions,
} from '../navigation/NavigationTypes';

export interface SolarSystemMapOptions {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  onSelectDestination?: (destination: DestinationRecord) => void;
}

interface StarParticle {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number;
  color: number;
}

export class SolarSystemMapCanvas extends UIComponent {
  private mapWidth: number;
  private mapHeight: number;
  private registry: DestinationRegistry;
  private navManager: SolarSystemNavigationManager;

  private backgroundGfx: Graphics;
  private starfieldGfx: Graphics;
  private nebulaGfx: Graphics;
  private solarSystemContainer: Container;
  private orbitsGfx: Graphics;
  private sunGfx: Graphics;
  private asteroidBeltGfx: Graphics;
  private bodiesContainer: Container;
  private badgesGfx: Graphics;
  private selectionReticleGfx: Graphics;
  private controlsContainer: Container;
  private schematicNoticeContainer: Container;
  private systemViewHeader: Container;

  private stars: StarParticle[] = [];

  private zoomLevel: number = 1.0;
  private targetZoomLevel: number = 1.0;
  private panX: number = 0;
  private panY: number = 0;
  private targetPanX: number = 0;
  private targetPanY: number = 0;

  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;

  private selectedDestinationId: string | null = DestinationId.EARTH;
  private hoveredDestinationId: string | null = null;
  private inspectedSystemId: string | null = null;
  private animationTimer: number = 0;

  private activeFilters: DestinationFilterOptions = {};
  private matchingDestinationIds: Set<string> = new Set();

  private onSelectCb?: (destination: DestinationRecord) => void;

  // Cached planet positions for reticle tracking and interactive layout
  private bodyScreenPositions: Map<string, { x: number; y: number; r: number }> = new Map();

  private unsubscribeAction?: () => void;
  private unsubscribeFilter?: () => void;
  private unsubscribeSystem?: () => void;

  constructor(options: SolarSystemMapOptions = {}) {
    super('SolarSystemMapCanvas');

    this.mapWidth = options.width ?? 1340;
    this.mapHeight = options.height ?? 890;
    this.container.position.set(options.x ?? 30, options.y ?? 130);

    this.registry = DestinationRegistry.getInstance();
    this.navManager = SolarSystemNavigationManager.getInstance();
    this.onSelectCb = options.onSelectDestination;

    // 1. Background tactical frame & starfield
    this.backgroundGfx = new Graphics();
    this.backgroundGfx.eventMode = 'static';
    this.container.addChild(this.backgroundGfx);

    this.starfieldGfx = new Graphics();
    this.container.addChild(this.starfieldGfx);

    this.nebulaGfx = new Graphics();
    this.container.addChild(this.nebulaGfx);

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

    this.badgesGfx = new Graphics();
    this.solarSystemContainer.addChild(this.badgesGfx);

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

    // System view mode header
    this.systemViewHeader = new Container();
    this.systemViewHeader.position.set(20, 42);
    this.systemViewHeader.visible = false;
    this.container.addChild(this.systemViewHeader);

    const sysBtn = new UIButton({
      label: '◀ RETURN TO SOLAR SYSTEM OVERVIEW',
      variant: 'SECONDARY',
      width: 250,
      height: 30,
      onClick: () => this.returnToOverview(),
    });
    this.systemViewHeader.addChild(sysBtn.container);

    // 4. Map Zoom / Navigation Controls
    this.controlsContainer = new Container();
    this.controlsContainer.position.set(20, this.mapHeight - 48);
    this.container.addChild(this.controlsContainer);

    this.initStarfield();
    this.setupControls();
    this.setupInteractivity();
    this.setupNavSubscriptions();
    this.renderFrame();
    this.renderNebula();
    this.buildPlanetaryBodies();
  }

  private initStarfield(): void {
    this.stars = [];
    const count = 120;
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.mapWidth,
        y: Math.random() * this.mapHeight,
        radius: Math.random() < 0.2 ? 1.8 : 0.9,
        baseAlpha: 0.2 + Math.random() * 0.6,
        twinkleSpeed: 0.5 + Math.random() * 2.0,
        color: Math.random() < 0.2 ? 0x93c5fd : Math.random() < 0.4 ? 0xfef08a : 0xffffff,
      });
    }
  }

  private setupControls(): void {
    const zoomInBtn = new UIButton({
      label: '+ ZOOM',
      variant: 'SECONDARY',
      width: 80,
      height: 30,
      onClick: () => this.adjustZoom(0.25),
    });
    zoomInBtn.container.position.set(0, 0);
    this.controlsContainer.addChild(zoomInBtn.container);

    const zoomOutBtn = new UIButton({
      label: '– ZOOM',
      variant: 'SECONDARY',
      width: 80,
      height: 30,
      onClick: () => this.adjustZoom(-0.25),
    });
    zoomOutBtn.container.position.set(90, 0);
    this.controlsContainer.addChild(zoomOutBtn.container);

    const resetBtn = new UIButton({
      label: 'OVERVIEW [R]',
      variant: 'GHOST',
      width: 105,
      height: 30,
      onClick: () => this.resetView(),
    });
    resetBtn.container.position.set(180, 0);
    this.controlsContainer.addChild(resetBtn.container);

    const focusEarthBtn = new UIButton({
      label: 'EARTH SYSTEM',
      variant: 'OUTLINE',
      width: 120,
      height: 30,
      onClick: () => {
        this.inspectSystem(DestinationId.EARTH);
      },
    });
    focusEarthBtn.container.position.set(295, 0);
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
      this.targetPanX = this.panX;
      this.targetPanY = this.panY;
      this.updateTransform();
    });

    this.backgroundGfx.on('pointerup', () => {
      this.isDragging = false;
    });

    this.backgroundGfx.on('pointerupoutside', () => {
      this.isDragging = false;
    });

    this.backgroundGfx.on('wheel' as any, (e: any) => {
      const delta = e.deltaY < 0 ? 0.18 : -0.18;
      this.adjustZoom(delta);
    });
  }

  private setupNavSubscriptions(): void {
    this.unsubscribeAction = this.navManager.on('navigation:action_triggered', (payload) => {
      if (payload.request.action === 'FOCUS_MAP') {
        this.focusPlanet(payload.request.destinationId);
      } else if (payload.request.action === 'INSPECT_SYSTEM') {
        this.inspectSystem(payload.request.destinationId);
      } else if (payload.request.action === 'RETURN_OVERVIEW') {
        this.returnToOverview();
      }
    });

    this.unsubscribeFilter = this.navManager.on('navigation:filter_changed', (payload) => {
      this.activeFilters = payload.filters;
      const matches = this.navManager.listDestinations(payload.filters);
      this.matchingDestinationIds = new Set(matches.map((m) => m.id));
      this.updateFilterHighlighting();
    });

    this.unsubscribeSystem = this.navManager.on('navigation:system_inspected', (payload) => {
      this.inspectedSystemId = payload.parentDestinationId;
      this.systemViewHeader.visible = !!this.inspectedSystemId;
      this.focusPlanet(payload.parentDestinationId, 1.9);
    });
  }

  public adjustZoom(delta: number): void {
    this.targetZoomLevel = Math.max(0.4, Math.min(3.0, this.targetZoomLevel + delta));
    this.zoomLevel = this.targetZoomLevel;
    this.updateTransform();
  }

  public resetView(): void {
    this.targetZoomLevel = 1.0;
    this.zoomLevel = 1.0;
    this.targetPanX = 0;
    this.targetPanY = 0;
    this.panX = 0;
    this.panY = 0;
    this.inspectedSystemId = null;
    this.systemViewHeader.visible = false;
    this.updateTransform();
    this.navManager.inspectSystem(null);
  }

  public returnToOverview(): void {
    this.resetView();
  }

  public inspectSystem(parentDestinationId: string): void {
    this.inspectedSystemId = parentDestinationId;
    this.systemViewHeader.visible = true;
    this.focusPlanet(parentDestinationId, 2.0);
    this.setSelectedDestination(parentDestinationId);
    this.navManager.inspectSystem(parentDestinationId);
  }

  public focusPlanet(destinationId: string, customZoom?: number): void {
    const pos = this.bodyScreenPositions.get(destinationId);
    if (customZoom) {
      this.targetZoomLevel = customZoom;
      this.zoomLevel = customZoom;
    }
    if (pos) {
      this.targetPanX = -pos.x * this.zoomLevel;
      this.targetPanY = -pos.y * this.zoomLevel;
      this.panX = this.targetPanX;
      this.panY = this.targetPanY;
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
      if (dest) {
        if (this.onSelectCb) {
          this.onSelectCb(dest);
        }
        this.navManager.setSelectedDestination(id);
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

    this.renderStarfield(reducedMotion);
    this.renderOrbits();
    this.renderSunCorona(reducedMotion);
    this.renderAsteroidBelt();
    this.updateBodyPositions(reducedMotion);
    this.renderExplorationBadges(reducedMotion);
    this.renderSelectionReticle(reducedMotion);
  }

  private renderStarfield(reducedMotion: boolean): void {
    this.starfieldGfx.clear();
    for (const s of this.stars) {
      const twinkle = reducedMotion ? 1.0 : 0.7 + 0.3 * Math.sin(this.animationTimer * s.twinkleSpeed);
      this.starfieldGfx.circle(s.x, s.y, s.radius);
      this.starfieldGfx.fill({ color: s.color, alpha: s.baseAlpha * twinkle });
    }
  }

  private renderNebula(): void {
    this.nebulaGfx.clear();
    // Subtle cosmic dust clouds in background corners
    this.nebulaGfx.ellipse(this.mapWidth * 0.15, this.mapHeight * 0.25, 220, 140);
    this.nebulaGfx.fill({ color: 0x1e1b4b, alpha: 0.12 });

    this.nebulaGfx.ellipse(this.mapWidth * 0.85, this.mapHeight * 0.7, 260, 160);
    this.nebulaGfx.fill({ color: 0x0c4a6e, alpha: 0.1 });
  }

  private renderFrame(): void {
    this.backgroundGfx.clear();

    // Deep space tactical canvas
    this.backgroundGfx.roundRect(0, 0, this.mapWidth, this.mapHeight, UI_RADIUS.MD);
    this.backgroundGfx.fill({ color: 0x020612, alpha: 0.96 });
    this.backgroundGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.5 });

    // Subtle tactical coordinate crosshairs
    this.backgroundGfx.moveTo(40, this.mapHeight / 2).lineTo(this.mapWidth - 40, this.mapHeight / 2);
    this.backgroundGfx.moveTo(this.mapWidth / 2, 40).lineTo(this.mapWidth / 2, this.mapHeight - 40);
    this.backgroundGfx.stroke({ color: 0x071a2f, width: 1.0, alpha: 0.25 });
  }

  private renderSunCorona(reducedMotion: boolean): void {
    this.sunGfx.clear();

    const sun = this.registry.getDestination(DestinationId.SUN);
    const r = sun?.radiusPixels ?? 34;

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

      const isSelected = p.id === this.selectedDestinationId;
      const isInspected = p.id === this.inspectedSystemId;

      this.orbitsGfx.circle(0, 0, p.orbitRadiusPixels);
      this.orbitsGfx.stroke({
        color: isSelected || isInspected ? UI_COLORS.CYAN : 0x1e3a5f,
        width: isSelected || isInspected ? 1.5 : 1.0,
        alpha: isSelected || isInspected ? 0.7 : 0.28,
      });
    }

    // If a system is inspected, draw sub-orbits for its moons
    if (this.inspectedSystemId) {
      const parentPos = this.bodyScreenPositions.get(this.inspectedSystemId);
      if (parentPos) {
        const children = this.registry.getSubDestinations(this.inspectedSystemId);
        for (const child of children) {
          if (child.orbitRadiusPixels > 0) {
            this.orbitsGfx.circle(parentPos.x, parentPos.y, child.orbitRadiusPixels);
            this.orbitsGfx.stroke({
              color: 0x38bdf8,
              width: 1.0,
              alpha: 0.45,
            });
          }
        }
      }
    }
  }

  private renderAsteroidBelt(): void {
    this.asteroidBeltGfx.clear();

    const belt = this.registry.getDestination(DestinationId.ASTEROID_BELT);
    const rBase = belt?.orbitRadiusPixels ?? 310;

    const count = 52;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + this.animationTimer * 0.02;
      const rOffset = ((i % 5) - 2) * 5;
      const x = Math.cos(angle) * (rBase + rOffset);
      const y = Math.sin(angle) * (rBase + rOffset);

      this.asteroidBeltGfx.circle(x, y, i % 3 === 0 ? 2.2 : 1.2);
      this.asteroidBeltGfx.fill({ color: 0x94a3b8, alpha: 0.5 });
    }
  }

  private buildPlanetaryBodies(): void {
    this.bodiesContainer.removeChildren();

    const destinations = this.registry.getAllDestinations();

    for (const dest of destinations) {
      if (dest.category === DestinationCategory.ORBITAL_REGION) continue;

      const bodyNode = new Container();
      bodyNode.label = dest.id;
      bodyNode.eventMode = 'static';
      bodyNode.cursor = 'pointer';

      // Hit area wrapper
      const hitAreaGfx = new Graphics();
      hitAreaGfx.circle(0, 0, Math.max(26, dest.radiusPixels + 14));
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
        if (dest.hasSubDestinations && this.inspectedSystemId !== dest.id) {
          // Single tap on parent planet selects it; double-tap or focus button opens system
        }
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
    if (dest.id === DestinationId.SATURN || dest.id === 'dest-saturn') {
      g.ellipse(0, 0, r * 2.2, r * 0.6);
      g.stroke({ color: 0xfde047, width: 3.5, alpha: 0.6 });
      g.ellipse(0, 0, r * 2.6, r * 0.7);
      g.stroke({ color: 0xfef08a, width: 1.5, alpha: 0.4 });
    }

    // Uranus subtle rings
    if (dest.id === DestinationId.URANUS || dest.id === 'dest-uranus') {
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
    if (
      dest.category === DestinationCategory.ROCKY_PLANET ||
      dest.category === DestinationCategory.GAS_GIANT ||
      dest.category === DestinationCategory.PLANET
    ) {
      g.arc(0, 0, r - 1, -Math.PI / 2, Math.PI / 2);
      g.stroke({ color: 0xffffff, width: 1.2, alpha: 0.4 });
    }
  }

  private updateBodyPositions(reducedMotion: boolean): void {
    this.bodyScreenPositions.clear();

    const destinations = this.registry.getAllDestinations();

    for (const dest of destinations) {
      if (dest.category === DestinationCategory.ORBITAL_REGION) continue;

      const node = this.bodiesContainer.children.find(
        (c) => c.label === dest.id
      ) as Container | undefined;
      if (!node) continue;

      let x = 0;
      let y = 0;

      if (dest.parentId) {
        // Natural satellite / Moon
        const parentDest = this.registry.getDestination(dest.parentId);
        let parentX = 0;
        let parentY = 0;
        if (parentDest) {
          const parentAngle =
            parentDest.initialAngle +
            (reducedMotion ? 0 : this.animationTimer * parentDest.orbitSpeed);
          parentX = Math.cos(parentAngle) * parentDest.orbitRadiusPixels;
          parentY = Math.sin(parentAngle) * parentDest.orbitRadiusPixels;
        }

        // When inspecting this system, expand moon orbits for tactical clarity
        const isSystemInspected = this.inspectedSystemId === dest.parentId;
        const orbitScale = isSystemInspected ? 1.4 : 1.0;

        const moonAngle =
          dest.initialAngle +
          (reducedMotion ? 0 : this.animationTimer * dest.orbitSpeed);
        x = parentX + Math.cos(moonAngle) * (dest.orbitRadiusPixels * orbitScale);
        y = parentY + Math.sin(moonAngle) * (dest.orbitRadiusPixels * orbitScale);

        // Visibility of moons: visible if inspected OR zoomed in > 1.2
        const isVisible = isSystemInspected || this.zoomLevel >= 1.2;
        node.visible = isVisible;
      } else if (dest.orbitRadiusPixels > 0) {
        // Planet orbiting Sun
        const angle =
          dest.initialAngle +
          (reducedMotion ? 0 : this.animationTimer * dest.orbitSpeed);
        x = Math.cos(angle) * dest.orbitRadiusPixels;
        y = Math.sin(angle) * dest.orbitRadiusPixels;
        node.visible = true;
      } else {
        // Sun
        x = 0;
        y = 0;
        node.visible = true;
      }

      node.position.set(x, y);
      this.bodyScreenPositions.set(dest.id, { x, y, r: dest.radiusPixels });
    }
  }

  private renderExplorationBadges(reducedMotion: boolean): void {
    this.badgesGfx.clear();

    for (const [id, pos] of this.bodyScreenPositions) {
      const dest = this.registry.getDestination(id);
      if (!dest) continue;

      const status = this.navManager.getDestinationExplorationStatus(id);

      const bx = pos.x + pos.r + 4;
      const by = pos.y - pos.r;

      switch (status) {
        case ExplorationStatusBadge.BASE_ESTABLISHED:
          // Cyan base diamond
          this.badgesGfx.rect(bx - 3, by - 3, 6, 6);
          this.badgesGfx.fill({ color: UI_COLORS.CYAN, alpha: 0.95 });
          break;

        case ExplorationStatusBadge.SURFACE_EXPLORED:
          // Emerald green disc
          this.badgesGfx.circle(bx, by, 3.5);
          this.badgesGfx.fill({ color: UI_COLORS.GREEN, alpha: 0.95 });
          break;

        case ExplorationStatusBadge.VISITED:
          // Small green ring
          this.badgesGfx.circle(bx, by, 3);
          this.badgesGfx.stroke({ color: UI_COLORS.GREEN, width: 1.2, alpha: 0.9 });
          break;

        case ExplorationStatusBadge.COMMS_CONNECTED:
          // Satellite signal arc
          this.badgesGfx.arc(bx, by, 4, -Math.PI / 4, Math.PI / 4);
          this.badgesGfx.stroke({ color: UI_COLORS.CYAN, width: 1.2, alpha: 0.9 });
          break;

        case ExplorationStatusBadge.LOCKED:
          // Amber lock indicator
          this.badgesGfx.rect(bx - 2.5, by - 1, 5, 4);
          this.badgesGfx.fill({ color: UI_COLORS.AMBER, alpha: 0.85 });
          this.badgesGfx.circle(bx, by - 2, 2);
          this.badgesGfx.stroke({ color: UI_COLORS.AMBER, width: 1.0, alpha: 0.85 });
          break;

        case ExplorationStatusBadge.UNEXPLORED:
        default:
          break;
      }

      // If active mission exists on body, draw pulsing beacon ring
      const hasActiveMission = this.navManager
        .getDestinationMissionOpportunities(id)
        .some((m) => m.status === 'IN_PROGRESS' || m.isActive);

      if (hasActiveMission) {
        const pulse = reducedMotion ? 1.0 : 1.0 + Math.sin(this.animationTimer * 4.0) * 0.3;
        this.badgesGfx.circle(pos.x, pos.y, (pos.r + 6) * pulse);
        this.badgesGfx.stroke({ color: UI_COLORS.CYAN, width: 1.5, alpha: 0.85 });
      }
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

    const b = size + pulse;
    this.selectionReticleGfx
      .moveTo(-b, -b + bracketLen).lineTo(-b, -b).lineTo(-b + bracketLen, -b)
      .moveTo(b - bracketLen, -b).lineTo(b, -b).lineTo(b, -b + bracketLen)
      .moveTo(b, b - bracketLen).lineTo(b, b).lineTo(b - bracketLen, b)
      .moveTo(-b + bracketLen, b).lineTo(-b, b).lineTo(-b, b - bracketLen)
      .stroke({ color: UI_COLORS.CYAN, width: 2.0, alpha: 0.95 });

    this.selectionReticleGfx.circle(0, 0, b + 6);
    this.selectionReticleGfx.stroke({ color: UI_COLORS.CYAN, width: 1.0, alpha: 0.35 });
  }

  private updateFilterHighlighting(): void {
    const hasFilterActive =
      (this.activeFilters.category && this.activeFilters.category !== 'ALL') ||
      (this.activeFilters.status && this.activeFilters.status !== 'ALL') ||
      !!this.activeFilters.query;

    for (const child of this.bodiesContainer.children) {
      const destId = child.label;
      if (!destId) continue;

      if (!hasFilterActive) {
        child.alpha = 1.0;
      } else {
        const isMatch = this.matchingDestinationIds.has(destId);
        child.alpha = isMatch ? 1.0 : 0.25;
      }
    }
  }

  public override destroy(): void {
    if (this.unsubscribeAction) this.unsubscribeAction();
    if (this.unsubscribeFilter) this.unsubscribeFilter();
    if (this.unsubscribeSystem) this.unsubscribeSystem();
    this.backgroundGfx.removeAllListeners();
    super.destroy();
  }
}
