/**
 * INTERSTELLAR CONTINUUM - Payload Catalogue Panel
 * Category-tabbed, searchable browser listing payloads, category icons,
 * physical envelope badges, and stock availability.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_COLORS, UI_FONTS, UI_RADIUS, UI_SPACING } from '../../ui/core/UIDesignTokens';
import { UIButton } from '../../ui/components/UIButton';
import { PayloadDefinition, PayloadCategory } from '../PayloadTypes';
import { PayloadRegistry } from '../PayloadRegistry';
import { PayloadCategoryRegistry } from '../PayloadCategoryRegistry';
import { PayloadInventoryManager } from '../PayloadInventoryManager';

export interface PayloadCataloguePanelOptions {
  width?: number;
  height?: number;
  onSelectPayload?: (payload: PayloadDefinition) => void;
}

export class PayloadCataloguePanel {
  public readonly container: Container;
  private width: number;
  private height: number;

  private bgGfx: Graphics;
  private tabBarContainer: Container;
  private listContainer: Container;

  private registry: PayloadRegistry;
  private categoryRegistry: PayloadCategoryRegistry;
  private inventoryManager: PayloadInventoryManager;

  private selectedCategory: string = 'ALL';
  private selectedPayloadId: string | null = null;
  private onSelectPayloadCb?: (payload: PayloadDefinition) => void;

  constructor(
    options: PayloadCataloguePanelOptions = {},
    registry?: PayloadRegistry,
    categoryRegistry?: PayloadCategoryRegistry,
    inventoryManager?: PayloadInventoryManager
  ) {
    this.width = options.width ?? 520;
    this.height = options.height ?? 700;
    this.container = new Container();

    this.registry = registry ?? PayloadRegistry.getInstance();
    this.categoryRegistry = categoryRegistry ?? PayloadCategoryRegistry.getInstance();
    this.inventoryManager = inventoryManager ?? PayloadInventoryManager.getInstance(this.registry);
    this.onSelectPayloadCb = options.onSelectPayload;

    this.bgGfx = new Graphics();
    this.container.addChild(this.bgGfx);

    this.tabBarContainer = new Container();
    this.tabBarContainer.position.set(UI_SPACING.MD, UI_SPACING.MD);
    this.container.addChild(this.tabBarContainer);

    this.listContainer = new Container();
    this.listContainer.position.set(UI_SPACING.MD, 85);
    this.container.addChild(this.listContainer);

    this.renderFrame();
    this.buildCategoryTabs();
    this.renderPayloadList();
  }

  private renderFrame(): void {
    this.bgGfx.clear();
    this.bgGfx.roundRect(0, 0, this.width, this.height, UI_RADIUS.MD);
    this.bgGfx.fill({ color: UI_COLORS.BG_PANEL, alpha: 0.95 });
    this.bgGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
  }

  private buildCategoryTabs(): void {
    this.tabBarContainer.removeChildren();

    const tabs = [
      { id: 'ALL', label: 'ALL' },
      { id: PayloadCategory.COMMUNICATION_SATELLITES, label: 'COMMS' },
      { id: PayloadCategory.OBSERVATION_SATELLITES, label: 'OBS' },
      { id: PayloadCategory.SCIENTIFIC_INSTRUMENTS, label: 'SCI' },
      { id: PayloadCategory.ROBOTIC_ROVERS, label: 'ROVER' },
      { id: PayloadCategory.LANDING_EQUIPMENT, label: 'LAND' },
      { id: PayloadCategory.RESEARCH_STATION_MODULES, label: 'MOD' },
      { id: PayloadCategory.POWER_MODULES, label: 'PWR' },
      { id: PayloadCategory.GENERAL_CARGO, label: 'CARGO' },
    ];

    let x = 0;
    const tabWidth = 52;
    for (const t of tabs) {
      const btn = new UIButton({
        label: t.label,
        width: tabWidth,
        height: 26,
        variant: this.selectedCategory === t.id ? 'primary' : 'secondary',
        onClick: () => {
          this.selectedCategory = t.id;
          this.buildCategoryTabs();
          this.renderPayloadList();
        },
      });
      btn.container.position.set(x, 0);
      this.tabBarContainer.addChild(btn.container);
      x += tabWidth + 4;
    }
  }

  public renderPayloadList(): void {
    this.listContainer.removeChildren();

    const filter = this.selectedCategory === 'ALL' ? undefined : { category: this.selectedCategory };
    const payloads = this.registry.listPayloads(filter);

    let y = 0;
    const itemHeight = 62;
    const maxItems = 9; // Display up to 9 items in viewport

    for (let i = 0; i < Math.min(payloads.length, maxItems); i++) {
      const p = payloads[i];
      const isSelected = this.selectedPayloadId === p.id;
      const card = this.renderPayloadCard(p, y, isSelected);
      this.listContainer.addChild(card);
      y += itemHeight + 6;
    }

    if (payloads.length === 0) {
      const emptyText = new Text({
        text: 'No payloads found in this category.',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 12,
          fill: UI_COLORS.TEXT_MUTED,
        }),
      });
      emptyText.position.set(10, 20);
      this.listContainer.addChild(emptyText);
    }
  }

  private renderPayloadCard(
    payload: PayloadDefinition,
    y: number,
    isSelected: boolean
  ): Container {
    const card = new Container();
    card.position.set(0, y);
    card.eventMode = 'static';
    card.cursor = 'pointer';

    const cardWidth = this.width - UI_SPACING.MD * 2;
    const bg = new Graphics();
    bg.roundRect(0, 0, cardWidth, 62, UI_RADIUS.SM);
    bg.fill({
      color: isSelected ? UI_COLORS.BG_PANEL_ELEVATED : UI_COLORS.BG_SURFACE,
      alpha: 0.9,
    });
    bg.stroke({
      color: isSelected ? UI_COLORS.BORDER_FOCUS : UI_COLORS.BORDER_DIM,
      width: isSelected ? 1.5 : 1,
    });
    card.addChild(bg);

    const nameText = new Text({
      text: payload.name.toUpperCase(),
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 12,
        fontWeight: 'bold',
        fill: isSelected ? UI_COLORS.TEXT_ACCENT : UI_COLORS.TEXT_PRIMARY,
      }),
    });
    nameText.position.set(12, 8);

    const categoryText = new Text({
      text: payload.category.replace(/_/g, ' '),
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 9,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_HIGHLIGHT,
      }),
    });
    categoryText.position.set(12, 26);

    const inv = this.inventoryManager.getInventoryRecord(payload.id);
    const availableQty = inv?.available ?? payload.quantity;

    const specsText = new Text({
      text: `${payload.massRating} MU  |  ${payload.powerRequirementRating} PWR  |  ${payload.storageRequirement} Slots  |  Avail: ${availableQty}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 9,
        fill: UI_COLORS.TEXT_SECONDARY,
      }),
    });
    specsText.position.set(12, 42);

    card.addChild(nameText, categoryText, specsText);

    card.on('pointerdown', () => {
      this.selectedPayloadId = payload.id;
      this.renderPayloadList();
      if (this.onSelectPayloadCb) {
        this.onSelectPayloadCb(payload);
      }
    });

    return card;
  }

  public selectPayload(payloadId: string): void {
    this.selectedPayloadId = payloadId;
    this.renderPayloadList();
    const p = this.registry.getPayload(payloadId);
    if (p && this.onSelectPayloadCb) {
      this.onSelectPayloadCb(p);
    }
  }

  public getSelectedPayload(): PayloadDefinition | undefined {
    return this.selectedPayloadId ? this.registry.getPayload(this.selectedPayloadId) : undefined;
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
