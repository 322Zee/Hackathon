/**
 * INTERSTELLAR CONTINUUM - Mission Alerts & Anomaly Management Panel (Section F)
 * Tactical aerospace alert console supporting INFO, WARNING, and CRITICAL priorities,
 * filterable by severity, with non-flashing dignified design, subsystem origins,
 * recommended action directives, and acknowledgement handling.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../../../ui/core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS, UI_SPACING } from '../../../ui/core/UIDesignTokens';
import { MissionAlert, AlertPriority } from '../../types/MissionControlTypes';
import { UIButton } from '../../../ui/components/UIButton';

export interface MissionAlertsPanelOptions {
  width?: number;
  height?: number;
  onDismissAlert?: (alertId: string) => void;
}

export class MissionAlertsPanel extends UIComponent {
  private width: number;
  private height: number;

  private bgGfx: Graphics;
  private filterContainer: Container;
  private alertsListContainer: Container;
  private detailsContainer: Container;

  private alerts: MissionAlert[] = [];
  private activeFilter: string = 'ALL';
  private selectedAlertId: string | null = null;
  private onDismissAlertCb?: (alertId: string) => void;

  constructor(options: MissionAlertsPanelOptions = {}) {
    super('MissionAlertsPanel');

    this.width = options.width ?? 1860;
    this.height = options.height ?? 370;
    this.onDismissAlertCb = options.onDismissAlert;

    this.bgGfx = new Graphics();
    this.filterContainer = new Container();
    this.alertsListContainer = new Container();
    this.detailsContainer = new Container();

    this.container.addChild(this.bgGfx);
    this.container.addChild(this.filterContainer);
    this.container.addChild(this.alertsListContainer);
    this.container.addChild(this.detailsContainer);

    this.filterContainer.position.set(UI_SPACING.MD, UI_SPACING.MD);
    this.alertsListContainer.position.set(UI_SPACING.MD, 50);
    this.detailsContainer.position.set(1180, 50);

    this.setupFilterBar();
    this.drawBackground();
  }

  public setAlerts(alerts: MissionAlert[]): void {
    this.alerts = alerts;
    if (this.alerts.length > 0 && !this.selectedAlertId) {
      this.selectedAlertId = this.alerts[0]?.id ?? null;
    }
    this.setupFilterBar();
    this.renderAlerts();
  }

  private setupFilterBar(): void {
    this.filterContainer.removeChildren();

    const criticalCount = this.alerts.filter((a) => a.priority === AlertPriority.CRITICAL).length;
    const warningCount = this.alerts.filter((a) => a.priority === AlertPriority.WARNING).length;
    const infoCount = this.alerts.filter((a) => a.priority === AlertPriority.INFO).length;

    const filters = [
      { id: 'ALL', label: `ALL ALERTS (${this.alerts.length})` },
      { id: AlertPriority.CRITICAL, label: `CRITICAL (${criticalCount})` },
      { id: AlertPriority.WARNING, label: `WARNINGS (${warningCount})` },
      { id: AlertPriority.INFO, label: `INFO (${infoCount})` },
    ];

    let curX = 0;
    for (const f of filters) {
      const isSelected = this.activeFilter === f.id;
      let variant: 'PRIMARY' | 'OUTLINE' | 'DANGER' = isSelected ? 'PRIMARY' : 'OUTLINE';
      if (f.id === AlertPriority.CRITICAL && criticalCount > 0) {
        variant = isSelected ? 'DANGER' : 'OUTLINE';
      }

      const btn = new UIButton({
        label: f.label,
        width: 170,
        height: 28,
        variant,
        onClick: () => {
          this.activeFilter = f.id;
          this.setupFilterBar();
          this.renderAlerts();
        },
      });
      btn.container.position.set(curX, 0);
      this.filterContainer.addChild(btn.container);
      curX += 178;
    }
  }

  private renderAlerts(): void {
    this.alertsListContainer.removeChildren();

    let filtered = [...this.alerts];
    if (this.activeFilter !== 'ALL') {
      filtered = filtered.filter((a) => a.priority === this.activeFilter);
    }

    if (filtered.length === 0) {
      const emptyText = new Text({
        text: 'ALL SUBSYSTEMS NOMINAL // NO ACTIVE ALERTS IN THIS CATEGORY',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11,
          fontWeight: 'bold',
          fill: UI_COLORS.GREEN,
        }),
      });
      emptyText.position.set(20, 20);
      this.alertsListContainer.addChild(emptyText);
      this.renderDetails(null);
      return;
    }

    const rowH = 54;
    for (let i = 0; i < Math.min(5, filtered.length); i++) {
      const alert = filtered[i];
      if (!alert) continue;
      const isSelected = this.selectedAlertId === alert.id;
      const row = this.createAlertRow(alert, 0, i * (rowH + 6), 1140, rowH, isSelected);
      this.alertsListContainer.addChild(row);
    }

    const selected = filtered.find((a) => a.id === this.selectedAlertId) ?? filtered[0] ?? null;
    this.renderDetails(selected);
  }

  private createAlertRow(
    alert: MissionAlert,
    x: number,
    y: number,
    w: number,
    h: number,
    isSelected: boolean
  ): Container {
    const row = new Container();
    row.position.set(x, y);

    let priorityColor: number = UI_COLORS.CYAN;
    if (alert.priority === AlertPriority.CRITICAL) {
      priorityColor = UI_COLORS.RED;
    } else if (alert.priority === AlertPriority.WARNING) {
      priorityColor = UI_COLORS.AMBER;
    }

    const gfx = new Graphics();
    gfx.roundRect(0, 0, w, h, UI_RADIUS.XS);
    gfx.fill({ color: isSelected ? 0x0f294a : 0x071526, alpha: 0.9 });
    gfx.stroke({
      color: isSelected ? priorityColor : UI_COLORS.BORDER_SUBTLE,
      width: isSelected ? 1.5 : 0.8,
    });
    gfx.eventMode = 'static';
    gfx.cursor = 'pointer';
    gfx.on('pointerdown', () => {
      this.selectedAlertId = alert.id;
      this.renderAlerts();
    });
    row.addChild(gfx);

    // Left priority strip (steady, non-flashing)
    gfx.rect(0, 0, 4, h).fill({ color: priorityColor, alpha: 0.95 });

    // Priority badge
    const badgeStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10,
      fontWeight: 'bold',
      fill: priorityColor,
      letterSpacing: 1.0,
    });
    const badge = new Text({
      text: `[${alert.priority}]`,
      style: badgeStyle,
    });
    badge.position.set(16, 8);
    row.addChild(badge);

    // Subsystem
    const subText = new Text({
      text: alert.subsystem.toUpperCase(),
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 9.5,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_MUTED,
      }),
    });
    subText.position.set(140, 8);
    row.addChild(subText);

    // Title
    const titleText = new Text({
      text: alert.title.toUpperCase(),
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
      }),
    });
    titleText.position.set(290, 7);
    row.addChild(titleText);

    // Message snippet
    const msgSnippet = alert.message.length > 90 ? `${alert.message.substring(0, 87)}...` : alert.message;
    const msgText = new Text({
      text: msgSnippet,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 9.5,
        fill: UI_COLORS.TEXT_SECONDARY,
      }),
    });
    msgText.position.set(16, 28);
    row.addChild(msgText);

    return row;
  }

  private renderDetails(alert: MissionAlert | null): void {
    this.detailsContainer.removeChildren();

    const w = 650;
    const h = 300;

    const gfx = new Graphics();
    gfx.roundRect(0, 0, w, h, UI_RADIUS.SM);
    gfx.fill({ color: 0x050e1c, alpha: 0.95 });
    gfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });

    // Header bar
    gfx.roundRect(0, 0, w, 26, UI_RADIUS.SM);
    gfx.fill({ color: 0x081528, alpha: 0.95 });
    gfx.rect(0, 0, 3, 26).fill({ color: UI_COLORS.CYAN, alpha: 0.8 });

    const header = new Text({
      text: 'ANOMALY & DIRECTIVE INSPECTION',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
        letterSpacing: 1.0,
      }),
    });
    header.position.set(10, 6);
    gfx.addChild(header);
    this.detailsContainer.addChild(gfx);

    if (!alert) {
      const emptyText = new Text({
        text: 'SELECT AN ALERT TO VIEW DIRECTIVES',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fill: UI_COLORS.TEXT_MUTED,
        }),
      });
      emptyText.position.set(20, 50);
      this.detailsContainer.addChild(emptyText);
      return;
    }

    let priorityColor: number = UI_COLORS.CYAN;
    if (alert.priority === AlertPriority.CRITICAL) priorityColor = UI_COLORS.RED;
    else if (alert.priority === AlertPriority.WARNING) priorityColor = UI_COLORS.AMBER;

    const title = new Text({
      text: `${alert.title.toUpperCase()}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 13,
        fontWeight: 'bold',
        fill: priorityColor,
      }),
    });
    title.position.set(15, 38);
    this.detailsContainer.addChild(title);

    const subBadge = new Text({
      text: `SUBSYSTEM: ${alert.subsystem} // SEVERITY: ${alert.priority}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 9.5,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_MUTED,
      }),
    });
    subBadge.position.set(15, 62);
    this.detailsContainer.addChild(subBadge);

    const msg = new Text({
      text: alert.message,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10.5,
        fill: UI_COLORS.TEXT_PRIMARY,
        wordWrap: true,
        wordWrapWidth: w - 30,
        lineHeight: 18,
      }),
    });
    msg.position.set(15, 90);
    this.detailsContainer.addChild(msg);

    if (alert.actionPrompt) {
      const actionHeader = new Text({
        text: 'RECOMMENDED FLIGHT DIRECTOR DIRECTIVE:',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fontWeight: 'bold',
          fill: UI_COLORS.AMBER,
        }),
      });
      actionHeader.position.set(15, 175);
      this.detailsContainer.addChild(actionHeader);

      const actionText = new Text({
        text: alert.actionPrompt,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fill: UI_COLORS.TEXT_SECONDARY,
          wordWrap: true,
          wordWrapWidth: w - 30,
        }),
      });
      actionText.position.set(15, 195);
      this.detailsContainer.addChild(actionText);
    }

    // Acknowledge / Dismiss button
    const ackBtn = new UIButton({
      label: 'ACKNOWLEDGE & ARCHIVE [ACK]',
      variant: 'OUTLINE',
      width: 250,
      height: 32,
      onClick: () => {
        if (this.onDismissAlertCb) {
          this.onDismissAlertCb(alert.id);
        }
        this.alerts = this.alerts.filter((a) => a.id !== alert.id);
        this.selectedAlertId = this.alerts.length > 0 ? (this.alerts[0]?.id ?? null) : null;
        this.setupFilterBar();
        this.renderAlerts();
      },
    });
    ackBtn.container.position.set(15, h - 45);
    this.detailsContainer.addChild(ackBtn.container);
  }

  private drawBackground(): void {
    this.bgGfx.clear();
    this.bgGfx.roundRect(0, 0, this.width, this.height, UI_RADIUS.SM);
    this.bgGfx.fill({ color: 0x020713, alpha: 0.7 });
    this.bgGfx.stroke({ color: UI_COLORS.BORDER_DIM, width: 1.0 });
  }
}
