/**
 * INTERSTELLAR CONTINUUM - Central Tooltip Manager
 * Registers interactive elements, coordinates hover timers, and manages the tooltip display.
 */

import { Container } from 'pixi.js';
import { UITooltip, UITooltipData } from './UITooltip';

export class TooltipManager {
  private static instance: TooltipManager;

  public readonly tooltip: UITooltip;
  private rootOverlayContainer?: Container;
  private hoverTimer?: number;
  private hoverDelayMs: number = 250;
  private currentTarget: any = null;

  constructor(overlayContainer?: Container) {
    this.tooltip = new UITooltip();
    if (overlayContainer) {
      this.attachToContainer(overlayContainer);
    }
    TooltipManager.instance = this;
  }

  public static getInstance(): TooltipManager {
    if (!TooltipManager.instance) {
      TooltipManager.instance = new TooltipManager();
    }
    return TooltipManager.instance;
  }

  public attachToContainer(container: Container): void {
    this.rootOverlayContainer = container;
    this.rootOverlayContainer.addChild(this.tooltip.container);
  }

  public register(target: Container, data: UITooltipData | (() => UITooltipData)): void {
    target.eventMode = 'static';

    target.on('pointerover', (e: any) => {
      this.currentTarget = target;
      if (this.hoverTimer) clearTimeout(this.hoverTimer);

      const resolvedData = typeof data === 'function' ? data() : data;
      const posX = e.global?.x ?? 0;
      const posY = e.global?.y ?? 0;

      this.hoverTimer = setTimeout(() => {
        if (this.currentTarget === target) {
          this.tooltip.setData(resolvedData);
          this.tooltip.setPosition(posX, posY);
          this.tooltip.show();
        }
      }, this.hoverDelayMs) as unknown as number;
    });

    target.on('pointermove', (e: any) => {
      if (this.currentTarget === target && this.tooltip.isVisible()) {
        const posX = e.global?.x ?? 0;
        const posY = e.global?.y ?? 0;
        this.tooltip.setPosition(posX, posY);
      }
    });

    target.on('pointerout', () => {
      if (this.currentTarget === target) {
        this.hide();
      }
    });
  }

  public show(data: UITooltipData, x: number, y: number): void {
    this.tooltip.setData(data);
    this.tooltip.setPosition(x, y);
    this.tooltip.show();
  }

  public hide(immediate: boolean = true): void {
    if (this.hoverTimer) clearTimeout(this.hoverTimer);
    this.currentTarget = null;
    this.tooltip.hide(immediate);
  }

  public update(deltaSeconds: number): void {
    this.tooltip.update(deltaSeconds);
  }

  public destroy(): void {
    if (this.hoverTimer) clearTimeout(this.hoverTimer);
    this.tooltip.destroy();
  }
}
