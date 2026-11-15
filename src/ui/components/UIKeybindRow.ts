/**
 * INTERSTELLAR CONTINUUM - Reusable Keybind Row Component
 * Displays action name, active keybindings badges, and handles interactive rebinding.
 */

import { Graphics, Text, TextStyle, Container } from 'pixi.js';
import { UIComponent } from '../core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS } from '../core/UIDesignTokens';
import { InputAction } from '../../input/InputAction';

export interface UIKeybindRowOptions {
  action: InputAction;
  actionLabel: string;
  width?: number;
  height?: number;
  keys: string[];
  onStartRebind?: (action: InputAction) => void;
}

export class UIKeybindRow extends UIComponent {
  private options: Required<UIKeybindRowOptions>;
  private keys: string[];
  private isListeningForBind: boolean = false;

  private labelText: Text;
  private badgesContainer: Container;
  private rebindBtnGfx: Graphics;
  private rebindBtnText: Text;

  constructor(options: UIKeybindRowOptions) {
    super(`KeybindRow_${options.action}`);

    this.options = {
      action: options.action,
      actionLabel: options.actionLabel,
      width: options.width ?? 520,
      height: options.height ?? 36,
      keys: options.keys,
      onStartRebind: options.onStartRebind ?? (() => {}),
    };

    this.keys = [...this.options.keys];

    // Action Label
    const labelStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 12,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_PRIMARY,
      letterSpacing: 0.5,
    });
    this.labelText = new Text({ text: this.options.actionLabel, style: labelStyle });
    this.labelText.position.set(0, 8);
    this.container.addChild(this.labelText);

    // Badges Container
    this.badgesContainer = new Container();
    this.badgesContainer.position.set(220, 4);
    this.container.addChild(this.badgesContainer);

    // Rebind button on right
    const rebindWidth = 80;
    const rebindX = this.options.width - rebindWidth;
    this.rebindBtnGfx = new Graphics();
    this.rebindBtnGfx.position.set(rebindX, 5);
    this.rebindBtnGfx.eventMode = 'static';
    this.rebindBtnGfx.cursor = 'pointer';
    this.rebindBtnGfx.on('pointerdown', (e) => {
      e.stopPropagation();
      this.options.onStartRebind(this.options.action);
    });
    this.container.addChild(this.rebindBtnGfx);

    const btnStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
    });
    this.rebindBtnText = new Text({ text: 'REBIND', style: btnStyle });
    this.rebindBtnText.position.set(rebindX + 16, 10);
    this.container.addChild(this.rebindBtnText);

    this.renderRow();
  }

  public getKeys(): string[] {
    return [...this.keys];
  }

  public setKeys(newKeys: string[]): void {
    this.keys = [...newKeys];
    this.isListeningForBind = false;
    this.renderRow();
  }

  public setListening(listening: boolean): void {
    this.isListeningForBind = listening;
    this.rebindBtnText.text = listening ? 'CANCEL' : 'REBIND';
    this.rebindBtnText.style.fill = listening ? UI_COLORS.RED : UI_COLORS.CYAN;
    this.renderRow();
  }

  public renderRow(): void {
    // 1. Render badges
    this.badgesContainer.removeChildren();
    let currentX = 0;

    if (this.isListeningForBind) {
      const promptStyle = new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fontWeight: 'bold',
        fill: UI_COLORS.AMBER,
      });
      const promptText = new Text({ text: 'PRESS ANY KEY...', style: promptStyle });
      promptText.position.set(0, 4);
      this.badgesContainer.addChild(promptText);
    } else {
      for (const key of this.keys) {
        const badge = new Container();
        badge.position.set(currentX, 0);

        const cleanKeyName = key.replace('Key', '').replace('Arrow', '▲ ');
        const badgeStyle = new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11,
          fontWeight: 'bold',
          fill: UI_COLORS.TEXT_PRIMARY,
        });
        const txt = new Text({ text: cleanKeyName, style: badgeStyle });
        txt.position.set(8, 4);

        const badgeWidth = Math.max(30, (txt.text?.length ?? 3) * 8 + 16);
        const bg = new Graphics();
        bg.roundRect(0, 0, badgeWidth, 22, UI_RADIUS.SM);
        bg.fill({ color: 0x07111e, alpha: 0.9 });
        bg.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });

        badge.addChild(bg);
        badge.addChild(txt);
        this.badgesContainer.addChild(badge);

        currentX += badgeWidth + 6;
      }
    }

    // 2. Rebind button styling
    this.rebindBtnGfx.clear();
    this.rebindBtnGfx.roundRect(0, 0, 80, 24, UI_RADIUS.SM);
    this.rebindBtnGfx.fill({
      color: this.isListeningForBind ? 0x2a1010 : UI_COLORS.BG_PANEL,
      alpha: 0.85,
    });
    this.rebindBtnGfx.stroke({
      color: this.isListeningForBind ? UI_COLORS.RED : UI_COLORS.BORDER_SUBTLE,
      width: 1,
    });
  }

  public override destroy(): void {
    this.rebindBtnGfx.removeAllListeners();
    super.destroy();
  }
}
