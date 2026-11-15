/**
 * INTERSTELLAR CONTINUUM - Reusable Contract Card UI Component
 * Renders contract details, objectives checklist, deadlines, and tactile action buttons.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_COLORS, UI_FONTS, UI_RADIUS } from '../../ui/core/UIDesignTokens';
import { UIButton } from '../../ui/components/UIButton';
import { UIProgressBar } from '../../ui/components/UIProgressBar';
import {
  ContractRecord,
  ContractStatus,
  CONTRACT_CATEGORY_LABELS,
} from '../ContractTypes';

export interface ContractCardOptions {
  contract: ContractRecord;
  width?: number;
  height?: number;
  onAccept?: (contractId: string) => void;
  onComplete?: (contractId: string) => void;
  onCancel?: (contractId: string) => void;
  onExtend?: (contractId: string) => void;
}

export class ContractCard {
  public readonly container: Container;
  private options: ContractCardOptions;
  private bgGfx: Graphics;

  constructor(options: ContractCardOptions) {
    this.options = options;
    this.container = new Container();
    this.container.label = `ContractCard_${options.contract.id}`;

    this.bgGfx = new Graphics();
    this.container.addChild(this.bgGfx);

    this.render();
  }

  private render(): void {
    const { contract } = this.options;
    const width = this.options.width ?? 440;
    const height = this.options.height ?? 220;

    this.bgGfx.clear();
    const isCompleted = contract.status === ContractStatus.COMPLETED;
    const isActive =
      contract.status === ContractStatus.ACCEPTED || contract.status === ContractStatus.IN_PROGRESS;

    const bgColor = isCompleted
      ? 0x06281e
      : isActive
        ? UI_COLORS.BG_PANEL_ELEVATED
        : UI_COLORS.BG_SURFACE;
    const strokeColor = isCompleted
      ? UI_COLORS.GREEN
      : isActive
        ? UI_COLORS.BORDER_FOCUS
        : UI_COLORS.BORDER_SUBTLE;

    this.bgGfx.roundRect(0, 0, width, height, UI_RADIUS.MD);
    this.bgGfx.fill({ color: bgColor, alpha: 0.9 });
    this.bgGfx.stroke({ color: strokeColor, width: 1.5 });

    // Category & Status Tag
    const categoryLabel = CONTRACT_CATEGORY_LABELS[contract.category] || contract.category;
    const catText = new Text({
      text: `${categoryLabel.toUpperCase()} // ${contract.destinationId.replace('DEST_', '')}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 9,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_HIGHLIGHT,
        letterSpacing: 0.8,
      }),
    });
    catText.position.set(16, 12);
    this.container.addChild(catText);

    // Status Pill
    const statusColor =
      contract.status === ContractStatus.COMPLETED
        ? UI_COLORS.GREEN
        : contract.status === ContractStatus.AVAILABLE
          ? UI_COLORS.CYAN
          : contract.status === ContractStatus.EXPIRED || contract.status === ContractStatus.FAILED
            ? UI_COLORS.RED
            : UI_COLORS.AMBER;

    const statusBadge = new Text({
      text: contract.status,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 9,
        fontWeight: 'bold',
        fill: statusColor,
      }),
    });
    statusBadge.anchor.set(1.0, 0);
    statusBadge.position.set(width - 16, 12);
    this.container.addChild(statusBadge);

    // Title
    const titleText = new Text({
      text: contract.title.length > 38 ? contract.title.substring(0, 35) + '...' : contract.title,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 13,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
      }),
    });
    titleText.position.set(16, 32);
    this.container.addChild(titleText);

    // Sponsor
    const sponsorText = new Text({
      text: `SPONSOR: ${contract.sponsorName}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fill: UI_COLORS.TEXT_SECONDARY,
      }),
    });
    sponsorText.position.set(16, 54);
    this.container.addChild(sponsorText);

    // Reward readout
    const rewardText = new Text({
      text: `REWARD: $₵${contract.rewards.credits.toLocaleString()}  |  +${contract.rewards.reputationGain} REP`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fontWeight: 'bold',
        fill: UI_COLORS.AMBER,
      }),
    });
    rewardText.position.set(16, 76);
    this.container.addChild(rewardText);

    // Objectives list summary
    let objY = 100;
    contract.objectives.slice(0, 2).forEach((obj) => {
      const checkMark = obj.isCompleted ? '✓' : '○';
      const checkColor = obj.isCompleted ? UI_COLORS.TEXT_SUCCESS : UI_COLORS.TEXT_MUTED;

      const objText = new Text({
        text: `${checkMark} ${obj.description.length > 44 ? obj.description.substring(0, 41) + '...' : obj.description}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9,
          fill: checkColor,
        }),
      });
      objText.position.set(16, objY);
      this.container.addChild(objText);
      objY += 18;
    });

    // Deadline / Remaining Time Bar
    if (contract.deadlineSeconds !== null) {
      const remainingSecs = contract.timeRemainingSeconds ?? contract.deadlineSeconds;
      const pct = Math.max(0, Math.min(1, remainingSecs / contract.deadlineSeconds));
      const days = Math.max(0, Math.round(remainingSecs / 86400));

      const timeText = new Text({
        text: contract.isInGracePeriod
          ? '⚠ GRACE PERIOD ACTIVE (-LATE PENALTY)'
          : `TIME REMAINING: ~${days} GAME DAYS`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9,
          fontWeight: 'bold',
          fill: contract.isInGracePeriod ? UI_COLORS.TEXT_WARNING : UI_COLORS.TEXT_MUTED,
        }),
      });
      timeText.position.set(16, 142);
      this.container.addChild(timeText);

      const pBar = new UIProgressBar({
        width: width - 32,
        height: 6,
        fillColor: contract.isInGracePeriod ? UI_COLORS.AMBER : UI_COLORS.CYAN,
        showPercent: false,
        initialValue: pct,
      });
      pBar.container.position.set(16, 158);
      this.container.addChild(pBar.container);
    }

    // Action button
    const btnY = height - 42;
    if (contract.status === ContractStatus.AVAILABLE) {
      const acceptBtn = new UIButton({
        label: 'ACCEPT CONTRACT',
        variant: 'PRIMARY',
        width: 140,
        height: 28,
        onClick: () => {
          if (this.options.onAccept) {
            this.options.onAccept(contract.id);
          }
        },
      });
      acceptBtn.container.position.set(width - 16 - 140, btnY);
      this.container.addChild(acceptBtn.container);
    } else if (isActive) {
      const allDone = contract.objectives.every((o) => o.isCompleted);
      if (allDone) {
        const completeBtn = new UIButton({
          label: 'COMPLETE & CLAIM',
          variant: 'PRIMARY',
          width: 160,
          height: 28,
          onClick: () => {
            if (this.options.onComplete) {
              this.options.onComplete(contract.id);
            }
          },
        });
        completeBtn.container.position.set(width - 16 - 160, btnY);
        this.container.addChild(completeBtn.container);
      } else {
        // Option to extend or cancel
        if (contract.deadlineSeconds !== null) {
          const extendBtn = new UIButton({
            label: 'EXTEND DEADLINE',
            variant: 'OUTLINE',
            width: 130,
            height: 28,
            onClick: () => {
              if (this.options.onExtend) {
                this.options.onExtend(contract.id);
              }
            },
          });
          extendBtn.container.position.set(width - 16 - 130, btnY);
          this.container.addChild(extendBtn.container);
        }

        const cancelBtn = new UIButton({
          label: 'CANCEL',
          variant: 'GHOST',
          width: 80,
          height: 28,
          onClick: () => {
            if (this.options.onCancel) {
              this.options.onCancel(contract.id);
            }
          },
        });
        cancelBtn.container.position.set(16, btnY);
        this.container.addChild(cancelBtn.container);
      }
    }
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
