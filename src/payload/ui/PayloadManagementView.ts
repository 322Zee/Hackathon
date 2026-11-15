/**
 * INTERSTELLAR CONTINUUM - Payload Management Composite Operations View
 * Comprehensive aerospace interface coordinating:
 * 1. Filterable Payload Catalogue with category tabs
 * 2. Deep Payload Specifications & Educational Inspector
 * 3. Spacecraft Assignment Manifest & Quantity Controls
 * 4. Real-Time Physical Capacity & Envelope Telemetry (Mass, Power, Slots)
 * 5. Live Compatibility Feedback & Missing Requirement Alerts
 * 6. Transportation Mission Delivery Briefing
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../../ui/core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS, UI_SPACING } from '../../ui/core/UIDesignTokens';
import { UIButton } from '../../ui/components/UIButton';
import { PayloadDefinition, VehiclePayloadManifest } from '../PayloadTypes';
import { PayloadTransportationService } from '../PayloadTransportationService';
import { PayloadCataloguePanel } from './PayloadCataloguePanel';
import { PayloadDetailView } from './PayloadDetailView';
import { PayloadAssignmentPanel } from './PayloadAssignmentPanel';
import { PayloadCapacityIndicator } from './PayloadCapacityIndicator';
import { TransportationBriefingPanel } from './TransportationBriefingPanel';
import { TransportationMissionDefinition } from '../TransportationMissionTypes';

export type PayloadViewTab = 'CATALOGUE' | 'ASSIGNMENT' | 'MISSION_BRIEFING';

export interface PayloadManagementViewOptions {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  initialVehicleId?: string;
  initialMissionId?: string;
  onClose?: () => void;
}

export class PayloadManagementView extends UIComponent {
  private viewWidth: number;
  private viewHeight: number;

  private service: PayloadTransportationService;

  private bgGfx: Graphics;
  private headerContainer: Container;
  private topBarContainer: Container;
  private mainContentContainer: Container;

  private cataloguePanel: PayloadCataloguePanel;
  private detailView: PayloadDetailView;
  private assignmentPanel: PayloadAssignmentPanel;
  private capacityIndicator: PayloadCapacityIndicator;
  private briefingPanel: TransportationBriefingPanel;

  private currentTab: PayloadViewTab = 'ASSIGNMENT';
  private activeVehicleId: string;
  private activeMission?: TransportationMissionDefinition;
  private onCloseCb?: () => void;

  constructor(options: PayloadManagementViewOptions = {}) {
    super('PayloadManagementView');

    this.viewWidth = options.width ?? 1860;
    this.viewHeight = options.height ?? 920;
    this.container.position.set(options.x ?? 30, options.y ?? 130);

    this.service = PayloadTransportationService.getInstance();
    this.onCloseCb = options.onClose;

    // Resolve initial vehicle
    const allVehicles = this.service.spacecraftAdapters.listAllVehicles();
    this.activeVehicleId = options.initialVehicleId ?? (allVehicles.length > 0 ? allVehicles[0].id : 'proj_astra_1');

    if (options.initialMissionId) {
      this.activeMission = this.service.getTransportationMission(options.initialMissionId);
    }

    // 1. Background
    this.bgGfx = new Graphics();
    this.bgGfx.eventMode = 'static';
    this.container.addChild(this.bgGfx);

    // 2. Header Container
    this.headerContainer = new Container();
    this.headerContainer.position.set(UI_SPACING.LG, UI_SPACING.MD);
    this.container.addChild(this.headerContainer);

    // 3. Top Bar Navigation Tabs
    this.topBarContainer = new Container();
    this.topBarContainer.position.set(UI_SPACING.LG, 60);
    this.container.addChild(this.topBarContainer);

    // 4. Main Body Container
    this.mainContentContainer = new Container();
    this.mainContentContainer.position.set(UI_SPACING.LG, 105);
    this.container.addChild(this.mainContentContainer);

    // Initialize Subpanels
    this.cataloguePanel = new PayloadCataloguePanel(
      { width: 500, height: this.viewHeight - 125 },
      this.service.registry,
      this.service.categoryRegistry,
      this.service.inventoryManager
    );

    this.detailView = new PayloadDetailView(
      { width: 560, height: this.viewHeight - 125 },
      this.service.inventoryManager
    );

    this.assignmentPanel = new PayloadAssignmentPanel(
      {
        width: 730,
        height: this.viewHeight - 315,
        onManifestChanged: (manifest) => this.onManifestUpdated(manifest),
      },
      this.service.assignmentService,
      this.service.spacecraftAdapters
    );

    this.capacityIndicator = new PayloadCapacityIndicator({
      width: 730,
      height: 175,
    });

    this.briefingPanel = new TransportationBriefingPanel(
      { width: 730, height: this.viewHeight - 125 },
      this.service.registry
    );

    // Wire catalogue selection to detail view & assignment panel
    this.cataloguePanel = new PayloadCataloguePanel(
      {
        width: 500,
        height: this.viewHeight - 125,
        onSelectPayload: (payload) => this.onSelectPayload(payload),
      },
      this.service.registry,
      this.service.categoryRegistry,
      this.service.inventoryManager
    );

    this.renderFrame();
    this.buildHeader();
    this.buildTabs();
    this.refreshLayout();

    // Select first payload by default
    const available = this.service.listPayloads();
    if (available.length > 0) {
      this.cataloguePanel.selectPayload(available[0].id);
    }
  }

  private renderFrame(): void {
    this.bgGfx.clear();
    this.bgGfx.roundRect(0, 0, this.viewWidth, this.viewHeight, UI_RADIUS.LG);
    this.bgGfx.fill({ color: UI_COLORS.BG_DARK, alpha: 0.98 });
    this.bgGfx.stroke({ color: UI_COLORS.BORDER_FOCUS, width: 2 });
  }

  private buildHeader(): void {
    this.headerContainer.removeChildren();

    const title = new Text({
      text: 'PAYLOAD LOGISTICS & TRANSPORTATION OPERATIONS',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 18,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_ACCENT,
        letterSpacing: 1.5,
      }),
    });
    title.position.set(0, 0);

    const vehicle = this.service.spacecraftAdapters.getVehicle(this.activeVehicleId);
    const sub = new Text({
      text: `ACTIVE CARRIER: ${vehicle?.name ?? this.activeVehicleId}  |  STATUS: CERTIFIED FOR CARGO INTEGRATION`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fill: UI_COLORS.TEXT_SECONDARY,
      }),
    });
    sub.position.set(0, 24);

    this.headerContainer.addChild(title, sub);

    if (this.onCloseCb) {
      const closeBtn = new UIButton({
        label: 'EXIT',
        width: 100,
        height: 28,
        onClick: this.onCloseCb,
      });
      closeBtn.container.position.set(this.viewWidth - 140, 0);
      this.headerContainer.addChild(closeBtn.container);
    }
  }

  private buildTabs(): void {
    this.topBarContainer.removeChildren();

    const tabs: { id: PayloadViewTab; label: string }[] = [
      { id: 'ASSIGNMENT', label: 'PAYLOAD ASSIGNMENT & MANIFEST' },
      { id: 'CATALOGUE', label: 'AGENCY PAYLOAD REGISTRY' },
      { id: 'MISSION_BRIEFING', label: 'TRANSPORTATION MISSION BRIEFING' },
    ];

    let x = 0;
    for (const t of tabs) {
      const isSelected = this.currentTab === t.id;
      const btn = new UIButton({
        label: t.label,
        width: 250,
        height: 32,
        variant: isSelected ? 'primary' : 'secondary',
        onClick: () => {
          this.currentTab = t.id;
          this.buildTabs();
          this.refreshLayout();
        },
      });
      btn.container.position.set(x, 0);
      this.topBarContainer.addChild(btn.container);
      x += 258;
    }
  }

  private refreshLayout(): void {
    this.mainContentContainer.removeChildren();

    // Left Panel: Catalogue (500px)
    this.cataloguePanel.container.position.set(0, 0);
    this.mainContentContainer.addChild(this.cataloguePanel.container);

    // Center Panel: Payload Detail Dossier (560px)
    this.detailView.container.position.set(520, 0);
    this.mainContentContainer.addChild(this.detailView.container);

    // Right Panel: Switchable between Assignment + Capacity and Mission Briefing
    const rightX = 1100;

    if (this.currentTab === 'MISSION_BRIEFING') {
      this.briefingPanel.container.position.set(rightX, 0);
      this.briefingPanel.setMission(this.activeMission);
      this.mainContentContainer.addChild(this.briefingPanel.container);
    } else {
      // Assignment Manifest & Live Capacity Indicator
      this.capacityIndicator.container.position.set(rightX, 0);
      this.mainContentContainer.addChild(this.capacityIndicator.container);

      this.assignmentPanel.container.position.set(rightX, 190);
      this.mainContentContainer.addChild(this.assignmentPanel.container);

      this.updateCapacityDisplay();
    }
  }

  private onSelectPayload(payload: PayloadDefinition): void {
    this.detailView.setPayload(payload);
    this.assignmentPanel.setSelectedPayload(payload);
  }

  private onManifestUpdated(manifest: VehiclePayloadManifest): void {
    this.updateCapacityDisplay();
    this.detailView.setPayload(this.cataloguePanel.getSelectedPayload());
  }

  private updateCapacityDisplay(): void {
    const vehicle = this.service.spacecraftAdapters.getVehicle(this.activeVehicleId);
    if (vehicle) {
      const metrics = this.service.getRemainingCapacity(this.activeVehicleId);
      this.capacityIndicator.updateCapacity(metrics, vehicle.capacity);
    }
  }

  public setActiveVehicle(vehicleId: string): void {
    this.activeVehicleId = vehicleId;
    this.assignmentPanel.setActiveVehicle(vehicleId);
    this.buildHeader();
    this.updateCapacityDisplay();
  }

  public setActiveMission(mission: TransportationMissionDefinition): void {
    this.activeMission = mission;
    this.assignmentPanel.setActiveMission(mission);
    this.briefingPanel.setMission(mission);
    this.refreshLayout();
  }

  public getSelectedPayload(): PayloadDefinition | undefined {
    return this.cataloguePanel.getSelectedPayload();
  }

  public getActiveVehicleId(): string {
    return this.activeVehicleId;
  }

  public override destroy(): void {
    this.cataloguePanel.destroy();
    this.detailView.destroy();
    this.assignmentPanel.destroy();
    this.capacityIndicator.destroy();
    this.briefingPanel.destroy();
    super.destroy();
  }
}
