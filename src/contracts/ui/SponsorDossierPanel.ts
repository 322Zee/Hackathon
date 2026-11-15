/**
 * INTERSTELLAR CONTINUUM - Sponsor Dossier Panel Component
 * Displays institutional profile, relationship reputation meter, and active agreements.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_COLORS, UI_FONTS, UI_RADIUS } from '../../ui/core/UIDesignTokens';
import { UIProgressBar } from '../../ui/components/UIProgressBar';
import { SponsorRecord, SPONSOR_CATEGORY_LABELS } from '../ContractTypes';

export interface SponsorDossierPanelOptions {
  sponsor: SponsorRecord;
  width?: number;
  height?: number;
}

export class SponsorDossierPanel {
  public readonly container: Container;
  private options: SponsorDossierPanelOptions;
  private bgGfx: Graphics;

  constructor(options: SponsorDossierPanelOptions) {
    this.options = options;
    this.container = new Container();
    this.container.label = `SponsorDossier_${options.sponsor.id}`;

    this.bgGfx = new Graphics();
    this.container.addChild(this.bgGfx);

    this.render();
  }

  private render(): void {
    const { sponsor } = this.options;
    const width = this.options.width ?? 680;
    const height = this.options.height ?? 240;

    this.bgGfx.clear();
    this.bgGfx.roundRect(0, 0, width, height, UI_RADIUS.MD);
    this.bgGfx.fill({ color: UI_COLORS.BG_SURFACE, alpha: 0.85 });
    this.bgGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });

    // Category Badge
    const catLabel = SPONSOR_CATEGORY_LABELS[sponsor.category] || sponsor.category;
    const catText = new Text({
      text: catLabel.toUpperCase(),
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_HIGHLIGHT,
        letterSpacing: 1.0,
      }),
    });
    catText.position.set(20, 14);
    this.container.addChild(catText);

    // Sponsor Name
    const nameText = new Text({
      text: sponsor.name,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 15,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
      }),
    });
    nameText.position.set(20, 36);
    this.container.addChild(nameText);

    // Reputation Meter
    const repX = width - 180;
    const repLabel = new Text({
      text: `REPUTATION: ${sponsor.reputation > 0 ? '+' : ''}${sponsor.reputation}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: sponsor.reputation >= 0 ? UI_COLORS.GREEN : UI_COLORS.RED,
      }),
    });
    repLabel.position.set(repX, 16);
    this.container.addChild(repLabel);

    const normRep = Math.max(0, Math.min(1, (sponsor.reputation + 100) / 200));
    const repBar = new UIProgressBar({
      width: 160,
      height: 8,
      fillColor: sponsor.reputation >= 0 ? UI_COLORS.GREEN : UI_COLORS.RED,
      showPercent: false,
      initialValue: normRep,
    });
    repBar.container.position.set(repX, 34);
    this.container.addChild(repBar.container);

    // Description
    const descText = new Text({
      text: sponsor.description,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fill: UI_COLORS.TEXT_SECONDARY,
        lineHeight: 16,
        wordWrap: true,
        wordWrapWidth: width - 40,
      }),
    });
    descText.position.set(20, 68);
    this.container.addChild(descText);

    // Available Budget & Funding Tier
    const statsText = new Text({
      text: `FUNDING TIER: ${'★'.repeat(sponsor.fundingTier)}${'☆'.repeat(5 - sponsor.fundingTier)}  |  ANNUAL BUDGET: $₵${sponsor.availableBudget.toLocaleString()}  |  MIN DIRECTOR RANK: ${sponsor.minDirectorRank}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.AMBER,
      }),
    });
    statsText.position.set(20, 130);
    this.container.addChild(statsText);

    // Active Agreements
    const agreeHeader = new Text({
      text: 'ACTIVE SPONSORSHIP AGREEMENTS & STIPENDS:',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 9,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_MUTED,
        letterSpacing: 0.8,
      }),
    });
    agreeHeader.position.set(20, 156);
    this.container.addChild(agreeHeader);

    if (sponsor.activeAgreements.length === 0) {
      const noneText = new Text({
        text: 'No active recurring grant agreements. Fulfill contracts to unlock institutional partnerships.',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fill: UI_COLORS.TEXT_MUTED,
        }),
      });
      noneText.position.set(20, 176);
      this.container.addChild(noneText);
    } else {
      let aY = 176;
      sponsor.activeAgreements.forEach((agree) => {
        const aText = new Text({
          text: `• ${agree.title}: +$₵${agree.periodicFunding.toLocaleString()} every ${agree.intervalGameDays}d (${agree.remainingIntervals}/${agree.totalIntervals} disbursements remaining)`,
          style: new TextStyle({
            fontFamily: UI_FONTS.FAMILY,
            fontSize: 10,
            fill: UI_COLORS.TEXT_SUCCESS,
          }),
        });
        aText.position.set(20, aY);
        this.container.addChild(aText);
        aY += 18;
      });
    }
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
