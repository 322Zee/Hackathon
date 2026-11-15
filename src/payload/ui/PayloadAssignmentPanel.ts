/**
 * INTERSTELLAR CONTINUUM - Payload Assignment Panel
 * Tactical operations panel enabling spacecraft selection, payload mounting/removal,
 * manifest quantity modification, compatibility feedback, and missing requirement alerts.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_COLORS, UI_FONTS, UI_RADIUS, UI_SPACING } from '../../ui/core/UIDesignTokens';
import { UIButton } from '../../ui/components/UIButton';
import {
  VehiclePayloadManifest,
  PayloadDefinition,
  PayloadValidationResult,
} from '../PayloadTypes';
import { PayloadAssignmentService } from '../PayloadAssignmentService';
import { SpacecraftAdapterRegistry, IVehiclePayloadTarget } from '../adapters/SpacecraftAdapter';
import { TransportationMissionDefinition } from '../TransportationMissionTypes';

export interface AssignmentPanelOptions {
  width?: number;
  height?: number;
  onManifestChanged?: (manifest: VehiclePayloadManifest) => void;
}

export class PayloadAssignmentPanel {
  public readonly container: Container;
  private width: number;
  private height: number;

  private bgGfx: Graphics;
  private contentContainer: Container;

  private assignmentService: PayloadAssignmentService;
  private vehicleRegistry: SpacecraftAdapterRegistry;

  private activeVehicleId: string;
  private activeMission?: TransportationMissionDefinition;
  private selectedPayload?: PayloadDefinition;

  private onManifestChangedCb?: (manifest: VehiclePayloadManifest) => void;

  constructor(
    options: AssignmentPanelOptions = {},
    assignmentService?: PayloadAssignmentService,
    vehicleRegistry?: SpacecraftAdapterRegistry
  ) {
    this.width = options.width ?? 680;
    this.height = options.height ?? 700;
    this.container = new Container();

    this.assignmentService = assignmentService ?? PayloadAssignmentService.getInstance();
    this.vehicleRegistry = vehicleRegistry ?? SpacecraftAdapterRegistry.getInstance();
    this.onManifestChangedCb = options.onManifestChanged;

    // Pick first available vehicle by default
    const vehicles = this.vehicleRegistry.listAllVehicles();
    this.activeVehicleId = vehicles.length > 0 ? vehicles[0].id : 'proj_astra_1';

    this.bgGfx = new Graphics();
    this.container.addChild(this.bgGfx);

    this.contentContainer = new Container();
    this.contentContainer.position.set(UI_SPACING.MD, UI_SPACING.MD);
    this.container.addChild(this.contentContainer);

    this.renderFrame();
    this.renderPanel();
  }

  private renderFrame(): void {
    this.bgGfx.clear();
    this.bgGfx.roundRect(0, 0, this.width, this.height, UI_RADIUS.MD);
    this.bgGfx.fill({ color: UI_COLORS.BG_PANEL, alpha: 0.95 });
    this.bgGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
  }

  public setActiveVehicle(vehicleId: string): void {
    this.activeVehicleId = vehicleId;
    this.renderPanel();
  }

  public getActiveVehicleId(): string {
    return this.activeVehicleId;
  }

  public setActiveMission(mission?: TransportationMissionDefinition): void {
    this.activeMission = mission;
    this.renderPanel();
  }

  public setSelectedPayload(payload?: PayloadDefinition): void {
    this.selectedPayload = payload;
    this.renderPanel();
  }

  public renderPanel(): void {
    this.contentContainer.removeChildren();

    const vehicle = this.vehicleRegistry.getVehicle(this.activeVehicleId);
    const manifest = this.assignmentService.getVehicleManifest(this.activeVehicleId);

    let currentY = 0;

    // 1. Vehicle Selector Header
    const vHeader = new Text({
      text: `ASSIGNMENT MANIFEST: ${vehicle?.name.toUpperCase() ?? this.activeVehicleId}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 14,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_ACCENT,
        letterSpacing: 1.0,
      }),
    });
    vHeader.position.set(0, currentY);
    this.contentContainer.addChild(vHeader);
    currentY += 26;

    // 2. Compatibility Feedback for currently selected payload
    if (this.selectedPayload) {
      const feedback = this.assignmentService.getCompatibilityFeedback(
        this.activeVehicleId,
        this.selectedPayload.id
      );

      const fBox = new Graphics();
      fBox.roundRect(0, currentY, this.width - UI_SPACING.MD * 2, 45, UI_RADIUS.SM);
      fBox.fill({
        color: feedback.isCompatible ? UI_COLORS.BG_SURFACE : 0x2a0e0e,
        alpha: 0.9,
      });
      fBox.stroke({
        color: feedback.isCompatible ? UI_COLORS.BORDER_DEFAULT : UI_COLORS.BORDER_FOCUS,
        width: 1,
      });
      this.contentContainer.addChild(fBox);

      const fText = new Text({
        text: `SELECTION: "${this.selectedPayload.name}" — ${feedback.details}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11,
          fill: feedback.isCompatible ? UI_COLORS.TEXT_SUCCESS : UI_COLORS.TEXT_DANGER,
        }),
      });
      fText.position.set(10, currentY + 12);
      this.contentContainer.addChild(fText);

      // Assign / Add Button
      const assignBtn = new UIButton({
        label: '+ ASSIGN PAYLOAD',
        width: 160,
        height: 28,
        onClick: () => {
          this.assignmentService.assignPayload(
            this.activeVehicleId,
            this.selectedPayload!.id,
            1,
            this.activeMission?.id
          );
          this.notifyChanged();
          this.renderPanel();
        },
      });
      assignBtn.container.position.set(this.width - 200, currentY + 8);
      this.contentContainer.addChild(assignBtn.container);

      currentY += 56;
    }

    // 3. Missing Requirements Banner (if mission is active)
    if (this.activeMission) {
      const missingAnalysis = this.assignmentService.getMissingRequirements(
        this.activeVehicleId,
        this.activeMission.requiredPayloads.map((r) => ({
          payloadId: r.payloadId,
          requiredQuantity: r.requiredQuantity,
        }))
      );

      if (!missingAnalysis.isComplete) {
        const mBox = new Graphics();
        mBox.roundRect(0, currentY, this.width - UI_SPACING.MD * 2, 44, UI_RADIUS.SM);
        mBox.fill({ color: 0x2d1a04, alpha: 0.9 });
        mBox.stroke({ color: UI_COLORS.BORDER_FOCUS, width: 1 });
        this.contentContainer.addChild(mBox);

        const missingDesc = missingAnalysis.missingItems
          .map((m) => `${m.deficit}x ${m.payloadName}`)
          .join(', ');

        const mText = new Text({
          text: `MISSION CONTRACT DEFICIT: Missing ${missingDesc}`,
          style: new TextStyle({
            fontFamily: UI_FONTS.FAMILY,
            fontSize: 11,
            fontWeight: 'bold',
            fill: UI_COLORS.TEXT_WARNING,
          }),
        });
        mText.position.set(10, currentY + 14);
        this.contentContainer.addChild(mText);
        currentY += 54;
      }
    }

    // 4. Manifest Items List
    const listTitle = new Text({
      text: `LOADED PAYLOADS (${manifest.assignedPayloads.size} ITEMS)`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 12,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
      }),
    });
    listTitle.position.set(0, currentY);
    this.contentContainer.addChild(listTitle);
    currentY += 24;

    if (manifest.assignedPayloads.size === 0) {
      const emptyMsg = new Text({
        text: 'No payloads currently mounted. Select an item from the catalogue to assign.',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11,
          fill: UI_COLORS.TEXT_MUTED,
        }),
      });
      emptyMsg.position.set(10, currentY + 15);
      this.contentContainer.addChild(emptyMsg);
      currentY += 60;
    } else {
      for (const [pId, item] of manifest.assignedPayloads.entries()) {
        const itemCard = this.renderManifestItemCard(item, currentY);
        this.contentContainer.addChild(itemCard);
        currentY += 50;
      }
    }

    currentY += 10;

    // 5. Manifest Action Controls (Clear All, Validate)
    const clearBtn = new UIButton({
      label: 'CLEAR MANIFEST',
      width: 150,
      height: 32,
      onClick: () => {
        this.assignmentService.clearVehicleManifest(
          this.activeVehicleId,
          this.activeMission?.id
        );
        this.notifyChanged();
        this.renderPanel();
      },
    });
    clearBtn.container.position.set(0, currentY);
    this.contentContainer.addChild(clearBtn.container);

    const validateBtn = new UIButton({
      label: 'VALIDATE MANIFEST',
      width: 170,
      height: 32,
      onClick: () => {
        const result = this.assignmentService.validateVehicleAssignment(
          this.activeVehicleId,
          {
            destinationId: this.activeMission?.destinationId,
            requiredMissionPayloads: this.activeMission?.requiredPayloads,
          }
        );
        this.displayValidationFeedback(result);
      },
    });
    validateBtn.container.position.set(170, currentY);
    this.contentContainer.addChild(validateBtn.container);
  }

  private renderManifestItemCard(
    item: { payloadId: string; quantity: number; totalMassRating: number; totalPowerRequirement: number; totalStorageRequirement: number },
    y: number
  ): Container {
    const card = new Container();
    card.position.set(0, y);

    const payload = this.assignmentService.getPayloadInfo(item.payloadId);
    const pName = payload?.name ?? item.payloadId;

    const bg = new Graphics();
    bg.roundRect(0, 0, this.width - UI_SPACING.MD * 2, 42, UI_RADIUS.SM);
    bg.fill({ color: UI_COLORS.BG_SURFACE, alpha: 0.85 });
    bg.stroke({ color: UI_COLORS.BORDER_DIM, width: 1 });
    card.addChild(bg);

    const nameText = new Text({
      text: `${item.quantity}x ${pName.toUpperCase()}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 12,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
      }),
    });
    nameText.position.set(12, 6);

    const statsText = new Text({
      text: `Total: ${item.totalMassRating} MU  |  ${item.totalPowerRequirement} PWR  |  ${item.totalStorageRequirement} Slots`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fill: UI_COLORS.TEXT_SECONDARY,
      }),
    });
    statsText.position.set(12, 22);

    card.addChild(nameText, statsText);

    // Quantity buttons: - and +
    const minusBtn = new UIButton({
      label: '-',
      width: 32,
      height: 26,
      onClick: () => {
        this.assignmentService.removePayload(
          this.activeVehicleId,
          item.payloadId,
          1,
          this.activeMission?.id
        );
        this.notifyChanged();
        this.renderPanel();
      },
    });
    minusBtn.container.position.set(this.width - 150, 8);

    const plusBtn = new UIButton({
      label: '+',
      width: 32,
      height: 26,
      onClick: () => {
        this.assignmentService.assignPayload(
          this.activeVehicleId,
          item.payloadId,
          1,
          this.activeMission?.id
        );
        this.notifyChanged();
        this.renderPanel();
      },
    });
    plusBtn.container.position.set(this.width - 110, 8);

    // Trash / Remove all
    const trashBtn = new UIButton({
      label: 'X',
      width: 32,
      height: 26,
      onClick: () => {
        this.assignmentService.removePayload(
          this.activeVehicleId,
          item.payloadId,
          item.quantity,
          this.activeMission?.id
        );
        this.notifyChanged();
        this.renderPanel();
      },
    });
    trashBtn.container.position.set(this.width - 70, 8);

    card.addChild(minusBtn.container, plusBtn.container, trashBtn.container);
    return card;
  }

  private displayValidationFeedback(result: PayloadValidationResult): void {
    // Show validation popup / banner in panel
    this.renderPanel();

    const bannerY = this.height - 120;
    const banner = new Graphics();
    banner.roundRect(0, bannerY, this.width - UI_SPACING.MD * 2, 80, UI_RADIUS.SM);
    banner.fill({
      color: result.isValid ? 0x062816 : 0x2e0808,
      alpha: 0.95,
    });
    banner.stroke({
      color: result.isValid ? UI_COLORS.GREEN : UI_COLORS.RED,
      width: 1.5,
    });
    this.contentContainer.addChild(banner);

    const statusTitle = new Text({
      text: result.isValid
        ? '✓ MANIFEST VERIFIED: ALL CHECKS PASSED'
        : `✗ VALIDATION REJECTED: ${result.errors.length} ISSUE(S) DETECTED`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 12,
        fontWeight: 'bold',
        fill: result.isValid ? UI_COLORS.TEXT_SUCCESS : UI_COLORS.TEXT_DANGER,
      }),
    });
    statusTitle.position.set(12, bannerY + 10);
    this.contentContainer.addChild(statusTitle);

    const detailText = new Text({
      text: result.isValid
        ? 'Vehicle mass, power, storage, fairing clearance, and mission payload contracts satisfied.'
        : result.errors[0]?.message ?? 'Manifest exceeds capacity or violates constraints.',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fill: UI_COLORS.TEXT_SECONDARY,
        wordWrap: true,
        wordWrapWidth: this.width - UI_SPACING.MD * 2 - 24,
      }),
    });
    detailText.position.set(12, bannerY + 34);
    this.contentContainer.addChild(detailText);
  }

  private notifyChanged(): void {
    if (this.onManifestChangedCb) {
      this.onManifestChangedCb(this.assignmentService.getVehicleManifest(this.activeVehicleId));
    }
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
