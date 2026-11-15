/**
 * INTERSTELLAR CONTINUUM - Component Comparison Modal View
 * Side-by-side comparative inspection modal displaying attribute diffs,
 * compatibility tag contrasts, and educational engineering trade-off synthesis.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_COLORS, UI_FONTS } from '../../ui/core/UIDesignTokens';
import { UIButton } from '../../ui/components/UIButton';
import { ComponentComparisonResult } from '../RocketComponentTypes';

export interface ComponentComparisonModalOptions {
  comparison: ComponentComparisonResult;
  onClose: () => void;
}

export class ComponentComparisonModal {
  public readonly container: Container;
  private comparison: ComponentComparisonResult;
  private onCloseCb: () => void;

  constructor(options: ComponentComparisonModalOptions) {
    this.comparison = options.comparison;
    this.onCloseCb = options.onClose;
    this.container = new Container();

    this.render();
  }

  private render(): void {
    this.container.removeChildren();

    // Backdrop modal dimming
    const backdrop = new Graphics();
    backdrop.rect(0, 0, 1920, 1080);
    backdrop.fill({ color: 0x000000, alpha: 0.75 });
    backdrop.eventMode = 'static';
    this.container.addChild(backdrop);

    // Modal Card Window (Centered)
    const modalWidth = 1400;
    const modalHeight = 840;
    const mx = (1920 - modalWidth) / 2;
    const my = (1080 - modalHeight) / 2;

    const modalGfx = new Graphics();
    modalGfx.roundRect(mx, my, modalWidth, modalHeight, 8);
    modalGfx.fill({ color: 0x07111e, alpha: 0.98 });
    modalGfx.stroke({ color: UI_COLORS.CYAN, width: 1.5 });
    this.container.addChild(modalGfx);

    // Header Accent Bar
    modalGfx.roundRect(mx, my, modalWidth, 4, 2).fill({ color: UI_COLORS.CYAN, alpha: 0.9 });

    // Title
    const title = new Text({
      text: 'ROCKET COMPONENT SPECIFICATION COMPARISON',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 18,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
        letterSpacing: 1.5,
      }),
    });
    title.position.set(mx + 30, my + 20);
    this.container.addChild(title);

    const subtitle = new Text({
      text: `CATEGORY: ${this.comparison.componentA.category}  |  BALANCED GAME ATTRIBUTES`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
      }),
    });
    subtitle.position.set(mx + 30, my + 46);
    this.container.addChild(subtitle);

    // Close Button (Top-Right)
    const closeBtn = new UIButton({
      label: 'CLOSE [ESC]',
      variant: 'OUTLINE',
      width: 130,
      height: 32,
      onClick: () => this.onCloseCb(),
    });
    closeBtn.container.position.set(mx + modalWidth - 160, my + 20);
    this.container.addChild(closeBtn.container);

    // 2 Header Component Cards: Component A vs Component B
    const compA = this.comparison.componentA;
    const compB = this.comparison.componentB;

    // Component A Header Box
    const boxAY = my + 75;
    const boxAGfx = new Graphics();
    boxAGfx.roundRect(mx + 30, boxAY, 650, 100, 6);
    boxAGfx.fill({ color: 0x0b1a2e, alpha: 0.9 });
    boxAGfx.stroke({ color: UI_COLORS.CYAN, width: 1.0 });
    this.container.addChild(boxAGfx);

    const titleA = new Text({
      text: `[A] ${compA.name}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 15,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
      }),
    });
    titleA.position.set(mx + 45, boxAY + 15);
    this.container.addChild(titleA);

    const descA = new Text({
      text: `${compA.componentType} • Tier ${compA.tier} • ₵${compA.costCredits.toLocaleString()} • ${compA.massUnits} Mass Units`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11.5,
        fill: UI_COLORS.TEXT_SECONDARY,
      }),
    });
    descA.position.set(mx + 45, boxAY + 40);
    this.container.addChild(descA);

    // Component B Header Box
    const boxBGfx = new Graphics();
    boxBGfx.roundRect(mx + 720, boxAY, 650, 100, 6);
    boxBGfx.fill({ color: 0x0b1a2e, alpha: 0.9 });
    boxBGfx.stroke({ color: UI_COLORS.AMBER, width: 1.0 });
    this.container.addChild(boxBGfx);

    const titleB = new Text({
      text: `[B] ${compB.name}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 15,
        fontWeight: 'bold',
        fill: UI_COLORS.AMBER,
      }),
    });
    titleB.position.set(mx + 735, boxAY + 15);
    this.container.addChild(titleB);

    const descB = new Text({
      text: `${compB.componentType} • Tier ${compB.tier} • ₵${compB.costCredits.toLocaleString()} • ${compB.massUnits} Mass Units`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11.5,
        fill: UI_COLORS.TEXT_SECONDARY,
      }),
    });
    descB.position.set(mx + 735, boxAY + 40);
    this.container.addChild(descB);

    // Attribute Differences Table
    const tableY = my + 190;
    const tableHeaderGfx = new Graphics();
    tableHeaderGfx.roundRect(mx + 30, tableY, 1340, 32, 4);
    tableHeaderGfx.fill({ color: 0x12243d, alpha: 0.9 });
    this.container.addChild(tableHeaderGfx);

    const th1 = new Text({
      text: 'BALANCING ATTRIBUTE',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
      }),
    });
    th1.position.set(mx + 45, tableY + 8);
    this.container.addChild(th1);

    const th2 = new Text({
      text: 'COMPONENT A',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
      }),
    });
    th2.position.set(mx + 350, tableY + 8);
    this.container.addChild(th2);

    const th3 = new Text({
      text: 'COMPONENT B',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fontWeight: 'bold',
        fill: UI_COLORS.AMBER,
      }),
    });
    th3.position.set(mx + 550, tableY + 8);
    this.container.addChild(th3);

    const th4 = new Text({
      text: 'DIFFERENCE & ADVANTAGE',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
      }),
    });
    th4.position.set(mx + 760, tableY + 8);
    this.container.addChild(th4);

    this.comparison.attributeDiffs.slice(0, 6).forEach((diff, idx) => {
      const rowY = tableY + 38 + idx * 44;
      const rowGfx = new Graphics();
      rowGfx.roundRect(mx + 30, rowY, 1340, 40, 4);
      rowGfx.fill({ color: idx % 2 === 0 ? 0x0a1626 : 0x081220, alpha: 0.85 });
      this.container.addChild(rowGfx);

      const rLabel = new Text({
        text: diff.label,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11.5,
          fontWeight: 'bold',
          fill: UI_COLORS.TEXT_PRIMARY,
        }),
      });
      rLabel.position.set(mx + 45, rowY + 11);
      this.container.addChild(rLabel);

      const valA = new Text({
        text: String(diff.valueA),
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11.5,
          fill: diff.advantage === 'A' ? UI_COLORS.GREEN : UI_COLORS.TEXT_PRIMARY,
          fontWeight: diff.advantage === 'A' ? 'bold' : 'normal',
        }),
      });
      valA.position.set(mx + 350, rowY + 11);
      this.container.addChild(valA);

      const valB = new Text({
        text: String(diff.valueB),
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11.5,
          fill: diff.advantage === 'B' ? UI_COLORS.GREEN : UI_COLORS.TEXT_PRIMARY,
          fontWeight: diff.advantage === 'B' ? 'bold' : 'normal',
        }),
      });
      valB.position.set(mx + 550, rowY + 11);
      this.container.addChild(valB);

      let advColor: number = UI_COLORS.TEXT_SECONDARY;
      let advText = diff.diff;
      if (diff.advantage === 'A') {
        advColor = UI_COLORS.CYAN;
        advText = `${diff.diff} (Advantage: Component A)`;
      } else if (diff.advantage === 'B') {
        advColor = UI_COLORS.AMBER;
        advText = `${diff.diff} (Advantage: Component B)`;
      }

      const diffText = new Text({
        text: `${advText} — ${diff.explanation}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10.5,
          fill: advColor,
        }),
      });
      diffText.position.set(mx + 760, rowY + 12);
      this.container.addChild(diffText);
    });

    // Compatibility Tags Comparison Section
    const tagsY = my + 510;
    const tagsBox = new Graphics();
    tagsBox.roundRect(mx + 30, tagsY, 1340, 80, 6);
    tagsBox.fill({ color: 0x091424, alpha: 0.9 });
    tagsBox.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.container.addChild(tagsBox);

    const tagsTitle = new Text({
      text: 'COMPATIBILITY TAG COMPARISON',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
      }),
    });
    tagsTitle.position.set(mx + 45, tagsY + 10);
    this.container.addChild(tagsTitle);

    const sharedTagsStr =
      this.comparison.sharedCompatibilityTags.length > 0
        ? this.comparison.sharedCompatibilityTags.join(', ')
        : 'None';
    const sharedText = new Text({
      text: `Shared Tags: ${sharedTagsStr}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10.5,
        fill: UI_COLORS.TEXT_PRIMARY,
      }),
    });
    sharedText.position.set(mx + 45, tagsY + 30);
    this.container.addChild(sharedText);

    const uniqueStrA =
      this.comparison.uniqueTagsA.length > 0 ? this.comparison.uniqueTagsA.join(', ') : 'None';
    const uniqueStrB =
      this.comparison.uniqueTagsB.length > 0 ? this.comparison.uniqueTagsB.join(', ') : 'None';
    const uniqueText = new Text({
      text: `Exclusive to [A]: ${uniqueStrA}  |  Exclusive to [B]: ${uniqueStrB}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10.5,
        fill: UI_COLORS.TEXT_SECONDARY,
      }),
    });
    uniqueText.position.set(mx + 45, tagsY + 52);
    this.container.addChild(uniqueText);

    // Educational Trade-Off Synthesis Box
    const synthY = my + 605;
    const synthBox = new Graphics();
    synthBox.roundRect(mx + 30, synthY, 1340, 210, 6);
    synthBox.fill({ color: 0x050e18, alpha: 0.95 });
    synthBox.stroke({ color: UI_COLORS.CYAN, width: 1.0 });
    this.container.addChild(synthBox);

    const synthTitle = new Text({
      text: 'CONCEPTUAL ENGINEERING TRADE-OFF ANALYSIS',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 12,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 1.0,
      }),
    });
    synthTitle.position.set(mx + 45, synthY + 14);
    this.container.addChild(synthTitle);

    const synthText = new Text({
      text: this.comparison.educationalSynthesis,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11.5,
        fill: UI_COLORS.TEXT_PRIMARY,
        wordWrap: true,
        wordWrapWidth: 1300,
        lineHeight: 18,
      }),
    });
    synthText.position.set(mx + 45, synthY + 40);
    this.container.addChild(synthText);
  }
}
