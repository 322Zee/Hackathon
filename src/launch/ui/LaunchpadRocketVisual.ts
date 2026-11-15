/**
 * INTERSTELLAR CONTINUUM - 2D/2.5D Launchpad Rocket Visual Presentation
 * Renders the actual selected rocket design standing on Launch Complex Pad Alpha,
 * dynamically constructed from the project's saved modular configuration,
 * complete with launch mount hold-down clamps, umbilical swing arms, drop shadows,
 * payload fairing silhouette, and subtle ambient cryogenic boil-off effects.
 *
 * NOTE: Abstract educational game artwork. Real-world vehicle dimensions and physical
 * construction parameters are strictly excluded.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { RocketProject } from '../../engineering/RocketProjectTypes';
import { ModularRocketConfiguration, ConfigurationSlotType } from '../../engineering/builder/RocketBuilderTypes';
import { DeploymentRecord, DeploymentState } from '../LaunchDeploymentTypes';

export interface LaunchpadRocketVisualOptions {
  x?: number;
  y?: number;
  scale?: number;
}

export class LaunchpadRocketVisual {
  public readonly container: Container;

  private posX: number;
  private posY: number;
  private visualScale: number;

  private shadowContainer: Container;
  private mountContainer: Container;
  private rocketContainer: Container;
  private umbilicalContainer: Container;
  private effectsContainer: Container;
  private signageContainer: Container;

  private activeProject?: RocketProject;
  private activeDeployment?: DeploymentRecord;

  // Cryogenic venting animation particles
  private ventParticles: Array<{ x: number; y: number; vx: number; vy: number; alpha: number; radius: number }> = [];
  private ventGfx: Graphics;
  private animTimer: number = 0;

  constructor(options: LaunchpadRocketVisualOptions = {}) {
    this.posX = options.x ?? 3050;
    this.posY = options.y ?? 1830;
    this.visualScale = options.scale ?? 0.85;

    this.container = new Container();
    this.container.label = 'LaunchpadRocketVisual';
    this.container.position.set(this.posX, this.posY);
    this.container.scale.set(this.visualScale);
    this.container.zIndex = this.posY;
    this.container.sortableChildren = true;

    this.shadowContainer = new Container();
    this.shadowContainer.zIndex = 1;
    this.container.addChild(this.shadowContainer);

    this.mountContainer = new Container();
    this.mountContainer.zIndex = 2;
    this.container.addChild(this.mountContainer);

    this.rocketContainer = new Container();
    this.rocketContainer.zIndex = 3;
    this.container.addChild(this.rocketContainer);

    this.umbilicalContainer = new Container();
    this.umbilicalContainer.zIndex = 4;
    this.container.addChild(this.umbilicalContainer);

    this.effectsContainer = new Container();
    this.effectsContainer.zIndex = 5;
    this.container.addChild(this.effectsContainer);

    this.signageContainer = new Container();
    this.signageContainer.zIndex = 6;
    this.container.addChild(this.signageContainer);

    this.ventGfx = new Graphics();
    this.effectsContainer.addChild(this.ventGfx);

    this.render();
  }

  /**
   * Update active project and deployment status, re-rendering vehicle
   */
  public update(project?: RocketProject, deployment?: DeploymentRecord): void {
    this.activeProject = project;
    this.activeDeployment = deployment;
    this.render();
  }

  /**
   * Per-frame animation tick for subtle ambient venting effects
   */
  public tick(deltaSeconds: number): void {
    if (!this.activeProject) return;

    this.animTimer += deltaSeconds;

    // Spawn subtle boil-off vapor wisps periodically
    if (this.animTimer > 0.15) {
      this.animTimer = 0;
      if (this.ventParticles.length < 18) {
        // Venting from interstage / upper boil-off valve
        this.ventParticles.push({
          x: 22,
          y: -140 + Math.random() * 20,
          vx: 8 + Math.random() * 12,
          vy: -6 - Math.random() * 8,
          alpha: 0.6,
          radius: 3 + Math.random() * 4,
        });
      }
    }

    // Update and draw venting particles
    this.ventGfx.clear();
    for (let i = this.ventParticles.length - 1; i >= 0; i--) {
      const p = this.ventParticles[i]!;
      p.x += p.vx * deltaSeconds;
      p.y += p.vy * deltaSeconds;
      p.alpha -= deltaSeconds * 0.45;
      p.radius += deltaSeconds * 5;

      if (p.alpha <= 0) {
        this.ventParticles.splice(i, 1);
      } else {
        this.ventGfx
          .circle(p.x, p.y, p.radius)
          .fill({ color: 0xe2e8f0, alpha: p.alpha * 0.4 });
      }
    }
  }

  /**
   * Render complete launchpad visual scene
   */
  public render(): void {
    this.shadowContainer.removeChildren();
    this.mountContainer.removeChildren();
    this.rocketContainer.removeChildren();
    this.umbilicalContainer.removeChildren();
    this.signageContainer.removeChildren();

    this.renderLaunchMount();

    if (this.activeProject) {
      this.renderVehicle();
      this.renderUmbilicals();
      this.renderStatusBanner();
    } else {
      this.renderStandbySignage();
    }
  }

  // =========================================================================
  // 1. LAUNCH MOUNT & HOLD-DOWN CLAMPS
  // =========================================================================

  private renderLaunchMount(): void {
    const shadowGfx = new Graphics();
    // Drop shadow under pad cradle
    shadowGfx.ellipse(15, 12, 110, 36).fill({ color: 0x050a14, alpha: 0.7 });
    this.shadowContainer.addChild(shadowGfx);

    const mountGfx = new Graphics();

    // Heavy reinforced steel launch cradle base
    mountGfx.roundRect(-80, -10, 160, 24, 4).fill({ color: 0x1e293b }).stroke({ color: 0x475569, width: 2 });
    mountGfx.rect(-60, -18, 120, 12).fill({ color: 0x0f172a }).stroke({ color: 0xd97706, width: 1.5 });

    // Flame exhaust opening cutout
    mountGfx.rect(-36, -20, 72, 16).fill({ color: 0x030712 });

    // Left & Right Hydraulic Hold-Down Clamp Arms
    // Left clamp
    mountGfx
      .poly([
        { x: -55, y: -4 },
        { x: -40, y: -34 },
        { x: -30, y: -34 },
        { x: -34, y: -4 },
      ])
      .fill({ color: 0xdc2626 })
      .stroke({ color: 0x7f1d1d, width: 1.5 });

    // Right clamp
    mountGfx
      .poly([
        { x: 55, y: -4 },
        { x: 40, y: -34 },
        { x: 30, y: -34 },
        { x: 34, y: -4 },
      ])
      .fill({ color: 0xdc2626 })
      .stroke({ color: 0x7f1d1d, width: 1.5 });

    // Clamp hydraulic pistons
    mountGfx.rect(-50, -22, 6, 16).fill({ color: 0x94a3b8 });
    mountGfx.rect(44, -22, 6, 16).fill({ color: 0x94a3b8 });

    // Pad safety yellow/black hazard striping on base
    for (let hx = -70; hx < 70; hx += 16) {
      mountGfx
        .moveTo(hx, 6)
        .lineTo(hx + 8, 14)
        .stroke({ color: 0xf59e0b, width: 2 });
    }

    this.mountContainer.addChild(mountGfx);
  }

  // =========================================================================
  // 2. VEHICLE STAGING FROM ACTUAL CONFIGURATION
  // =========================================================================

  private renderVehicle(): void {
    if (!this.activeProject) return;

    const config: ModularRocketConfiguration =
      (this.activeProject as any).modularConfig ??
      {
        stages: [
          {
            stageNumber: 1,
            slots: [
              { slotType: ConfigurationSlotType.STRUCTURE, installedComponentId: 'struct_booster_core_medium' },
              { slotType: ConfigurationSlotType.PROPULSION, installedComponentId: 'prop_basic_booster_mk1' },
            ],
          },
          {
            stageNumber: 2,
            slots: [
              { slotType: ConfigurationSlotType.STRUCTURE, installedComponentId: 'struct_upper_stage_light' },
              { slotType: ConfigurationSlotType.PAYLOAD, installedComponentId: 'payload_basic_satellite_bus' },
            ],
          },
        ],
      };

    let currentBaseY = -30; // Starts atop the launch mount

    // Rocket vehicle drop shadow cast towards north-west
    const rocketShadow = new Graphics();
    rocketShadow
      .poly([
        { x: -28, y: -20 },
        { x: 60, y: -280 },
        { x: 95, y: -270 },
        { x: 28, y: -20 },
      ])
      .fill({ color: 0x050a14, alpha: 0.28 });
    this.shadowContainer.addChild(rocketShadow);

    const stages = [...(config.stages ?? [])].sort((a, b) => a.stageNumber - b.stageNumber);

    for (const stage of stages) {
      const isBooster = stage.stageNumber === 1;
      const stageWidth = isBooster ? 56 : 46;
      const stageHeight = isBooster ? 130 : 85;
      const stageTopY = currentBaseY - stageHeight;

      // 1. Engine Nozzles at stage base
      const propSlot = stage.slots.find(s => s.slotType === ConfigurationSlotType.PROPULSION);
      if (propSlot?.installedComponentId || isBooster) {
        const engineGfx = new Graphics();
        if (isBooster) {
          // Dual main booster bells
          engineGfx.poly([
            { x: -18, y: currentBaseY },
            { x: -6, y: currentBaseY },
            { x: -3, y: currentBaseY + 16 },
            { x: -21, y: currentBaseY + 16 },
          ]).fill({ color: 0xd97706 }).stroke({ color: 0x78350f, width: 1 });

          engineGfx.poly([
            { x: 6, y: currentBaseY },
            { x: 18, y: currentBaseY },
            { x: 21, y: currentBaseY + 16 },
            { x: 3, y: currentBaseY + 16 },
          ]).fill({ color: 0xd97706 }).stroke({ color: 0x78350f, width: 1 });
        } else {
          // Single upper vacuum expander bell
          engineGfx.poly([
            { x: -12, y: currentBaseY },
            { x: 12, y: currentBaseY },
            { x: 16, y: currentBaseY + 15 },
            { x: -16, y: currentBaseY + 15 },
          ]).fill({ color: 0x64748b }).stroke({ color: 0x334155, width: 1 });
        }
        this.rocketContainer.addChild(engineGfx);
      }

      // 2. Stage Cylindrical Fuselage
      const stageGfx = new Graphics();
      const hasStructure = stage.slots.some(
        s => s.slotType === ConfigurationSlotType.STRUCTURE && s.installedComponentId
      );

      // Main fuselage tube with curved highlight
      stageGfx
        .roundRect(-stageWidth / 2, stageTopY, stageWidth, stageHeight, 2)
        .fill({ color: hasStructure ? 0x1e3a5f : 0x0f2238 })
        .stroke({ color: 0x38bdf8, width: 1.2 });

      // Specular cylindrical highlight down the right side
      stageGfx
        .rect(stageWidth / 2 - 10, stageTopY + 2, 7, stageHeight - 4)
        .fill({ color: 0xffffff, alpha: 0.18 });

      // Horizontal stringer / weld rings
      for (let sy = stageTopY + 18; sy < currentBaseY - 10; sy += 24) {
        stageGfx
          .moveTo(-stageWidth / 2 + 4, sy)
          .lineTo(stageWidth / 2 - 4, sy)
          .stroke({ color: 0x0284c7, width: 1, alpha: 0.6 });
      }

      // Vertical external conduit raceway tunnel
      stageGfx
        .rect(-stageWidth / 2 + 5, stageTopY + 8, 3, stageHeight - 16)
        .fill({ color: 0x94a3b8 });

      this.rocketContainer.addChild(stageGfx);

      // 3. Aerodynamic Fins (Stage 1 base)
      if (isBooster) {
        const finsGfx = new Graphics();
        // Left fin
        finsGfx.poly([
          { x: -stageWidth / 2, y: currentBaseY - 35 },
          { x: -stageWidth / 2 - 18, y: currentBaseY + 4 },
          { x: -stageWidth / 2, y: currentBaseY + 4 },
        ]).fill({ color: 0x0284c7 }).stroke({ color: 0x0369a1, width: 1 });

        // Right fin
        finsGfx.poly([
          { x: stageWidth / 2, y: currentBaseY - 35 },
          { x: stageWidth / 2 + 18, y: currentBaseY + 4 },
          { x: stageWidth / 2, y: currentBaseY + 4 },
        ]).fill({ color: 0x0284c7 }).stroke({ color: 0x0369a1, width: 1 });

        this.rocketContainer.addChild(finsGfx);

        // Interstage Decoupler Ring
        const ringGfx = new Graphics();
        ringGfx
          .rect(-stageWidth / 2 - 2, stageTopY - 8, stageWidth + 4, 8)
          .fill({ color: 0x334155 })
          .stroke({ color: 0xf59e0b, width: 1 });
        this.rocketContainer.addChild(ringGfx);
      }

      currentBaseY = stageTopY - (isBooster ? 8 : 2);
    }

    // 4. Fairing Nose Shroud & Internal Payload Platform
    const fairingHeight = 70;
    const fairingTopY = currentBaseY - fairingHeight;
    const fairingWidth = 44;

    const fairingGfx = new Graphics();

    // Fairing aerodynamic shell
    fairingGfx.poly([
      { x: -fairingWidth / 2, y: currentBaseY },
      { x: -fairingWidth / 2, y: currentBaseY - 20 },
      { x: 0, y: fairingTopY },
      { x: fairingWidth / 2, y: currentBaseY - 20 },
      { x: fairingWidth / 2, y: currentBaseY },
    ]).fill({ color: 0x0f172a, alpha: 0.9 }).stroke({ color: 0x38bdf8, width: 1.5 });

    // Fairing split seam
    fairingGfx.moveTo(0, fairingTopY).lineTo(0, currentBaseY).stroke({ color: 0x0284c7, width: 1 });

    this.rocketContainer.addChild(fairingGfx);

    // Payload platform representation (translucent gold satellite payload silhouette)
    const payloadGfx = new Graphics();
    payloadGfx.roundRect(-12, currentBaseY - 44, 24, 24, 2).fill({ color: 0xf59e0b, alpha: 0.85 });
    // Solar array wings
    payloadGfx.rect(-20, currentBaseY - 36, 7, 10).fill({ color: 0x38bdf8, alpha: 0.9 });
    payloadGfx.rect(13, currentBaseY - 36, 7, 10).fill({ color: 0x38bdf8, alpha: 0.9 });
    // Antenna dish
    payloadGfx.circle(0, currentBaseY - 50, 4).fill({ color: 0xffffff });

    this.rocketContainer.addChild(payloadGfx);
  }

  // =========================================================================
  // 3. UMBILICAL GANTRY CONNECTIONS
  // =========================================================================

  private renderUmbilicals(): void {
    const umbGfx = new Graphics();

    // Umbilical swing-arms extending from east (x: +150 towards tower) to rocket body
    // Lower propellant arm
    umbGfx.moveTo(140, -90).lineTo(28, -90).stroke({ color: 0x64748b, width: 3 });
    umbGfx.circle(28, -90, 3).fill({ color: 0x22c55e }); // Cryo coupling lock

    // Upper avionics & telemetry arm
    umbGfx.moveTo(140, -170).lineTo(23, -170).stroke({ color: 0x64748b, width: 2.5 });
    umbGfx.circle(23, -170, 2.5).fill({ color: 0x38bdf8 });

    this.umbilicalContainer.addChild(umbGfx);
  }

  // =========================================================================
  // 4. STATUS LABELS & READOUTS
  // =========================================================================

  private renderStatusBanner(): void {
    if (!this.activeProject) return;

    const bannerCont = new Container();
    bannerCont.position.set(0, 45);

    const bannerBg = new Graphics();
    bannerBg.roundRect(-110, 0, 220, 34, 4).fill({ color: 0x091424, alpha: 0.95 }).stroke({ color: 0x38bdf8, width: 1.2 });
    bannerCont.addChild(bannerBg);

    const titleText = new Text({
      text: `${this.activeProject.name.toUpperCase()}`,
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 10,
        fontWeight: 'bold',
        fill: 0x38bdf8,
        letterSpacing: 0.8,
      }),
    });
    titleText.anchor.set(0.5, 0);
    titleText.position.set(0, 4);
    bannerCont.addChild(titleText);

    const statusText = new Text({
      text: `PAD-01 // ${this.activeDeployment?.status ?? DeploymentState.NOT_ASSIGNED} (${this.activeProject.designVersion})`,
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 8.5,
        fill: this.activeDeployment?.isEligible ? 0x22c55e : 0xf59e0b,
      }),
    });
    statusText.anchor.set(0.5, 0);
    statusText.position.set(0, 18);
    bannerCont.addChild(statusText);

    this.signageContainer.addChild(bannerCont);
  }

  private renderStandbySignage(): void {
    const bannerCont = new Container();
    bannerCont.position.set(0, 35);

    const bannerBg = new Graphics();
    bannerBg.roundRect(-100, 0, 200, 26, 4).fill({ color: 0x091424, alpha: 0.85 }).stroke({ color: 0xd97706, width: 1 });
    bannerCont.addChild(bannerBg);

    const text = new Text({
      text: 'PAD ALPHA // STANDBY (NO VEHICLE)',
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 8.5,
        fontWeight: 'bold',
        fill: 0xf59e0b,
        letterSpacing: 0.5,
      }),
    });
    text.anchor.set(0.5, 0.5);
    text.position.set(0, 13);
    bannerCont.addChild(text);

    this.signageContainer.addChild(bannerCont);
  }

  public destroy(): void {
    this.container.destroy({ children: true });
    this.ventParticles.length = 0;
  }
}
