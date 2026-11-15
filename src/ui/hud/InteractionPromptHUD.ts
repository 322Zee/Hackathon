/**
 * INTERSTELLAR CONTINUUM - Global Interaction Prompt HUD
 * Displays contextual interaction prompts at screen bottom center,
 * synchronized directly with the environmental InteractionSystem.
 */

import { Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS } from '../core/UIDesignTokens';
import { IInteractiveObject } from '../../interaction/InteractionTypes';

export class InteractionPromptHUD extends UIComponent {
  private bgGfx: Graphics;
  private keyBadgeGfx: Graphics;
  private keyText: Text;
  private actionText: Text;
  private targetNameText: Text;

  private currentTarget: IInteractiveObject | null = null;

  constructor() {
    super('InteractionPromptHUD');

    // Position at screen bottom center
    this.container.position.set(960, 990);

    this.bgGfx = new Graphics();
    this.keyBadgeGfx = new Graphics();

    this.container.addChild(this.bgGfx);
    this.container.addChild(this.keyBadgeGfx);

    const keyStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 12,
      fontWeight: 'bold',
      fill: 0x000000,
    });
    this.keyText = new Text({ text: 'E', style: keyStyle });
    this.keyText.anchor.set(0.5, 0.5);
    this.container.addChild(this.keyText);

    const actionStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 11,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_ACCENT,
      letterSpacing: 1.0,
    });
    this.actionText = new Text({ text: '', style: actionStyle });
    this.actionText.position.set(24, -14);
    this.container.addChild(this.actionText);

    const targetStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 12,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_PRIMARY,
      letterSpacing: 0.8,
    });
    this.targetNameText = new Text({ text: '', style: targetStyle });
    this.targetNameText.position.set(24, 0);
    this.container.addChild(this.targetNameText);

    this.hide(true);
  }

  public setTarget(target: IInteractiveObject | null, keyHint: string = 'E'): void {
    if (this.currentTarget === target) return;

    this.currentTarget = target;

    if (!target) {
      this.hide();
      return;
    }

    this.keyText.text = keyHint.toUpperCase();
    this.actionText.text = target.actionText ? target.actionText.toUpperCase() : 'INTERACT';
    this.targetNameText.text = target.displayName.toUpperCase();

    let textWidth = 140;
    try {
      if (typeof document !== 'undefined') {
        textWidth = Math.max(this.actionText.width, this.targetNameText.width);
      } else {
        const len = Math.max(this.actionText.text.length, this.targetNameText.text.length);
        textWidth = len * 8;
      }
    } catch {
      const len = Math.max(this.actionText.text.length, this.targetNameText.text.length);
      textWidth = len * 8;
    }
    const totalWidth = textWidth + 70;
    const totalHeight = 44;

    this.bgGfx.clear();
    // Glass banner
    this.bgGfx.roundRect(-totalWidth / 2, -totalHeight / 2, totalWidth, totalHeight, UI_RADIUS.SM);
    this.bgGfx.fill({ color: UI_COLORS.BG_PANEL_ELEVATED, alpha: 0.94 });
    this.bgGfx.stroke({ color: UI_COLORS.CYAN, width: 1.2, alpha: 0.85 });

    // Key badge
    this.keyBadgeGfx.clear();
    const bx = -totalWidth / 2 + 18;
    this.keyBadgeGfx.roundRect(bx - 12, -12, 24, 24, 4);
    this.keyBadgeGfx.fill({ color: UI_COLORS.CYAN });

    this.keyText.position.set(bx, 0);
    this.actionText.position.set(bx + 18, -14);
    this.targetNameText.position.set(bx + 18, 0);

    this.show();
  }

  public getTarget(): IInteractiveObject | null {
    return this.currentTarget;
  }

  public getActionText(): string {
    return this.actionText.text;
  }

  public getTargetNameText(): string {
    return this.targetNameText.text;
  }
}
