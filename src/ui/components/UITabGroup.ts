/**
 * INTERSTELLAR CONTINUUM - Reusable Tab Group Component
 * Manages tab selection, active highlights, and view routing.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_SPACING } from '../core/UIDesignTokens';

export interface UITabItem {
  id: string;
  label: string;
  badge?: number | string;
}

export interface UITabGroupOptions {
  tabs: UITabItem[];
  width?: number;
  height?: number;
  initialTabId?: string;
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
}

export class UITabGroup extends UIComponent {
  private tabs: UITabItem[];
  private activeTabId: string;
  private tabWidth: number;
  private tabHeight: number;
  private onTabChangeCallback?: (tabId: string) => void;

  private tabButtons: Map<string, { container: Container; bg: Graphics; text: Text; badge?: Text }> = new Map();
  private indicatorGfx: Graphics;

  constructor(options: UITabGroupOptions) {
    super('TabGroup');

    this.tabs = options.tabs;
    this.activeTabId = options.activeTabId ?? options.initialTabId ?? (options.tabs[0]?.id ?? '');
    this.tabHeight = options.height ?? 34;
    this.tabWidth = options.width ? options.width / Math.max(1, options.tabs.length) : 130;
    this.onTabChangeCallback = options.onTabChange;

    this.indicatorGfx = new Graphics();
    this.container.addChild(this.indicatorGfx);

    this.buildTabs();
    this.updateTabStyles();
  }

  private buildTabs(): void {
    const tabStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 12,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_SECONDARY,
      letterSpacing: 1.0,
    });

    const badgeStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 9,
      fontWeight: 'bold',
      fill: 0x000000,
    });

    this.tabs.forEach((tab, index) => {
      const btn = new Container();
      btn.position.set(index * this.tabWidth, 0);
      btn.eventMode = 'static';
      btn.cursor = 'pointer';

      const bg = new Graphics();
      const txt = new Text({
        text: tab.label.toUpperCase(),
        style: tabStyle,
      });
      txt.anchor.set(0.5, 0.5);
      txt.position.set(this.tabWidth / 2, this.tabHeight / 2);

      btn.addChild(bg, txt);

      let badgeText: Text | undefined;
      if (tab.badge !== undefined) {
        const badgeBg = new Graphics();
        badgeBg.circle(this.tabWidth - 14, 10, 8).fill({ color: UI_COLORS.CYAN });

        badgeText = new Text({
          text: String(tab.badge),
          style: badgeStyle,
        });
        badgeText.anchor.set(0.5, 0.5);
        badgeText.position.set(this.tabWidth - 14, 10);

        btn.addChild(badgeBg, badgeText);
      }

      btn.on('pointertap', () => {
        this.selectTab(tab.id);
      });

      this.container.addChild(btn);
      this.tabButtons.set(tab.id, { container: btn, bg, text: txt, badge: badgeText });
    });
  }

  public selectTab(tabId: string): void {
    if (this.activeTabId === tabId) return;

    this.activeTabId = tabId;
    this.updateTabStyles();

    if (this.onTabChangeCallback) {
      this.onTabChangeCallback(tabId);
    }
  }

  public getActiveTabId(): string {
    return this.activeTabId;
  }

  public setBadge(tabId: string, badge?: string | number): void {
    const tab = this.tabs.find((t) => t.id === tabId);
    if (!tab) return;
    tab.badge = badge;
    const btn = this.tabButtons.get(tabId);
    if (btn && btn.badge) {
      btn.badge.text = badge !== undefined ? String(badge) : '';
    }
  }

  private updateTabStyles(): void {
    this.indicatorGfx.clear();

    const activeIndex = this.tabs.findIndex((t) => t.id === this.activeTabId);
    if (activeIndex >= 0) {
      // Draw bottom active indicator bar
      const x = activeIndex * this.tabWidth;
      this.indicatorGfx
        .rect(x + UI_SPACING.XS, this.tabHeight - 2, this.tabWidth - UI_SPACING.SM, 2)
        .fill({ color: UI_COLORS.CYAN });
    }

    this.tabs.forEach((tab) => {
      const btn = this.tabButtons.get(tab.id);
      if (!btn) return;

      const isActive = tab.id === this.activeTabId;

      btn.bg.clear();
      btn.bg.rect(0, 0, this.tabWidth, this.tabHeight);
      btn.bg.fill({
        color: isActive ? UI_COLORS.BG_PANEL_ELEVATED : UI_COLORS.BG_PANEL,
        alpha: isActive ? 0.9 : 0.6,
      });

      btn.text.style.fill = isActive ? UI_COLORS.CYAN : UI_COLORS.TEXT_MUTED;
    });
  }
}
