/**
 * INTERSTELLAR CONTINUUM - Communications Management Interface View
 * Dedicated interactive user interface providing:
 * 1. Global network overview & telemetry KPIs
 * 2. 2D schematic network map
 * 3. Earth ground station registry, construction, and upgrades
 * 4. Communication satellite constellation registry and calibration
 * 5. Planetary relay network deployment and upgrades
 * 6. Solar System coverage matrix and bottleneck diagnostics
 * 7. Outage alerts and emergency recovery controls
 *
 * NOTE: Strictly adheres to 2D UI architecture, PixiJS v8, and project design tokens.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_COLORS, UI_FONTS, UI_SPACING, UI_RADIUS } from '../../ui/core/UIDesignTokens';
import { UIButton } from '../../ui/components/UIButton';
import { UITabGroup } from '../../ui/components/UITabGroup';
import { UIProgressBar } from '../../ui/components/UIProgressBar';
import { CommunicationsNetworkManager } from '../CommunicationsNetworkManager';
import { NetworkSchematicMap } from './NetworkSchematicMap';
import {
  InfrastructureType,
  RecoveryMethod,
  CoverageRating,
} from '../NetworkTypes';
import { DestinationId } from '../../destinations/DestinationTypes';

export interface CommunicationsManagementViewOptions {
  width?: number;
  height?: number;
  onClose?: () => void;
  manager?: CommunicationsNetworkManager;
}

export class CommunicationsManagementView {
  public readonly container: Container;

  private width: number;
  private height: number;
  private manager: CommunicationsNetworkManager;
  private options: CommunicationsManagementViewOptions;

  private backdropGfx: Graphics;
  private panelGfx: Graphics;
  private headerContainer: Container;
  private contentContainer: Container;
  private tabGroup?: UITabGroup;

  private schematicMap?: NetworkSchematicMap;
  private currentTabId: string = 'tab_overview';
  private feedbackText?: Text;

  constructor(options: CommunicationsManagementViewOptions = {}) {
    this.options = options;
    this.width = options.width ?? 1560;
    this.height = options.height ?? 880;
    this.manager = options.manager ?? CommunicationsNetworkManager.getInstance();

    this.container = new Container();
    this.container.label = 'CommunicationsManagementView';
    this.container.visible = false;
    this.container.zIndex = 1000;

    this.backdropGfx = new Graphics();
    this.panelGfx = new Graphics();
    this.headerContainer = new Container();
    this.contentContainer = new Container();

    this.container.addChild(this.backdropGfx);
    this.container.addChild(this.panelGfx);
    this.container.addChild(this.headerContainer);
    this.container.addChild(this.contentContainer);

    this.buildBackdrop();
    this.buildPanel();
    this.buildHeader();
    this.buildTabGroup();
    this.switchTab('tab_overview');
  }

  public show(): void {
    this.container.visible = true;
    this.refreshContent();
  }

  public hide(): void {
    this.container.visible = false;
  }

  public isVisible(): boolean {
    return this.container.visible;
  }

  private buildBackdrop(): void {
    this.backdropGfx.clear();
    this.backdropGfx
      .rect(0, 0, 1920, 1080)
      .fill({ color: 0x020617, alpha: 0.85 });
    this.backdropGfx.eventMode = 'static';
  }

  private buildPanel(): void {
    const x = (1920 - this.width) / 2;
    const y = (1080 - this.height) / 2;

    this.panelGfx.clear();
    this.panelGfx
      .roundRect(x, y, this.width, this.height, UI_RADIUS.LG)
      .fill({ color: UI_COLORS.BG_PANEL, alpha: 0.98 })
      .stroke({ color: UI_COLORS.BORDER_DEFAULT, width: 2 });
  }

  private buildHeader(): void {
    this.headerContainer.removeChildren();

    const x = (1920 - this.width) / 2 + UI_SPACING.LG;
    const y = (1080 - this.height) / 2 + UI_SPACING.MD;

    // Header title
    const titleStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 22,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
      letterSpacing: 2,
    });
    const title = new Text({ text: 'COMMUNICATIONS & SATELLITE NETWORK', style: titleStyle });
    title.x = x;
    title.y = y;
    this.headerContainer.addChild(title);

    // Subtitle
    const subStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 12,
      fill: UI_COLORS.TEXT_SECONDARY,
    });
    const sub = new Text({
      text: 'DEEP SPACE TELEMETRY, RELAY CONSTELLATIONS & GROUND ARRAYS',
      style: subStyle,
    });
    sub.x = x;
    sub.y = y + 28;
    this.headerContainer.addChild(sub);

    // Close button
    const closeBtn = new UIButton({
      label: 'CLOSE [ESC]',
      width: 140,
      height: 38,
      variant: 'SECONDARY',
      onClick: () => {
        this.hide();
        if (this.options.onClose) this.options.onClose();
      },
    });
    closeBtn.container.x = x + this.width - 180;
    closeBtn.container.y = y;
    this.headerContainer.addChild(closeBtn.container);

    // Feedback status notification text
    const fbStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 12,
      fill: UI_COLORS.TEXT_SUCCESS,
    });
    this.feedbackText = new Text({ text: 'NETWORK TELEMETRY ONLINE', style: fbStyle });
    this.feedbackText.x = x + 600;
    this.feedbackText.y = y + 10;
    this.headerContainer.addChild(this.feedbackText);
  }

  private buildTabGroup(): void {
    const x = (1920 - this.width) / 2 + UI_SPACING.LG;
    const y = (1080 - this.height) / 2 + 75;

    this.tabGroup = new UITabGroup({
      tabs: [
        { id: 'tab_overview', label: 'NETWORK MAP & OVERVIEW' },
        { id: 'tab_stations', label: 'GROUND STATIONS' },
        { id: 'tab_satellites', label: 'SATELLITE FLEET' },
        { id: 'tab_relays', label: 'PLANETARY RELAYS' },
        { id: 'tab_coverage', label: 'SOLAR SYSTEM COVERAGE' },
      ],
      initialTabId: 'tab_overview',
      width: this.width - UI_SPACING.LG * 2,
      height: 40,
      onTabChange: (tabId) => {
        this.switchTab(tabId);
      },
    });

    this.tabGroup.container.x = x;
    this.tabGroup.container.y = y;
    this.container.addChild(this.tabGroup.container);
  }

  public switchTab(tabId: string): void {
    this.currentTabId = tabId;
    this.refreshContent();
  }

  public refreshContent(): void {
    this.contentContainer.removeChildren();

    const startX = (1920 - this.width) / 2 + UI_SPACING.LG;
    const startY = (1080 - this.height) / 2 + 130;

    switch (this.currentTabId) {
      case 'tab_overview':
        this.renderOverviewTab(startX, startY);
        break;
      case 'tab_stations':
        this.renderGroundStationsTab(startX, startY);
        break;
      case 'tab_satellites':
        this.renderSatellitesTab(startX, startY);
        break;
      case 'tab_relays':
        this.renderRelaysTab(startX, startY);
        break;
      case 'tab_coverage':
        this.renderCoverageTab(startX, startY);
        break;
    }
  }

  // =========================================================================
  // TAB 1: OVERVIEW & MAP
  // =========================================================================

  private renderOverviewTab(x: number, y: number): void {
    const status = this.manager.getNetworkStatus();

    // 1. KPI Cards Row
    const kpis = [
      { label: 'GROUND STATIONS', val: `${status.operationalGroundStations} / ${status.totalGroundStations}`, col: UI_COLORS.CYAN },
      { label: 'ACTIVE SATELLITES', val: `${status.activeSatellites} / ${status.totalSatellites}`, col: UI_COLORS.GREEN },
      { label: 'PLANETARY RELAYS', val: `${status.operationalRelays} / ${status.totalRelays}`, col: UI_COLORS.BLUE },
      { label: 'TOTAL CAPACITY', val: `${status.totalNetworkCapacity} Gbps`, col: UI_COLORS.TEXT_PRIMARY },
      { label: 'NETWORK HEALTH', val: `${status.networkHealthScore}%`, col: status.networkHealthScore > 80 ? UI_COLORS.GREEN : UI_COLORS.AMBER },
      { label: 'ACTIVE OUTAGES', val: `${status.activeOutagesCount}`, col: status.activeOutagesCount === 0 ? UI_COLORS.TEXT_MUTED : UI_COLORS.RED },
    ];

    const cardWidth = 240;
    kpis.forEach((kpi, idx) => {
      const cx = x + idx * (cardWidth + 12);
      const cardGfx = new Graphics();
      cardGfx
        .roundRect(cx, y, cardWidth, 65, UI_RADIUS.MD)
        .fill({ color: UI_COLORS.BG_PANEL_ELEVATED, alpha: 0.8 })
        .stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
      this.contentContainer.addChild(cardGfx);

      const lStyle = new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 10, fill: UI_COLORS.TEXT_SECONDARY });
      const label = new Text({ text: kpi.label, style: lStyle });
      label.x = cx + 12;
      label.y = y + 10;
      this.contentContainer.addChild(label);

      const vStyle = new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 18, fontWeight: 'bold', fill: kpi.col });
      const val = new Text({ text: kpi.val, style: vStyle });
      val.x = cx + 12;
      val.y = y + 30;
      this.contentContainer.addChild(val);
    });

    // 2. 2D Network Schematic Map
    const mapY = y + 80;
    this.schematicMap = new NetworkSchematicMap({
      width: 1050,
      height: 580,
      x: x,
      y: mapY,
      manager: this.manager,
    });
    this.contentContainer.addChild(this.schematicMap.container);

    // 3. Side Telemetry & Outage Alerts Panel
    const sideX = x + 1070;
    const sideWidth = 440;
    const sideGfx = new Graphics();
    sideGfx
      .roundRect(sideX, mapY, sideWidth, 580, UI_RADIUS.MD)
      .fill({ color: UI_COLORS.BG_SURFACE, alpha: 0.9 })
      .stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    this.contentContainer.addChild(sideGfx);

    const sideHeaderStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 14,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
    });
    const sideHeader = new Text({ text: 'ACTIVE NETWORK TELEMETRY', style: sideHeaderStyle });
    sideHeader.x = sideX + 16;
    sideHeader.y = mapY + 16;
    this.contentContainer.addChild(sideHeader);

    // Maintenance Trigger Button
    const maintBtn = new UIButton({
      label: `EXECUTE MAINTENANCE (₵${status.totalCycleMaintenanceCost})`,
      width: 400,
      height: 38,
      variant: 'PRIMARY',
      onClick: () => {
        const res = this.manager.processMaintenanceCycle();
        this.showFeedback(`MAINTENANCE COMPLETE: ₵${res.totalCostPaid} paid, ${res.operationalCount} online.`);
        this.refreshContent();
      },
    });
    maintBtn.container.x = sideX + 20;
    maintBtn.container.y = mapY + 520;
    this.contentContainer.addChild(maintBtn.container);

    // List active outages
    const outages = this.manager.getActiveOutages();
    let alertY = mapY + 50;

    if (outages.length === 0) {
      const allClearStyle = new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 12, fill: UI_COLORS.TEXT_SUCCESS });
      const allClear = new Text({ text: '✓ ALL NETWORK NODES NOMINAL\nNo solar interference or equipment faults.', style: allClearStyle });
      allClear.x = sideX + 16;
      allClear.y = alertY;
      this.contentContainer.addChild(allClear);
    } else {
      outages.forEach((outage) => {
        const oBox = new Graphics();
        oBox
          .roundRect(sideX + 12, alertY, sideWidth - 24, 75, UI_RADIUS.SM)
          .fill({ color: 0x450a0a, alpha: 0.7 })
          .stroke({ color: UI_COLORS.RED, width: 1 });
        this.contentContainer.addChild(oBox);

        const oTitleStyle = new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 12, fontWeight: 'bold', fill: UI_COLORS.RED });
        const oTitle = new Text({ text: `ALERT: ${outage.outageType}`, style: oTitleStyle });
        oTitle.x = sideX + 20;
        oTitle.y = alertY + 8;
        this.contentContainer.addChild(oTitle);

        const oDescStyle = new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 10, fill: UI_COLORS.TEXT_PRIMARY });
        const oDesc = new Text({ text: `${outage.description}\nTarget: ${outage.targetId}`, style: oDescStyle });
        oDesc.x = sideX + 20;
        oDesc.y = alertY + 28;
        this.contentContainer.addChild(oDesc);

        // Quick restore button
        const restoreBtn = new UIButton({
          label: 'RESTORE',
          width: 90,
          height: 28,
          variant: 'PRIMARY',
          onClick: () => {
            this.manager.restoreNetworkService(outage.targetId, RecoveryMethod.REMOTE_DIAGNOSTICS);
            this.showFeedback(`Restored service on ${outage.targetId}`);
            this.refreshContent();
          },
        });
        restoreBtn.container.x = sideX + sideWidth - 120;
        restoreBtn.container.y = alertY + 24;
        this.contentContainer.addChild(restoreBtn.container);

        alertY += 85;
      });
    }
  }

  // =========================================================================
  // TAB 2: GROUND STATIONS
  // =========================================================================

  private renderGroundStationsTab(x: number, y: number): void {
    const stations = this.manager.getAllGroundStations();

    let rowY = y;
    stations.forEach((st) => {
      const rowGfx = new Graphics();
      rowGfx
        .roundRect(x, rowY, this.width - UI_SPACING.LG * 2, 85, UI_RADIUS.MD)
        .fill({ color: UI_COLORS.BG_PANEL_ELEVATED, alpha: 0.85 })
        .stroke({ color: st.isUnlocked ? UI_COLORS.BORDER_SUBTLE : 0x334155, width: 1 });
      this.contentContainer.addChild(rowGfx);

      // Station Name & Location
      const nameStyle = new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 14,
        fontWeight: 'bold',
        fill: st.isUnlocked ? UI_COLORS.CYAN : UI_COLORS.TEXT_MUTED,
      });
      const name = new Text({ text: `${st.name} [${st.id}]`, style: nameStyle });
      name.x = x + 16;
      name.y = rowY + 12;
      this.contentContainer.addChild(name);

      const locStyle = new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 11, fill: UI_COLORS.TEXT_SECONDARY });
      const loc = new Text({ text: `Location: ${st.location} | Long: ${st.longitudeDeg}° Lat: ${st.latitudeDeg}°`, style: locStyle });
      loc.x = x + 16;
      loc.y = rowY + 36;
      this.contentContainer.addChild(loc);

      // Specs
      const specStyle = new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 11, fill: UI_COLORS.TEXT_MUTED });
      const spec = new Text({
        text: `Bandwidth: ${st.capacityRating} Gbps | Dish: ${st.dishDiameterMeters}m (+${st.signalGainDb} dB) | Upkeep: ₵${st.maintenanceCost}/cycle`,
        style: specStyle,
      });
      spec.x = x + 16;
      spec.y = rowY + 56;
      this.contentContainer.addChild(spec);

      // Status Badge
      const statusColor = st.status === 'OPERATIONAL' ? UI_COLORS.GREEN : st.status === 'DEGRADED' ? UI_COLORS.AMBER : UI_COLORS.RED;
      const statusStyle = new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 12, fontWeight: 'bold', fill: statusColor });
      const statusText = new Text({ text: st.isUnlocked ? st.status : 'LOCKED / UNBUILT', style: statusStyle });
      statusText.x = x + 720;
      statusText.y = rowY + 32;
      this.contentContainer.addChild(statusText);

      // Level Badge
      const lvlStyle = new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 12, fill: UI_COLORS.CYAN });
      const lvl = new Text({ text: `TIER ${st.upgradeLevel} / ${st.maxUpgradeLevel}`, style: lvlStyle });
      lvl.x = x + 920;
      lvl.y = rowY + 32;
      this.contentContainer.addChild(lvl);

      // Action Buttons
      if (st.isUnlocked) {
        if (st.upgradeLevel < st.maxUpgradeLevel) {
          const cost = st.upgradeLevel * 25000;
          const upBtn = new UIButton({
            label: `UPGRADE (₵${cost})`,
            width: 170,
            height: 34,
            variant: 'PRIMARY',
            onClick: () => {
              const res = this.manager.upgradeNetworkInfrastructure(InfrastructureType.GROUND_STATION, st.id);
              if (res.success) {
                this.showFeedback(`Upgraded ${st.name} to Level ${res.newLevel}!`);
              } else {
                this.showFeedback(res.reason || 'Upgrade failed.');
              }
              this.refreshContent();
            },
          });
          upBtn.container.x = x + 1100;
          upBtn.container.y = rowY + 25;
          this.contentContainer.addChild(upBtn.container);
        }

        const diagBtn = new UIButton({
          label: 'DIAGNOSTICS',
          width: 130,
          height: 34,
          variant: 'SECONDARY',
          onClick: () => {
            this.manager.restoreNetworkService(st.id, RecoveryMethod.REMOTE_DIAGNOSTICS);
            this.showFeedback(`Diagnostics & alignment completed on ${st.name}`);
            this.refreshContent();
          },
        });
        diagBtn.container.x = x + 1290;
        diagBtn.container.y = rowY + 25;
        this.contentContainer.addChild(diagBtn.container);
      } else {
        const buildCost = st.unlockRequirements.costCredits ?? 50000;
        const buildBtn = new UIButton({
          label: `CONSTRUCT (₵${buildCost})`,
          width: 190,
          height: 34,
          variant: 'PRIMARY',
          onClick: () => {
            try {
              this.manager.registerGroundStation(st);
              this.showFeedback(`Constructed and commissioned ${st.name}!`);
            } catch (err: any) {
              this.showFeedback(err.message);
            }
            this.refreshContent();
          },
        });
        buildBtn.container.x = x + 1100;
        buildBtn.container.y = rowY + 25;
        this.contentContainer.addChild(buildBtn.container);
      }

      rowY += 95;
    });
  }

  // =========================================================================
  // TAB 3: SATELLITE FLEET
  // =========================================================================

  private renderSatellitesTab(x: number, y: number): void {
    const satellites = this.manager.getAllSatellites();

    let rowY = y;
    satellites.forEach((sat) => {
      const rowGfx = new Graphics();
      rowGfx
        .roundRect(x, rowY, this.width - UI_SPACING.LG * 2, 85, UI_RADIUS.MD)
        .fill({ color: UI_COLORS.BG_PANEL_ELEVATED, alpha: 0.85 })
        .stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
      this.contentContainer.addChild(rowGfx);

      const nameStyle = new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 14,
        fontWeight: 'bold',
        fill: UI_COLORS.GREEN,
      });
      const name = new Text({ text: `${sat.name} [${sat.id}]`, style: nameStyle });
      name.x = x + 16;
      name.y = rowY + 12;
      this.contentContainer.addChild(name);

      const typeStyle = new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 11, fill: UI_COLORS.TEXT_SECONDARY });
      const type = new Text({
        text: `Type: ${sat.satelliteType} | Destination: ${sat.destinationId} | Power: ${sat.powerStatus}%`,
        style: typeStyle,
      });
      type.x = x + 16;
      type.y = rowY + 36;
      this.contentContainer.addChild(type);

      const specStyle = new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 11, fill: UI_COLORS.TEXT_MUTED });
      const spec = new Text({
        text: `Coverage Boost: +${sat.networkContribution.coverageBonus}% | Bandwidth: +${sat.networkContribution.bandwidthBonus} Gbps | Upkeep: ₵${sat.operationalCost}/cycle`,
        style: specStyle,
      });
      spec.x = x + 16;
      spec.y = rowY + 56;
      this.contentContainer.addChild(spec);

      // Status
      const statusColor = sat.status === 'ACTIVE' ? UI_COLORS.GREEN : UI_COLORS.AMBER;
      const statusStyle = new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 12, fontWeight: 'bold', fill: statusColor });
      const statusText = new Text({ text: sat.status, style: statusStyle });
      statusText.x = x + 750;
      statusText.y = rowY + 32;
      this.contentContainer.addChild(statusText);

      // Level
      const lvlStyle = new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 12, fill: UI_COLORS.CYAN });
      const lvl = new Text({ text: `TIER ${sat.upgradeLevel} / ${sat.maxUpgradeLevel}`, style: lvlStyle });
      lvl.x = x + 920;
      lvl.y = rowY + 32;
      this.contentContainer.addChild(lvl);

      // Upgrade Action
      if (sat.upgradeLevel < sat.maxUpgradeLevel) {
        const cost = sat.upgradeLevel * 18000;
        const upBtn = new UIButton({
          label: `UPGRADE (₵${cost})`,
          width: 170,
          height: 34,
          variant: 'PRIMARY',
          onClick: () => {
            const res = this.manager.upgradeNetworkInfrastructure(InfrastructureType.COMMUNICATION_SATELLITE, sat.id);
            if (res.success) {
              this.showFeedback(`Upgraded satellite ${sat.name}!`);
            } else {
              this.showFeedback(res.reason || 'Upgrade failed.');
            }
            this.refreshContent();
          },
        });
        upBtn.container.x = x + 1100;
        upBtn.container.y = rowY + 25;
        this.contentContainer.addChild(upBtn.container);
      }

      const calibBtn = new UIButton({
        label: 'CALIBRATE',
        width: 130,
        height: 34,
        variant: 'SECONDARY',
        onClick: () => {
          this.manager.restoreNetworkService(sat.id, RecoveryMethod.RECALIBRATION);
          this.showFeedback(`Satellite array recalibrated: ${sat.name}`);
          this.refreshContent();
        },
      });
      calibBtn.container.x = x + 1290;
      calibBtn.container.y = rowY + 25;
      this.contentContainer.addChild(calibBtn.container);

      rowY += 95;
    });
  }

  // =========================================================================
  // TAB 4: PLANETARY RELAYS
  // =========================================================================

  private renderRelaysTab(x: number, y: number): void {
    const relays = this.manager.getAllRelays();

    let rowY = y;
    relays.forEach((relay) => {
      const rowGfx = new Graphics();
      rowGfx
        .roundRect(x, rowY, this.width - UI_SPACING.LG * 2, 85, UI_RADIUS.MD)
        .fill({ color: UI_COLORS.BG_PANEL_ELEVATED, alpha: 0.85 })
        .stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
      this.contentContainer.addChild(rowGfx);

      const nameStyle = new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 14,
        fontWeight: 'bold',
        fill: UI_COLORS.BLUE,
      });
      const name = new Text({ text: `${relay.name} [${relay.id}]`, style: nameStyle });
      name.x = x + 16;
      name.y = rowY + 12;
      this.contentContainer.addChild(name);

      const locStyle = new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 11, fill: UI_COLORS.TEXT_SECONDARY });
      const loc = new Text({
        text: `Location: ${relay.deploymentLocation} (${relay.locationType}) | Condition: ${relay.conditionRating}%`,
        style: locStyle,
      });
      loc.x = x + 16;
      loc.y = rowY + 36;
      this.contentContainer.addChild(loc);

      const specStyle = new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 11, fill: UI_COLORS.TEXT_MUTED });
      const spec = new Text({
        text: `Surface Boost: +${relay.networkContribution.localSurfaceBonus}% | Range Mult: ${relay.networkContribution.rangeMultiplier}x | Upkeep: ₵${relay.maintenanceCost}/cycle`,
        style: specStyle,
      });
      spec.x = x + 16;
      spec.y = rowY + 56;
      this.contentContainer.addChild(spec);

      // Status
      const statusColor = relay.operationalState === 'OPERATIONAL' ? UI_COLORS.GREEN : UI_COLORS.AMBER;
      const statusStyle = new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 12, fontWeight: 'bold', fill: statusColor });
      const statusText = new Text({ text: relay.operationalState, style: statusStyle });
      statusText.x = x + 720;
      statusText.y = rowY + 32;
      this.contentContainer.addChild(statusText);

      // Level
      const lvlStyle = new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 12, fill: UI_COLORS.CYAN });
      const lvl = new Text({ text: `TIER ${relay.upgradeLevel} / ${relay.maxUpgradeLevel}`, style: lvlStyle });
      lvl.x = x + 920;
      lvl.y = rowY + 32;
      this.contentContainer.addChild(lvl);

      // Upgrade Action
      if (relay.upgradeLevel < relay.maxUpgradeLevel) {
        const cost = relay.upgradeLevel * 30000;
        const upBtn = new UIButton({
          label: `UPGRADE (₵${cost})`,
          width: 170,
          height: 34,
          variant: 'PRIMARY',
          onClick: () => {
            const res = this.manager.upgradeNetworkInfrastructure(InfrastructureType.PLANETARY_RELAY, relay.id);
            if (res.success) {
              this.showFeedback(`Upgraded relay ${relay.name}!`);
            } else {
              this.showFeedback(res.reason || 'Upgrade failed.');
            }
            this.refreshContent();
          },
        });
        upBtn.container.x = x + 1100;
        upBtn.container.y = rowY + 25;
        this.contentContainer.addChild(upBtn.container);
      }

      const svcBtn = new UIButton({
        label: 'SERVICE RELAY',
        width: 140,
        height: 34,
        variant: 'SECONDARY',
        onClick: () => {
          this.manager.restoreNetworkService(relay.id, RecoveryMethod.EMERGENCY_REPAIR);
          this.showFeedback(`Serviced and recalibrated ${relay.name}`);
          this.refreshContent();
        },
      });
      svcBtn.container.x = x + 1280;
      svcBtn.container.y = rowY + 25;
      this.contentContainer.addChild(svcBtn.container);

      rowY += 95;
    });
  }

  // =========================================================================
  // TAB 5: SOLAR SYSTEM COVERAGE
  // =========================================================================

  private renderCoverageTab(x: number, y: number): void {
    const destinationIds = [
      DestinationId.EARTH_ORBIT_LEO,
      DestinationId.EARTH_ORBIT_GEO,
      DestinationId.MOON,
      DestinationId.MARS,
      DestinationId.CERES,
      DestinationId.JUPITER,
      DestinationId.EUROPA,
      DestinationId.SATURN,
    ];

    let rowY = y;
    destinationIds.forEach((destId) => {
      const cov = this.manager.evaluateCoverage(destId);

      const rowGfx = new Graphics();
      rowGfx
        .roundRect(x, rowY, this.width - UI_SPACING.LG * 2, 70, UI_RADIUS.MD)
        .fill({ color: UI_COLORS.BG_PANEL_ELEVATED, alpha: 0.85 })
        .stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
      this.contentContainer.addChild(rowGfx);

      // Destination Name
      const nameStyle = new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 14,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
      });
      const name = new Text({ text: `${cov.destinationName} [${cov.destinationId}]`, style: nameStyle });
      name.x = x + 16;
      name.y = rowY + 12;
      this.contentContainer.addChild(name);

      // Coverage Bar
      const bar = new UIProgressBar({
        width: 180,
        height: 12,
        initialValue: cov.coveragePercentage / 100,
        fillColor: cov.coveragePercentage > 75 ? UI_COLORS.GREEN : cov.coveragePercentage > 40 ? UI_COLORS.AMBER : UI_COLORS.RED,
      });
      bar.container.x = x + 380;
      bar.container.y = rowY + 28;
      this.contentContainer.addChild(bar.container);

      // Rating Badge
      const rColor = cov.rating === CoverageRating.OPTIMAL ? UI_COLORS.GREEN :
                     cov.rating === CoverageRating.GOOD ? UI_COLORS.CYAN :
                     cov.rating === CoverageRating.PARTIAL ? UI_COLORS.AMBER : UI_COLORS.RED;
      const rStyle = new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 12, fontWeight: 'bold', fill: rColor });
      const rating = new Text({ text: `${cov.coveragePercentage}% (${cov.rating})`, style: rStyle });
      rating.x = x + 580;
      rating.y = rowY + 26;
      this.contentContainer.addChild(rating);

      // Latency & Downlink Multiplier
      const metStyle = new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 11, fill: UI_COLORS.TEXT_MUTED });
      const met = new Text({
        text: `Latency: ${cov.latencySeconds}s | Science Multiplier: ${cov.scienceMultiplier}x | Telemetry: ${cov.telemetryFidelity}%`,
        style: metStyle,
      });
      met.x = x + 16;
      met.y = rowY + 40;
      this.contentContainer.addChild(met);

      // Recommendations / Bottlenecks
      const note = cov.bottlenecks.length > 0 ? cov.bottlenecks[0] : 'Continuous high-fidelity communication coverage.';
      const noteStyle = new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 10, fill: UI_COLORS.TEXT_SECONDARY });
      const noteText = new Text({ text: note, style: noteStyle });
      noteText.x = x + 760;
      noteText.y = rowY + 26;
      this.contentContainer.addChild(noteText);

      rowY += 80;
    });
  }

  private showFeedback(msg: string): void {
    if (this.feedbackText) {
      this.feedbackText.text = msg.toUpperCase();
    }
  }

  public update(deltaSeconds: number): void {
    if (this.schematicMap && this.currentTabId === 'tab_overview') {
      this.schematicMap.updateAnimation(deltaSeconds);
    }
  }

  public destroy(): void {
    if (this.schematicMap) {
      this.schematicMap.destroy();
    }
    this.container.destroy({ children: true });
  }
}
