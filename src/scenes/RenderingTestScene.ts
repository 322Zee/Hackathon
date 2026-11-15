/**
 * INTERSTELLAR CONTINUUM - Rendering Architecture
 * Rendering Test Scene: Multi-layer 2.5D demonstration scene
 * Demonstrates:
 * - All 12 rendering layers
 * - 2.5D depth scaling and aerial perspective tinting
 * - Parallax movement across distant and foreground layers
 * - Dynamic 2D lighting with ambient twilight and pulsating beacons
 * - Shaders: Atmospheric haze, Thruster heat distortion, Scanlines, Vignette
 * - Dynamic Y-sorting of gameplay objects
 * - Interactive HUD and diagnostics UI overlay
 */

import { Container, Graphics, Text } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { SceneId } from './SceneId';
import { RenderPipeline } from '../rendering/pipeline/RenderPipeline';
import { RenderLayerType } from '../rendering/layers/RenderLayerType';
import { LightType, FalloffType } from '../rendering/lighting/LightTypes';
import { AtmosphericHazeFilter } from '../rendering/shaders/filters/AtmosphericHazeFilter';
import { ThrusterHeatFilter } from '../rendering/shaders/filters/ThrusterHeatFilter';
import { ScanlineHologramFilter } from '../rendering/shaders/filters/ScanlineHologramFilter';
import { VignetteFilter } from '../rendering/shaders/filters/VignetteFilter';
import { ServiceLocator } from '../core/ServiceLocator';
import { RenderEngine } from '../rendering/RenderEngine';
import { CameraSystem } from '../camera/CameraSystem';
import { CameraMode, ZoomPreset } from '../camera/CameraMode';
import { ICameraTarget } from '../camera/CameraTarget';
import { Logger } from '../core/logging/Logger';

interface Particle {
  graphics: Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  alpha: number;
}

export class RenderingTestScene extends BaseScene {
  public readonly id = SceneId.PLANETARY_ENVIRONMENTS;

  private pipeline?: RenderPipeline;
  private cameraSystem?: CameraSystem;
  private particles: Particle[] = [];
  private telemetryText?: Text;
  private roverContainer?: Container;
  private astronautContainer?: Container;
  private landerContainer?: Container;
  private probeContainer?: Container;
  private elapsedSeconds: number = 0;

  // Rover motion state for target tracking
  private roverX: number = 650;
  private roverVx: number = 90;

  protected async onInitialize(): Promise<void> {
    Logger.info('TEST_SCENE', 'Initializing Rendering Test Scene with Camera Architecture...');

    // Access or establish RenderPipeline
    if (ServiceLocator.has('RenderEngine')) {
      const renderEngine = ServiceLocator.get<RenderEngine>('RenderEngine');
      this.pipeline = renderEngine.getPipeline();
    } else {
      // Standalone/testing fallback
      this.pipeline = new RenderPipeline(this.container);
    }

    // Access or establish CameraSystem
    if (ServiceLocator.has('CameraSystem')) {
      this.cameraSystem = ServiceLocator.get<CameraSystem>('CameraSystem');
    } else {
      this.cameraSystem = new CameraSystem();
      this.cameraSystem.setLayerManager(this.pipeline.layerManager);
    }

    // Configure camera boundaries for the Mars exploration zone
    this.cameraSystem.setBounds({
      minX: -400,
      maxX: 2400,
      minY: 0,
      maxY: 1200,
    });

    this.setupSceneContent();
    Logger.info('TEST_SCENE', 'Rendering Test Scene initialized successfully.');
  }

