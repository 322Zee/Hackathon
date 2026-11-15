/**
 * INTERSTELLAR CONTINUUM - Interactive Information Panel
 * Reusable modal dialogue component for inspecting equipment, research consoles, and facility stations
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { InputManager } from '../input/InputManager';
import { EventBus } from '../core/EventBus';

export interface InfoPanelSpecItem {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface InfoPanelData {
  title: string;
  category?: string;
  description: string;
  specs?: InfoPanelSpecItem[];
  confirmText?: string;
  closeText?: string;
  onConfirm?: () => void;
  onClose?: () => void;
}

export class InformationPanel {
  public readonly container: Container;
  private backdropGfx: Graphics;
  private modalContainer: Container;
  private panelGfx: Graphics;
  private headerTitleText: Text;
  private categoryBadgeText: Text;
  private descriptionText: Text;
  private specsContainer: Container;
  private confirmBtnContainer: Container;
  private closeBtnContainer: Container;

  private isVisible: boolean = false;
  private currentData: InfoPanelData | null = null;
  private inputManager?: InputManager;
  private eventBus?: EventBus;

  private panelWidth: number = 640;
  private panelHeight: number = 420;

  constructor(inputManager?: InputManager, eventBus?: EventBus) {
    this.inputManager = inputManager;
    this.eventBus = eventBus;

    this.container = new Container();
    this.container.label = 'InformationPanelOverlay';
    this.container.visible = false;

    // 1. Semi-transparent dark backdrop
    this.backdropGfx = new Graphics();
    this.backdropGfx.rect(0, 0, 1920, 1080);
    this.backdropGfx.fill({ color: 0x030712, alpha: 0.65 });
    this.backdropGfx.eventMode = 'static';
    this.backdropGfx.on('pointerdown', (e) => {
      e.stopPropagation();
      this.hide();
    });
    this.container.addChild(this.backdropGfx);

    // 2. Centered Modal Window
    this.modalContainer = new Container();
    this.modalContainer.position.set((1920 - this.panelWidth) / 2, (1080 - this.panelHeight) / 2);
    this.modalContainer.eventMode = 'static';
    this.container.addChild(this.modalContainer);

    this.panelGfx = new Graphics();
    this.modalContainer.addChild(this.panelGfx);

    // Category / Subsystem tag
    const catStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 11,
      fontWeight: 'bold',
      fill: 0x00f0ff,
      letterSpacing: 1.5,
    });
    this.categoryBadgeText = new Text({ text: 'EQUIPMENT TERMINAL', style: catStyle });
    this.categoryBadgeText.position.set(30, 24);
    this.modalContainer.addChild(this.categoryBadgeText);

    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0xffffff,
      letterSpacing: 1.0,
    });
    this.headerTitleText = new Text({ text: 'STATION DATA CONSOLE', style: titleStyle });
    this.headerTitleText.position.set(30, 48);
    this.modalContainer.addChild(this.headerTitleText);

    // Description
    const descStyle = new TextStyle({
      fontFamily: 'sans-serif',
      fontSize: 14,
      fill: 0xc8d6e5,
      lineHeight: 22,
      wordWrap: true,
      wordWrapWidth: this.panelWidth - 60,
    });
    this.descriptionText = new Text({ text: '', style: descStyle });
    this.descriptionText.position.set(30, 95);
    this.modalContainer.addChild(this.descriptionText);

    // Specifications Container
    this.specsContainer = new Container();
    this.specsContainer.position.set(30, 210);
    this.modalContainer.addChild(this.specsContainer);

    // Confirm Button
    this.confirmBtnContainer = new Container();
    this.confirmBtnContainer.position.set(this.panelWidth - 30 - 160, this.panelHeight - 55);
    this.modalContainer.addChild(this.confirmBtnContainer);

    // Close Button
    this.closeBtnContainer = new Container();
    this.closeBtnContainer.position.set(this.panelWidth - 30 - 330, this.panelHeight - 55);
    this.modalContainer.addChild(this.closeBtnContainer);

    this.renderButtons();
    this.redrawPanel();
  }

  public isOpen(): boolean {
    return this.isVisible;
  }

  public show(data: InfoPanelData): void {
    this.currentData = data;
    this.isVisible = true;
    this.container.visible = true;

    if (this.inputManager) {
      this.inputManager.lockInput('InformationPanel');
    }

    this.headerTitleText.text = data.title;
    this.categoryBadgeText.text = (data.category ?? 'SYSTEM FACILITY').toUpperCase();
    this.descriptionText.text = data.description;

    this.buildSpecs(data.specs ?? []);
    this.redrawPanel();

    if (this.eventBus) {
      this.eventBus.emit('interaction:modal-opened', { modalId: data.title });
    }
  }

  public hide(): void {
    if (!this.isVisible) return;

    this.isVisible = false;
    this.container.visible = false;

    if (this.inputManager) {
      this.inputManager.unlockInput('InformationPanel');
    }

    if (this.currentData?.onClose) {
      this.currentData.onClose();
    }

    if (this.eventBus) {
      this.eventBus.emit('interaction:modal-closed', {
        modalId: this.currentData ? this.currentData.title : 'info_panel',
      });
    }

    this.currentData = null;
  }

  private buildSpecs(specs: InfoPanelSpecItem[]): void {
    this.specsContainer.removeChildren();

    const labelStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 12,
      fontWeight: 'bold',
      fill: 0x64748b,
    });

    const valueStyleNormal = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 12,
      fontWeight: 'bold',
      fill: 0x38bdf8,
    });

    const valueStyleHighlight = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 12,
      fontWeight: 'bold',
      fill: 0x4ade80,
    });

    const rowHeight = 26;
    for (let i = 0; i < specs.length; i++) {
      const spec = specs[i];
      if (!spec) continue;
      const y = i * rowHeight;

      const bg = new Graphics();
      bg.rect(0, y, this.panelWidth - 60, 22);
      bg.fill({ color: i % 2 === 0 ? 0x0f1d30 : 0x0a1422, alpha: 0.6 });
      this.specsContainer.addChild(bg);

      const label = new Text({ text: spec.label.toUpperCase(), style: labelStyle });
      label.position.set(10, y + 3);
      this.specsContainer.addChild(label);

      const val = new Text({
        text: spec.value,
        style: spec.highlight ? valueStyleHighlight : valueStyleNormal,
      });
      val.position.set(220, y + 3);
      this.specsContainer.addChild(val);
    }
  }

  private renderButtons(): void {
    // 1. Confirm Button
    this.confirmBtnContainer.eventMode = 'static';
    this.confirmBtnContainer.cursor = 'pointer';
    const confirmGfx = new Graphics();
    confirmGfx.roundRect(0, 0, 150, 36, 4).fill({ color: 0x0284c7 }).stroke({ color: 0x38bdf8, width: 1 });
    this.confirmBtnContainer.addChild(confirmGfx);

    const confirmText = new Text({
      text: 'CONFIRM (E)',
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 12,
        fontWeight: 'bold',
        fill: 0xffffff,
      }),
    });
    confirmText.anchor.set(0.5);
    confirmText.position.set(75, 18);
    this.confirmBtnContainer.addChild(confirmText);

    this.confirmBtnContainer.on('pointerdown', (e) => {
      e.stopPropagation();
      if (this.currentData?.onConfirm) {
        this.currentData.onConfirm();
      }
      this.hide();
    });

    // 2. Close Button
    this.closeBtnContainer.eventMode = 'static';
    this.closeBtnContainer.cursor = 'pointer';
    const closeGfx = new Graphics();
    closeGfx.roundRect(0, 0, 150, 36, 4).fill({ color: 0x1e293b }).stroke({ color: 0x475569, width: 1 });
    this.closeBtnContainer.addChild(closeGfx);

    const closeText = new Text({
      text: 'CLOSE (ESC)',
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 12,
        fontWeight: 'bold',
        fill: 0x94a3b8,
      }),
    });
    closeText.anchor.set(0.5);
    closeText.position.set(75, 18);
    this.closeBtnContainer.addChild(closeText);

    this.closeBtnContainer.on('pointerdown', (e) => {
      e.stopPropagation();
      this.hide();
    });
  }

  private redrawPanel(): void {
    this.panelGfx.clear();

    // Outer Glow / Border Frame
    this.panelGfx
      .roundRect(0, 0, this.panelWidth, this.panelHeight, 8)
      .fill({ color: 0x060f1c, alpha: 0.96 })
      .stroke({ color: 0x00f0ff, width: 1.5, alpha: 0.8 });

    // Header divider rule
    this.panelGfx
      .moveTo(30, 80)
      .lineTo(this.panelWidth - 30, 80)
      .stroke({ color: 0x1e3a5f, width: 1 });

    // Footer divider rule
    this.panelGfx
      .moveTo(30, this.panelHeight - 65)
      .lineTo(this.panelWidth - 30, this.panelHeight - 65)
      .stroke({ color: 0x1e3a5f, width: 1 });
  }

  public handleKeyDown(code: string): boolean {
    if (!this.isVisible) return false;

    if (code === 'Escape') {
      this.hide();
      return true;
    }

    if (code === 'KeyE' || code === 'Enter' || code === 'Space') {
      if (this.currentData?.onConfirm) {
        this.currentData.onConfirm();
      }
      this.hide();
      return true;
    }

    return true; // Consume other keys while modal is open
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
