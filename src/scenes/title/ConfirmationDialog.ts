/**
 * INTERSTELLAR CONTINUUM - New Organisation Overwrite Confirmation Dialog
 * Prevents accidental loss of existing organisation saves with clear,
 * keyboard and mouse navigable modal confirmation.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { AgencyProfile } from '../../core/GameState';

export interface ConfirmationDialogOptions {
  onConfirm: () => void;
  onCancel: () => void;
}

export class ConfirmationDialog {
  public readonly container: Container;

  private backdropGfx: Graphics;
  private modalContainer: Container;
  private panelGfx: Graphics;

  private titleText: Text;
  private warningText: Text;
  private agencyDetailsText: Text;

  private confirmBtnContainer: Container;
  private cancelBtnContainer: Container;

  private isVisible: boolean = false;
  private selectedIndex: number = 1; // Default to Cancel (safety first)
  private options?: ConfirmationDialogOptions;

  private readonly modalWidth: number = 660;
  private readonly modalHeight: number = 360;

  constructor() {
    this.container = new Container();
    this.container.label = 'ConfirmationDialog';
    this.container.visible = false;

    // 1. Dimming Backdrop
    this.backdropGfx = new Graphics();
    this.backdropGfx.rect(0, 0, 1920, 1080);
    this.backdropGfx.fill({ color: 0x020611, alpha: 0.78 });
    this.backdropGfx.eventMode = 'static';
    this.backdropGfx.on('pointerdown', (e) => {
      e.stopPropagation();
      this.cancel();
    });
    this.container.addChild(this.backdropGfx);

    // 2. Modal Frame
    this.modalContainer = new Container();
    this.modalContainer.position.set(
      (1920 - this.modalWidth) / 2,
      (1080 - this.modalHeight) / 2
    );
    this.modalContainer.eventMode = 'static';
    this.container.addChild(this.modalContainer);

    this.panelGfx = new Graphics();
    this.modalContainer.addChild(this.panelGfx);

    // Header Title
    this.titleText = new Text({
      text: '⚠️ OVERWRITE EXISTING ORGANISATION?',
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 18,
        fontWeight: 'bold',
        fill: 0xf59e0b,
        letterSpacing: 1.5,
      }),
    });
    this.titleText.position.set(36, 32);
    this.modalContainer.addChild(this.titleText);

    // Warning Message
    this.warningText = new Text({
      text:
        'An active space exploration organisation already exists in memory. Starting a new organisation will permanently replace your current venture, funding ledgers, researched technologies, and mission archives.\n\nThis action cannot be undone.',
      style: new TextStyle({
        fontFamily: 'sans-serif',
        fontSize: 13,
        fill: 0x94a3b8,
        wordWrap: true,
        wordWrapWidth: this.modalWidth - 72,
        lineHeight: 20,
      }),
    });
    this.warningText.position.set(36, 76);
    this.modalContainer.addChild(this.warningText);

    // Agency Profile Callout
    this.agencyDetailsText = new Text({
      text: 'ACTIVE PROFILE: Unknown Agency',
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 12,
        fontWeight: 'bold',
        fill: 0x38bdf8,
        letterSpacing: 0.8,
      }),
    });
    this.agencyDetailsText.position.set(36, 195);
    this.modalContainer.addChild(this.agencyDetailsText);

    // Action Buttons
    this.confirmBtnContainer = new Container();
    this.cancelBtnContainer = new Container();

    this.modalContainer.addChild(this.confirmBtnContainer);
    this.modalContainer.addChild(this.cancelBtnContainer);
  }

  public show(agency: AgencyProfile | null, options: ConfirmationDialogOptions): void {
    this.options = options;
    this.selectedIndex = 1; // Default to CANCEL for safety

    if (agency) {
      this.agencyDetailsText.text = `ACTIVE PROFILE: "${agency.agencyName.toUpperCase()}" // ${agency.rankTitle.toUpperCase()}`;
    } else {
      this.agencyDetailsText.text = 'ACTIVE PROFILE: Existing Save Slot 1';
    }

    this.isVisible = true;
    this.container.visible = true;

    this.renderPanel();
    this.renderButtons();
  }

  public hide(): void {
    this.isVisible = false;
    this.container.visible = false;
  }

  public isOpen(): boolean {
    return this.isVisible;
  }

  private renderPanel(): void {
    this.panelGfx.clear();

    // Body
    this.panelGfx
      .roundRect(0, 0, this.modalWidth, this.modalHeight, 8)
      .fill({ color: 0x090f1d, alpha: 0.98 })
      .stroke({ color: 0xf59e0b, width: 2.0 });

    // Warning Accent Header Bar
    this.panelGfx
      .moveTo(36, 64)
      .lineTo(this.modalWidth - 36, 64)
      .stroke({ color: 0xf59e0b, width: 1.2, alpha: 0.5 });

    // Agency Box Backing
    this.panelGfx
      .roundRect(36, 185, this.modalWidth - 72, 42, 4)
      .fill({ color: 0x0f172a, alpha: 0.9 })
      .stroke({ color: 0x1e3a5f, width: 1.0 });
  }

  private renderButtons(): void {
    this.confirmBtnContainer.removeChildren();
    this.cancelBtnContainer.removeChildren();

    const btnW = 240;
    const btnH = 42;
    const btnY = this.modalHeight - 74;

    // 1. CONFIRM & OVERWRITE BUTTON (Index 0)
    this.confirmBtnContainer.position.set(36, btnY);
    this.confirmBtnContainer.eventMode = 'static';
    this.confirmBtnContainer.cursor = 'pointer';

    const isConfirmSelected = this.selectedIndex === 0;
    const confirmBg = new Graphics();
    confirmBg.roundRect(0, 0, btnW, btnH, 4);
    confirmBg.fill({ color: isConfirmSelected ? 0xd97706 : 0x451a03, alpha: 0.95 });
    confirmBg.stroke({
      color: isConfirmSelected ? 0xfef08a : 0xf59e0b,
      width: isConfirmSelected ? 2.0 : 1.2,
    });

    const confirmTxt = new Text({
      text: isConfirmSelected ? '▶ OVERWRITE & BEGIN' : 'OVERWRITE & BEGIN',
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 12,
        fontWeight: 'bold',
        fill: isConfirmSelected ? 0xffffff : 0xfde68a,
        letterSpacing: 0.8,
      }),
    });
    confirmTxt.position.set(20, 13);
    this.confirmBtnContainer.addChild(confirmBg);
    this.confirmBtnContainer.addChild(confirmTxt);

    this.confirmBtnContainer.on('pointerover', () => {
      this.selectedIndex = 0;
      this.renderButtons();
    });
    this.confirmBtnContainer.on('pointertap', () => {
      this.confirm();
    });

    // 2. CANCEL BUTTON (Index 1 - Safety default)
    this.cancelBtnContainer.position.set(this.modalWidth - btnW - 36, btnY);
    this.cancelBtnContainer.eventMode = 'static';
    this.cancelBtnContainer.cursor = 'pointer';

    const isCancelSelected = this.selectedIndex === 1;
    const cancelBg = new Graphics();
    cancelBg.roundRect(0, 0, btnW, btnH, 4);
    cancelBg.fill({ color: isCancelSelected ? 0x0284c7 : 0x0f172a, alpha: 0.95 });
    cancelBg.stroke({
      color: isCancelSelected ? 0xffffff : 0x38bdf8,
      width: isCancelSelected ? 2.0 : 1.2,
    });

    const cancelTxt = new Text({
      text: isCancelSelected ? '▶ KEEP SAVED VENTURE' : 'KEEP SAVED VENTURE',
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 12,
        fontWeight: 'bold',
        fill: isCancelSelected ? 0xffffff : 0x93c5fd,
        letterSpacing: 0.8,
      }),
    });
    cancelTxt.position.set(16, 13);
    this.cancelBtnContainer.addChild(cancelBg);
    this.cancelBtnContainer.addChild(cancelTxt);

    this.cancelBtnContainer.on('pointerover', () => {
      this.selectedIndex = 1;
      this.renderButtons();
    });
    this.cancelBtnContainer.on('pointertap', () => {
      this.cancel();
    });
  }

  public navigateLeft(): void {
    if (this.selectedIndex !== 0) {
      this.selectedIndex = 0;
      this.renderButtons();
    }
  }

  public navigateRight(): void {
    if (this.selectedIndex !== 1) {
      this.selectedIndex = 1;
      this.renderButtons();
    }
  }

  public selectCurrent(): void {
    if (this.selectedIndex === 0) {
      this.confirm();
    } else {
      this.cancel();
    }
  }

  private confirm(): void {
    this.hide();
    if (this.options?.onConfirm) {
      this.options.onConfirm();
    }
  }

  public cancel(): void {
    this.hide();
    if (this.options?.onCancel) {
      this.options.onCancel();
    }
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
