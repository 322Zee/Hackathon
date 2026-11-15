/**
 * INTERSTELLAR CONTINUUM - Contextual Interaction Prompt
 * Non-obstructive dynamic badge indicating available interactions, keybinding hints, and requirement status
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { IInteractiveObject } from './InteractionTypes';

export interface ContextualPromptConfig {
  keyLabel?: string;
  onClick?: () => void;
}

export class ContextualPrompt {
  public readonly container: Container;
  private backgroundGfx: Graphics;
  private keyBadgeGfx: Graphics;
  private keyText: Text;
  private actionText: Text;
  private statusText: Text;

  private currentTarget: IInteractiveObject | null = null;
  private isAvailable: boolean = true;
  private targetAlpha: number = 0;
  private currentAlpha: number = 0;
  private fadeSpeed: number = 8.0; // Fades in/out in ~0.12s

  private promptWidth: number = 240;
  private promptHeight: number = 42;
  private onClickHandler?: () => void;

  constructor(config?: ContextualPromptConfig) {
    this.container = new Container();
    this.container.label = 'ContextualPrompt';
    this.container.visible = false;
    this.container.alpha = 0;
    this.onClickHandler = config?.onClick;

    // Enable pointer interaction for mouse clicking the prompt
    this.container.eventMode = 'static';
    this.container.cursor = 'pointer';
    this.container.on('pointerdown', (e) => {
      e.stopPropagation();
      if (this.isAvailable && this.currentTarget && this.onClickHandler) {
        this.onClickHandler();
      }
    });

    // 1. Background capsule / rounded rectangle
    this.backgroundGfx = new Graphics();
    this.container.addChild(this.backgroundGfx);

    // 2. Key badge background
    this.keyBadgeGfx = new Graphics();
    this.container.addChild(this.keyBadgeGfx);

    // 3. Key label text (e.g. "E")
    const keyStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 13,
      fontWeight: 'bold',
      fill: 0x000000,
      align: 'center',
    });
    this.keyText = new Text({
      text: config?.keyLabel ?? 'E',
      style: keyStyle,
    });
    this.keyText.anchor.set(0.5);
    this.container.addChild(this.keyText);

    // 4. Action text (e.g. "Enter Mission Operations")
    const actionStyle = new TextStyle({
      fontFamily: 'sans-serif',
      fontSize: 13,
      fontWeight: 'bold',
      fill: 0xffffff,
      letterSpacing: 0.5,
    });
    this.actionText = new Text({
      text: '',
      style: actionStyle,
    });
    this.actionText.anchor.set(0, 0.5);
    this.container.addChild(this.actionText);

    // 5. Status / Warning text (e.g. "Locked: Level 2 Required")
    const statusStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 10,
      fill: 0xff6666,
    });
    this.statusText = new Text({
      text: '',
      style: statusStyle,
    });
    this.statusText.anchor.set(0, 0.5);
    this.statusText.visible = false;
    this.container.addChild(this.statusText);

    this.redraw();
  }

  public setOnClick(handler: () => void): void {
    this.onClickHandler = handler;
  }

  public setTarget(target: IInteractiveObject | null, available: boolean = true, reason?: string): void {
    this.currentTarget = target;
    this.isAvailable = available;

    if (!target) {
      this.targetAlpha = 0;
      return;
    }

    this.targetAlpha = 1.0;
    this.container.visible = true;

    // Update text content
    this.actionText.text = target.actionText || `Interact with ${target.displayName}`;

    if (!available && reason) {
      this.statusText.text = reason.toUpperCase();
      this.statusText.visible = true;
    } else {
      this.statusText.visible = false;
    }

    this.redraw();
  }

  public updatePosition(worldX: number, worldY: number, offsetY: number = -65): void {
    this.container.position.set(worldX - this.promptWidth / 2, worldY + offsetY);
  }

  public update(deltaSeconds: number): void {
    if (this.currentAlpha !== this.targetAlpha) {
      const step = this.fadeSpeed * deltaSeconds;
      if (this.currentAlpha < this.targetAlpha) {
        this.currentAlpha = Math.min(this.targetAlpha, this.currentAlpha + step);
      } else {
        this.currentAlpha = Math.max(this.targetAlpha, this.currentAlpha - step);
      }
      this.container.alpha = this.currentAlpha;

      if (this.currentAlpha <= 0.001 && this.targetAlpha === 0) {
        this.container.visible = false;
      }
    }
  }

  private redraw(): void {
    let textWidth = 140;
    try {
      if (typeof document !== 'undefined') {
        textWidth = this.actionText.width || 140;
      } else {
        textWidth = (this.actionText.text ? this.actionText.text.length : 12) * 8.5;
      }
    } catch {
      textWidth = (this.actionText.text ? this.actionText.text.length : 12) * 8.5;
    }
    const paddingRight = 18;
    const badgeWidth = 26;
    const badgeHeight = 24;
    const badgeMargin = 8;

    this.promptWidth = Math.max(160, badgeMargin + badgeWidth + 10 + textWidth + paddingRight);
    this.promptHeight = this.statusText.visible ? 52 : 38;

    // Background styling: Sci-fi cyber frame
    this.backgroundGfx.clear();
    const bgColor = this.isAvailable ? 0x07111e : 0x1f0b0e;
    const borderColor = this.isAvailable ? 0x00f0ff : 0xff3b5c;

    // Shadow
    this.backgroundGfx
      .roundRect(2, 2, this.promptWidth, this.promptHeight, 6)
      .fill({ color: 0x000000, alpha: 0.5 });

    // Base body
    this.backgroundGfx
      .roundRect(0, 0, this.promptWidth, this.promptHeight, 6)
      .fill({ color: bgColor, alpha: 0.92 })
      .stroke({ color: borderColor, width: 1.5, alpha: 0.85 });

    // Key badge
    this.keyBadgeGfx.clear();
    const keyColor = this.isAvailable ? 0x00f0ff : 0x888888;
    this.keyBadgeGfx
      .roundRect(badgeMargin, 7, badgeWidth, badgeHeight, 4)
      .fill({ color: keyColor, alpha: 0.95 });

    this.keyText.position.set(badgeMargin + badgeWidth / 2, 7 + badgeHeight / 2);

    if (this.statusText.visible) {
      this.actionText.position.set(badgeMargin + badgeWidth + 10, 16);
      this.statusText.position.set(badgeMargin + badgeWidth + 10, 36);
    } else {
      this.actionText.position.set(badgeMargin + badgeWidth + 10, this.promptHeight / 2);
    }
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
