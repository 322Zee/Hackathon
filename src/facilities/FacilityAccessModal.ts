/**
 * INTERSTELLAR CONTINUUM - Facility Access Modal
 * Coherent 2.5D aerospace access dialogue displaying facility identity,
 * operational purpose, availability status, rank requirements, future system connections,
 * and working navigation entry into interior scenes.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { FacilityRecord, FacilityAvailabilityState } from './FacilityTypes';
import { InputManager } from '../input/InputManager';
import { EventBus } from '../core/EventBus';

export interface FacilityAccessModalOptions {
  onEnter?: (facility: FacilityRecord) => void;
  onClose?: (facility: FacilityRecord) => void;
}

export class FacilityAccessModal {
  public readonly container: Container;

  private backdropGfx: Graphics;
  private modalContainer: Container;
  private panelGfx: Graphics;
  private iconGfx: Graphics;

  private titleText: Text;
  private deptBadgeText: Text;
  private statusBadgeText: Text;
  private rankBadgeText: Text;
  private purposeText: Text;
  private descriptionText: Text;

  private specsContainer: Container;
  private futureSystemContainer: Container;

  private enterBtnContainer: Container;
  private enterBtnText: Text;
  private closeBtnContainer: Container;

  private isVisible: boolean = false;
  private currentFacility: FacilityRecord | null = null;
  private inputManager?: InputManager;
  private eventBus?: EventBus;
  private options: FacilityAccessModalOptions = {};

  private readonly modalWidth: number = 740;
  private readonly modalHeight: number = 520;

  constructor(
    inputManager?: InputManager,
    eventBus?: EventBus,
    options: FacilityAccessModalOptions = {}
  ) {
    this.inputManager = inputManager;
    this.eventBus = eventBus;
    this.options = options;

    this.container = new Container();
    this.container.label = 'FacilityAccessModalOverlay';
    this.container.visible = false;

    // 1. Fullscreen Dimming Backdrop
    this.backdropGfx = new Graphics();
    this.backdropGfx.rect(0, 0, 1920, 1080);
    this.backdropGfx.fill({ color: 0x020611, alpha: 0.72 });
    this.backdropGfx.eventMode = 'static';
    this.backdropGfx.on('pointerdown', (e) => {
      e.stopPropagation();
      this.hide();
    });
    this.container.addChild(this.backdropGfx);

    // 2. Centered Modal Window
    this.modalContainer = new Container();
    this.modalContainer.position.set(
      (1920 - this.modalWidth) / 2,
      (1080 - this.modalHeight) / 2
    );
    this.modalContainer.eventMode = 'static';
    this.container.addChild(this.modalContainer);

    this.panelGfx = new Graphics();
    this.modalContainer.addChild(this.panelGfx);

    this.iconGfx = new Graphics();
    this.modalContainer.addChild(this.iconGfx);

    // Department & Short Code
    this.deptBadgeText = new Text({
      text: 'DEPARTMENT // FACILITY CODE',
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 11,
        fontWeight: 'bold',
        fill: 0x00f0ff,
        letterSpacing: 1.5,
      }),
    });
    this.deptBadgeText.position.set(96, 24);
    this.modalContainer.addChild(this.deptBadgeText);

    // Title
    this.titleText = new Text({
      text: 'FACILITY NAME',
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 20,
        fontWeight: 'bold',
        fill: 0xffffff,
        letterSpacing: 1.0,
      }),
    });
    this.titleText.position.set(96, 46);
    this.modalContainer.addChild(this.titleText);

    // Status LED Badge
    this.statusBadgeText = new Text({
      text: '● OPERATIONAL',
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 11,
        fontWeight: 'bold',
        fill: 0x4ade80,
        letterSpacing: 1.0,
      }),
    });
    this.statusBadgeText.position.set(560, 24);
    this.modalContainer.addChild(this.statusBadgeText);

    // Rank Requirement Badge
    this.rankBadgeText = new Text({
      text: 'CLEARANCE: RANK 1',
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 10,
        fontWeight: 'bold',
        fill: 0x94a3b8,
        letterSpacing: 0.8,
      }),
    });
    this.rankBadgeText.position.set(560, 46);
    this.modalContainer.addChild(this.rankBadgeText);

    // Purpose Callout
    this.purposeText = new Text({
      text: 'PURPOSE: Central operational mandate.',
      style: new TextStyle({
        fontFamily: 'sans-serif',
        fontSize: 12,
        fontWeight: 'bold',
        fill: 0x38bdf8,
        wordWrap: true,
        wordWrapWidth: this.modalWidth - 60,
        lineHeight: 18,
      }),
    });
    this.purposeText.position.set(30, 88);
    this.modalContainer.addChild(this.purposeText);

    // Detailed Description
    this.descriptionText = new Text({
      text: 'Detailed facility architecture description.',
      style: new TextStyle({
        fontFamily: 'sans-serif',
        fontSize: 13,
        fill: 0xcad5e2,
        wordWrap: true,
        wordWrapWidth: this.modalWidth - 60,
        lineHeight: 20,
      }),
    });
    this.descriptionText.position.set(30, 134);
    this.modalContainer.addChild(this.descriptionText);

    // Future System Integration Card
    this.futureSystemContainer = new Container();
    this.futureSystemContainer.position.set(30, 204);
    this.modalContainer.addChild(this.futureSystemContainer);

    // Live Specs Container
    this.specsContainer = new Container();
    this.specsContainer.position.set(30, 360);
    this.modalContainer.addChild(this.specsContainer);

    // Buttons Container
    this.enterBtnContainer = new Container();
    this.enterBtnText = new Text({
      text: 'ENTER FACILITY',
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 13,
        fontWeight: 'bold',
        fill: 0xffffff,
        letterSpacing: 1.0,
      }),
    });
    this.modalContainer.addChild(this.enterBtnContainer);

    this.closeBtnContainer = new Container();
    this.modalContainer.addChild(this.closeBtnContainer);
  }

  public show(facility: FacilityRecord, options?: FacilityAccessModalOptions): void {
    this.currentFacility = facility;
    if (options) {
      this.options = { ...this.options, ...options };
    }

    this.isVisible = true;
    this.container.visible = true;

    if (this.inputManager) {
      this.inputManager.lockInput('FacilityAccessModal');
    }

    this.renderModalContent();

    if (this.eventBus) {
      this.eventBus.emit('facility:modal-opened', {
        facilityId: facility.id,
        name: facility.name,
      });
    }
  }

  public hide(): void {
    if (!this.isVisible) return;

    this.isVisible = false;
    this.container.visible = false;

    if (this.inputManager) {
      this.inputManager.unlockInput('FacilityAccessModal');
    }

    const closedFacility = this.currentFacility;
    this.currentFacility = null;

    if (closedFacility && this.options.onClose) {
      this.options.onClose(closedFacility);
    }

    if (this.eventBus && closedFacility) {
      this.eventBus.emit('facility:modal-closed', {
        facilityId: closedFacility.id,
      });
    }
  }

  public isOpen(): boolean {
    return this.isVisible;
  }

  public getCurrentFacility(): FacilityRecord | null {
    return this.currentFacility;
  }

  private renderModalContent(): void {
    if (!this.currentFacility) return;

    const f = this.currentFacility;
    const accent = f.accentColor || 0x00f0ff;

    // 1. Draw Panel Frame with Accent Border & Corner Brackets
    this.panelGfx.clear();
    // Glass Body
    this.panelGfx
      .roundRect(0, 0, this.modalWidth, this.modalHeight, 8)
      .fill({ color: 0x08101e, alpha: 0.95 })
      .stroke({ color: accent, width: 1.8, alpha: 0.75 });

    // Inner subtle glow
    this.panelGfx
      .roundRect(4, 4, this.modalWidth - 8, this.modalHeight - 8, 6)
      .stroke({ color: 0x1e293b, width: 1.0, alpha: 0.5 });

    // Top Header Accent Line
    this.panelGfx
      .moveTo(24, 78)
      .lineTo(this.modalWidth - 24, 78)
      .stroke({ color: accent, width: 1.2, alpha: 0.4 });

    // 2. Draw Facility Icon
    this.drawFacilityIcon(f.iconName, accent);

    // 3. Update Text Fields
    this.deptBadgeText.text = `${f.department} // [${f.shortCode}]`;
    this.deptBadgeText.style.fill = accent;

    this.titleText.text = f.name.toUpperCase();

    // Availability styling
    let statusLabel = '● OPERATIONAL';
    let statusColor = 0x4ade80;
    let canEnter = true;

    if (f.availability === FacilityAvailabilityState.RESTRICTED) {
      statusLabel = '▲ RESTRICTED';
      statusColor = 0xf59e0b;
      canEnter = false;
    } else if (f.availability === FacilityAvailabilityState.LOCKED) {
      statusLabel = '■ LOCKED';
      statusColor = 0xef4444;
      canEnter = false;
    } else if (f.availability === FacilityAvailabilityState.UNDER_UPGRADE) {
      statusLabel = '◆ UPGRADING';
      statusColor = 0xeab308;
      canEnter = false;
    }

    this.statusBadgeText.text = statusLabel;
    this.statusBadgeText.style.fill = statusColor;

    this.rankBadgeText.text = `CLEARANCE: ${f.requiredRankTitle}`;
    this.purposeText.text = `PURPOSE: ${f.purpose}`;
    this.descriptionText.text = f.description;

    // 4. Render Future System Integration Card
    this.renderFutureSystemCard(f, accent);

    // 5. Render Specs Table
    this.renderSpecsTable(f.specs || []);

    // 6. Render Action Buttons
    this.renderButtons(canEnter, accent);
  }

  private drawFacilityIcon(iconName: string, accentColor: number): void {
    this.iconGfx.clear();
    const cx = 52;
    const cy = 46;

    // Hexagonal Icon Badge Base
    this.iconGfx
      .circle(cx, cy, 26)
      .fill({ color: 0x0f172a, alpha: 0.9 })
      .stroke({ color: accentColor, width: 2.0 });

    this.iconGfx.circle(cx, cy, 20).stroke({ color: accentColor, width: 0.8, alpha: 0.5 });

    // Internal emblem geometry
    switch (iconName) {
      case 'MISSION_CONTROL':
        // Radar dish sweep
        this.iconGfx.arc(cx, cy, 14, -Math.PI * 0.7, Math.PI * 0.2);
        this.iconGfx.stroke({ color: accentColor, width: 2 });
        this.iconGfx.moveTo(cx, cy).lineTo(cx + 10, cy - 8).stroke({ color: 0xffffff, width: 1.5 });
        this.iconGfx.circle(cx, cy, 3).fill({ color: accentColor });
        break;

      case 'ROCKET_ENGINEERING':
        // Rocket silhouette
        this.iconGfx.moveTo(cx, cy - 14).lineTo(cx + 8, cy + 10).lineTo(cx, cy + 6).lineTo(cx - 8, cy + 10).closePath();
        this.iconGfx.fill({ color: accentColor });
        break;

      case 'SPACECRAFT_LAB':
        // Satellite bus with solar arrays
        this.iconGfx.rect(cx - 5, cy - 5, 10, 10).fill({ color: 0xffffff });
        this.iconGfx.rect(cx - 16, cy - 4, 9, 8).stroke({ color: accentColor, width: 1.5 });
        this.iconGfx.rect(cx + 7, cy - 4, 9, 8).stroke({ color: accentColor, width: 1.5 });
        break;

      case 'RESEARCH_DEVELOPMENT':
        // Atomic orbit rings
        this.iconGfx.ellipse(cx, cy, 14, 5).stroke({ color: accentColor, width: 1.2 });
        this.iconGfx.ellipse(cx, cy, 5, 14).stroke({ color: accentColor, width: 1.2 });
        this.iconGfx.circle(cx, cy, 3).fill({ color: 0xffffff });
        break;

      case 'FINANCE_ADMIN':
        // Administrative shield
        this.iconGfx.moveTo(cx - 10, cy - 12).lineTo(cx + 10, cy - 12).lineTo(cx + 10, cy + 2).lineTo(cx, cy + 12).lineTo(cx - 10, cy + 2).closePath();
        this.iconGfx.stroke({ color: accentColor, width: 2 }).fill({ color: 0x064e3b, alpha: 0.6 });
        break;

      case 'MANUFACTURING_CENTRE':
        // Gear & flame
        this.iconGfx.circle(cx, cy, 11).stroke({ color: accentColor, width: 2 });
        this.iconGfx.rect(cx - 3, cy - 15, 6, 30).fill({ color: accentColor });
        this.iconGfx.rect(cx - 15, cy - 3, 30, 6).fill({ color: accentColor });
        break;

      case 'ROBOTICS_CENTRE':
        // Rover wheel / manipulator
        this.iconGfx.circle(cx - 7, cy + 6, 5).stroke({ color: accentColor, width: 2 });
        this.iconGfx.circle(cx + 7, cy + 6, 5).stroke({ color: accentColor, width: 2 });
        this.iconGfx.moveTo(cx - 7, cy + 6).lineTo(cx, cy - 8).lineTo(cx + 7, cy + 6).stroke({ color: 0xffffff, width: 1.5 });
        break;

      case 'COMMUNICATIONS_CENTRE':
        // Parabolic dish
        this.iconGfx.arc(cx, cy + 4, 12, Math.PI, 0);
        this.iconGfx.stroke({ color: accentColor, width: 2.2 });
        this.iconGfx.moveTo(cx, cy + 4).lineTo(cx, cy - 10).stroke({ color: 0xffffff, width: 1.5 });
        this.iconGfx.circle(cx, cy - 10, 2.5).fill({ color: accentColor });
        break;

      case 'PLANETARY_DATA_CENTRE':
        // Celestial globe with ring
        this.iconGfx.circle(cx, cy, 9).fill({ color: accentColor });
        this.iconGfx.ellipse(cx, cy, 16, 4).stroke({ color: 0xffffff, width: 1.5 });
        break;

      case 'SETTINGS_ADMIN':
        // System Cog / Terminal
        this.iconGfx.circle(cx, cy, 9).stroke({ color: accentColor, width: 3 });
        this.iconGfx.circle(cx, cy, 3).fill({ color: 0xffffff });
        break;

      case 'LAUNCH_PAD':
        // Hexagonal launch mount
        this.iconGfx.rect(cx - 12, cy - 10, 24, 20).stroke({ color: accentColor, width: 2 });
        this.iconGfx.moveTo(cx - 12, cy - 10).lineTo(cx + 12, cy + 10).stroke({ color: 0xffffff, width: 1.2 });
        this.iconGfx.moveTo(cx + 12, cy - 10).lineTo(cx - 12, cy + 10).stroke({ color: 0xffffff, width: 1.2 });
        break;

      default:
        // Standard facility badge
        this.iconGfx.rect(cx - 10, cy - 10, 20, 20).stroke({ color: accentColor, width: 2 });
        break;
    }
  }

  private renderFutureSystemCard(f: FacilityRecord, accent: number): void {
    this.futureSystemContainer.removeChildren();

    const cardW = this.modalWidth - 60;
    const cardH = 140;

    const bg = new Graphics();
    bg.roundRect(0, 0, cardW, cardH, 6);
    bg.fill({ color: 0x050c18, alpha: 0.9 });
    bg.stroke({ color: 0x1e3a5f, width: 1.2 });

    const title = new Text({
      text: `SUBSYSTEM INTEGRATION: [${f.futureSystem}]`,
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 11,
        fontWeight: 'bold',
        fill: accent,
        letterSpacing: 1.0,
      }),
    });
    title.position.set(16, 12);

    const desc = new Text({
      text: f.futureSystemDescription,
      style: new TextStyle({
        fontFamily: 'sans-serif',
        fontSize: 11.5,
        fill: 0x94a3b8,
        wordWrap: true,
        wordWrapWidth: cardW - 32,
        lineHeight: 16,
      }),
    });
    desc.position.set(16, 32);

    // Capabilities list
    let lineY = 68;
    for (const cap of f.futureCapabilities.slice(0, 3)) {
      const capTxt = new Text({
        text: `▹ ${cap}`,
        style: new TextStyle({
          fontFamily: 'monospace',
          fontSize: 10.5,
          fill: 0x38bdf8,
          letterSpacing: 0.5,
        }),
      });
      capTxt.position.set(20, lineY);
      bg.addChild(capTxt);
      lineY += 18;
    }

    const note = new Text({
      text: 'STATUS: Operational access layer active. Full gameplay controls connect in future phases.',
      style: new TextStyle({
        fontFamily: 'sans-serif',
        fontSize: 10,
        fontStyle: 'italic',
        fill: 0x64748b,
      }),
    });
    note.position.set(16, 122);

    bg.addChild(title);
    bg.addChild(desc);
    bg.addChild(note);
    this.futureSystemContainer.addChild(bg);
  }

  private renderSpecsTable(specs: Array<{ label: string; value: string; highlight?: boolean }>): void {
    this.specsContainer.removeChildren();

    const colW = (this.modalWidth - 60) / Math.max(1, specs.length);
    for (let i = 0; i < specs.length; i++) {
      const spec = specs[i]!;
      const col = new Container();
      col.position.set(i * colW, 0);

      const lbl = new Text({
        text: spec.label,
        style: new TextStyle({
          fontFamily: 'monospace',
          fontSize: 9.5,
          fontWeight: 'bold',
          fill: 0x64748b,
          letterSpacing: 0.8,
        }),
      });
      lbl.position.set(0, 0);

      const val = new Text({
        text: spec.value,
        style: new TextStyle({
          fontFamily: 'monospace',
          fontSize: 11,
          fontWeight: 'bold',
          fill: spec.highlight ? 0x00f0ff : 0xe2e8f0,
        }),
      });
      val.position.set(0, 16);

      col.addChild(lbl);
      col.addChild(val);
      this.specsContainer.addChild(col);
    }
  }

  private renderButtons(canEnter: boolean, accent: number): void {
    this.enterBtnContainer.removeChildren();
    this.closeBtnContainer.removeChildren();

    const btnY = this.modalHeight - 64;
    const btnW = 200;
    const btnH = 40;

    // 1. ENTER FACILITY BUTTON
    this.enterBtnContainer.position.set(this.modalWidth - btnW - 30, btnY);
    this.enterBtnContainer.eventMode = canEnter ? 'static' : 'none';
    this.enterBtnContainer.cursor = canEnter ? 'pointer' : 'not-allowed';

    const enterBg = new Graphics();
    if (canEnter) {
      enterBg.roundRect(0, 0, btnW, btnH, 4);
      enterBg.fill({ color: accent, alpha: 0.85 });
      enterBg.stroke({ color: 0xffffff, width: 1.5 });
      this.enterBtnText.text = 'ENTER FACILITY';
      this.enterBtnText.style.fill = 0x040812;
    } else {
      enterBg.roundRect(0, 0, btnW, btnH, 4);
      enterBg.fill({ color: 0x334155, alpha: 0.5 });
      enterBg.stroke({ color: 0x64748b, width: 1.2 });
      this.enterBtnText.text = 'ACCESS LOCKED';
      this.enterBtnText.style.fill = 0x94a3b8;
    }
    const enterTxtWidth = this.getSafeTextWidth(this.enterBtnText, 8.5);
    this.enterBtnText.position.set((btnW - enterTxtWidth) / 2, 11);

    this.enterBtnContainer.addChild(enterBg);
    this.enterBtnContainer.addChild(this.enterBtnText);

    if (canEnter) {
      this.enterBtnContainer.on('pointerover', () => {
        enterBg.fill({ color: 0xffffff, alpha: 1.0 });
      });
      this.enterBtnContainer.on('pointerout', () => {
        enterBg.fill({ color: accent, alpha: 0.85 });
      });
      this.enterBtnContainer.on('pointertap', () => {
        if (this.currentFacility && this.options.onEnter) {
          const fac = this.currentFacility;
          this.hide();
          this.options.onEnter(fac);
        }
      });
    }

    // 2. RETURN TO CAMPUS BUTTON
    this.closeBtnContainer.position.set(this.modalWidth - btnW * 2 - 45, btnY);
    this.closeBtnContainer.eventMode = 'static';
    this.closeBtnContainer.cursor = 'pointer';

    const closeBg = new Graphics();
    closeBg.roundRect(0, 0, btnW, btnH, 4);
    closeBg.fill({ color: 0x0f172a, alpha: 0.85 });
    closeBg.stroke({ color: 0x475569, width: 1.2 });

    const closeTxt = new Text({
      text: 'RETURN TO CAMPUS',
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 12,
        fontWeight: 'bold',
        fill: 0x94a3b8,
        letterSpacing: 0.8,
      }),
    });
    const closeTxtWidth = this.getSafeTextWidth(closeTxt, 7.5);
    closeTxt.position.set((btnW - closeTxtWidth) / 2, 12);

    this.closeBtnContainer.addChild(closeBg);
    this.closeBtnContainer.addChild(closeTxt);

    this.closeBtnContainer.on('pointerover', () => {
      closeBg.stroke({ color: 0xffffff, width: 1.5 });
      closeTxt.style.fill = 0xffffff;
    });
    this.closeBtnContainer.on('pointerout', () => {
      closeBg.stroke({ color: 0x475569, width: 1.2 });
      closeTxt.style.fill = 0x94a3b8;
    });
    this.closeBtnContainer.on('pointertap', () => {
      this.hide();
    });
  }

  private getSafeTextWidth(txt: Text, charWidth: number = 8.5): number {
    try {
      if (typeof document !== 'undefined') {
        return txt.width || 100;
      }
    } catch {
      // Fallback in headless environment without DOM canvas
    }
    const len = txt.text ? txt.text.length : 12;
    return len * charWidth;
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
