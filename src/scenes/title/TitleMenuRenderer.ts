/**
 * INTERSTELLAR CONTINUUM - Title Screen Menu Architecture
 * Handles "PRESS TO START" prompt, Main Menu options,
 * keyboard & mouse navigation, and selection feedback.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export interface MenuItemDefinition {
  id: string;
  label: string;
  subtitle: string;
  enabled: boolean;
  disabledReason?: string;
  onActivate: () => void;
}

export interface TitleMenuOptions {
  onHover?: (index: number) => void;
  onSelect?: (index: number) => void;
  onStartPressed?: () => void;
}

export class TitleMenuRenderer {
  public readonly container: Container;

  private promptContainer: Container;
  private promptBg: Graphics;
  private promptText: Text;

  private menuContainer: Container;
  private items: MenuItemDefinition[] = [];
  private itemContainers: Container[] = [];
  private selectedIndex: number = 0;

  private isStartScreenActive: boolean = true;
  private options: TitleMenuOptions = {};
  private timeElapsed: number = 0;

  private readonly menuWidth: number = 480;
  private readonly itemHeight: number = 54;

  constructor(options: TitleMenuOptions = {}) {
    this.options = options;

    this.container = new Container();
    this.container.label = 'TitleMenuRenderer';

    // 1. "PRESS TO START" Prompt Container
    this.promptContainer = new Container();
    this.promptContainer.position.set(960, 580);
    this.promptContainer.eventMode = 'static';
    this.promptContainer.cursor = 'pointer';

    this.promptBg = new Graphics();
    this.promptContainer.addChild(this.promptBg);

    const promptStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0x00f0ff,
      letterSpacing: 2.5,
      dropShadow: {
        alpha: 0.8,
        angle: Math.PI / 2,
        blur: 10,
        color: 0x00f0ff,
        distance: 0,
      },
    });

    this.promptText = new Text({
      text: '▶ PRESS ANY KEY OR CLICK TO START ◀',
      style: promptStyle,
    });
    this.promptText.anchor.set(0.5, 0.5);
    this.promptContainer.addChild(this.promptText);

    this.promptContainer.on('pointertap', () => {
      this.triggerStart();
    });

    this.container.addChild(this.promptContainer);

    // 2. Main Menu Container
    this.menuContainer = new Container();
    this.menuContainer.position.set(960 - this.menuWidth / 2, 440);
    this.menuContainer.visible = false;
    this.container.addChild(this.menuContainer);
  }

  public setMenuItems(items: MenuItemDefinition[]): void {
    this.items = items;
    // Default selected index to first enabled item
    const firstEnabled = items.findIndex((i) => i.enabled);
    this.selectedIndex = firstEnabled !== -1 ? firstEnabled : 0;
    this.renderMenu();
  }

  public triggerStart(): void {
    if (!this.isStartScreenActive) return;

    this.isStartScreenActive = false;
    this.promptContainer.visible = false;
    this.menuContainer.visible = true;

    if (this.options.onStartPressed) {
      this.options.onStartPressed();
    }
  }

  public isStartMode(): boolean {
    return this.isStartScreenActive;
  }

  public getSelectedIndex(): number {
    return this.selectedIndex;
  }

  public selectNext(): void {
    if (this.items.length === 0 || this.isStartScreenActive) return;

    let next = (this.selectedIndex + 1) % this.items.length;
    // Advance to next enabled item if possible
    let attempts = 0;
    while (!this.items[next]?.enabled && attempts < this.items.length) {
      next = (next + 1) % this.items.length;
      attempts++;
    }

    if (this.selectedIndex !== next) {
      this.selectedIndex = next;
      this.renderMenu();
      if (this.options.onHover) this.options.onHover(this.selectedIndex);
    }
  }

  public selectPrevious(): void {
    if (this.items.length === 0 || this.isStartScreenActive) return;

    let prev = (this.selectedIndex - 1 + this.items.length) % this.items.length;
    let attempts = 0;
    while (!this.items[prev]?.enabled && attempts < this.items.length) {
      prev = (prev - 1 + this.items.length) % this.items.length;
      attempts++;
    }

    if (this.selectedIndex !== prev) {
      this.selectedIndex = prev;
      this.renderMenu();
      if (this.options.onHover) this.options.onHover(this.selectedIndex);
    }
  }

  public activateSelected(): void {
    if (this.isStartScreenActive) {
      this.triggerStart();
      return;
    }

    const item = this.items[this.selectedIndex];
    if (item && item.enabled) {
      if (this.options.onSelect) this.options.onSelect(this.selectedIndex);
      item.onActivate();
    }
  }

  private renderMenu(): void {
    this.menuContainer.removeChildren();
    this.itemContainers = [];

    let currentY = 0;
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i]!;
      const isSelected = i === this.selectedIndex;
      const isEnabled = item.enabled;

      const itemCont = new Container();
      itemCont.position.set(0, currentY);
      itemCont.eventMode = isEnabled ? 'static' : 'none';
      itemCont.cursor = isEnabled ? 'pointer' : 'default';

      // Background Button Geometry
      const bg = new Graphics();
      bg.roundRect(0, 0, this.menuWidth, this.itemHeight - 8, 4);

      if (isSelected && isEnabled) {
        bg.fill({ color: 0x07253b, alpha: 0.95 });
        bg.stroke({ color: 0x00f0ff, width: 2.0 });
      } else if (!isEnabled) {
        bg.fill({ color: 0x090f19, alpha: 0.6 });
        bg.stroke({ color: 0x1e293b, width: 1.0 });
      } else {
        bg.fill({ color: 0x071120, alpha: 0.85 });
        bg.stroke({ color: 0x1e3a5f, width: 1.2 });
      }
      itemCont.addChild(bg);

      // Selection Marker Arrow
      if (isSelected && isEnabled) {
        const marker = new Graphics();
        marker
          .moveTo(14, 18)
          .lineTo(24, 23)
          .lineTo(14, 28)
          .closePath()
          .fill({ color: 0x00f0ff });
        itemCont.addChild(marker);
      }

      // Main Label Text
      const textX = isSelected && isEnabled ? 34 : 20;
      const labelText = new Text({
        text: item.label.toUpperCase(),
        style: new TextStyle({
          fontFamily: 'monospace',
          fontSize: 15,
          fontWeight: 'bold',
          fill: !isEnabled ? 0x475569 : isSelected ? 0xffffff : 0x38bdf8,
          letterSpacing: 1.5,
        }),
      });
      labelText.position.set(textX, 8);
      itemCont.addChild(labelText);

      // Subtitle / Reason Tag
      const subtitleStr = !isEnabled && item.disabledReason ? `[${item.disabledReason}]` : item.subtitle;
      const subtitleText = new Text({
        text: subtitleStr,
        style: new TextStyle({
          fontFamily: 'sans-serif',
          fontSize: 10.5,
          fontWeight: isSelected ? 'bold' : 'normal',
          fill: !isEnabled ? 0x64748b : isSelected ? 0x93c5fd : 0x64748b,
          letterSpacing: 0.5,
        }),
      });
      subtitleText.position.set(textX, 27);
      itemCont.addChild(subtitleText);

      // Pointer Event Listeners
      if (isEnabled) {
        itemCont.on('pointerover', () => {
          if (this.selectedIndex !== i) {
            this.selectedIndex = i;
            this.renderMenu();
            if (this.options.onHover) this.options.onHover(i);
          }
        });
        itemCont.on('pointertap', () => {
          this.selectedIndex = i;
          this.activateSelected();
        });
      }

      this.menuContainer.addChild(itemCont);
      this.itemContainers.push(itemCont);
      currentY += this.itemHeight;
    }
  }

  public update(deltaSeconds: number): void {
    this.timeElapsed += deltaSeconds;

    // Animate "PRESS TO START" pulsing breath
    if (this.isStartScreenActive) {
      const pulse = 0.65 + Math.sin(this.timeElapsed * 3.2) * 0.35;
      this.promptText.alpha = pulse;
    }
  }

  public destroy(): void {
    this.container.destroy({ children: true });
    this.items = [];
    this.itemContainers = [];
  }
}