  private setupSceneContent(): void {
    if (!this.pipeline) return;

    // 1. LAYER 1: BACKGROUND (Deep Space & Nebula)
    this.setupBackgroundLayer();

    // 2. LAYER 2: DISTANT ENVIRONMENT (Celestial Planet with Atmospheric Limb)
    this.setupDistantEnvironmentLayer();

    // 3. LAYER 3: PARALLAX (Multi-depth Starfield & Orbital Station)
    this.setupParallaxLayer();

    // 4. LAYER 4: WORLD (Mars Terrain & Landing Pad Platform)
    this.setupWorldLayer();

    // 5. LAYER 5: GAMEPLAY OBJECTS (Lander, Rover, Astronaut, Probe with 2.5D Depth)
    this.setupGameplayObjectsLayer();

    // 6. LAYER 6: FOREGROUND ENVIRONMENT (Gantry Crane Silhouette)
    this.setupForegroundLayer();

    // 7. LAYER 7: PARTICLES & ATMOSPHERE (Martian Dust & Thruster Sparks)
    this.setupParticlesLayer();

    // 8. LAYER 8: LIGHTING (Mars Surface Twilight + Pulsing Beacons + Spotlight)
    this.setupLightingLayer();

    // 9. LAYER 9: WORLD EFFECTS (Thruster Heat Distortion Shimmer)
    this.setupWorldEffectsLayer();

    // 10. LAYER 10: HUD (Tactical Telemetry & Depth Indicators)
    this.setupHudLayer();

    // 11. LAYER 11: UI OVERLAY (Diagnostic Controls)
    this.setupUiOverlayLayer();

    // 12. LAYER 12: CINEMATIC OVERLAY (Letterbox & Vignette)
    this.setupCinematicOverlayLayer();
  }

  private setupBackgroundLayer(): void {
    const bgContainer = this.pipeline!.getLayerContainer(RenderLayerType.BACKGROUND);
    const bg = new Graphics();
    // Cosmic gradient void
    bg.rect(0, 0, 1920, 1080);
    bg.fill({ color: 0x050813, alpha: 1.0 });

    // Distant Martian twilight horizon glow
    bg.rect(0, 680, 1920, 400);
    bg.fill({ color: 0x2a120e, alpha: 0.85 });

    // Procedural nebula cloud
    for (let i = 0; i < 6; i++) {
      bg.circle(400 + i * 180, 320 + Math.sin(i) * 50, 220 - i * 15);
      bg.fill({ color: 0x4a1d24, alpha: 0.18 });
    }

    bgContainer.addChild(bg);
  }

  private setupDistantEnvironmentLayer(): void {
    const distantContainer = this.pipeline!.getLayerContainer(RenderLayerType.DISTANT_ENVIRONMENT);
    const planetContainer = new Container();
    planetContainer.position.set(1450, 300);

    const planetGraphics = new Graphics();
    planetGraphics.circle(0, 0, 160);
    planetGraphics.fill({ color: 0x9a3412 }); // Mars Rust Body

    // Atmospheric latitude bands
    planetGraphics.rect(-150, -30, 300, 25);
    planetGraphics.fill({ color: 0xc2410c, alpha: 0.7 });
    planetGraphics.rect(-140, 20, 280, 20);
    planetGraphics.fill({ color: 0x7c2d12, alpha: 0.8 });

    // Polar ice cap
    planetGraphics.arc(0, -90, 80, Math.PI * 0.9, Math.PI * 0.1, true);
    planetGraphics.fill({ color: 0xfed7aa, alpha: 0.85 });

    planetContainer.addChild(planetGraphics);

    // Attach Atmospheric Haze Filter to distant planet
    const hazeFilter = new AtmosphericHazeFilter({
      glowColor: [0.95, 0.45, 0.25], // Warm Martian atmospheric scatter
      intensity: 1.4,
      thickness: 0.1,
    });
    this.pipeline!.shaderManager.registerFilter(hazeFilter);
    planetContainer.filters = [hazeFilter.filter];

    distantContainer.addChild(planetContainer);
  }

  private setupParallaxLayer(): void {
    const parallaxContainer = this.pipeline!.getLayerContainer(RenderLayerType.PARALLAX);
    const stars = new Graphics();

    // 250 distant stars
    for (let i = 0; i < 250; i++) {
      const x = (i * 77 + 23) % 1920;
      const y = (i * 47 + 11) % 650;
      const r = (i % 3 === 0 ? 1.5 : 0.8);
      const alpha = 0.4 + (i % 5) * 0.12;
      stars.circle(x, y, r);
      stars.fill({ color: 0xffffff, alpha });
    }

    // Distant orbital satellite silhouette
    const satellite = new Graphics();
    satellite.rect(600, 200, 40, 8);
    satellite.fill({ color: 0x64748b });
    satellite.rect(616, 194, 8, 20);
    satellite.fill({ color: 0x38bdf8 }); // Solar panel blue
    stars.addChild(satellite);

    parallaxContainer.addChild(stars);
  }

