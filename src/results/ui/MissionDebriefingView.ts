/**
 * INTERSTELLAR CONTINUUM - Mission Debriefing Interface View
 * Authoritative debriefing report presentation from Mission Operations department:
 * A. Mission Summary & Operational Identity
 * B. Performance Score & Performance Grade Visual Gauge
 * C. Detailed Objective Evaluation Dossier
 * D. Confirmed Mission Rewards & Claim Action
 * E. In-depth Performance Analysis & Diagnostics
 * F. Return & Routing Navigation Controls
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_COLORS, UI_FONTS } from '../../ui/core/UIDesignTokens';
import { UIButton } from '../../ui/components/UIButton';
import { MissionResultRecord, MissionCompletionStatus } from '../ResultsTypes';
import { PerformanceScoreGauge } from './PerformanceScoreGauge';
import { CategoryBreakdownCard } from './CategoryBreakdownCard';
import { MissionResultsManager } from '../MissionResultsManager';

export interface MissionDebriefingViewOptions {
  width?: number;
  height?: number;
  result?: MissionResultRecord;
  manager?: MissionResultsManager;
  onContinue?: () => void;
  onOpenHistory?: () => void;
}

export class MissionDebriefingView {
  public readonly container: Container;

  private width: number;
  private height: number;
  private result?: MissionResultRecord;
  private manager: MissionResultsManager;
  private onContinue?: () => void;
  private onOpenHistory?: () => void;

  private backgroundGfx: Graphics;
  private contentContainer: Container;
  private scoreGauge?: PerformanceScoreGauge;
  private breakdownCard?: CategoryBreakdownCard;

  private claimButton?: UIButton;
  private continueButton?: UIButton;
  private historyButton?: UIButton;
  private claimStatusText?: Text;

  constructor(options: MissionDebriefingViewOptions = {}) {
    this.width = options.width ?? 1440;
    this.height = options.height ?? 860;
    this.manager = options.manager ?? MissionResultsManager.getInstance();
    this.result = options.result;
    this.onContinue = options.onContinue;
    this.onOpenHistory = options.onOpenHistory;

    this.container = new Container();

    this.backgroundGfx = new Graphics();
    this.container.addChild(this.backgroundGfx);

    this.contentContainer = new Container();
    this.container.addChild(this.contentContainer);

    this.renderBackdrop();

    if (this.result) {
      this.displayResult(this.result);
    }
  }

  private renderBackdrop(): void {
    this.backgroundGfx.clear();

    // Dark aerospace backdrop
    this.backgroundGfx.rect(0, 0, this.width, this.height);
    this.backgroundGfx.fill({ color: UI_COLORS.BG_OVERLAY, alpha: 0.96 });

    // Main central dossier frame
    const margin = 20;
    const panelW = this.width - margin * 2;
    const panelH = this.height - margin * 2;

    this.backgroundGfx.roundRect(margin, margin, panelW, panelH, 8);
    this.backgroundGfx.fill({ color: UI_COLORS.BG_PANEL, alpha: 0.92 });
    this.backgroundGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 2 });

    // Header bar separator
    this.backgroundGfx.moveTo(margin, margin + 70);
    this.backgroundGfx.lineTo(margin + panelW, margin + 70);
    this.backgroundGfx.stroke({ color: UI_COLORS.BORDER_DIM, width: 1.5 });

    // Footer bar separator
    this.backgroundGfx.moveTo(margin, this.height - margin - 70);
    this.backgroundGfx.lineTo(margin + panelW, this.height - margin - 70);
    this.backgroundGfx.stroke({ color: UI_COLORS.BORDER_DIM, width: 1.5 });
  }

  public displayResult(result: MissionResultRecord): void {
    this.result = result;
    this.contentContainer.removeChildren();

    const margin = 20;
    const panelW = this.width - margin * 2;

    // ==========================================
    // SECTION A: HEADER & MISSION SUMMARY
    // ==========================================
    const headerContainer = new Container();
    headerContainer.position.set(margin + 24, margin + 14);

    // Department Watermark Badge
    const deptTag = new Text({
      text: 'ASTRA CONTINUUM // MISSION OPERATIONS FLIGHT DEBRIEFING',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 2,
      }),
    });
    headerContainer.addChild(deptTag);

    // Mission Title & Code
    const titleText = new Text({
      text: `${result.shortCode ? result.shortCode + ' ' : ''}${result.missionName.toUpperCase()}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 22,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
        letterSpacing: 1.2,
      }),
    });
    titleText.position.set(0, 16);
    headerContainer.addChild(titleText);

    // Metadata Strip: Destination | Type | Duration | Status
    const statusColor =
      result.completionStatus === MissionCompletionStatus.COMPLETED
        ? UI_COLORS.TEXT_SUCCESS
        : result.completionStatus === MissionCompletionStatus.PARTIALLY_COMPLETED
        ? UI_COLORS.TEXT_WARNING
        : UI_COLORS.TEXT_DANGER;

    const metaText = new Text({
      text: `DESTINATION: ${String(result.destination).toUpperCase()}   |   TYPE: ${String(result.missionType).toUpperCase()}   |   DURATION: ${result.missionDurationFormatted}   |   STATUS: `,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fill: UI_COLORS.TEXT_MUTED,
        letterSpacing: 1,
      }),
    });
    metaText.position.set(panelW - 740, 24);
    headerContainer.addChild(metaText);

    const statusBadge = new Text({
      text: result.completionStatus,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fontWeight: 'bold',
        fill: statusColor,
        letterSpacing: 1,
      }),
    });
    statusBadge.position.set(panelW - 140, 24);
    headerContainer.addChild(statusBadge);

    this.contentContainer.addChild(headerContainer);

    // ==========================================
    // BODY COLUMNS LAYOUT
    // Left: Section B (Score Gauge & Category Audit)
    // Center: Section C & D (Objectives & Rewards)
    // Right: Section E (Analysis & Diagnostics)
    // ==========================================
    const bodyY = margin + 86;
    const colLeftW = 460;
    const colMidW = 480;
    const colRightW = panelW - colLeftW - colMidW - 64;

    // LEFT COLUMN: Section B - Score & Categories
    const leftCol = new Container();
    leftCol.position.set(margin + 24, bodyY);

    // Gauge container
    const gaugeWrap = new Container();
    gaugeWrap.position.set(colLeftW / 2, 85);
    const gradeColor =
      result.finalPerformanceScore >= 90
        ? UI_COLORS.CYAN
        : result.finalPerformanceScore >= 80
        ? UI_COLORS.GREEN
        : result.finalPerformanceScore >= 70
        ? UI_COLORS.BLUE
        : result.finalPerformanceScore >= 60
        ? UI_COLORS.AMBER
        : UI_COLORS.RED;

    this.scoreGauge = new PerformanceScoreGauge({
      radius: 65,
      score: result.finalPerformanceScore,
      gradeLetter: result.gradeLetter,
      gradeLabel: result.gradeLabel,
      gradeColorHex: gradeColor,
    });
    gaugeWrap.addChild(this.scoreGauge.container);
    leftCol.addChild(gaugeWrap);

    // Category Breakdown Card
    this.breakdownCard = new CategoryBreakdownCard({
      width: colLeftW,
      height: 480,
    });
    this.breakdownCard.container.position.set(0, 180);
    this.breakdownCard.setCategories(result.categoryBreakdown);
    leftCol.addChild(this.breakdownCard.container);

    this.contentContainer.addChild(leftCol);

    // MIDDLE COLUMN: Section C (Objectives) & Section D (Rewards)
    const midCol = new Container();
    midCol.position.set(margin + 24 + colLeftW + 24, bodyY);

    // Section C: Objectives Header
    this.renderSectionHeader(midCol, 'SECTION C: OBJECTIVES EVALUATION', 0);

    const objBoxH = 340;
    const objBox = new Graphics();
    objBox.roundRect(0, 24, colMidW, objBoxH, 6);
    objBox.fill({ color: UI_COLORS.BG_PANEL, alpha: 0.85 });
    objBox.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.5 });
    midCol.addChild(objBox);

    const objList = new Container();
    objList.position.set(14, 36);

    const allObjectives = [...result.objectivesCompleted, ...result.objectivesMissed];
    allObjectives.slice(0, 5).forEach((obj, idx) => {
      const row = new Container();
      row.position.set(0, idx * 58);

      const markColor = obj.isCompleted ? UI_COLORS.GREEN : UI_COLORS.RED;
      const markIcon = obj.isCompleted ? '[OK]' : '[MISSED]';

      const tagText = new Text({
        text: markIcon,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fontWeight: 'bold',
          fill: markColor,
        }),
      });
      tagText.position.set(0, 0);
      row.addChild(tagText);

      const titleText = new Text({
        text: `${obj.isOptional ? '[OPTIONAL] ' : ''}${obj.title}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11,
          fontWeight: 'bold',
          fill: UI_COLORS.TEXT_PRIMARY,
        }),
      });
      titleText.position.set(70, 0);
      row.addChild(titleText);

      const ptsText = new Text({
        text: `${obj.pointsAwarded}/${obj.maxPoints} pts`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fontWeight: 'bold',
          fill: obj.isCompleted ? UI_COLORS.CYAN : UI_COLORS.TEXT_MUTED,
        }),
      });
      ptsText.anchor.set(1, 0);
      ptsText.position.set(colMidW - 28, 0);
      row.addChild(ptsText);

      const descText = new Text({
        text: obj.feedback || obj.description,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fill: UI_COLORS.TEXT_SECONDARY,
          wordWrap: true,
          wordWrapWidth: colMidW - 32,
        }),
      });
      descText.position.set(70, 18);
      row.addChild(descText);

      objList.addChild(row);
    });
    midCol.addChild(objList);

    // Section D: Rewards Panel
    const rewardsY = objBoxH + 40;
    this.renderSectionHeader(midCol, 'SECTION D: MISSION REWARDS & DISBURSEMENTS', rewardsY);

    const rewBoxH = 260;
    const rewBox = new Graphics();
    rewBox.roundRect(0, rewardsY + 24, colMidW, rewBoxH, 6);
    rewBox.fill({ color: UI_COLORS.BG_PANEL, alpha: 0.85 });
    rewBox.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.5 });
    midCol.addChild(rewBox);

    const rewList = new Container();
    rewList.position.set(16, rewardsY + 38);

    const rew = result.rewardSummary;
    const rewardItems = [
      { label: 'MISSION CREDITS', val: `₵${rew.credits.toLocaleString()}`, color: UI_COLORS.GREEN },
      { label: 'RESEARCH DATA', val: `+${rew.researchData} Data Packets`, color: UI_COLORS.CYAN },
      { label: 'RAW MATERIALS', val: `+${rew.rawMaterials} Tons`, color: UI_COLORS.BLUE },
      { label: 'TECHNOLOGY POINTS', val: `+${rew.technologyPoints} Tech Points`, color: UI_COLORS.PURPLE },
      { label: 'AGENCY PRESTIGE', val: `+${rew.agencyPrestige} Reputation`, color: UI_COLORS.AMBER },
    ];

    rewardItems.forEach((r, idx) => {
      const row = new Container();
      row.position.set(0, idx * 30);

      const l = new Text({
        text: r.label,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fontWeight: 'bold',
          fill: UI_COLORS.TEXT_MUTED,
        }),
      });
      l.position.set(0, 0);
      row.addChild(l);

      const v = new Text({
        text: r.val,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11,
          fontWeight: 'bold',
          fill: r.color,
        }),
      });
      v.anchor.set(1, 0);
      v.position.set(colMidW - 36, 0);
      row.addChild(v);

      rewList.addChild(row);
    });

    if (rew.unlockedMissionIds.length > 0) {
      const unlockText = new Text({
        text: `UNLOCKED MISSIONS: ${rew.unlockedMissionIds.join(', ')}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fontWeight: 'bold',
          fill: UI_COLORS.CYAN,
        }),
      });
      unlockText.position.set(0, 155);
      rewList.addChild(unlockText);
    }

    // Claim Action Button inside Section D
    const isAlreadyClaimed = result.isClaimed || rew.isClaimed;
    this.claimStatusText = new Text({
      text: isAlreadyClaimed ? '[REWARDS AUTHORITATIVELY CLAIMED]' : 'Rewards pending director disbursement',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: isAlreadyClaimed ? UI_COLORS.GREEN : UI_COLORS.AMBER,
      }),
    });
    this.claimStatusText.position.set(0, 185);
    rewList.addChild(this.claimStatusText);

    if (!isAlreadyClaimed) {
      this.claimButton = new UIButton({
        label: 'CLAIM REWARDS',
        width: 170,
        height: 28,
        variant: 'PRIMARY',
        onClick: () => this.handleClaim(),
      });
      this.claimButton.container.position.set(colMidW - 200, 178);
      rewList.addChild(this.claimButton.container);
    }

    midCol.addChild(rewList);
    this.contentContainer.addChild(midCol);

    // RIGHT COLUMN: Section E - Performance Analysis & Diagnostics
    const rightCol = new Container();
    rightCol.position.set(margin + 24 + colLeftW + 24 + colMidW + 24, bodyY);

    this.renderSectionHeader(rightCol, 'SECTION E: PERFORMANCE ANALYSIS & FEEDBACK', 0);

    const analysisBoxH = 664;
    const analysisBox = new Graphics();
    analysisBox.roundRect(0, 24, colRightW, analysisBoxH, 6);
    analysisBox.fill({ color: UI_COLORS.BG_PANEL, alpha: 0.85 });
    analysisBox.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.5 });
    rightCol.addChild(analysisBox);

    const analysisList = new Container();
    analysisList.position.set(16, 36);

    // Executive Summary
    const execLabel = new Text({
      text: 'EXECUTIVE FLIGHT SUMMARY:',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_MUTED,
      }),
    });
    analysisList.addChild(execLabel);

    const execText = new Text({
      text: result.performanceFeedback.executiveSummary,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fill: UI_COLORS.TEXT_PRIMARY,
        wordWrap: true,
        wordWrapWidth: colRightW - 32,
        lineHeight: 16,
      }),
    });
    execText.position.set(0, 16);
    analysisList.addChild(execText);

    // Strengths (What went well)
    const strengthsLabel = new Text({
      text: 'KEY FLIGHT STRENGTHS:',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.GREEN,
      }),
    });
    strengthsLabel.position.set(0, 95);
    analysisList.addChild(strengthsLabel);

    const strengthsStr = result.performanceFeedback.strengths.length > 0
      ? result.performanceFeedback.strengths.map((s) => `• ${s}`).join('\n')
      : '• Baseline nominal operations maintained.';
    const strengthsText = new Text({
      text: strengthsStr,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fill: UI_COLORS.TEXT_SECONDARY,
        wordWrap: true,
        wordWrapWidth: colRightW - 32,
        lineHeight: 16,
      }),
    });
    strengthsText.position.set(0, 115);
    analysisList.addChild(strengthsText);

    // Areas for Improvement (What could be improved)
    const improveLabel = new Text({
      text: 'AREAS FOR FLIGHT IMPROVEMENT:',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.AMBER,
      }),
    });
    improveLabel.position.set(0, 245);
    analysisList.addChild(improveLabel);

    const improveStr = result.performanceFeedback.areasForImprovement.length > 0
      ? result.performanceFeedback.areasForImprovement.map((s) => `• ${s}`).join('\n')
      : '• No critical system variances recorded.';
    const improveText = new Text({
      text: improveStr,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fill: UI_COLORS.TEXT_SECONDARY,
        wordWrap: true,
        wordWrapWidth: colRightW - 32,
        lineHeight: 16,
      }),
    });
    improveText.position.set(0, 265);
    analysisList.addChild(improveText);

    // Engineering & Budget Technical Feedback
    const techLabel = new Text({
      text: 'TECHNICAL & BUDGET AUDIT:',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
      }),
    });
    techLabel.position.set(0, 395);
    analysisList.addChild(techLabel);

    const techStr = `ENGINEERING: ${result.performanceFeedback.engineeringFeedback}\n\nBUDGET: ${result.performanceFeedback.budgetFeedback}\n\nSCIENCE: ${result.performanceFeedback.scientificFeedback}`;
    const techText = new Text({
      text: techStr,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fill: UI_COLORS.TEXT_SECONDARY,
        wordWrap: true,
        wordWrapWidth: colRightW - 32,
        lineHeight: 15,
      }),
    });
    techText.position.set(0, 415);
    analysisList.addChild(techText);

    rightCol.addChild(analysisList);
    this.contentContainer.addChild(rightCol);

    // ==========================================
    // SECTION F: FOOTER CONTROLS & CONTINUATION
    // ==========================================
    const footerY = this.height - margin - 52;

    this.historyButton = new UIButton({
      label: 'VIEW MISSION HISTORY ARCHIVE',
      width: 260,
      height: 38,
      variant: 'SECONDARY',
      onClick: () => {
        if (this.onOpenHistory) this.onOpenHistory();
      },
    });
    this.historyButton.container.position.set(margin + 24, footerY);
    this.contentContainer.addChild(this.historyButton.container);

    this.continueButton = new UIButton({
      label: 'RETURN TO MISSION OPERATIONS',
      width: 280,
      height: 38,
      variant: 'PRIMARY',
      onClick: () => {
        if (this.onContinue) this.onContinue();
      },
    });
    this.continueButton.container.position.set(this.width - margin - 304, footerY);
    this.contentContainer.addChild(this.continueButton.container);
  }

  private handleClaim(): void {
    if (!this.result) return;

    const claimRes = this.manager.claimMissionRewards(this.result.id);
    if (claimRes.success) {
      this.result.isClaimed = true;
      this.result.rewardSummary.isClaimed = true;
      if (this.claimStatusText) {
        this.claimStatusText.text = '[REWARDS AUTHORITATIVELY CLAIMED]';
        this.claimStatusText.style.fill = UI_COLORS.GREEN;
      }
      if (this.claimButton) {
        this.claimButton.container.visible = false;
      }
    }
  }

  private renderSectionHeader(parent: Container, title: string, yPos: number): void {
    const text = new Text({
      text: title,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_MUTED,
        letterSpacing: 1.2,
      }),
    });
    text.position.set(0, yPos);
    parent.addChild(text);
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
