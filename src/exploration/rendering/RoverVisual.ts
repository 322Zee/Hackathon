/**
 * INTERSTELLAR CONTINUUM - 2D/2.5D Composite Rover Visual Renderer
 * Procedural composite PixiJS rendering of planetary rovers:
 * Rocker-bogie wheel assembly, chassis panels, solar arrays/RTG,
 * pan-tilt mast, articulated robotic arm, headlights, and dynamic drop shadows.
 */

import { Container, Graphics } from 'pixi.js';
import { RoverModelType, RoverRecord } from '../ExplorationTypes';

export class RoverVisual {
  public readonly container: Container = new Container();

  // Child containers for layered 2.5D depth
  private shadowGraphics: Graphics = new Graphics();
  private wheelAssembly: Container = new Container();
  private chassisContainer: Container = new Container();
  private chassisGraphics: Graphics = new Graphics();
  private powerSourceGraphics: Graphics = new Graphics();
  private mastContainer: Container = new Container();
  private mastGraphics: Graphics = new Graphics();
  private armContainer: Container = new Container();
  private armGraphics: Graphics = new Graphics();
  private headlightGraphics: Graphics = new Graphics();

  // Animation states
  private suspensionBounce: number = 0;
  private suspensionRoll: number = 0;
  private mastPanAngle: number = 0;
  private armExtensionProgress: number = 0; // 0.0 (stowed) to 1.0 (deployed)
  private isSampling: boolean = false;
  private isScanning: boolean = false;
  private headlightsEnabled: boolean = true;

  constructor() {
    this.container.label = 'RoverVisual';

    // Layer stack
    this.container.addChild(this.shadowGraphics);
    this.container.addChild(this.headlightGraphics);
    this.container.addChild(this.wheelAssembly);
    this.container.addChild(this.chassisContainer);

    this.chassisContainer.addChild(this.chassisGraphics);
    this.chassisContainer.addChild(this.powerSourceGraphics);
    this.chassisContainer.addChild(this.mastContainer);
    this.chassisContainer.addChild(this.armContainer);

    this.mastContainer.addChild(this.mastGraphics);
    this.armContainer.addChild(this.armGraphics);

    // Initial render
    this.rebuildVisual(RoverModelType.SCOUT);
  }