  private setupWorldLayer(): void {
    const worldContainer = this.pipeline!.getLayerContainer(RenderLayerType.WORLD);
    const world = new Graphics();

    // Martian terrain ridge
    world.moveTo(0, 750);
    world.lineTo(400, 720);
    world.lineTo(850, 760);
    world.lineTo(1350, 710);
    world.lineTo(1920, 740);
    world.lineTo(1920, 1080);
    world.lineTo(0, 1080);
    world.closePath();
    world.fill({ color: 0x571c14 });

    // Heavy Industrial Landing Platform (Modular reinforced pad)
    world.rect(480, 720, 960, 45);
    world.fill({ color: 0x1e293b }); // Concrete base
    world.stroke({ color: 0x475569, width: 3 });

    // Warning hazard stripes on platform lip
    for (let x = 480; x < 1440; x += 40) {
      world.moveTo(x, 720);
      world.lineTo(x + 20, 740);
      world.lineTo(x + 10, 740);
      world.lineTo(x - 10, 720);
      world.fill({ color: 0xf59e0b, alpha: 0.85 }); // Amber hazard
    }

    worldContainer.addChild(world);
  }

  private setupGameplayObjectsLayer(): void {
    const gameplayContainer = this.pipeline!.getLayerContainer(RenderLayerType.GAMEPLAY_OBJECTS);

    // 1. Heavy Lander Spacecraft (Focal Plane Z = 0, y = 715)
    this.landerContainer = new Container();
    this.landerContainer.position.set(960, 715);
    const lander = new Graphics();
    // Service Module Body
    lander.rect(-70, -180, 140, 160);
    lander.fill({ color: 0xe2e8f0 });
    lander.stroke({ color: 0x0284c7, width: 2 });
    // Command module capsule cone
    lander.moveTo(-60, -180);
    lander.lineTo(0, -250);
    lander.lineTo(60, -180);
    lander.closePath();
    lander.fill({ color: 0x0f172a });
    // Heat shield base
    lander.rect(-80, -20, 160, 20);
    lander.fill({ color: 0x334155 });
    // Landing gear struts
    lander.moveTo(-70, -20);
    lander.lineTo(-120, 25);
    lander.stroke({ color: 0x94a3b8, width: 6 });
    lander.moveTo(70, -20);
    lander.lineTo(120, 25);
    lander.stroke({ color: 0x94a3b8, width: 6 });
    // Agency insignia decal
    lander.circle(0, -100, 18);
    lander.fill({ color: 0x0284c7 });
    this.landerContainer.addChild(lander);
    this.pipeline!.depthSystem.applyDepthToObject(this.landerContainer, 0.0);
    gameplayContainer.addChild(this.landerContainer);

    // 2. Surface Exploration Rover (Foreground Z = -1.5, y = 750, larger scale)
    this.roverContainer = new Container();
    this.roverContainer.position.set(650, 750);
    const rover = new Graphics();
    // Chassis
    rover.rect(-50, -40, 100, 30);
    rover.fill({ color: 0x3b82f6 });
    rover.stroke({ color: 0x1d4ed8, width: 2 });
    // Wheels (4-wheel rocker-bogie)
    rover.circle(-40, 0, 16);
    rover.fill({ color: 0x0f172a });
    rover.circle(40, 0, 16);
    rover.fill({ color: 0x0f172a });
    // Sensor Mast & Telemetry Dish
    rover.moveTo(-20, -40);
    rover.lineTo(-20, -75);
    rover.stroke({ color: 0x94a3b8, width: 3 });
    rover.circle(-20, -75, 8);
    rover.fill({ color: 0x38bdf8 });
    this.roverContainer.addChild(rover);
    this.pipeline!.depthSystem.applyDepthToObject(this.roverContainer, -1.5);
    gameplayContainer.addChild(this.roverContainer);

    // Register Rover as Camera Follow Target
    const roverTarget: ICameraTarget = {
      id: 'exploration_rover',
      getPosition: () => ({ x: this.roverX, y: 750 }),
      getVelocity: () => ({ x: this.roverVx, y: 0 }),
    };
    this.cameraSystem?.setTarget(roverTarget);

    // 3. Field Astronaut (Z = -0.6, y = 735)
    this.astronautContainer = new Container();
    this.astronautContainer.position.set(780, 735);
    const astronaut = new Graphics();
    // EVA Suit Body
    astronaut.rect(-10, -45, 20, 35);
    astronaut.fill({ color: 0xffffff });
    // Gold reflective helmet visor
    astronaut.circle(0, -50, 12);
    astronaut.fill({ color: 0xf59e0b });
    // Life support backpack
    astronaut.rect(-15, -42, 6, 26);
    astronaut.fill({ color: 0x64748b });
    // Legs
    astronaut.rect(-8, -10, 6, 12);
    astronaut.fill({ color: 0xffffff });
    astronaut.rect(2, -10, 6, 12);
    astronaut.fill({ color: 0xffffff });
    this.astronautContainer.addChild(astronaut);
    this.pipeline!.depthSystem.applyDepthToObject(this.astronautContainer, -0.6);
    gameplayContainer.addChild(this.astronautContainer);

    // 4. Robotic Sensor Probe (Background Z = 4.2, y = 670, scaled down with atmospheric haze)
    this.probeContainer = new Container();
    this.probeContainer.position.set(1280, 670);
    const probe = new Graphics();
    probe.circle(0, 0, 14);
    probe.fill({ color: 0xe0f2fe });
    probe.rect(-18, -3, 36, 6);
    probe.fill({ color: 0x0284c7 });
    this.probeContainer.addChild(probe);
    this.pipeline!.depthSystem.applyDepthToObject(this.probeContainer, 4.2, 0xe0f2fe);
    gameplayContainer.addChild(this.probeContainer);

    // Sort gameplay layer initially
    this.pipeline!.sortGameplayObjects();
  }

