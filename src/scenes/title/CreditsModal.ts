/**
 * INTERSTELLAR CONTINUUM - Credits Interface Architecture
 * Displays project authorship, engine architecture, scientific design groups,
 * and mission dedication using configurable project metadata.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export class CreditsModal {
  public readonly container: Container;

  private backdropGfx: Graphics;
  private modalContainer: Container;
  private panelGfx: Graphics;
  private closeBtnContainer: Container;

  private isVisible: boolean = false;
  private onCloseCallback?: () => void;

  private readonly modalWidth: number = 720;
  private readonly modalHeight: number = 520;

  constructor() {
    this.container = new Container();
    this.container.label = 'CreditsModal';
    this.container.visible = false;

    // 1. Semi-transparent Backdrop
    this.backdropGfx = new Graphics();
    this.backdropGfx.rect(0, 0, 1920, 1080);
    this.backdropGfx.fill({ color: 0x020611, alpha: 0.78 });
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

    this.renderPanel();
    this.renderCreditsText();

    this.closeBtnContainer = new Container();
    this.modalContainer.addChild(this.closeBtnContainer);
    this.renderCloseButton();
  }

  public show(onClose?: () => void): void {
    this.onCloseCallback = onClose;
    this.isVisible = true;
    this.container.visible = true;
  }

  public hide(): void {
    if (!this.isVisible) return;
    this.isVisible = false;
    this.container.visible = false;
    if (this.onCloseCallback) {
      this.onCloseCallback();
    }
  }

  public isOpen(): boolean {
    return this.isVisible;
  }

  private renderPanel(): void {
    this.panelGfx.clear();

    this.panelGfx
      .roundRect(0, 0, this.modalWidth, this.modalHeight, 8)
      .fill({ color: 0x08101e, alpha: 0.96 })
      .stroke({ color: 0x00f0ff, width: 1.8, alpha: 0.8 });

    // Inner subtle glow
    this.panelGfx
      .roundRect(4, 4, this.modalWidth - 8, this.modalHeight - 8, 6)
      .stroke({ color: 0x1e293b, width: 1.0, alpha: 0.5 });

    // Top Header line
    this.panelGfx
      .moveTo(32, 68)
      .lineTo(this.modalWidth - 32, 68)
      .stroke({ color: 0x00f0ff, width: 1.2, alpha: 0.4 });
  }

  private renderCreditsText(): void {
    const titleText = new Text({
      text: 'PROJECT CREDITS // INTERSTELLAR CONTINUUM',
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 18,
        fontWeight: 'bold',
        fill: 0xffffff,
        letterSpacing: 1.5,
      }),
    });
    titleText.position.set(36, 30);
    this.modalContainer.addChild(titleText);

    const creditsData = [
      {
        role: 'SYSTEM ARCHITECTURE & TECHNICAL DIRECTION',
        team: 'Principal Software Architecture Team // Google Antigravity IDE',
      },
      {
        role: '2.5D PROCEDURAL RENDERING & GRAPHICS PIPELINE',
        team: 'Visual Engineering & Multi-Layer Graphics Division',
      },
      {
        role: 'ORBITAL DYNAMICS & FLIGHT SIMULATION',
        team: 'Solar System Astrodynamics & Mission Design Workgroup',
      },
      {
        role: 'AEROSPACE FACILITY ARCHITECTURE & INTERACTION',
        team: 'Headquarters Spatial Engineering & Departmental Systems',
      },
      {
        role: 'AUDIO ARCHITECTURE & COMPOSITION',
        team: 'Positional Audio & Multi-Channel Mixing Systems',
      },
      {
        role: 'DEDICATION & MANDATE',
        team: 'Dedicated to the advancement of aerospace education and the peaceful exploration of the Solar System.',
      },
    ];

    let currentY = 88;
    for (const item of creditsData) {
      const roleText = new Text({
        text: item.role,
        style: new TextStyle({
          fontFamily: 'monospace',
          fontSize: 10,
          fontWeight: 'bold',
          fill: 0x38bdf8,
          letterSpacing: 1.0,
        }),
      });
      roleText.position.set(36, currentY);
      this.modalContainer.addChild(roleText);

      const teamText = new Text({
        text: item.team,
        style: new TextStyle({
          fontFamily: 'sans-serif',
          fontSize: 12,
          fill: 0xcad5e2,
          wordWrap: true,
          wordWrapWidth: this.modalWidth - 72,
          lineHeight: 18,
        }),
      });
      teamText.position.set(36, currentY + 16);
      this.modalContainer.addChild(teamText);

      currentY += 56;
    }
  }

  private renderCloseButton(): void {
    const btnW = 180;
    const btnH = 38;
    const btnY = this.modalHeight - 56;

    this.closeBtnContainer.position.set((this.modalWidth - btnW) / 2, btnY);
    this.closeBtnContainer.eventMode = 'static';
    this.closeBtnContainer.cursor = 'pointer';

    const bg = new Graphics();
    bg.roundRect(0, 0, btnW, btnH, 4);
    bg.fill({ color: 0x0f172a, alpha: 0.9 });
    bg.stroke({ color: 0x00f0ff, width: 1.2 });

    const txt = new Text({
      text: 'CLOSE [ESC]',
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 12,
        fontWeight: 'bold',
        fill: 0x38bdf8,
        letterSpacing: 0.8,
      }),
    });
    txt.position.set(42, 11);

    this.closeBtnContainer.addChild(bg);
    this.closeBtnContainer.addChild(txt);

    this.closeBtnContainer.on('pointerover', () => {
      bg.stroke({ color: 0xffffff, width: 1.5 });
      txt.style.fill = 0xffffff;
    });
    this.closeBtnContainer.on('pointerout', () => {
      bg.stroke({ color: 0x00f0ff, width: 1.2 });
      txt.style.fill = 0x38bdf8;
    });
    this.closeBtnContainer.on('pointertap', () => {
      this.hide();
    });
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
