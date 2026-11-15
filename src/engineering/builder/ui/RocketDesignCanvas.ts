/**
 * INTERSTELLAR CONTINUUM - Interactive 2D Rocket Design Canvas
 * Central visual assembly canvas providing layered 2D/2.5D schematic rendering,
 * component slot hotspots, interactive selection feedback, pan, zoom, and viewport centering.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_COLORS, UI_FONTS } from '../../../ui/core/UIDesignTokens';
import { UIButton } from '../../../ui/components/UIButton';
import { RocketComponentRegistry } from '../../RocketComponentRegistry';
import {
  ModularRocketConfiguration,
  ConfigurationSlotType,
  ModularConfigurationSlot,
} from '../RocketBuilderTypes';

export interface RocketDesignCanvasOptions {
  width: number;
  height: number;
  onSlotSelected?: (slotId: string) => void;
}

export class RocketDesignCanvas {
  public readonly container: Container;
  private viewportContainer: Container;
  private rocketGraphicContainer: Container;
  private slotHotspotsContainer: Container;
  private uiOverlayContainer: Container;

  private registry: RocketComponentRegistry;
  private width: number;
  private height: number;
  private onSlotSelectedCb?: (slotId: string) => void;

  private zoomLevel: number = 1.0;
  private panX: number = 0;
  private panY: number = 0;

  private activeConfig?: ModularRocketConfiguration;
  private selectedSlotId?: string;

  private zoomText!: Text;

  constructor(options: RocketDesignCanvasOptions) {
    this.width = options.width;
    this.height = options.height;
    this.onSlotSelectedCb = options.onSlotSelected;
    this.registry = RocketComponentRegistry.getInstance();

    this.container = new Container();

    this.viewportContainer = new Container();
    this.rocketGraphicContainer = new Container();
    this.slotHotspotsContainer = new Container();
    this.uiOverlayContainer = new Container();

    this.viewportContainer.addChild(this.rocketGraphicContainer);
    this.viewportContainer.addChild(this.slotHotspotsContainer);

    this.container.addChild(this.viewportContainer);
    this.container.addChild(this.uiOverlayContainer);

    this.setupBackgroundAndGrid();
    this.setupCanvasControls();
  }

  // =========================================================================
  // BACKGROUND & GRID
  // =========================================================================

  private setupBackgroundAndGrid(): void {
    const bg = new Graphics();
    bg.rect(0, 0, this.width, this.height);
    bg.fill({ color: 0x051022, alpha: 0.98 });
    bg.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.container.addChildAt(bg, 0);

    // Subtle technical grid lines
    const grid = new Graphics();
    for (let x = 0; x < this.width; x += 40) {
      grid.moveTo(x, 0).lineTo(x, this.height).stroke({ color: 0x0a1e38, width: 0.75 });
    }
    for (let y = 0; y < this.height; y += 40) {
      grid.moveTo(0, y).lineTo(this.width, y).stroke({ color: 0x0a1e38, width: 0.75 });
    }
    this.container.addChildAt(grid, 1);
  }

  private setupCanvasControls(): void {
    const controlsGfx = new Graphics();
    controlsGfx.roundRect(16, 16, 360, 42, 6);
    controlsGfx.fill({ color: 0x081326, alpha: 0.9 });
    controlsGfx.stroke({ color: UI_COLORS.CYAN, width: 1.0 });
    this.uiOverlayContainer.addChild(controlsGfx);

    // Zoom Buttons
    const btnZoomIn = new UIButton({
      label: '+',
      variant: 'OUTLINE',
      width: 32,
      height: 28,
      onClick: () => this.adjustZoom(0.15),
    });
    btnZoomIn.container.position.set(24, 23);
    this.uiOverlayContainer.addChild(btnZoomIn.container);

    const btnZoomOut = new UIButton({
      label: '−',
      variant: 'OUTLINE',
      width: 32,
      height: 28,
      onClick: () => this.adjustZoom(-0.15),
    });
    btnZoomOut.container.position.set(62, 23);
    this.uiOverlayContainer.addChild(btnZoomOut.container);

    const btnFit = new UIButton({
      label: 'FIT',
      variant: 'OUTLINE',
      width: 50,
      height: 28,
      onClick: () => this.fitToScreen(),
    });
    btnFit.container.position.set(100, 23);
    this.uiOverlayContainer.addChild(btnFit.container);

    const btnCenter = new UIButton({
      label: 'CENTER',
      variant: 'OUTLINE',
      width: 75,
      height: 28,
      onClick: () => this.centerView(),
    });
    btnCenter.container.position.set(156, 23);
    this.uiOverlayContainer.addChild(btnCenter.container);

    this.zoomText = new Text({
      text: 'ZOOM: 100%',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
      }),
    });
    this.zoomText.position.set(245, 30);
    this.uiOverlayContainer.addChild(this.zoomText);
  }

  public adjustZoom(delta: number): void {
    this.zoomLevel = Math.max(0.5, Math.min(2.2, +(this.zoomLevel + delta).toFixed(2)));
    this.applyTransform();
  }

  public setZoom(zoom: number): void {
    this.zoomLevel = Math.max(0.5, Math.min(2.2, +zoom.toFixed(2)));
    this.applyTransform();
  }

  public centerView(): void {
    this.panX = 0;
    this.panY = 0;
    this.zoomLevel = 1.0;
    this.applyTransform();
  }

  public fitToScreen(): void {
    this.panX = 0;
    this.panY = 0;
    this.zoomLevel = 0.85;
    this.applyTransform();
  }

  public pan(deltaX: number, deltaY: number): void {
    this.panX += deltaX;
    this.panY += deltaY;
    this.applyTransform();
  }

  private applyTransform(): void {
    this.viewportContainer.scale.set(this.zoomLevel);
    this.viewportContainer.position.set(
      this.width / 2 + this.panX * this.zoomLevel,
      this.height / 2 + this.panY * this.zoomLevel
    );
    if (this.zoomText) {
      this.zoomText.text = `ZOOM: ${Math.round(this.zoomLevel * 100)}%`;
    }
  }

  // =========================================================================
  // VEHICLE RENDERING & SLOT HOTSPOTS
  // =========================================================================

  public setConfiguration(config: ModularRocketConfiguration, selectedSlotId?: string): void {
    this.activeConfig = config;
    this.selectedSlotId = selectedSlotId;
    this.renderVehicle();
  }

  public setSelectedSlot(slotId?: string): void {
    this.selectedSlotId = slotId;
    this.renderVehicle();
  }

  private renderVehicle(): void {
    this.rocketGraphicContainer.removeChildren();
    this.slotHotspotsContainer.removeChildren();

    if (!this.activeConfig) return;

    const centerX = 0;
    let currentBaseY = 320; // Stacking from bottom up

    // 1. Launch Mount Cradle
    const cradleGfx = new Graphics();
    cradleGfx.rect(centerX - 130, currentBaseY + 10, 260, 26).fill({ color: 0x1e293b });
    cradleGfx.rect(centerX - 95, currentBaseY - 6, 190, 16).fill({ color: 0x334155 });
    cradleGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.rocketGraphicContainer.addChild(cradleGfx);

    // Iterate through stages from bottom (Stage 1) to top
    const stages = [...this.activeConfig.stages].sort((a, b) => a.stageNumber - b.stageNumber);

    for (const stage of stages) {
      const isBooster = stage.stageNumber === 1;
      const stageWidth = isBooster ? 110 : 96;
      const stageHeight = isBooster ? 260 : 180;

      const stageTopY = currentBaseY - stageHeight;

      // Stage Airframe Box
      const stageGfx = new Graphics();
      const hasStructure = stage.slots.some(
        s => s.slotType === ConfigurationSlotType.STRUCTURE && s.installedComponentId
      );

      stageGfx.roundRect(centerX - stageWidth / 2, stageTopY, stageWidth, stageHeight, 4);
      stageGfx.fill({ color: hasStructure ? 0x153158 : 0x0f2038, alpha: 0.95 });
      stageGfx.stroke({
        color: hasStructure ? UI_COLORS.CYAN : 0x334155,
        width: 1.5,
      });

      // Internal tank level lines
      for (let ty = stageTopY + 30; ty < currentBaseY - 20; ty += 40) {
        stageGfx.moveTo(centerX - stageWidth / 2 + 10, ty).lineTo(centerX + stageWidth / 2 - 10, ty).stroke({ color: 0x1e4976, width: 1 });
      }

      this.rocketGraphicContainer.addChild(stageGfx);

      // Render Stage Propulsion Engine Bell at base
      const propSlot = stage.slots.find(s => s.slotType === ConfigurationSlotType.PROPULSION);
      if (propSlot?.installedComponentId) {
        const engineGfx = new Graphics();
        if (isBooster) {
          // Twin booster bells
          engineGfx.poly([
            { x: centerX - 36, y: currentBaseY },
            { x: centerX - 12, y: currentBaseY },
            { x: centerX - 6, y: currentBaseY + 28 },
            { x: centerX - 42, y: currentBaseY + 28 },
          ]).fill({ color: 0xf59e0b });
          engineGfx.poly([
            { x: centerX + 12, y: currentBaseY },
            { x: centerX + 36, y: currentBaseY },
            { x: centerX + 42, y: currentBaseY + 28 },
            { x: centerX + 6, y: currentBaseY + 28 },
          ]).fill({ color: 0xf59e0b });
        } else {
          // Single vacuum expander nozzle
          engineGfx.poly([
            { x: centerX - 24, y: currentBaseY },
            { x: centerX + 24, y: currentBaseY },
            { x: centerX + 32, y: currentBaseY + 30 },
            { x: centerX - 32, y: currentBaseY + 30 },
          ]).fill({ color: 0x94a3b8 });
        }
        this.rocketGraphicContainer.addChild(engineGfx);
      }

      // If Stage 1, render aerodynamic fins
      if (isBooster) {
        const finsGfx = new Graphics();
        finsGfx.poly([
          { x: centerX - stageWidth / 2, y: currentBaseY - 70 },
          { x: centerX - stageWidth / 2 - 40, y: currentBaseY + 5 },
          { x: centerX - stageWidth / 2, y: currentBaseY + 5 },
        ]).fill({ color: UI_COLORS.CYAN });
        finsGfx.poly([
          { x: centerX + stageWidth / 2, y: currentBaseY - 70 },
          { x: centerX + stageWidth / 2 + 40, y: currentBaseY + 5 },
          { x: centerX + stageWidth / 2, y: currentBaseY + 5 },
        ]).fill({ color: UI_COLORS.CYAN });
        this.rocketGraphicContainer.addChild(finsGfx);
      }

      // Interstage Decoupler Ring at top
      if (isBooster) {
        const ringGfx = new Graphics();
        ringGfx.rect(centerX - stageWidth / 2 - 2, stageTopY - 14, stageWidth + 4, 14);
        ringGfx.fill({ color: 0x475569 });
        ringGfx.stroke({ color: UI_COLORS.AMBER, width: 1 });
        this.rocketGraphicContainer.addChild(ringGfx);
      }

      // Render interactive Slot Hotspot Tags beside the stage
      stage.slots.forEach((slot, sIdx) => {
        const slotY = stageTopY + 20 + sIdx * 32;
        this.renderSlotHotspot(slot, centerX, slotY, isBooster);
      });

      // Prepare baseY for next stage up
      currentBaseY = stageTopY - (isBooster ? 16 : 4);
    }

    // Top: Payload Section & Fairing Nose Shroud
    const fairingHeight = 150;
    const fairingTopY = currentBaseY - fairingHeight;
    const fairingWidth = 92;

    const shroudGfx = new Graphics();
    shroudGfx.poly([
      { x: centerX - fairingWidth / 2, y: currentBaseY },
      { x: centerX - fairingWidth / 2, y: currentBaseY - 40 },
      { x: centerX, y: fairingTopY },
      { x: centerX + fairingWidth / 2, y: currentBaseY - 40 },
      { x: centerX + fairingWidth / 2, y: currentBaseY },
    ]).fill({ color: 0x1e293b, alpha: 0.8 });
    shroudGfx.poly([
      { x: centerX - fairingWidth / 2, y: currentBaseY },
      { x: centerX - fairingWidth / 2, y: currentBaseY - 40 },
      { x: centerX, y: fairingTopY },
      { x: centerX + fairingWidth / 2, y: currentBaseY - 40 },
      { x: centerX + fairingWidth / 2, y: currentBaseY },
    ]).stroke({ color: UI_COLORS.CYAN, width: 1.5 });
    this.rocketGraphicContainer.addChild(shroudGfx);

    // Payload item silhouette inside
    const payloadSil = new Graphics();
    payloadSil.roundRect(centerX - 24, currentBaseY - 80, 48, 48, 4).fill({ color: UI_COLORS.AMBER, alpha: 0.85 });
    payloadSil.rect(centerX - 4, currentBaseY - 100, 8, 20).fill({ color: 0xffffff });
    this.rocketGraphicContainer.addChild(payloadSil);

    this.applyTransform();
  }

  private renderSlotHotspot(
    slot: ModularConfigurationSlot,
    centerX: number,
    slotY: number,
    _isBooster: boolean
  ): void {
    const isSelected = this.selectedSlotId === slot.slotId;
    const isInstalled = !!slot.installedComponentId;
    const comp = isInstalled ? this.registry.getComponent(slot.installedComponentId!) : undefined;

    // Slot Tag Anchor Container
    const tagContainer = new Container();
    tagContainer.eventMode = 'static';
    tagContainer.cursor = 'pointer';

    // Place tags to the left for booster, right for upper stage, or alternating
    const isLeft = slot.stageNumber % 2 === 1;
    const tagX = isLeft ? centerX - 260 : centerX + 80;
    tagContainer.position.set(tagX, slotY);

    const tagGfx = new Graphics();
    tagGfx.roundRect(0, 0, 180, 26, 4);
    tagGfx.fill({
      color: isSelected ? 0x0c3154 : isInstalled ? 0x091c33 : 0x07111e,
      alpha: 0.95,
    });
    tagGfx.stroke({
      color: isSelected
        ? UI_COLORS.CYAN
        : isInstalled
        ? UI_COLORS.GREEN
        : slot.required
        ? UI_COLORS.AMBER
        : UI_COLORS.BORDER_SUBTLE,
      width: isSelected ? 2.0 : 1.0,
    });
    tagContainer.addChild(tagGfx);

    const slotLabelText = new Text({
      text: isInstalled ? `${comp?.name.substring(0, 18)}..` : `[+] ${slot.label.substring(0, 16)}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 9.5,
        fontWeight: 'bold',
        fill: isSelected
          ? UI_COLORS.CYAN
          : isInstalled
          ? UI_COLORS.GREEN
          : slot.required
          ? UI_COLORS.AMBER
          : UI_COLORS.TEXT_MUTED,
      }),
    });
    slotLabelText.position.set(8, 6);
    tagContainer.addChild(slotLabelText);

    // Leader line to rocket center
    const lineGfx = new Graphics();
    const lineStartX = isLeft ? 180 : 0;
    const lineEndX = isLeft ? 210 : -30;
    lineGfx.moveTo(lineStartX, 13).lineTo(lineEndX, 13).stroke({
      color: isSelected ? UI_COLORS.CYAN : 0x334155,
      width: 1.0,
    });
    tagContainer.addChild(lineGfx);

    tagContainer.on('pointerdown', () => {
      this.selectedSlotId = slot.slotId;
      if (this.onSlotSelectedCb) {
        this.onSlotSelectedCb(slot.slotId);
      }
      this.renderVehicle();
    });

    this.slotHotspotsContainer.addChild(tagContainer);
  }
}
