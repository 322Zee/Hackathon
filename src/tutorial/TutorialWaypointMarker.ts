/**
 * INTERSTELLAR CONTINUUM - Contextual Waypoint Marker System
 * Renders in-world beacon rings for on-screen tutorial targets and
 * screen-edge directional bearing arrows with distance telemetry when off-screen.
 * Respects accessibility reduced-motion preferences.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { CameraSystem } from '../camera/CameraSystem';
import { SettingsManager } from '../settings/SettingsManager';
import { ServiceLocator } from '../core/ServiceLocator';
import { TutorialHighlightTarget } from './TutorialTypes';
import { UI_COLORS, UI_FONTS } from '../ui/core/UIDesignTokens';

export class TutorialWaypointMarker {
  public readonly worldContainer: Container;
  public readonly hudContainer: Container;

  private cameraSystem?: CameraSystem;
  private settingsManager?: SettingsManager;

  // World graphics
  private worldBeaconGfx: Graphics;
  private worldLabelText: Text;

  // Off-screen HUD graphics
  private hudArrowGfx: Graphics;
  private hudLabelText: Text;
  private hudDistanceText: Text;

  private currentTarget: TutorialHighlightTarget | null = null;
  private pulseTimer: number = 0;
  private activeTargetWorldX: number = 0;
  private activeTargetWorldY: number = 0;
  private playerWorldX: number = 0;
  private playerWorldY: number = 0;

  constructor(cameraSystem?: CameraSystem) {
    this.cameraSystem = cameraSystem;
    this.worldContainer = new Container();
    this.hudContainer = new Container();

    this.worldContainer.visible = false;
    this.hudContainer.visible = false;

    // 1. World Beacon
    this.worldBeaconGfx = new Graphics();
    this.worldContainer.addChild(this.worldBeaconGfx);

    const worldStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 13,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
      dropShadow: {
        alpha: 0.8,
        angle: Math.PI / 4,
        blur: 4,
        color: 0x000000,
        distance: 2,
      },
    });
    this.worldLabelText = new Text({ text: '', style: worldStyle });
    this.worldLabelText.anchor.set(0.5, 1);
    this.worldContainer.addChild(this.worldLabelText);

    // 2. Off-screen HUD Arrow Indicator
    this.hudArrowGfx = new Graphics();
    this.hudContainer.addChild(this.hudArrowGfx);

    const hudLabelStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 11,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_PRIMARY,
      letterSpacing: 1.0,
      dropShadow: {
        alpha: 0.9,
        angle: Math.PI / 4,
        blur: 3,
        color: 0x000000,
        distance: 2,
      },
    });
    this.hudLabelText = new Text({ text: '', style: hudLabelStyle });
    this.hudLabelText.anchor.set(0.5, 0.5);
    this.hudContainer.addChild(this.hudLabelText);

    const hudDistStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10,
      fill: UI_COLORS.CYAN,
    });
    this.hudDistanceText = new Text({ text: '', style: hudDistStyle });
    this.hudDistanceText.anchor.set(0.5, 0.5);
    this.hudContainer.addChild(this.hudDistanceText);
  }

  public setCameraSystem(cam: CameraSystem): void {
    this.cameraSystem = cam;
  }

  public setTarget(target: TutorialHighlightTarget | null): void {
    this.currentTarget = target;
    if (!target || target.type === 'NONE' || !target.worldPosition) {
      this.worldContainer.visible = false;
      this.hudContainer.visible = false;
      return;
    }

    this.activeTargetWorldX = target.worldPosition.x;
    this.activeTargetWorldY = target.worldPosition.y;
    this.worldContainer.position.set(this.activeTargetWorldX, this.activeTargetWorldY);

    const label = target.label ?? 'OBJECTIVE WAYPOINT';
    this.worldLabelText.text = `// ${label} //`;
    this.worldLabelText.position.set(0, -(target.radius ?? 40) - 24);

    this.hudLabelText.text = label;
  }

  public getTarget(): TutorialHighlightTarget | null {
    return this.currentTarget;
  }

  public update(
    deltaSeconds: number,
    playerX: number = 0,
    playerY: number = 0
  ): void {
    if (!this.currentTarget || this.currentTarget.type === 'NONE' || !this.currentTarget.worldPosition) {
      this.worldContainer.visible = false;
      this.hudContainer.visible = false;
      return;
    }

    this.playerWorldX = playerX;
    this.playerWorldY = playerY;

    // Check accessibility reduced motion
    if (!this.settingsManager && ServiceLocator.has('SettingsManager')) {
      this.settingsManager = ServiceLocator.get<SettingsManager>('SettingsManager');
    }
    const reducedMotion =
      this.settingsManager?.getSettings().accessibility.reducedMotion ?? false;

    this.pulseTimer += deltaSeconds;

    // Resolve visibility via Camera Frustum
    let isOnScreen = true;
    let virtualTarget = { x: 960, y: 540 };

    if (this.cameraSystem) {
      try {
        const frustum = this.cameraSystem.getVisibleFrustum();
        if (frustum) {
          const margin = 50;
          isOnScreen =
            this.activeTargetWorldX >= frustum.minX - margin &&
            this.activeTargetWorldX <= frustum.maxX + margin &&
            this.activeTargetWorldY >= frustum.minY - margin &&
            this.activeTargetWorldY <= frustum.maxY + margin;
        }
        virtualTarget = this.cameraSystem.worldToVirtual(
          this.activeTargetWorldX,
          this.activeTargetWorldY
        );
      } catch {
        isOnScreen = true;
      }
    }

    if (isOnScreen) {
      this.renderOnScreenBeacon(reducedMotion);
      this.worldContainer.visible = true;
      this.hudContainer.visible = false;
    } else {
      this.renderOffScreenIndicator(virtualTarget, reducedMotion);
      this.worldContainer.visible = false;
      this.hudContainer.visible = true;
    }
  }

  private renderOnScreenBeacon(reducedMotion: boolean): void {
    const baseRadius = this.currentTarget?.radius ?? 40;
    const pulsePhase = reducedMotion ? 0.5 : (Math.sin(this.pulseTimer * 3.5) + 1) * 0.5;

    this.worldBeaconGfx.clear();

    // 1. Outer beacon expansion ring
    const outerRadius = baseRadius + (reducedMotion ? 10 : pulsePhase * 24);
    const outerAlpha = reducedMotion ? 0.4 : 0.6 - pulsePhase * 0.4;
    this.worldBeaconGfx.circle(0, 0, outerRadius);
    this.worldBeaconGfx.stroke({ color: UI_COLORS.CYAN, width: 2, alpha: outerAlpha });

    // 2. Inner focus ring
    this.worldBeaconGfx.circle(0, 0, baseRadius);
    this.worldBeaconGfx.fill({ color: UI_COLORS.CYAN, alpha: 0.12 });
    this.worldBeaconGfx.stroke({ color: UI_COLORS.CYAN, width: 2.5, alpha: 0.85 });

    // 3. Precision Crosshairs
    const armLen = baseRadius + 14;
    this.worldBeaconGfx.moveTo(-armLen, 0).lineTo(armLen, 0);
    this.worldBeaconGfx.moveTo(0, -armLen).lineTo(0, armLen);
    this.worldBeaconGfx.stroke({ color: UI_COLORS.CYAN, width: 1.5, alpha: 0.75 });

    // 4. Center diamond pin
    this.worldBeaconGfx.poly([
      { x: 0, y: -6 },
      { x: 6, y: 0 },
      { x: 0, y: 6 },
      { x: -6, y: 0 },
    ]);
    this.worldBeaconGfx.fill({ color: 0xffffff, alpha: 0.95 });
  }

  private renderOffScreenIndicator(
    virtualTarget: { x: number; y: number },
    reducedMotion: boolean
  ): void {
    // Virtual screen boundaries (1920 x 1080)
    const screenW = 1920;
    const screenH = 1080;
    const paddingX = 80;
    const paddingY = 80;
    const centerX = screenW / 2;
    const centerY = screenH / 2;

    const dx = virtualTarget.x - centerX;
    const dy = virtualTarget.y - centerY;
    const angle = Math.atan2(dy, dx);

    // Clamp indicator to screen perimeter rectangle
    const halfW = screenW / 2 - paddingX;
    const halfH = screenH / 2 - paddingY;

    const tanTheta = Math.tan(angle);
    let edgeX = 0;
    let edgeY = 0;

    if (Math.abs(dx * halfH) > Math.abs(dy * halfW)) {
      // Clamps to Left or Right edge
      edgeX = dx > 0 ? halfW : -halfW;
      edgeY = edgeX * tanTheta;
    } else {
      // Clamps to Top or Bottom edge
      edgeY = dy > 0 ? halfH : -halfH;
      edgeX = tanTheta !== 0 ? edgeY / tanTheta : 0;
    }

    const indicatorX = centerX + edgeX;
    const indicatorY = centerY + edgeY;

    // Calculate real distance to target in world pixels
    const worldDist = Math.round(
      Math.hypot(
        this.activeTargetWorldX - this.playerWorldX,
        this.activeTargetWorldY - this.playerWorldY
      )
    );

    // Draw directional pointer arrow
    this.hudArrowGfx.clear();
    const bob = reducedMotion ? 0 : Math.sin(this.pulseTimer * 4.0) * 4;

    this.hudArrowGfx.position.set(indicatorX, indicatorY);
    this.hudArrowGfx.rotation = angle;

    // Arrow pointer shape
    this.hudArrowGfx.poly([
      { x: 18 + bob, y: 0 },
      { x: -6 + bob, y: -12 },
      { x: -2 + bob, y: 0 },
      { x: -6 + bob, y: 12 },
    ]);
    this.hudArrowGfx.fill({ color: UI_COLORS.CYAN, alpha: 0.95 });
    this.hudArrowGfx.stroke({ color: 0xffffff, width: 1.5, alpha: 0.9 });

    // Distance & Label placement
    // Place text offset inward from the screen edge
    const inwardDist = 38;
    const textX = indicatorX - Math.cos(angle) * inwardDist;
    const textY = indicatorY - Math.sin(angle) * inwardDist;

    this.hudLabelText.position.set(textX, textY - 8);
    this.hudDistanceText.text = `${worldDist}m`;
    this.hudDistanceText.position.set(textX, textY + 8);
  }

  public destroy(): void {
    this.worldContainer.destroy({ children: true });
    this.hudContainer.destroy({ children: true });
  }
}