  public rebuildVisual(modelType: RoverModelType): void {
    this.chassisGraphics.clear();
    this.powerSourceGraphics.clear();
    this.wheelAssembly.removeChildren();

    // 1. Build Wheels based on Rover Model (6 wheels for Scout/Science, 8 for Heavy)
    const wheelCount = modelType === RoverModelType.HEAVY_UTILITY ? 8 : 6;
    const chassisWidth = modelType === RoverModelType.HEAVY_UTILITY ? 38 : 30;
    const chassisLength = modelType === RoverModelType.HEAVY_UTILITY ? 58 : 46;

    const rowOffsets = wheelCount === 8
      ? [-22, -8, 8, 22]
      : [-18, 0, 18];

    for (let i = 0; i < rowOffsets.length; i++) {
      const yOffset = rowOffsets[i]!;

      // Left wheel
      const leftWheel = this.createWheelGraphic();
      leftWheel.x = -chassisWidth * 0.5 - 6;
      leftWheel.y = yOffset;
      this.wheelAssembly.addChild(leftWheel);

      // Right wheel
      const rightWheel = this.createWheelGraphic();
      rightWheel.x = chassisWidth * 0.5 + 6;
      rightWheel.y = yOffset;
      this.wheelAssembly.addChild(rightWheel);
    }

    // 2. Chassis Hull Base
    const hw = chassisWidth * 0.5;
    const hl = chassisLength * 0.5;

    // Rocker-bogie suspension struts
    this.chassisGraphics.rect(-hw - 4, -hl + 8, (hw + 4) * 2, hl * 2 - 16);
    this.chassisGraphics.stroke({ color: 0x334155, width: 2.5 });

    // Main Titanium/Composite Chassis
    let hullColor = 0xd97706; // Amber/Gold (Scout)
    if (modelType === RoverModelType.SCIENTIFIC) hullColor = 0xe2e8f0; // Pristine White/Platinum
    if (modelType === RoverModelType.HEAVY_UTILITY) hullColor = 0x475569; // Dark Slate/Industrial
    if (modelType === RoverModelType.ADVANCED_AUTONOMOUS) hullColor = 0x0284c7; // Deep Cyber Cyan

    // Rounded chassis body
    this.chassisGraphics.roundRect(-hw, -hl, chassisWidth, chassisLength, 6);
    this.chassisGraphics.fill({ color: hullColor });
    this.chassisGraphics.stroke({ color: 0x1e293b, width: 2.0 });

    // Chassis Hazard / Trim Stripes
    this.chassisGraphics.rect(-hw + 3, -hl + 6, chassisWidth - 6, 4);
    this.chassisGraphics.fill({ color: 0x0f172a, alpha: 0.8 });

    // 3. Power Source Visual
    if (modelType === RoverModelType.SCIENTIFIC) {
      // RTG Cylinder with cooling fins at rear
      this.powerSourceGraphics.roundRect(-8, hl - 16, 16, 14, 3);
      this.powerSourceGraphics.fill({ color: 0x94a3b8 });
      this.powerSourceGraphics.stroke({ color: 0x334155, width: 1.5 });
      // RTG Core Glow
      this.powerSourceGraphics.circle(0, hl - 9, 3);
      this.powerSourceGraphics.fill({ color: 0xf59e0b, alpha: 0.9 });
    } else {
      // Photovoltaic Solar Panel Array on top deck
      this.powerSourceGraphics.rect(-hw + 4, -hl + 12, chassisWidth - 8, chassisLength - 26);
      this.powerSourceGraphics.fill({ color: 0x1e3a8a }); // Solar cell dark blue
      this.powerSourceGraphics.stroke({ color: 0x38bdf8, width: 1.0 });

      // Solar grid lines
      for (let y = -hl + 16; y < hl - 16; y += 7) {
        this.powerSourceGraphics.moveTo(-hw + 4, y);
        this.powerSourceGraphics.lineTo(hw - 4, y);
        this.powerSourceGraphics.stroke({ color: 0x60a5fa, width: 0.75, alpha: 0.7 });
      }
    }

    // 4. Parabolic High-Gain Antenna Dish
    this.powerSourceGraphics.circle(hw - 9, hl - 8, 6);
    this.powerSourceGraphics.fill({ color: 0xf8fafc });
    this.powerSourceGraphics.stroke({ color: 0x64748b, width: 1.2 });
    this.powerSourceGraphics.circle(hw - 9, hl - 8, 2);
    this.powerSourceGraphics.fill({ color: 0x0284c7 });

    // 5. Sensor Mast Anchor Position (Front-Left)
    this.mastContainer.x = -hw + 8;
    this.mastContainer.y = -hl + 6;
    this.drawMast(0);

    // 6. Robotic Arm Anchor Position (Front-Right)
    this.armContainer.x = hw - 8;
    this.armContainer.y = -hl + 8;
    this.drawRoboticArm(0);
  }

  private createWheelGraphic(): Graphics {
    const w = new Graphics();
    // Tread tyre
    w.roundRect(-4, -6, 8, 12, 2.5);
    w.fill({ color: 0x1e293b });
    w.stroke({ color: 0x0f172a, width: 1.5 });

    // Wheel rim hub
    w.circle(0, 0, 2.5);
    w.fill({ color: 0x94a3b8 });

    return w;
  }

  private drawMast(panAngleRad: number): void {
    this.mastGraphics.clear();

    // Mast base cylinder
    this.mastGraphics.circle(0, 0, 3.5);
    this.mastGraphics.fill({ color: 0x334155 });

    // Mast pan-tilt camera head
    const headX = Math.cos(panAngleRad) * 4;
    const headY = Math.sin(panAngleRad) * 4;

    this.mastGraphics.rect(headX - 4, headY - 3, 8, 6);
    this.mastGraphics.fill({ color: 0xf1f5f9 });
    this.mastGraphics.stroke({ color: 0x475569, width: 1.0 });

    // Dual stereoscopic camera lenses
    this.mastGraphics.circle(headX - 2, headY, 1.5);
    this.mastGraphics.fill({ color: 0x0284c7 });

    this.mastGraphics.circle(headX + 2, headY, 1.5);
    this.mastGraphics.fill({ color: 0x0284c7 });
  }

