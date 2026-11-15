/**
 * INTERSTELLAR CONTINUUM - Payload Detail View
 * Comprehensive dossier inspecting a single payload: educational purpose,
 * physical envelope ratings, compatibility tags, destination restrictions,
 * and live warehouse inventory counts.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_COLORS, UI_FONTS, UI_RADIUS, UI_SPACING } from '../../ui/core/UIDesignTokens';
import { PayloadDefinition } from '../PayloadTypes';
import { PayloadInventoryManager } from '../PayloadInventoryManager';

export interface PayloadDetailViewOptions {
  width?: number;
  height?: number;
}

export class PayloadDetailView {
  public readonly container: Container;
  private width: number;
  private height: number;

  private bgGfx: Graphics;
  private contentContainer: Container;
  private inventoryManager: PayloadInventoryManager;

  constructor(
    options: PayloadDetailViewOptions = {},
    inventoryManager?: PayloadInventoryManager
  ) {
    this.width = options.width ?? 580;
    this.height = options.height ?? 700;
    this.container = new Container();
    this.inventoryManager = inventoryManager ?? PayloadInventoryManager.getInstance();

    this.bgGfx = new Graphics();
    this.container.addChild(this.bgGfx);

    this.contentContainer = new Container();
    this.contentContainer.position.set(UI_SPACING.MD, UI_SPACING.MD);
    this.container.addChild(this.contentContainer);

    this.renderFrame();
  }

  private renderFrame(): void {
    this.bgGfx.clear();
    this.bgGfx.roundRect(0, 0, this.width, this.height, UI_RADIUS.MD);
    this.bgGfx.fill({ color: UI_COLORS.BG_PANEL, alpha: 0.95 });
    this.bgGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
  }

  public setPayload(payload?: PayloadDefinition): void {
    this.contentContainer.removeChildren();

    if (!payload) {
      const emptyText = new Text({
        text: 'Select a payload from the catalogue to inspect specifications.',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 13,
          fill: UI_COLORS.TEXT_MUTED,
        }),
      });
      emptyText.position.set(20, 40);
      this.contentContainer.addChild(emptyText);
      return;
    }

    let currentY = 0;

    // 1. Header: Name & Category
    const titleText = new Text({
      text: payload.name.toUpperCase(),
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 16,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_ACCENT,
        letterSpacing: 1.2,
      }),
    });
    titleText.position.set(0, currentY);
    this.contentContainer.addChild(titleText);
    currentY += 26;

    const categoryText = new Text({
      text: `CATEGORY: ${payload.category} | ASSET: ${payload.visualAsset}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_HIGHLIGHT,
      }),
    });
    categoryText.position.set(0, currentY);
    this.contentContainer.addChild(categoryText);
    currentY += 24;

    // Divider
    const div1 = new Graphics();
    div1.rect(0, currentY, this.width - UI_SPACING.MD * 2, 1);
    div1.fill({ color: UI_COLORS.BORDER_SUBTLE, alpha: 0.8 });
    this.contentContainer.addChild(div1);
    currentY += 14;

    // 2. Ratings Box
    const ratingsBox = new Graphics();
    ratingsBox.roundRect(0, currentY, this.width - UI_SPACING.MD * 2, 70, UI_RADIUS.SM);
    ratingsBox.fill({ color: UI_COLORS.BG_SURFACE, alpha: 0.8 });
    ratingsBox.stroke({ color: UI_COLORS.BORDER_DIM, width: 1 });
    this.contentContainer.addChild(ratingsBox);

    const rStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 12,
      fill: UI_COLORS.TEXT_PRIMARY,
      fontWeight: 'bold',
    });
    const lStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10,
      fill: UI_COLORS.TEXT_MUTED,
    });

    // Mass
    const mLabel = new Text({ text: 'MASS RATING', style: lStyle });
    mLabel.position.set(15, currentY + 12);
    const mVal = new Text({ text: `${payload.massRating} MU`, style: rStyle });
    mVal.position.set(15, currentY + 34);

    // Power
    const pLabel = new Text({ text: 'POWER DRAW', style: lStyle });
    pLabel.position.set(190, currentY + 12);
    const pVal = new Text({ text: `${payload.powerRequirementRating} PWR`, style: rStyle });
    pVal.position.set(190, currentY + 34);

    // Storage
    const sLabel = new Text({ text: 'STORAGE VOLUME', style: lStyle });
    sLabel.position.set(370, currentY + 12);
    const sVal = new Text({ text: `${payload.storageRequirement} Slots`, style: rStyle });
    sVal.position.set(370, currentY + 34);

    this.contentContainer.addChild(mLabel, mVal, pLabel, pVal, sLabel, sVal);
    currentY += 84;

    // 3. Technical & Educational Description
    const descHeader = new Text({
      text: 'SYSTEM DESCRIPTION',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
      }),
    });
    descHeader.position.set(0, currentY);
    this.contentContainer.addChild(descHeader);
    currentY += 20;

    const descBody = new Text({
      text: payload.description,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fill: UI_COLORS.TEXT_SECONDARY,
        wordWrap: true,
        wordWrapWidth: this.width - UI_SPACING.MD * 2,
        lineHeight: 16,
      }),
    });
    descBody.position.set(0, currentY);
    this.contentContainer.addChild(descBody);
    currentY += 46;

    // 4. Gameplay & Research Purpose
    const purposeHeader = new Text({
      text: 'RESEARCH & MISSION PURPOSE',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
      }),
    });
    purposeHeader.position.set(0, currentY);
    this.contentContainer.addChild(purposeHeader);
    currentY += 20;

    const purposeBody = new Text({
      text: payload.purpose,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fill: UI_COLORS.TEXT_SECONDARY,
        wordWrap: true,
        wordWrapWidth: this.width - UI_SPACING.MD * 2,
        lineHeight: 16,
      }),
    });
    purposeBody.position.set(0, currentY);
    this.contentContainer.addChild(purposeBody);
    currentY += 50;

    // 5. Compatibility & Destination Constraints
    const tagsHeader = new Text({
      text: `COMPATIBILITY TAGS: ${payload.compatibilityTags.join(', ')}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fill: UI_COLORS.TEXT_HIGHLIGHT,
        wordWrap: true,
        wordWrapWidth: this.width - UI_SPACING.MD * 2,
      }),
    });
    tagsHeader.position.set(0, currentY);
    this.contentContainer.addChild(tagsHeader);
    currentY += 26;

    if (payload.destinationRestrictions && payload.destinationRestrictions.length > 0) {
      const destText = new Text({
        text: `RESTRICTED DESTINATIONS: ${payload.destinationRestrictions.join(', ')}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fill: UI_COLORS.TEXT_WARNING,
        }),
      });
      destText.position.set(0, currentY);
      this.contentContainer.addChild(destText);
      currentY += 24;
    }

    // 6. Live Warehouse Inventory Quantity Display
    const invRecord = this.inventoryManager.getInventoryRecord(payload.id);
    const available = invRecord?.available ?? payload.quantity;
    const reserved = invRecord?.reserved ?? 0;
    const assigned = invRecord?.assigned ?? 0;
    const inTransit = invRecord?.inTransit ?? 0;
    const delivered = invRecord?.delivered ?? 0;
    const totalOwned = invRecord?.totalOwned ?? payload.quantity;

    const invBox = new Graphics();
    invBox.roundRect(0, currentY, this.width - UI_SPACING.MD * 2, 70, UI_RADIUS.SM);
    invBox.fill({ color: UI_COLORS.BG_SURFACE, alpha: 0.9 });
    invBox.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    this.contentContainer.addChild(invBox);

    const invTitle = new Text({
      text: 'WAREHOUSE INVENTORY STATUS',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
      }),
    });
    invTitle.position.set(12, currentY + 10);
    this.contentContainer.addChild(invTitle);

    const invBreakdown = new Text({
      text: `Available: ${available}  |  Reserved: ${reserved}  |  Assigned: ${assigned}  |  In Transit: ${inTransit}  |  Delivered: ${delivered}  |  Total: ${totalOwned}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fill: UI_COLORS.TEXT_HIGHLIGHT,
      }),
    });
    invBreakdown.position.set(12, currentY + 36);
    this.contentContainer.addChild(invBreakdown);
    currentY += 82;

    // 7. Unit Procurement Cost
    const costText = new Text({
      text: `ACQUISITION COST: ${payload.acquisitionCost.toLocaleString()} CREDITS`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 12,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_ACCENT,
      }),
    });
    costText.position.set(0, currentY);
    this.contentContainer.addChild(costText);
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