  private setupForegroundLayer(): void {
    const fgContainer = this.pipeline!.getLayerContainer(RenderLayerType.FOREGROUND_ENVIRONMENT);
    const gantry = new Graphics();

    // Heavy Industrial Gantry Tower silhouette framing screen left
    gantry.rect(-80, 300, 140, 780);
    gantry.fill({ color: 0x090d16, alpha: 0.95 });

    // Steel truss bracing
    for (let y = 320; y < 1000; y += 80) {
      gantry.moveTo(-80, y);
      gantry.lineTo(60, y + 80);
      gantry.stroke({ color: 0x1e293b, width: 4 });
      gantry.moveTo(60, y);
      gantry.lineTo(-80, y + 80);
      gantry.stroke({ color: 0x1e293b, width: 4 });
    }

    // Overhead service crane arm extending over the pad
    gantry.rect(-20, 260, 480, 35);
    gantry.fill({ color: 0x090d16, alpha: 0.95 });

    fgContainer.addChild(gantry);
  }

  private setupParticlesLayer(): void {
    const particleContainer = this.pipeline!.getLayerContainer(RenderLayerType.PARTICLES_ATMOSPHERE);

    // Instantiate 40 persistent dust & plume particles
    for (let i = 0; i < 40; i++) {
      const g = new Graphics();
      const isPlume = i % 2 === 0;
      const size = isPlume ? Math.random() * 3 + 2 : Math.random() * 2 + 1;
      const color = isPlume ? 0x38bdf8 : 0xf97316; // Thruster spark vs dust particle

      g.circle(0, 0, size);
      g.fill({ color, alpha: 0.8 });
      (g as any).blendMode = isPlume ? 'add' : 'normal';

      const p: Particle = {
        graphics: g,
        x: isPlume ? 960 + (Math.random() * 60 - 30) : Math.random() * 1920,
        y: isPlume ? 710 + Math.random() * 40 : 650 + Math.random() * 300,
        vx: isPlume ? (Math.random() * 40 - 20) : (Math.random() * 30 + 15),
        vy: isPlume ? Math.random() * 50 + 20 : (Math.random() * 10 - 5),
        life: Math.random() * 2.0,
        maxLife: Math.random() * 1.5 + 1.0,
        alpha: 0.8,
      };

      g.position.set(p.x, p.y);
      particleContainer.addChild(g);
      this.particles.push(p);
    }
  }

