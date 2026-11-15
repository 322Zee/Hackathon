/**
 * INTERSTELLAR CONTINUUM - Planetary Base Management View
 * Authoritative multi-tab modal interface for planetary base oversight,
 * module construction, grid power management, logistical transfers, and upgrades.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { PlanetaryBaseManager } from '../PlanetaryBaseManager';
import { BaseRecord, BaseModuleType, ModuleOperationalState } from '../BaseTypes';
import { BaseSchematicVisualizer } from './BaseSchematicVisualizer';

export interface BaseViewConfig {
  manager: PlanetaryBaseManager;
  onClose?: () => void;
  width?: number;
  height?: number;
}

export type BaseTabId =
  | 'tab_overview'
  | 'tab_construction'
  | 'tab_modules'
  | 'tab_logistics'
  | 'tab_history';

export class PlanetaryBaseManagementView {
  public container: Container;
  private manager: PlanetaryBaseManager;
  private onClose?: () => void;
  private width: number;
  private height: number;

  private isViewVisible: boolean = false;
  private activeTabId: BaseTabId = 'tab_overview';
  private selectedBaseId?: string;

  // Visual sub-containers
  private backdropGfx: Graphics;
  private modalGfx: Graphics;
  private headerContainer: Container;
  private tabsContainer: Container;
  private contentContainer: Container;

  // Sub-components
  private schematicVisualizer: BaseSchematicVisualizer;

  constructor(config: BaseViewConfig) {
    this.manager = config.manager;
    this.onClose = config.onClose;
    this.width = config.width ?? 1080;
    this.height = config.height ?? 680;

    this.container = new Container();
    this.container.label = 'PlanetaryBaseManagementView';
    this.container.visible = false;

    this.backdropGfx = new Graphics();
    this.modalGfx = new Graphics();
    this.headerContainer = new Container();
    this.tabsContainer = new Container();
    this.contentContainer = new Container();

    this.container.addChild(this.backdropGfx);
    this.container.addChild(this.modalGfx);
    this.container.addChild(this.headerContainer);
    this.container.addChild(this.tabsContainer);
    this.container.addChild(this.contentContainer);

    this.schematicVisualizer = new BaseSchematicVisualizer({
      width: 680,
      height: 480,
    });

    this.buildStaticLayout();
  }

  public show(preferredBaseId?: string): void {
    this.isViewVisible = true;
    this.container.visible = true;

    const bases = this.manager.listBases();
    if (preferredBaseId && this.manager.getBase(preferredBaseId)) {
      this.selectedBaseId = preferredBaseId;
    } else if (bases.length > 0) {
      this.selectedBaseId = bases[0].id;
    }

    this.renderHeader();
    this.renderTabs();
    this.renderContent();
  }

  public hide(): void {
    this.isViewVisible = false;
    this.container.visible = false;
    if (this.onClose) {
      this.onClose();
    }
  }

  public isVisible(): boolean {
    return this.isViewVisible;
  }

  public selectBase(baseId: string): void {
    if (this.manager.getBase(baseId)) {
      this.selectedBaseId = baseId;
      this.renderHeader();
      this.renderContent();
    }
  }

  public switchTab(tabId: BaseTabId): void {
    this.activeTabId = tabId;
    this.renderTabs();
    this.renderContent();
  }

  public update(_deltaTimeSeconds: number): void {
    if (!this.isViewVisible) return;
    // Periodic refresh
  }

  private buildStaticLayout(): void {
    const x = (1920 - this.width) / 2 || 40;
    const y = (1080 - this.height) / 2 || 40;

    // Dark backdrop overlay
    this.safeDrawRect(this.backdropGfx, 0, 0, 1920, 1080, 0x000000, 0.75);

    // Main modal window panel
    this.safeDrawRect(this.modalGfx, x, y, this.width, this.height, 0x0a1120, 0.98);
    this.safeDrawRect(this.modalGfx, x, y, this.width, 50, 0x0f1c32, 1.0); // Header bar
  }

  private renderHeader(): void {
    try {
      this.headerContainer.removeChildren?.();
    } catch {
      // Mock safe
    }

    const x = (1920 - this.width) / 2 || 40;
    const y = (1080 - this.height) / 2 || 40;

    const base = this.selectedBaseId ? this.manager.getBase(this.selectedBaseId) : undefined;
    const titleText = base
      ? `PLANETARY OUTPOST // ${base.name.toUpperCase()} [${base.destinationId}]`
      : 'PLANETARY BASE OPERATIONS';

    const titleStyle = new TextStyle({
      fill: 0x00e5ff,
      fontSize: 16,
      fontWeight: 'bold',
      letterSpacing: 1.5,
    });

    const header = new Text({ text: titleText, style: titleStyle });
    header.x = x + 20;
    header.y = y + 15;
    this.headerContainer.addChild(header);

    // Status badge
    if (base) {
      const statusStyle = new TextStyle({
        fill: base.operationalStatus === 'OPERATIONAL' ? 0x00e676 : 0xffd600,
        fontSize: 12,
        fontWeight: 'bold',
      });
      const statusText = new Text({
        text: `STATUS: ${base.operationalStatus} | LVL ${base.baseLevel}`,
        style: statusStyle,
      });
      statusText.x = x + this.width - 240;
      statusText.y = y + 17;
      this.headerContainer.addChild(statusText);
    }
  }

  private renderTabs(): void {
    try {
      this.tabsContainer.removeChildren?.();
    } catch {
      // Mock safe
    }

    const x = (1920 - this.width) / 2 || 40;
    const y = (1080 - this.height) / 2 || 40;

    const tabs: { id: BaseTabId; label: string }[] = [
      { id: 'tab_overview', label: 'OUTPOST OVERVIEW' },
      { id: 'tab_construction', label: 'CONSTRUCTION' },
      { id: 'tab_modules', label: 'FACILITIES' },
      { id: 'tab_logistics', label: 'LOGISTICS & CARGO' },
      { id: 'tab_history', label: 'ACTIVITY LOG' },
    ];

    let curX = x + 20;
    for (const tab of tabs) {
      const isActive = tab.id === this.activeTabId;
      const tabStyle = new TextStyle({
        fill: isActive ? 0x00e5ff : 0x78909c,
        fontSize: 12,
        fontWeight: isActive ? 'bold' : 'normal',
      });

      const txt = new Text({ text: tab.label, style: tabStyle });
      txt.x = curX;
      txt.y = y + 60;
      this.tabsContainer.addChild(txt);

      curX += 160;
    }
  }

  private renderContent(): void {
    try {
      this.contentContainer.removeChildren?.();
    } catch {
      // Mock safe
    }

    const base = this.selectedBaseId ? this.manager.getBase(this.selectedBaseId) : undefined;
    if (!base) {
      this.renderNoBaseView();
      return;
    }

    switch (this.activeTabId) {
      case 'tab_overview':
        this.renderOverviewTab(base);
        break;
      case 'tab_construction':
        this.renderConstructionTab(base);
        break;
      case 'tab_modules':
        this.renderModulesTab(base);
        break;
      case 'tab_logistics':
        this.renderLogisticsTab(base);
        break;
      case 'tab_history':
        this.renderHistoryTab(base);
        break;
    }
  }

  private renderOverviewTab(base: BaseRecord): void {
    const x = (1920 - this.width) / 2 || 40;
    const y = (1080 - this.height) / 2 || 40;

    // 1. Mount 2D/2.5D visualizer
    this.schematicVisualizer.container.x = x + 20;
    this.schematicVisualizer.container.y = y + 90;
    this.schematicVisualizer.setBase(base);
    this.contentContainer.addChild(this.schematicVisualizer.container);

    // 2. Telemetry side cards
    const sideX = x + 720;
    let curY = y + 90;

    const summary = this.manager.getBaseStatus(base.id);

    // Card 1: Power Grid
    const powerText = new Text({
      text: `POWER GRID TELEMETRY\n------------------\nGeneration:  ${summary.powerGeneration} PWR\nConsumption: ${summary.powerConsumption} PWR\nNet Balance: ${summary.powerNetBalance > 0 ? '+' : ''}${summary.powerNetBalance} PWR\nBattery Buffer: ${base.powerStatus.batteryStored} / ${base.powerStatus.batteryCapacity} kWh`,
      style: new TextStyle({ fill: 0x81d4fa, fontSize: 12 }),
    });
    powerText.x = sideX;
    powerText.y = curY;
    this.contentContainer.addChild(powerText);
    curY += 110;

    // Card 2: Communications
    const commsText = new Text({
      text: `COMMUNICATIONS TELEMETRY\n-----------------------\nStatus:    ${summary.commsConnected ? 'CONNECTED' : 'OFFLINE'}\nBandwidth: ${summary.commsBandwidthGbps} Gbps\nFidelity:  ${summary.signalQuality}%\nRelay:     ${base.communicationsStatus.linkType}`,
      style: new TextStyle({ fill: 0x80cbc4, fontSize: 12 }),
    });
    commsText.x = sideX;
    commsText.y = curY;
    this.contentContainer.addChild(commsText);
    curY += 110;

    // Card 3: Structural Maintenance
    const maintText = new Text({
      text: `STRUCTURAL MAINTENANCE\n----------------------\nCondition: ${summary.overallCondition}%\nUrgency:   ${summary.maintenanceState}\nSupplies:  ${summary.maintenanceState === 'OPTIMAL' ? '0' : base.maintenanceStatus.requiredSupplies} Needed\nWear Rate: ${base.maintenanceStatus.wearRatePerCycle}% / cycle`,
      style: new TextStyle({ fill: 0xffcc80, fontSize: 12 }),
    });
    maintText.x = sideX;
    maintText.y = curY;
    this.contentContainer.addChild(maintText);
    curY += 110;

    // Card 4: Science & Logistics
    const sciText = new Text({
      text: `OPERATIONAL THROUGHPUT\n----------------------\nScience Output:   +${summary.activeResearchOutput} / cycle\nRefining Rate:    +${summary.activeProcessingRate} units\nOccupied Slots:   ${summary.occupiedSlots} / ${summary.maxSlots}\nStorage Utilized: ${summary.storageUsed} / ${summary.storageMax}`,
      style: new TextStyle({ fill: 0xce93d8, fontSize: 12 }),
    });
    sciText.x = sideX;
    sciText.y = curY;
    this.contentContainer.addChild(sciText);
  }

  private renderConstructionTab(base: BaseRecord): void {
    const x = (1920 - this.width) / 2 || 40;
    const y = (1080 - this.height) / 2 || 40;

    const info = new Text({
      text: `CONSTRUCTION WORKBENCH // ${base.name}\nAvailable Building Slots: ${base.availableSlots} of ${base.maxSlots}\nActive Construction Tasks: ${base.activeConstructionTasks.length}`,
      style: new TextStyle({ fill: 0xffffff, fontSize: 13, fontWeight: 'bold' }),
    });
    info.x = x + 30;
    info.y = y + 100;
    this.contentContainer.addChild(info);

    // List active tasks
    let taskY = y + 160;
    for (const t of base.activeConstructionTasks) {
      const taskCard = new Text({
        text: `• [TASK] ${t.moduleTypeId} at Slot #${t.slotIndex + 1} | Progress: ${t.progressPercent}% (${t.elapsedTicks}/${t.totalDurationTicks} ticks)`,
        style: new TextStyle({ fill: 0x00e5ff, fontSize: 12 }),
      });
      taskCard.x = x + 30;
      taskCard.y = taskY;
      this.contentContainer.addChild(taskCard);
      taskY += 30;
    }
  }

  private renderModulesTab(base: BaseRecord): void {
    const x = (1920 - this.width) / 2 || 40;
    const y = (1080 - this.height) / 2 || 40;

    const title = new Text({
      text: `INSTALLED BASE MODULES (${base.installedModules.length})`,
      style: new TextStyle({ fill: 0xffffff, fontSize: 14, fontWeight: 'bold' }),
    });
    title.x = x + 30;
    title.y = y + 100;
    this.contentContainer.addChild(title);

    let modY = y + 140;
    for (const m of base.installedModules) {
      const card = new Text({
        text: `Slot #${m.slotIndex + 1} | ${m.name} [Tier ${m.level}] - Health: ${m.health}% - State: ${m.operationalState} - Draw: ${m.powerDraw} PWR`,
        style: new TextStyle({ fill: 0xb0bec5, fontSize: 12 }),
      });
      card.x = x + 30;
      card.y = modY;
      this.contentContainer.addChild(card);
      modY += 28;
    }
  }

  private renderLogisticsTab(base: BaseRecord): void {
    const x = (1920 - this.width) / 2 || 40;
    const y = (1080 - this.height) / 2 || 40;

    const title = new Text({
      text: `LOGISTICAL INVENTORY & STORAGE // Capacity: ${base.storageCapacity} Units`,
      style: new TextStyle({ fill: 0xffffff, fontSize: 14, fontWeight: 'bold' }),
    });
    title.x = x + 30;
    title.y = y + 100;
    this.contentContainer.addChild(title);

    const inv = base.inventory;
    const invDetails = new Text({
      text: `Credits Buffer:           ₵${inv.creditsBuffer.toLocaleString()}\nRaw Materials:            ${inv.rawMaterials} Units\nProcessed Materials:      ${inv.processedMaterials} Units\nMaintenance Supplies:     ${inv.maintenanceSupplies} Units\nResearch Samples:         ${inv.researchSamples} Assayed\nLife Support Consumables: ${inv.lifeSupportConsumables} Days`,
      style: new TextStyle({ fill: 0x81d4fa, fontSize: 13, lineHeight: 24 }),
    });
    invDetails.x = x + 30;
    invDetails.y = y + 140;
    this.contentContainer.addChild(invDetails);
  }

  private renderHistoryTab(base: BaseRecord): void {
    const x = (1920 - this.width) / 2 || 40;
    const y = (1080 - this.height) / 2 || 40;

    const title = new Text({
      text: `BASE ACTIVITY & OPERATIONAL LOG`,
      style: new TextStyle({ fill: 0xffffff, fontSize: 14, fontWeight: 'bold' }),
    });
    title.x = x + 30;
    title.y = y + 100;
    this.contentContainer.addChild(title);

    let histY = y + 140;
    const recent = base.activityHistory.slice(0, 12);
    for (const h of recent) {
      const entry = new Text({
        text: `[${h.category}] ${h.message}`,
        style: new TextStyle({ fill: 0x90a4ae, fontSize: 11 }),
      });
      entry.x = x + 30;
      entry.y = histY;
      this.contentContainer.addChild(entry);
      histY += 24;
    }
  }

  private renderNoBaseView(): void {
    const x = (1920 - this.width) / 2 || 40;
    const y = (1080 - this.height) / 2 || 40;

    const noBase = new Text({
      text: 'No planetary bases have been established yet.\nDeploy an outpost from Mission Planning to begin exploration.',
      style: new TextStyle({ fill: 0x78909c, fontSize: 14, align: 'center' }),
    });
    noBase.x = x + 200;
    noBase.y = y + 250;
    this.contentContainer.addChild(noBase);
  }

  private safeDrawRect(
    gfx: any,
    x: number,
    y: number,
    w: number,
    h: number,
    color: number,
    alpha: number
  ): void {
    try {
      if (typeof gfx.rect === 'function') {
        gfx.rect(x, y, w, h);
        if (typeof gfx.fill === 'function') {
          gfx.fill({ color, alpha });
        }
      } else if (typeof gfx.beginFill === 'function') {
        gfx.beginFill(color, alpha);
        gfx.drawRect(x, y, w, h);
        gfx.endFill();
      }
    } catch {
      // Defensive
    }
  }

  public destroy(): void {
    this.schematicVisualizer.destroy();
    this.container.destroy({ children: true });
  }
}
