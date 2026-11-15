/**
 * INTERSTELLAR CONTINUUM - Reusable Scrollable List Component
 * Viewport masked container with custom tactical scrollbar and mousewheel support.
 */

import { Container, Graphics } from 'pixi.js';
import { UIComponent } from '../core/UIComponent';
import { UI_COLORS, UI_RADIUS, UI_SPACING } from '../core/UIDesignTokens';

export interface UIScrollListOptions {
  width: number;
  height: number;
  itemGap?: number;
  gap?: number;
  itemHeight?: number;
}

export class UIScrollList extends UIComponent {
  public readonly itemsContainer: Container;

  private listWidth: number;
  private listHeight: number;
  private itemGap: number;

  private maskGfx: Graphics;
  private scrollbarTrackGfx: Graphics;
  private scrollbarThumbGfx: Graphics;

  private scrollY: number = 0;
  private maxScrollY: number = 0;
  private isDragging: boolean = false;
  private dragStartY: number = 0;
  private dragStartScroll: number = 0;

  constructor(options: UIScrollListOptions) {
    super('ScrollList');

    this.listWidth = options.width;
    this.listHeight = options.height;
    this.itemGap = options.gap ?? options.itemGap ?? UI_SPACING.SM;

    this.itemsContainer = new Container();
    this.itemsContainer.label = 'ListItems';

    this.maskGfx = new Graphics();
    this.maskGfx.rect(0, 0, this.listWidth - 12, this.listHeight).fill({ color: 0xffffff });
    this.itemsContainer.mask = this.maskGfx;

    this.scrollbarTrackGfx = new Graphics();
    this.scrollbarThumbGfx = new Graphics();

    this.container.addChild(this.maskGfx);
    this.container.addChild(this.itemsContainer);
    this.container.addChild(this.scrollbarTrackGfx);
    this.container.addChild(this.scrollbarThumbGfx);

    this.setupInteractivity();
    this.updateScrollbar();
  }

  private setupInteractivity(): void {
    this.container.eventMode = 'static';

    // Mouse wheel scrolling
    this.container.on('wheel', (e: any) => {
      e.stopPropagation();
      const delta = e.deltaY ?? 0;
      this.scrollBy(delta * 0.5);
    });

    // Draggable scrollbar thumb
    this.scrollbarThumbGfx.eventMode = 'static';
    this.scrollbarThumbGfx.cursor = 'pointer';

    this.scrollbarThumbGfx.on('pointerdown', (e) => {
      this.isDragging = true;
      this.dragStartY = e.global.y;
      this.dragStartScroll = this.scrollY;
    });

    this.container.on('globalpointermove', (e) => {
      if (!this.isDragging) return;
      const deltaY = e.global.y - this.dragStartY;
      const scrollRatio = this.maxScrollY / Math.max(1, this.listHeight - 30);
      this.scrollTo(this.dragStartScroll + deltaY * scrollRatio);
    });

    this.container.on('pointerup', () => {
      this.isDragging = false;
    });
    this.container.on('pointerupoutside', () => {
      this.isDragging = false;
    });
  }

  public addItem(item: UIComponent | Container): void {
    const rawContainer = item instanceof UIComponent ? item.container : item;
    let currentY = 0;
    for (const child of this.itemsContainer.children) {
      let childH = 36;
      try {
        if (typeof document !== 'undefined') {
          childH = (child as any).height || 36;
        }
      } catch {
        childH = 36;
      }
      currentY += childH + this.itemGap;
    }

    rawContainer.position.set(0, currentY);
    this.itemsContainer.addChild(rawContainer);
    this.calculateMaxScroll();
    this.updateScrollbar();
  }

  public getItemCount(): number {
    return this.itemsContainer.children.length;
  }

  public getScrollOffset(): number {
    return this.scrollY;
  }

  public clearItems(): void {
    this.itemsContainer.removeChildren();
    this.scrollY = 0;
    this.itemsContainer.position.y = 0;
    this.maxScrollY = 0;
    this.updateScrollbar();
  }

  public scrollBy(delta: number): void {
    this.scrollTo(this.scrollY + delta);
  }

  public scrollTo(targetY: number): void {
    this.scrollY = Math.max(0, Math.min(this.maxScrollY, targetY));
    this.itemsContainer.position.y = -this.scrollY;
    this.updateScrollbar();
  }

  private getContentHeight(): number {
    let totalHeight = 0;
    try {
      if (typeof document !== 'undefined') {
        totalHeight = this.itemsContainer.height;
      }
    } catch {
      // Fallback in headless environment
    }
    if (!totalHeight) {
      totalHeight = this.itemsContainer.children.length * (36 + this.itemGap);
    }
    return totalHeight;
  }

  private calculateMaxScroll(): void {
    const totalHeight = this.getContentHeight();
    this.maxScrollY = Math.max(0, totalHeight - this.listHeight);
  }

  private updateScrollbar(): void {
    this.scrollbarTrackGfx.clear();
    this.scrollbarThumbGfx.clear();

    if (this.maxScrollY <= 0) {
      this.scrollbarTrackGfx.visible = false;
      this.scrollbarThumbGfx.visible = false;
      return;
    }

    this.scrollbarTrackGfx.visible = true;
    this.scrollbarThumbGfx.visible = true;

    const trackX = this.listWidth - 8;
    const trackW = 6;
    const trackH = this.listHeight;

    this.scrollbarTrackGfx.roundRect(trackX, 0, trackW, trackH, UI_RADIUS.XS);
    this.scrollbarTrackGfx.fill({ color: UI_COLORS.BG_PANEL_ELEVATED, alpha: 0.6 });

    const totalContentHeight = this.getContentHeight();
    const thumbRatio = Math.min(1.0, this.listHeight / (totalContentHeight || 1));
    const thumbH = Math.max(24, trackH * thumbRatio);
    const scrollPercent = this.maxScrollY > 0 ? this.scrollY / this.maxScrollY : 0;
    const thumbY = scrollPercent * (trackH - thumbH);

    this.scrollbarThumbGfx.roundRect(trackX, thumbY, trackW, thumbH, UI_RADIUS.XS);
    this.scrollbarThumbGfx.fill({ color: UI_COLORS.BORDER_DEFAULT, alpha: 0.8 });
  }
}