  private setupLightingLayer(): void {
    const lighting = this.pipeline!.lightingSystem;
    lighting.applyPreset('MARS_SURFACE');

    // 1. Pulsing Launchpad Warning Beacon (Amber)
    lighting.addLight({
      id: 'beacon_pad_left',
      type: LightType.POINT,
      x: 520,
      y: 710,
      radius: 220,
      color: 0xf59e0b,
      intensity: 0.85,
      falloff: FalloffType.SMOOTH,
      pulseSpeed: 3.0,
      pulseIntensityMin: 0.3,
      pulseIntensityMax: 1.1,
    });

    // 2. High-intensity Lander Service Floodlight (Cyan)
    lighting.addLight({
      id: 'floodlight_lander',
      type: LightType.SPOT,
      x: 960,
      y: 650,
      radius: 420,
      color: 0x38bdf8,
      intensity: 0.95,
      falloff: FalloffType.SMOOTH,
      direction: Math.PI / 2, // Shining downwards onto landing bay
      coneAngle: Math.PI / 2.5,
    });

    // 3. Rover Worklight
    lighting.addLight({
      id: 'rover_headlight',
      type: LightType.SPOT,
      x: 690,
      y: 730,
      radius: 300,
      color: 0xffedd5,
      intensity: 0.75,
      falloff: FalloffType.SMOOTH,
      direction: 0, // Shining to the right
      coneAngle: Math.PI / 3,
    });
  }

  private setupWorldEffectsLayer(): void {
    const fxContainer = this.pipeline!.getLayerContainer(RenderLayerType.WORLD_EFFECTS);

    // Thruster heat shimmer visual graphic
    const plumeGlow = new Graphics();
    plumeGlow.moveTo(930, 715);
    plumeGlow.lineTo(960, 780);
    plumeGlow.lineTo(990, 715);
    plumeGlow.closePath();
    plumeGlow.fill({ color: 0x0284c7, alpha: 0.35 });

    fxContainer.addChild(plumeGlow);

    // Attach Thruster Heat Distortion Filter
    const heatFilter = new ThrusterHeatFilter({
      speed: 6.0,
      frequency: 30.0,
      amplitude: 0.008,
    });
    this.pipeline!.shaderManager.registerFilter(heatFilter);
    plumeGlow.filters = [heatFilter.filter];
  }

  private setupHudLayer(): void {
    const hudContainer = this.pipeline!.getLayerContainer(RenderLayerType.HUD);
    const hud = new Graphics();

    // Targeting brackets around Lander
    hud.rect(880, 500, 160, 240);
    hud.stroke({ color: 0x38bdf8, width: 1, alpha: 0.5 });
    // Telemetry reticle corners
    hud.moveTo(880, 520);
    hud.lineTo(880, 500);
    hud.lineTo(900, 500);
    hud.stroke({ color: 0x38bdf8, width: 2 });

    // Vector line connecting Rover to Lander
    hud.moveTo(690, 730);
    hud.lineTo(890, 715);
    hud.stroke({ color: 0x22c55e, width: 1, alpha: 0.4 });

    hudContainer.addChild(hud);

    // Apply Scanline Hologram Filter to HUD
    const hologramFilter = new ScanlineHologramFilter({
      lineCount: 220,
      flickerSpeed: 8.0,
      chromaticShift: 0.0015,
    });
    this.pipeline!.shaderManager.registerFilter(hologramFilter);
    hudContainer.filters = [hologramFilter.filter];
  }

