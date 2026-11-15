/**
 * INTERSTELLAR CONTINUUM - Mission Control Dashboard & Telemetry Interface
 * High-polish Mission Director command console mounted at Organisation Headquarters.
 *
 * Implements:
 * - Mission Overview & MET Telemetry Clock (Section A)
 * - Spacecraft Systems Status (Section B)
 * - Mission Progress & Milestone Timeline (Section C)
 * - Flight Dynamics Trajectory & Telemetry Presentation (Section D)
 * - Chronological Mission Event Audit Log (Section E)
 * - Non-flashing Aerospace Alert & Anomaly Console (Section F)
 * - Live Feed vs Sample Demonstration Mode toggle
 * - Empty Mission State with guidance
 * - Return-to-Headquarters routing integration
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../../ui/core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS, UI_SPACING } from '../../ui/core/UIDesignTokens';
import { UIButton } from '../../ui/components/UIButton';
import { UITabGroup, UITabItem } from '../../ui/components/UITabGroup';
import { IMissionDataProvider } from '../adapters/IMissionDataProvider';
import { LiveMissionDataProvider } from '../adapters/LiveMissionDataProvider';
import { SampleMissionDataProvider } from '../adapters/SampleMissionDataProvider';
import {
  MissionTelemetrySnapshot,
  MissionControlEvent,
  MissionAlert,
} from '../types/MissionControlTypes';

import { MissionOverviewPanel } from './components/MissionOverviewPanel';
import { SpacecraftStatusPanel } from './components/SpacecraftStatusPanel';
import { MissionProgressPanel } from './components/MissionProgressPanel';
import { TelemetryDisplayPanel } from './components/TelemetryDisplayPanel';
import { MissionEventLogPanel } from './components/MissionEventLogPanel';
import { MissionAlertsPanel } from './components/MissionAlertsPanel';

export enum DashboardTab {
  SPACECRAFT_SYSTEMS = 'SPACECRAFT_SYSTEMS',
  MISSION_PROGRESS = 'MISSION_PROGRESS',
  FLIGHT_TRAJECTORY = 'FLIGHT_TRAJECTORY',
  EVENT_LOG = 'EVENT_LOG',
  ALERTS = 'ALERTS',
}

export interface MissionControlDashboardOptions {
  width?: number;
  height?: number;
  dataProvider?: IMissionDataProvider;
  onReturnToHQ?: () => void;
  onOpenCatalogue?: () => void;
}

export class MissionControlDashboard extends UIComponent {
  private width: number;
  private height: number;

  private liveProvider: IMissionDataProvider;
  private sampleProvider: IMissionDataProvider;
  private activeProvider: IMissionDataProvider;

  private isDemoMode: boolean = false;
  private activeTab: DashboardTab = DashboardTab.SPACECRAFT_SYSTEMS;

  private selectedInstanceId: string | null = null;
  private activeSnapshot: MissionTelemetrySnapshot | null = null;

  // Visual layout containers
  private backdropGfx: Graphics;
  private headerContainer: Container;
  private missionSelectorContainer: Container;
  private tabContainer: Container;
  private contentContainer: Container;
  private emptyStateContainer: Container;

  // Sub-panels
  private overviewPanel: MissionOverviewPanel;
  private spacecraftPanel: SpacecraftStatusPanel;
  private progressPanel: MissionProgressPanel;
  private trajectoryPanel: TelemetryDisplayPanel;
  private eventLogPanel: MissionEventLogPanel;
  private alertsPanel: MissionAlertsPanel;

  // Controls
  private tabGroup?: UITabGroup;
  private returnBtn?: UIButton;
  private demoToggleBtn?: UIButton;
  private missionButtons: UIButton[] = [];

  // Callbacks
  private onReturnToHQCb?: () => void;
  private onOpenCatalogueCb?: () => void;

  // Subscriptions
  private unsubscribeSnapshot?: () => void;
  private unsubscribeEvents?: () => void;
  private unsubscribeAlerts?: () => void;

  constructor(options: MissionControlDashboardOptions = {}) {
    super('MissionControlDashboard');

    this.width = options.width ?? 1920;
    this.height = options.height ?? 1080;

    this.onReturnToHQCb = options.onReturnToHQ;
    this.onOpenCatalogueCb = options.onOpenCatalogue;

    this.liveProvider = options.dataProvider ?? new LiveMissionDataProvider();
    this.sampleProvider = new SampleMissionDataProvider();
    this.activeProvider = this.liveProvider;

    // 1. Full-screen aerospace backdrop
    this.backdropGfx = new Graphics();
    this.backdropGfx.rect(0, 0, this.width, this.height);
    this.backdropGfx.fill({ color: 0x020713, alpha: 0.98 });
    this.container.addChild(this.backdropGfx);

    // Sub-containers
    this.headerContainer = new Container();
    this.missionSelectorContainer = new Container();
    this.tabContainer = new Container();
    this.contentContainer = new Container();
    this.emptyStateContainer = new Container();

    this.container.addChild(this.contentContainer);
    this.container.addChild(this.emptyStateContainer);
    this.container.addChild(this.headerContainer);
    this.container.addChild(this.missionSelectorContainer);
    this.container.addChild(this.tabContainer);

    // Section A: Mission Overview Panel (Pinned across all tabs)
    this.overviewPanel = new MissionOverviewPanel({
      width: this.width - UI_SPACING.LG * 2,
      height: 110,
    });
    this.overviewPanel.container.position.set(UI_SPACING.LG, 115);
    this.contentContainer.addChild(this.overviewPanel.container);

    // Content Panels (Y: 235 to ~1060)
    const contentY = 280;
    const contentW = this.width - UI_SPACING.LG * 2;
    const contentH = 780;

    this.spacecraftPanel = new SpacecraftStatusPanel({ width: contentW, height: contentH });
    this.spacecraftPanel.container.position.set(UI_SPACING.LG, contentY);
    this.contentContainer.addChild(this.spacecraftPanel.container);

    this.progressPanel = new MissionProgressPanel({ width: contentW, height: contentH });
    this.progressPanel.container.position.set(UI_SPACING.LG, contentY);
    this.progressPanel.container.visible = false;
    this.contentContainer.addChild(this.progressPanel.container);

    this.trajectoryPanel = new TelemetryDisplayPanel({ width: contentW, height: contentH });
    this.trajectoryPanel.container.position.set(UI_SPACING.LG, contentY);
    this.trajectoryPanel.container.visible = false;
    this.contentContainer.addChild(this.trajectoryPanel.container);

    this.eventLogPanel = new MissionEventLogPanel({ width: contentW, height: contentH });
    this.eventLogPanel.container.position.set(UI_SPACING.LG, contentY);
    this.eventLogPanel.container.visible = false;
    this.contentContainer.addChild(this.eventLogPanel.container);

    this.alertsPanel = new MissionAlertsPanel({
      width: contentW,
      height: contentH,
      onDismissAlert: (alertId) => {
        if (this.selectedInstanceId) {
          this.activeProvider.dismissAlert(this.selectedInstanceId, alertId);
        }
      },
    });
    this.alertsPanel.container.position.set(UI_SPACING.LG, contentY);
    this.alertsPanel.container.visible = false;
    this.contentContainer.addChild(this.alertsPanel.container);

    this.setupHeader();
    this.setupTabs();
    this.setupEmptyState();
    this.refreshMissionsList();
  }

  private setupHeader(): void {
    this.headerContainer.removeChildren();

    const barGfx = new Graphics();
    barGfx.rect(0, 0, this.width, 68);
    barGfx.fill({ color: 0x020713, alpha: 0.98 });
    barGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });

    // Decorative top strip
    barGfx.rect(0, 0, this.width, 3).fill({ color: UI_COLORS.CYAN, alpha: 0.9 });
    this.headerContainer.addChild(barGfx);

    // Title
    const titleStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 16,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_PRIMARY,
      letterSpacing: 2.0,
    });
    const title = new Text({
      text: 'MISSION CONTROL DASHBOARD // FLIGHT OPERATIONS CENTRE',
      style: titleStyle,
    });
    title.position.set(UI_SPACING.LG, 14);
    this.headerContainer.addChild(title);

    const subStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
      letterSpacing: 1.0,
    });
    const sub = new Text({
      text: 'TELEMETRY RECEPTION & VEHICLE SUBSYSTEMS CONSOLE',
      style: subStyle,
    });
    sub.position.set(UI_SPACING.LG, 38);
    this.headerContainer.addChild(sub);

    // Mode Toggle: Live Feed vs Demo Mode
    this.demoToggleBtn = new UIButton({
      label: this.isDemoMode ? 'MODE: DEMO PREVIEW [ACTIVE]' : 'MODE: LIVE FEED',
      variant: this.isDemoMode ? 'SECONDARY' : 'OUTLINE',
      width: 250,
      height: 38,
      onClick: () => this.toggleDemoMode(),
    });
    this.demoToggleBtn.container.position.set(1360, 14);
    this.headerContainer.addChild(this.demoToggleBtn.container);

    // Return to Headquarters Button
    this.returnBtn = new UIButton({
      label: 'RETURN TO HQ [ESC]',
      variant: 'OUTLINE',
      width: 240,
      height: 38,
      onClick: () => this.returnToHeadquarters(),
    });
    this.returnBtn.container.position.set(1640, 14);
    this.headerContainer.addChild(this.returnBtn.container);
  }

  private setupTabs(): void {
    this.tabContainer.removeChildren();
    this.tabContainer.position.set(UI_SPACING.LG, 235);

    const tabs: UITabItem[] = [
      { id: DashboardTab.SPACECRAFT_SYSTEMS, label: 'SPACECRAFT SYSTEMS (B)' },
      { id: DashboardTab.MISSION_PROGRESS, label: 'MISSION PROGRESS (C)' },
      { id: DashboardTab.FLIGHT_TRAJECTORY, label: 'TELEMETRY PROFILE (D)' },
      { id: DashboardTab.EVENT_LOG, label: 'EVENT LOG (E)' },
      { id: DashboardTab.ALERTS, label: 'ALERTS & ANOMALIES (F)' },
    ];

    this.tabGroup = new UITabGroup({
      tabs,
      initialTabId: DashboardTab.SPACECRAFT_SYSTEMS,
      width: 1300,
      height: 36,
      onTabChange: (tabId) => {
        this.switchTab(tabId as DashboardTab);
      },
    });
    this.tabContainer.addChild(this.tabGroup.container);
  }

  private setupEmptyState(): void {
    this.emptyStateContainer.removeChildren();
    this.emptyStateContainer.position.set((this.width - 800) / 2, (this.height - 380) / 2);
    this.emptyStateContainer.visible = false;

    const gfx = new Graphics();
    gfx.roundRect(0, 0, 800, 380, UI_RADIUS.MD);
    gfx.fill({ color: 0x050e1c, alpha: 0.98 });
    gfx.stroke({ color: UI_COLORS.BORDER_DEFAULT, width: 2.0 });

    // Decorative top strip
    gfx.rect(0, 0, 800, 4).fill({ color: UI_COLORS.AMBER, alpha: 0.9 });
    this.emptyStateContainer.addChild(gfx);

    const title = new Text({
      text: 'NO ACTIVE FLIGHT MISSIONS DETECTED',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 18,
        fontWeight: 'bold',
        fill: UI_COLORS.AMBER,
        letterSpacing: 1.5,
        align: 'center',
      }),
    });
    title.anchor.set(0.5, 0);
    title.position.set(400, 40);
    this.emptyStateContainer.addChild(title);

    const desc = new Text({
      text:
        'The telemetry receiver has no active flight instances transmitting signals.\n\n' +
        'You can either authorize a mission from the Mission Catalogue at MOC,\n' +
        'or activate Demonstration Mode to preview real-time deep space telemetry\n' +
        'with sample educational spacecraft (ARES-I & EUROPA-DISCOVERY).',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 12,
        fill: UI_COLORS.TEXT_PRIMARY,
        align: 'center',
        lineHeight: 22,
      }),
    });
    desc.anchor.set(0.5, 0);
    desc.position.set(400, 95);
    this.emptyStateContainer.addChild(desc);

    // Action buttons in empty state
    const demoBtn = new UIButton({
      label: 'ACTIVATE DEMO MODE',
      variant: 'PRIMARY',
      width: 250,
      height: 40,
      onClick: () => this.toggleDemoMode(true),
    });
    demoBtn.container.position.set(130, 260);
    this.emptyStateContainer.addChild(demoBtn.container);

    const catBtn = new UIButton({
      label: 'OPEN MISSION CATALOGUE',
      variant: 'OUTLINE',
      width: 250,
      height: 40,
      onClick: () => {
        if (this.onOpenCatalogueCb) {
          this.onOpenCatalogueCb();
        } else {
          this.returnToHeadquarters();
        }
      },
    });
    catBtn.container.position.set(420, 260);
    this.emptyStateContainer.addChild(catBtn.container);
  }

  public refreshMissionsList(): void {
    const missions = this.activeProvider.getActiveMissions();

    this.missionSelectorContainer.removeChildren();
    this.missionSelectorContainer.position.set(UI_SPACING.LG, 76);
    this.missionButtons = [];

    if (missions.length === 0) {
      this.selectedInstanceId = null;
      this.activeSnapshot = null;
      this.contentContainer.visible = false;
      this.tabContainer.visible = false;
      this.emptyStateContainer.visible = true;
      return;
    }

    this.contentContainer.visible = true;
    this.tabContainer.visible = true;
    this.emptyStateContainer.visible = false;

    // Render mission switcher pills
    const lbl = new Text({
      text: 'ACTIVE MISSIONS:',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_MUTED,
        letterSpacing: 1.0,
      }),
    });
    lbl.position.set(0, 8);
    this.missionSelectorContainer.addChild(lbl);

    let curX = 130;
    if (!this.selectedInstanceId || !missions.some((m) => m.instanceId === this.selectedInstanceId)) {
      this.selectedInstanceId = missions[0]?.instanceId ?? null;
    }

    for (const m of missions) {
      const isSelected = m.instanceId === this.selectedInstanceId;
      const btn = new UIButton({
        label: `${m.shortCode} // ${m.destinationName.toUpperCase()}`,
        width: 240,
        height: 28,
        variant: isSelected ? 'PRIMARY' : 'OUTLINE',
        onClick: () => this.selectMission(m.instanceId),
      });
      btn.container.position.set(curX, 0);
      this.missionSelectorContainer.addChild(btn.container);
      this.missionButtons.push(btn);
      curX += 250;
    }

    this.subscribeToCurrentMission();
  }

  public selectMission(instanceId: string): void {
    this.selectedInstanceId = instanceId;
    this.refreshMissionsList();
  }

  private subscribeToCurrentMission(): void {
    this.teardownSubscriptions();

    if (!this.selectedInstanceId) return;

    this.unsubscribeSnapshot = this.activeProvider.subscribeToSnapshot(
      this.selectedInstanceId,
      (snapshot) => {
        this.activeSnapshot = snapshot;
        this.updatePanels(snapshot);
      }
    );

    this.unsubscribeEvents = this.activeProvider.subscribeToEvents(
      this.selectedInstanceId,
      (event: MissionControlEvent) => {
        if (this.activeSnapshot) {
          const updated = [...this.activeSnapshot.recentEvents, event];
          this.eventLogPanel.setEvents(updated);
        }
      }
    );

    this.unsubscribeAlerts = this.activeProvider.subscribeToAlerts(
      this.selectedInstanceId,
      (alert: MissionAlert) => {
        if (this.activeSnapshot) {
          const updated = [...this.activeSnapshot.alerts, alert];
          this.alertsPanel.setAlerts(updated);
        }
      }
    );
  }

  private teardownSubscriptions(): void {
    if (this.unsubscribeSnapshot) {
      this.unsubscribeSnapshot();
      this.unsubscribeSnapshot = undefined;
    }
    if (this.unsubscribeEvents) {
      this.unsubscribeEvents();
      this.unsubscribeEvents = undefined;
    }
    if (this.unsubscribeAlerts) {
      this.unsubscribeAlerts();
      this.unsubscribeAlerts = undefined;
    }
  }

  private updatePanels(snapshot: MissionTelemetrySnapshot): void {
    this.overviewPanel.setOverview(snapshot.overview);
    this.spacecraftPanel.setTelemetry(snapshot.spacecraft);
    this.progressPanel.setProgress(snapshot.progress);
    this.trajectoryPanel.setSnapshot(snapshot);
    this.eventLogPanel.setEvents(snapshot.recentEvents);
    this.alertsPanel.setAlerts(snapshot.alerts);
  }

  public switchTab(tab: DashboardTab): void {
    this.activeTab = tab;
    this.tabGroup?.selectTab(tab);

    this.spacecraftPanel.container.visible = tab === DashboardTab.SPACECRAFT_SYSTEMS;
    this.progressPanel.container.visible = tab === DashboardTab.MISSION_PROGRESS;
    this.trajectoryPanel.container.visible = tab === DashboardTab.FLIGHT_TRAJECTORY;
    this.eventLogPanel.container.visible = tab === DashboardTab.EVENT_LOG;
    this.alertsPanel.container.visible = tab === DashboardTab.ALERTS;
  }

  public toggleDemoMode(forceDemo?: boolean): void {
    this.isDemoMode = forceDemo !== undefined ? forceDemo : !this.isDemoMode;

    if (this.demoToggleBtn) {
      this.demoToggleBtn.setLabel(
        this.isDemoMode ? 'MODE: DEMO PREVIEW [ACTIVE]' : 'MODE: LIVE FEED'
      );
      (this.demoToggleBtn as any).options.variant = this.isDemoMode ? 'SECONDARY' : 'OUTLINE';
    }

    this.activeProvider = this.isDemoMode ? this.sampleProvider : this.liveProvider;
    this.selectedInstanceId = null;
    this.refreshMissionsList();
  }

  public returnToHeadquarters(): void {
    if (this.onReturnToHQCb) {
      this.onReturnToHQCb();
    } else {
      this.hide();
    }
  }

  public override update(deltaSeconds: number): void {
    super.update(deltaSeconds);
    this.activeProvider.update(deltaSeconds);
  }

  public getSelectedInstanceId(): string | null {
    return this.selectedInstanceId;
  }

  public getActiveTab(): DashboardTab {
    return this.activeTab;
  }

  public getIsDemoMode(): boolean {
    return this.isDemoMode;
  }

  public override destroy(): void {
    this.teardownSubscriptions();
    this.liveProvider.dispose();
    this.sampleProvider.dispose();
    super.destroy();
  }
}
