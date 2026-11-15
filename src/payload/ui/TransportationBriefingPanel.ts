/**
 * INTERSTELLAR CONTINUUM - Transportation Mission Delivery Briefing Panel
 * Tactical dossier detailing mission delivery destinations, multi-payload logistics
 * criteria, follow-up exploration phases, budget, and educational concepts.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_COLORS, UI_FONTS, UI_RADIUS, UI_SPACING } from '../../ui/core/UIDesignTokens';
import { TransportationMissionDefinition } from '../TransportationMissionTypes';
import { PayloadRegistry } from '../PayloadRegistry';

export interface TransportationBriefingPanelOptions {
  width?: number;
  height?: number;
}

export class TransportationBriefingPanel {
  public readonly container: Container;
  private width: number;
  private height: number;

  private bgGfx: Graphics;
  private contentContainer: Container;
  private registry: PayloadRegistry;

  constructor(
    options: TransportationBriefingPanelOptions = {},
    registry?: PayloadRegistry
  ) {
    this.width = options.width ?? 680;
    this.height = options.height ?? 700;
    this.container = new Container();
    this.registry = registry ?? PayloadRegistry.getInstance();

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

  public setMission(mission?: TransportationMissionDefinition): void {
    this.contentContainer.removeChildren();

    if (!mission) {
      const emptyText = new Text({
        text: 'No active transportation mission selected.',
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

    // 1. Mission Title & Code
    const titleText = new Text({
      text: `${mission.shortCode}: ${mission.name.toUpperCase()}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 15,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_ACCENT,
        letterSpacing: 1.0,
      }),
    });
    titleText.position.set(0, currentY);
    this.contentContainer.addChild(titleText);
    currentY += 24;

    const subText = new Text({
      text: `DESTINATION: ${mission.destinationId}  |  DIFFICULTY: ${mission.difficulty}  |  DURATION: ${mission.estimatedDurationDays} DAYS`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_HIGHLIGHT,
      }),
    });
    subText.position.set(0, currentY);
    this.contentContainer.addChild(subText);
    currentY += 26;

    // Divider
    const div = new Graphics();
    div.rect(0, currentY, this.width - UI_SPACING.MD * 2, 1);
    div.fill({ color: UI_COLORS.BORDER_SUBTLE, alpha: 0.8 });
    this.contentContainer.addChild(div);
    currentY += 12;

    // 2. Summary & Operational Description
    const descText = new Text({
      text: mission.briefing.description,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fill: UI_COLORS.TEXT_SECONDARY,
        wordWrap: true,
        wordWrapWidth: this.width - UI_SPACING.MD * 2,
        lineHeight: 16,
      }),
    });
    descText.position.set(0, currentY);
    this.contentContainer.addChild(descText);
    currentY += 56;

    // 3. Educational & Scientific Concepts
    const eduBox = new Graphics();
    eduBox.roundRect(0, currentY, this.width - UI_SPACING.MD * 2, 60, UI_RADIUS.SM);
    eduBox.fill({ color: UI_COLORS.BG_SURFACE, alpha: 0.8 });
    eduBox.stroke({ color: UI_COLORS.BORDER_DIM, width: 1 });
    this.contentContainer.addChild(eduBox);

    const eduTitle = new Text({
      text: 'AEROSPACE EDUCATIONAL CONCEPT',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
      }),
    });
    eduTitle.position.set(12, currentY + 8);

    const eduBody = new Text({
      text: mission.briefing.educationalConcept,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fill: UI_COLORS.TEXT_HIGHLIGHT,
        wordWrap: true,
        wordWrapWidth: this.width - UI_SPACING.MD * 2 - 24,
        lineHeight: 14,
      }),
    });
    eduBody.position.set(12, currentY + 24);
    this.contentContainer.addChild(eduTitle, eduBody);
    currentY += 72;

    // 4. Required Payloads Manifest Checklist
    const reqHeader = new Text({
      text: 'REQUIRED PAYLOADS MANIFEST',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 12,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
      }),
    });
    reqHeader.position.set(0, currentY);
    this.contentContainer.addChild(reqHeader);
    currentY += 20;

    for (const req of mission.requiredPayloads) {
      const p = this.registry.getPayload(req.payloadId);
      const pName = p ? p.name : req.payloadId;

      const pBox = new Graphics();
      pBox.roundRect(0, currentY, this.width - UI_SPACING.MD * 2, 38, UI_RADIUS.SM);
      pBox.fill({ color: UI_COLORS.BG_SURFACE, alpha: 0.9 });
      pBox.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
      this.contentContainer.addChild(pBox);

      const pLabel = new Text({
        text: `• [REQ: ${req.requiredQuantity}x] ${pName.toUpperCase()}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11,
          fontWeight: 'bold',
          fill: UI_COLORS.TEXT_ACCENT,
        }),
      });
      pLabel.position.set(10, currentY + 5);

      const pCond = new Text({
        text: req.conditionDescription ?? 'Deliver undamaged to destination target.',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9,
          fill: UI_COLORS.TEXT_MUTED,
        }),
      });
      pCond.position.set(10, currentY + 20);

      this.contentContainer.addChild(pLabel, pCond);
      currentY += 44;
    }

    currentY += 8;

    // 5. Follow-Up Exploration Phase (If present)
    if (mission.explorationObjectives && mission.explorationObjectives.length > 0) {
      const expHeader = new Text({
        text: 'FOLLOW-UP EXPLORATION PHASE (UNLOCKED AFTER DELIVERY)',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11,
          fontWeight: 'bold',
          fill: UI_COLORS.TEXT_WARNING,
        }),
      });
      expHeader.position.set(0, currentY);
      this.contentContainer.addChild(expHeader);
      currentY += 20;

      for (const exp of mission.explorationObjectives) {
        const expText = new Text({
          text: `▶ ${exp.title}: ${exp.description} (Target: ${exp.targetValue})`,
          style: new TextStyle({
            fontFamily: UI_FONTS.FAMILY,
            fontSize: 10,
            fill: UI_COLORS.TEXT_SECONDARY,
          }),
        });
        expText.position.set(10, currentY);
        this.contentContainer.addChild(expText);
        currentY += 20;
      }
      currentY += 10;
    }

    // 6. Mission Rewards & Budget
    const rewBox = new Graphics();
    rewBox.roundRect(0, currentY, this.width - UI_SPACING.MD * 2, 55, UI_RADIUS.SM);
    rewBox.fill({ color: 0x051d18, alpha: 0.9 });
    rewBox.stroke({ color: UI_COLORS.BORDER_FOCUS, width: 1 });
    this.contentContainer.addChild(rewBox);

    const rewText = new Text({
      text: `CONTRACT REWARDS: +${mission.rewards.credits.toLocaleString()} Credits  |  +${mission.rewards.researchData} Research  |  +${mission.rewards.agencyPrestige} Prestige  |  +${mission.rewards.technologyPoints} Tech Pts`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_SUCCESS,
      }),
    });
    rewText.position.set(12, currentY + 12);

    const budgetText = new Text({
      text: `BUDGET CAP: ${mission.missionCost.allocatedCredits.toLocaleString()} Credits (Launch Cost Cap: ${mission.missionCost.launchCostCapCredits.toLocaleString()})`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 9,
        fill: UI_COLORS.TEXT_SECONDARY,
      }),
    });
    budgetText.position.set(12, currentY + 32);

    this.contentContainer.addChild(rewText, budgetText);
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