  private setupUiOverlayLayer(): void {
    const uiContainer = this.pipeline!.getLayerContainer(RenderLayerType.UI_OVERLAY);

    // Tactical Header Panel (expanded to accommodate camera & viewport controls)
    const headerBg = new Graphics();
    headerBg.rect(40, 25, 960, 185);
    headerBg.fill({ color: 0x020617, alpha: 0.9 });
    headerBg.stroke({ color: 0x0284c7, width: 2 });

    const titleText = new Text({
      text: 'INTERSTELLAR CONTINUUM // CAMERA & VIEWPORT ARCHITECTURE',
      style: {
        fontFamily: 'Courier New, monospace',
        fontSize: 15,
        fontWeight: 'bold',
        fill: '#38bdf8',
        letterSpacing: 2,
      },
    });
    titleText.position.set(60, 40);

    this.telemetryText = new Text({
      text: 'CAM: (0, 0) | ZOOM: 1.0x | MODE: PLAYER_FOLLOW | FRUSTUM: [-400..2400]\nTARGET: EXPLORATION_ROVER | DEADZONE: ACTIVE | PARALLAX: SYNCED',
      style: {
        fontFamily: 'Courier New, monospace',
        fontSize: 12,
        fill: '#94a3b8',
        lineHeight: 18,
      },
    });
    this.telemetryText.position.set(60, 70);

    // Row 1: Camera Mode & Zoom Controls
    const btnFollowRover = this.createButton(60, 120, 'FOLLOW ROVER', () => {
      this.cameraSystem?.setMode(CameraMode.PLAYER_FOLLOW);
    });

    const btnOverview = this.createButton(205, 120, 'OVERVIEW 0.4x', () => {
      this.cameraSystem?.setMode(CameraMode.MISSION_OVERVIEW);
      this.cameraSystem?.setZoomPreset(ZoomPreset.MISSION_OVERVIEW);
    });

    const btnCloseUp = this.createButton(350, 120, 'CLOSE-UP 1.8x', () => {
      this.cameraSystem?.setMode(CameraMode.INTERFACE_FOCUSED);
      this.cameraSystem?.setZoomPreset(ZoomPreset.CLOSE_INTERACTION);
    });

    const btnShake = this.createButton(495, 120, 'SHAKE CAM', () => {
      this.cameraSystem?.shake(30);
    });

    const btnReset = this.createButton(640, 120, 'RESET CAM', () => {
      this.cameraSystem?.reset();
    });

    // Row 2: Rendering Toggles
    const btnLighting = this.createButton(60, 160, 'TOGGLE LIGHTS', () => {
      const current = this.pipeline!.lightingSystem.getEnabled();
      this.pipeline!.lightingSystem.setEnabled(!current);
    });

    const btnShaders = this.createButton(205, 160, 'TOGGLE SHADERS', () => {
      const current = this.pipeline!.shaderManager.areShadersEnabled();
      this.pipeline!.shaderManager.setShadersEnabled(!current);
    });

    uiContainer.addChild(headerBg);
    uiContainer.addChild(titleText);
    uiContainer.addChild(this.telemetryText);
    uiContainer.addChild(btnFollowRover);
    uiContainer.addChild(btnOverview);
    uiContainer.addChild(btnCloseUp);
    uiContainer.addChild(btnShake);
    uiContainer.addChild(btnReset);
    uiContainer.addChild(btnLighting);
    uiContainer.addChild(btnShaders);
  }

  private createButton(x: number, y: number, label: string, onClick: () => void): Container {
    const btn = new Container();
    btn.position.set(x, y);
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const bg = new Graphics();
    bg.rect(0, 0, 130, 32);
    bg.fill({ color: 0x0f172a, alpha: 0.9 });
    bg.stroke({ color: 0x38bdf8, width: 1.5 });

    const txt = new Text({
      text: label,
      style: {
        fontFamily: 'Courier New, monospace',
        fontSize: 11,
        fontWeight: 'bold',
        fill: '#38bdf8',
      },
    });
    txt.position.set(10, 8);

    btn.addChild(bg);
    btn.addChild(txt);

    btn.on('pointerdown', onClick);
    btn.on('pointerover', () => {
      bg.clear();
      bg.rect(0, 0, 130, 32);
      bg.fill({ color: 0x0284c7, alpha: 0.9 });
      bg.stroke({ color: 0xffffff, width: 1.5 });
      txt.style.fill = '#ffffff';
    });
    btn.on('pointerout', () => {
      bg.clear();
      bg.rect(0, 0, 130, 32);
      bg.fill({ color: 0x0f172a, alpha: 0.9 });
      bg.stroke({ color: 0x38bdf8, width: 1.5 });
      txt.style.fill = '#38bdf8';
    });

    return btn;
  }