  private drawRoboticArm(progress: number): void {
    this.armGraphics.clear();

    // Base joint
    this.armGraphics.circle(0, 0, 3);
    this.armGraphics.fill({ color: 0x475569 });

    if (progress <= 0.05) {
      // Stowed posture: folded back along chassis
      this.armGraphics.moveTo(0, 0);
      this.armGraphics.lineTo(0, 14);
      this.armGraphics.stroke({ color: 0x64748b, width: 2.5 });

      // Core drill tool turret tucked
      this.armGraphics.rect(-2.5, 12, 5, 4);
      this.armGraphics.fill({ color: 0x94a3b8 });
    } else {
      // Extended posture: reaching outward and forward
      const reachLength = 22 * progress;
      const elbowX = Math.sin(progress * 1.2) * 12;
      const elbowY = -reachLength * 0.5;
      const toolX = Math.sin(progress * 0.8) * 8 + 4;
      const toolY = -reachLength;

      // Shoulder to elbow
      this.armGraphics.moveTo(0, 0);
      this.armGraphics.lineTo(elbowX, elbowY);
      this.armGraphics.stroke({ color: 0x64748b, width: 2.5 });

      // Elbow joint
      this.armGraphics.circle(elbowX, elbowY, 2.5);
      this.armGraphics.fill({ color: 0x334155 });

      // Elbow to wrist/tool turret
      this.armGraphics.moveTo(elbowX, elbowY);
      this.armGraphics.lineTo(toolX, toolY);
      this.armGraphics.stroke({ color: 0x94a3b8, width: 2.0 });

      // Turret and drill bit
      this.armGraphics.circle(toolX, toolY, 3.5);
      this.armGraphics.fill({ color: 0xf59e0b });
      this.armGraphics.moveTo(toolX, toolY);
      this.armGraphics.lineTo(toolX + 3, toolY - 5);
      this.armGraphics.stroke({ color: 0x00f0ff, width: 1.5 });
    }
  }

  private updateHeadlights(enabled: boolean): void {
    this.headlightGraphics.clear();
    if (!enabled) return;

    // Twin forward headlight illumination cones
    // Forward direction is along negative Y in chassis local space
    const beamLength = 120.0;
    const beamSpread = 38.0;

    // Left headlight beam
    this.headlightGraphics.moveTo(-10, -22);
    this.headlightGraphics.lineTo(-10 - beamSpread, -22 - beamLength);
    this.headlightGraphics.lineTo(-10 + beamSpread * 0.4, -22 - beamLength);
    this.headlightGraphics.closePath();
    this.headlightGraphics.fill({ color: 0xffffff, alpha: 0.15 });

    // Right headlight beam
    this.headlightGraphics.moveTo(10, -22);
    this.headlightGraphics.lineTo(10 - beamSpread * 0.4, -22 - beamLength);
    this.headlightGraphics.lineTo(10 + beamSpread, -22 - beamLength);
    this.headlightGraphics.closePath();
    this.headlightGraphics.fill({ color: 0xffffff, alpha: 0.15 });
  }

  public setHeadlights(enabled: boolean): void {
    this.headlightsEnabled = enabled;
  }

  public triggerScanAnimation(): void {
    this.isScanning = true;
  }

  public triggerSampleAnimation(): void {
    this.isSampling = true;
  }

  /**
   * Updates visual rendering and animations per frame.
   */
  public update(rover: RoverRecord, deltaSeconds: number): void {
    // 1. Position and Rotation Anchor
    this.container.x = rover.location.x;
    this.container.y = rover.location.y;

    // Convert heading degrees to PixiJS container rotation
    const targetRotation = (rover.location.headingDeg * Math.PI) / 180;
    this.container.rotation = targetRotation;

    // 2. Suspension Bounce & Roll Oscillation
    const speedRatio = Math.min(1.0, Math.abs(rover.speed) / rover.movementConfig.maxSpeed);
    if (speedRatio > 0.05) {
      this.suspensionBounce = Math.sin(Date.now() * 0.015) * speedRatio * 1.5;
      this.suspensionRoll = Math.sin(Date.now() * 0.012) * speedRatio * 0.03;
    } else {
      this.suspensionBounce *= 0.9;
      this.suspensionRoll *= 0.9;
    }

    this.chassisContainer.y = this.suspensionBounce;
    this.chassisContainer.rotation = this.suspensionRoll;

    // 3. Drop Shadow Scaling
    this.shadowGraphics.clear();
    const shadowWidth = 44 + speedRatio * 4;
    const shadowHeight = 60 + speedRatio * 2;
    this.shadowGraphics.ellipse(0, 4, shadowWidth * 0.5, shadowHeight * 0.5);
    this.shadowGraphics.fill({ color: 0x000000, alpha: 0.45 });

    // 4. Update Headlights
    this.updateHeadlights(this.headlightsEnabled);

    // 5. Mast Camera Animation
    if (this.isScanning) {
      this.mastPanAngle += deltaSeconds * 4.0;
      if (this.mastPanAngle >= Math.PI * 2) {
        this.mastPanAngle = 0;
        this.isScanning = false;
      }
      this.drawMast(this.mastPanAngle);
    }

    // 6. Articulated Robotic Arm Sampling Animation
    if (this.isSampling) {
      this.armExtensionProgress += deltaSeconds * 0.8;
      if (this.armExtensionProgress >= 1.0) {
        this.armExtensionProgress = 0;
        this.isSampling = false;
      }
      this.drawRoboticArm(this.armExtensionProgress);
    }
  }
}
