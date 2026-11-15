/**
 * INTERSTELLAR CONTINUUM - Destination Search & Tactical Filter Bar
 * Aerospace filter bar offering category chips, exploration state toggles,
 * quick search query input, and real-time matching statistics.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../../ui/core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS } from '../../ui/core/UIDesignTokens';
import { DestinationCategory } from '../DestinationTypes';
import {
  DestinationFilterOptions,
  DestinationStatusFilter,
} from '../navigation/NavigationTypes';
import { DestinationSearchFilterEngine } from '../navigation/DestinationSearchFilterEngine';
import { SolarSystemNavigationManager } from '../navigation/SolarSystemNavigationManager';

export interface DestinationSearchFilterBarOptions {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  onFilterChange?: (filters: DestinationFilterOptions) => void;
}

interface FilterChipDefinition<T> {
  id: T;
  label: string;
}

export class DestinationSearchFilterBar extends UIComponent {
  private navManager: SolarSystemNavigationManager;
  private filterEngine: DestinationSearchFilterEngine;

  private barWidth: number;
  private barHeight: number;

  private backgroundGfx: Graphics;
  private chipsContainer: Container;
  private statsText: Text;

  private activeCategory: DestinationCategory | 'ALL' = 'ALL';
  private activeStatus: DestinationStatusFilter = 'ALL';
  private currentQuery: string = '';

  private onFilterChangeCb?: (filters: DestinationFilterOptions) => void;

  private readonly categoryChips: FilterChipDefinition<DestinationCategory | 'ALL'>[] = [
    { id: 'ALL', label: 'ALL CATEGORIES' },
    { id: DestinationCategory.PLANET, label: 'PLANETS' },
    { id: DestinationCategory.NATURAL_SATELLITE, label: 'MOONS' },
    { id: DestinationCategory.DWARF_PLANET, label: 'DWARF PLANETS' },
    { id: DestinationCategory.ASTEROID, label: 'ASTEROIDS' },
  ];

  private readonly statusChips: FilterChipDefinition<DestinationStatusFilter>[] = [
    { id: 'ALL', label: 'ALL STATES' },
    { id: 'UNLOCKED', label: 'UNLOCKED' },
    { id: 'LOCKED', label: 'LOCKED' },
    { id: 'VISITED', label: 'VISITED' },
    { id: 'UNEXPLORED', label: 'UNEXPLORED' },
    { id: 'ACTIVE_MISSION', label: 'ACTIVE MISSIONS' },
  ];

  constructor(options: DestinationSearchFilterBarOptions = {}) {
    super('DestinationSearchFilterBar');

    this.barWidth = options.width ?? 1340;
    this.barHeight = options.height ?? 46;
    this.container.position.set(options.x ?? 30, options.y ?? 40);

    this.navManager = SolarSystemNavigationManager.getInstance();
    this.filterEngine = DestinationSearchFilterEngine.getInstance();
    this.onFilterChangeCb = options.onFilterChange;

    this.backgroundGfx = new Graphics();
    this.container.addChild(this.backgroundGfx);

    this.chipsContainer = new Container();
    this.container.addChild(this.chipsContainer);

    // Stats indicator on the right
    const statsStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
      letterSpacing: 1.0,
    });
    this.statsText = new Text({ text: 'MATCHING: 28 / 28', style: statsStyle });
    this.statsText.position.set(this.barWidth - 180, 15);
    this.container.addChild(this.statsText);

    this.renderFrame();
    this.renderChips();
    this.updateStats();
  }

  public setCategory(cat: DestinationCategory | 'ALL'): void {
    this.activeCategory = cat;
    this.renderChips();
    this.dispatchFilterChange();
  }

  public setStatus(status: DestinationStatusFilter): void {
    this.activeStatus = status;
    this.renderChips();
    this.dispatchFilterChange();
  }

  public setQuery(query: string): void {
    this.currentQuery = query;
    this.dispatchFilterChange();
  }

  public getFilters(): DestinationFilterOptions {
    return {
      query: this.currentQuery.trim() || undefined,
      category: this.activeCategory,
      status: this.activeStatus,
    };
  }

  private dispatchFilterChange(): void {
    const filters = this.getFilters();
    this.updateStats();

    if (this.onFilterChangeCb) {
      this.onFilterChangeCb(filters);
    }

    const matches = this.filterEngine.filter(filters);
    this.navManager.emit('navigation:filter_changed', {
      filters,
      matchCount: matches.length,
      timestamp: Date.now(),
    });
  }

  private updateStats(): void {
    const stats = this.filterEngine.getStats(this.getFilters());
    this.statsText.text = `MATCHING: ${stats.matching} / ${stats.total}`;
    this.statsText.style.fill = stats.matching > 0 ? UI_COLORS.CYAN : UI_COLORS.AMBER;
  }

  private renderChips(): void {
    this.chipsContainer.removeChildren();

    let currentX = 14;
    const paddingY = 9;
    const chipHeight = 26;

    // Render Category Chips
    for (const chip of this.categoryChips) {
      const isActive = this.activeCategory === chip.id;
      const res = this.createChipNode(chip.label, isActive, chipHeight, () => {
        this.setCategory(chip.id);
      });
      res.node.position.set(currentX, paddingY);
      this.chipsContainer.addChild(res.node);
      currentX += res.width + 8;
    }

    // Divider bar
    const divider = new Graphics();
    divider.moveTo(currentX + 4, paddingY + 2).lineTo(currentX + 4, paddingY + chipHeight - 2);
    divider.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.5, alpha: 0.6 });
    this.chipsContainer.addChild(divider);
    currentX += 16;

    // Render Status Chips
    for (const chip of this.statusChips) {
      const isActive = this.activeStatus === chip.id;
      const res = this.createChipNode(chip.label, isActive, chipHeight, () => {
        this.setStatus(chip.id);
      });
      res.node.position.set(currentX, paddingY);
      this.chipsContainer.addChild(res.node);
      currentX += res.width + 8;
    }
  }

  private createChipNode(
    label: string,
    isActive: boolean,
    chipHeight: number,
    onTap: () => void
  ): { node: Container; width: number } {
    const node = new Container();
    node.eventMode = 'static';
    node.cursor = 'pointer';

    const textStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 9.5,
      fontWeight: isActive ? 'bold' : 'normal',
      fill: isActive ? 0xffffff : UI_COLORS.TEXT_SECONDARY,
      letterSpacing: 0.8,
    });
    const text = new Text({ text: label, style: textStyle });
    text.position.set(10, 6);

    const textWidth =
      typeof document !== 'undefined' ? text.width || label.length * 7.5 : label.length * 7.5;
    const chipWidth = textWidth + 20;

    const bg = new Graphics();
    bg.roundRect(0, 0, chipWidth, chipHeight, UI_RADIUS.SM);
    bg.fill({
      color: isActive ? 0x0369a1 : 0x051326,
      alpha: isActive ? 0.95 : 0.6,
    });
    bg.stroke({
      color: isActive ? UI_COLORS.CYAN : UI_COLORS.BORDER_SUBTLE,
      width: 1.0,
      alpha: isActive ? 0.9 : 0.4,
    });

    node.addChild(bg);
    node.addChild(text);

    node.on('pointerover', () => {
      if (!isActive) {
        bg.fill({ color: 0x0a2f58, alpha: 0.8 });
        text.style.fill = UI_COLORS.TEXT_PRIMARY;
      }
    });

    node.on('pointerout', () => {
      if (!isActive) {
        bg.fill({ color: 0x051326, alpha: 0.6 });
        text.style.fill = UI_COLORS.TEXT_SECONDARY;
      }
    });

    node.on('pointertap', onTap);

    return { node, width: chipWidth };
  }

  private renderFrame(): void {
    this.backgroundGfx.clear();
    this.backgroundGfx.roundRect(0, 0, this.barWidth, this.barHeight, UI_RADIUS.MD);
    this.backgroundGfx.fill({ color: 0x020713, alpha: 0.92 });
    this.backgroundGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.2 });
  }

  public override destroy(): void {
    super.destroy();
  }
}