  private setupCinematicOverlayLayer(): void {
    const cinematicContainer = this.pipeline!.getLayerContainer(RenderLayerType.CINEMATIC_OVERLAY);
    const letterbox = new Graphics();

    // Subtle anamorphic widescreen framing bars
    letterbox.rect(0, 0, 1920, 24);
    letterbox.fill({ color: 0x000000, alpha: 0.95 });
    letterbox.rect(0, 1056, 1920, 24);
    letterbox.fill({ color: 0x000000, alpha: 0.95 });

    cinematicContainer.addChild(letterbox);

    // Attach Cinematic Vignette Filter
    const vignetteFilter = new VignetteFilter({
      radius: 0.45,
      softness: 0.45,
      intensity: 0.5,
    });
    this.pipeline!.shaderManager.registerFilter(vignetteFilter);
    cinematicContainer.filters = [vignetteFilter.filter];
  }

  protected onUpdate(deltaSeconds: number): void {
    if (!this.pipeline) return;

    this.elapsedSeconds += deltaSeconds;

    // 1. Animate Surface Rover Movement along Landing Platform
    this.roverX += this.roverVx * deltaSeconds;
    if (this.roverX > 1250) {
      this.roverX = 1250;
      this.roverVx = -Math.abs(this.roverVx);
    } else if (this.roverX < 600) {
      this.roverX = 600;
      this.roverVx = Math.abs(this.roverVx);
    }

    if (this.roverContainer) {
      this.roverContainer.position.x = this.roverX;
    }

    // 2. Update Central Camera System (tracks rover, applies bounds, shake & parallax)
    if (this.cameraSystem) {
      this.cameraSystem.update(deltaSeconds);
      const camPos = this.cameraSystem.getPosition();
      const zoom = this.cameraSystem.getZoom();
      const mode = this.cameraSystem.getMode();
      const frustum = this.cameraSystem.getVisibleFrustum();

      if (this.telemetryText) {
        this.telemetryText.text =
          `CAM: (${Math.round(camPos.x)}, ${Math.round(camPos.y)}) | ZOOM: ${zoom.toFixed(2)}x | MODE: ${mode}\n` +
          `ROVER_X: ${Math.round(this.roverX)} | FRUSTUM: [${Math.round(frustum.minX)}..${Math.round(frustum.maxX)}, ${Math.round(frustum.minY)}..${Math.round(frustum.maxY)}] | DEADZONE: ACTIVE`;
      }
    }

    // 3. Animated Martian Dust & Thruster Spark Particles
    for (const p of this.particles) {
      p.x += p.vx * deltaSeconds;
      p.y += p.vy * deltaSeconds;
      p.life += deltaSeconds;

      if (p.life >= p.maxLife || p.x > 1940 || p.y > 800) {
        // Reset particle
        p.life = 0;
        p.x = 940 + Math.random() * 40;
        p.y = 715;
      }

      p.graphics.position.set(p.x, p.y);
      p.graphics.alpha = Math.max(0, 1.0 - p.life / p.maxLife);
    }

    // 4. Subtle Robotic Probe Floating Motion
    if (this.probeContainer) {
      const hoverY = 670 + Math.sin(this.elapsedSeconds * 2.0) * 8;
      this.probeContainer.position.y = hoverY;
    }

    // 5. Update Pipeline Subsystems
    this.pipeline.update(deltaSeconds);
  }

  public getCameraSystem(): CameraSystem | undefined {
    return this.cameraSystem;
  }

  public getPipeline(): RenderPipeline | undefined {
    return this.pipeline;
  }

  protected onCleanup(): void {
    this.particles = [];
    Logger.info('TEST_SCENE', 'Rendering Test Scene cleaned up.');
  }
}
