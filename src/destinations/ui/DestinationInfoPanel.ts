/**
 * INTERSTELLAR CONTINUUM - Destination Information Panel
 * Tactical aerospace panel presenting comprehensive scientific telemetry,
 * physical metrics, environmental classifications, surface availability,
 * exploration methods, communication profiles, and progression unlock tracking.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../../ui/core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS, UI_SPACING } from '../../ui/core/UIDesignTokens';
import { UIButton } from '../../ui/components/UIButton';
import {
  DestinationRecord,
  SurfaceAvailability,
} from '../DestinationTypes';
import { DestinationRegistry } from '../DestinationRegistry';

export interface DestinationInfoPanelOptions {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  onBrowseMissions?: (destination: DestinationRecord) => void;
  onViewSubDestinations?: (destination: DestinationRecord) => void;
  onClose?: () => void;
}

export class DestinationInfoPanel extends UIComponent {
  private panelWidth: number;
  private panelHeight: number;
  private currentDestination: DestinationRecord | null = null;
  private registry: DestinationRegistry;

  private backgroundGfx: Graphics;
  private headerContainer: Container;
  private specsContainer: Container;
  private missionContainer: Container;
  private lockNoticeContainer: Container;
  private actionsContainer: Container;

  private nameText: Text;
  private subtitleText: Text;
  private categoryText: Text;
  private statusBadgeText: Text;
  private surfaceBadgeText: Text;
  private descText: Text;

  private browseMissionsBtn: UIButton;
  private viewSubDestinationsBtn: UIButton;
  private closeBtn: UIButton;

  private onBrowseMissionsCb?: (destination: DestinationRecord) => void;
  private onViewSubDestinationsCb?: (destination: DestinationRecord) => void;
  private onCloseCb?: () => void;

  constructor(options: DestinationInfoPanelOptions = {}) {
    super('DestinationInfoPanel');

    this.panelWidth = options.width ?? 500;
    this.panelHeight = options.height ?? 890;
    this.container.position.set(options.x ?? 1380, options.y ?? 130);
    this.registry = DestinationRegistry.getInstance();

    this.onBrowseMissionsCb = options.onBrowseMissions;
    this.onViewSubDestinationsCb = options.onViewSubDestinations;
    this.onCloseCb = options.onClose;

    // 1. Background Panel Frame
    this.backgroundGfx = new Graphics();
    this.backgroundGfx.eventMode = 'static';
    this.container.addChild(this.backgroundGfx);

    // 2. Header Container
    this.headerContainer = new Container();
    this.headerContainer.position.set(UI_SPACING.LG, UI_SPACING.MD);
    this.container.addChild(this.headerContainer);

    const nameStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 18,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_PRIMARY,
      letterSpacing: 1.5,
    });
    this.nameText = new Text({ text: 'DESTINATION NAME', style: nameStyle });
    this.headerContainer.addChild(this.nameText);

    const subStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10.5,
      fontWeight: 'bold',
      fill: UI_COLORS.AMBER,
      letterSpacing: 1.0,
    });
    this.subtitleText = new Text({ text: 'SUBTITLE', style: subStyle });
    this.subtitleText.position.set(0, 26);
    this.headerContainer.addChild(this.subtitleText);

    const catStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10,
      fill: UI_COLORS.TEXT_MUTED,
      letterSpacing: 0.8,
    });
    this.categoryText = new Text({ text: 'CATEGORY // ENVIRONMENT', style: catStyle });
    this.categoryText.position.set(0, 48);
    this.headerContainer.addChild(this.categoryText);

    const statusStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10,
      fontWeight: 'bold',
      fill: UI_COLORS.GREEN,
      letterSpacing: 1.0,
    });
    this.statusBadgeText = new Text({ text: '[UNLOCKED]', style: statusStyle });
    this.statusBadgeText.position.set(this.panelWidth - UI_SPACING.LG * 2 - 100, 4);
    this.headerContainer.addChild(this.statusBadgeText);

    const surfStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 9,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
      letterSpacing: 0.5,
    });
    this.surfaceBadgeText = new Text({ text: '[SOLID SURFACE]', style: surfStyle });
    this.surfaceBadgeText.position.set(0, 66);
    this.headerContainer.addChild(this.surfaceBadgeText);

    // 3. Description text
    const descStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10.5,
      fill: UI_COLORS.TEXT_SECONDARY,
      wordWrap: true,
      wordWrapWidth: this.panelWidth - UI_SPACING.LG * 2,
      lineHeight: 16,
    });
    this.descText = new Text({ text: '', style: descStyle });
    this.descText.position.set(UI_SPACING.LG, 105);
    this.container.addChild(this.descText);

    // 4. Physical Specs Container
    this.specsContainer = new Container();
    this.specsContainer.position.set(UI_SPACING.LG, 210);
    this.container.addChild(this.specsContainer);

    // 5. Mission Status Container
    this.missionContainer = new Container();
    this.missionContainer.position.set(UI_SPACING.LG, 520);
    this.container.addChild(this.missionContainer);

    // 6. Lock Notice Container
    this.lockNoticeContainer = new Container();
    this.lockNoticeContainer.position.set(UI_SPACING.LG, 625);
    this.container.addChild(this.lockNoticeContainer);

    // 7. Actions Container (Bottom)
    this.actionsContainer = new Container();
    this.actionsContainer.position.set(UI_SPACING.LG, this.panelHeight - 58);
    this.container.addChild(this.actionsContainer);

    this.browseMissionsBtn = new UIButton({
      label: 'BROWSE MISSIONS',
      variant: 'PRIMARY',
      width: 170,
      height: 38,
      onClick: () => {
        if (this.currentDestination && this.onBrowseMissionsCb) {
          this.onBrowseMissionsCb(this.currentDestination);
        }
      },
    });
    this.actionsContainer.addChild(this.browseMissionsBtn.container);

    this.viewSubDestinationsBtn = new UIButton({
      label: 'ORBITAL REGIONS',
      variant: 'SECONDARY',
      width: 160,
      height: 38,
      onClick: () => {
        if (this.currentDestination && this.onViewSubDestinationsCb) {
          this.onViewSubDestinationsCb(this.currentDestination);
        }
      },
    });
    this.viewSubDestinationsBtn.container.position.set(180, 0);
    this.actionsContainer.addChild(this.viewSubDestinationsBtn.container);

    this.closeBtn = new UIButton({
      label: 'CLOSE',
      variant: 'GHOST',
      width: 80,
      height: 38,
      onClick: () => {
        if (this.onCloseCb) this.onCloseCb();
      },
    });
    this.closeBtn.container.position.set(this.panelWidth - UI_SPACING.LG * 2 - 80, 0);
    this.actionsContainer.addChild(this.closeBtn.container);

    this.renderFrame();
  }

  public setDestination(dest: DestinationRecord | null): void {
    this.currentDestination = dest;
    if (!dest) {
      this.container.visible = false;
      return;
    }

    this.container.visible = true;
    this.nameText.text = dest.name.toUpperCase();
    this.subtitleText.text = dest.subtitle;
    this.categoryText.text = `[${dest.category}] // ${dest.environment}`;

    const isUnlocked = this.registry.isUnlocked(dest.id);
    if (isUnlocked) {
      this.statusBadgeText.text = '[UNLOCKED]';
      this.statusBadgeText.style.fill = UI_COLORS.GREEN;
    } else {
      this.statusBadgeText.text = '[LOCKED]';
      this.statusBadgeText.style.fill = UI_COLORS.AMBER;
    }

    // Surface availability badge styling
    this.updateSurfaceBadge(dest);

    this.descText.text = dest.scientificDescription;

    this.renderSpecs(dest);
    this.renderMissionTelemetry(dest);
    this.renderLockNotice(dest, isUnlocked);

    // Dynamic button labels
    this.viewSubDestinationsBtn.container.visible = dest.hasSubDestinations;
    if (dest.id === 'DEST_EARTH') {
      this.viewSubDestinationsBtn.setLabel('ORBITAL REGIONS');
    } else if (dest.hasSubDestinations) {
      this.viewSubDestinationsBtn.setLabel('EXPLORE MOONS');
    }

    this.renderFrame();
  }

  public getDestination(): DestinationRecord | null {
    return this.currentDestination;
  }

  private updateSurfaceBadge(dest: DestinationRecord): void {
    switch (dest.surfaceAvailability) {
      case SurfaceAvailability.WALKABLE_SURFACE:
        this.surfaceBadgeText.text = '✦ SOLID SURFACE: ACCESSIBLE';
        this.surfaceBadgeText.style.fill = UI_COLORS.GREEN;
        break;
      case SurfaceAvailability.HAZARDOUS_SURFACE_SPECIALIZED_ONLY:
        this.surfaceBadgeText.text = '▲ HAZARDOUS SURFACE: SPECIALIZED PROBE ONLY';
        this.surfaceBadgeText.style.fill = UI_COLORS.AMBER;
        break;
      case SurfaceAvailability.SMALL_BODY_MICROGRAVITY:
        this.surfaceBadgeText.text = '◈ SMALL BODY: MICROGRAVITY SAMPLING';
        this.surfaceBadgeText.style.fill = UI_COLORS.CYAN;
        break;
      case SurfaceAvailability.NO_SURFACE_ORBITAL_ATMOSPHERIC_ONLY:
      default:
        this.surfaceBadgeText.text = '✖ NO SOLID SURFACE: ORBITAL/ATMOSPHERE ONLY';
        this.surfaceBadgeText.style.fill = 0x94a3b8;
        break;
    }
  }

  private renderSpecs(dest: DestinationRecord): void {
    this.specsContainer.removeChildren();

    const boxW = this.panelWidth - UI_SPACING.LG * 2;
    const boxH = 295;

    const bg = new Graphics();
    bg.roundRect(0, 0, boxW, boxH, UI_RADIUS.SM);
    bg.fill({ color: 0x050d1a, alpha: 0.85 });
    bg.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.specsContainer.addChild(bg);

    const titleStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
      letterSpacing: 1.5,
    });
    const header = new Text({ text: '// SCIENTIFIC & PHYSICAL TELEMETRY //', style: titleStyle });
    header.position.set(12, 10);
    this.specsContainer.addChild(header);

    const p = dest.physicalCharacteristics;
    const rows: Array<{ label: string; value: string }> = [];

    if (typeof p.semiMajorAxisAu === 'number') {
      rows.push({ label: 'SEMI-MAJOR AXIS:', value: `${p.semiMajorAxisAu.toFixed(3)} AU` });
    }
    if (typeof p.altitudeKmMin === 'number') {
      rows.push({
        label: 'ALTITUDE REGIME:',
        value: `${p.altitudeKmMin.toLocaleString()} – ${p.altitudeKmMax?.toLocaleString()} km`,
      });
    }
    if (typeof p.orbitalPeriodDays === 'number') {
      const periodStr =
        Math.abs(p.orbitalPeriodDays) < 1
          ? `${(Math.abs(p.orbitalPeriodDays) * 24 * 60).toFixed(0)} minutes`
          : `${Math.abs(p.orbitalPeriodDays).toFixed(1)} Earth days${p.orbitalPeriodDays < 0 ? ' (Retrograde)' : ''}`;
      rows.push({ label: 'ORBITAL PERIOD:', value: periodStr });
    }
    if (typeof p.surfaceGravityG === 'number') {
      rows.push({ label: 'SURFACE GRAVITY:', value: `${p.surfaceGravityG.toFixed(2)} g (${dest.gravityClassification})` });
    }
    if (typeof p.escapeVelocityKps === 'number') {
      rows.push({ label: 'ESCAPE VELOCITY:', value: `${p.escapeVelocityKps.toFixed(2)} km/s` });
    }
    if (typeof p.meanTemperatureC === 'number') {
      rows.push({ label: 'MEAN TEMP:', value: `${p.meanTemperatureC} °C (${dest.temperatureClassification})` });
    }
    if (p.atmosphereComposition) {
      rows.push({ label: 'ATMOSPHERE:', value: p.atmosphereComposition });
    }
    if (p.radiationLevel) {
      rows.push({ label: 'RADIATION LEVEL:', value: p.radiationLevel });
    }
    if (dest.communication) {
      const latencyStr =
        dest.communication.oneWayLatencySeconds < 60
          ? `${dest.communication.oneWayLatencySeconds.toFixed(2)}s`
          : `${(dest.communication.oneWayLatencySeconds / 60).toFixed(1)} min`;
      rows.push({ label: 'ONE-WAY LATENCY:', value: latencyStr });
      rows.push({ label: 'COMM RELAY:', value: dest.communication.relayRequirement });
    }
    if (dest.supportedExplorationMethods && dest.supportedExplorationMethods.length > 0) {
      const methodsStr = dest.supportedExplorationMethods
        .slice(0, 3)
        .map((m) => m.replace(/_/g, ' '))
        .join(', ');
      rows.push({ label: 'MODES SUPPORTED:', value: methodsStr });
    }

    let y = 30;
    for (const r of rows) {
      const lbl = new Text({
        text: r.label,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9,
          fontWeight: 'bold',
          fill: UI_COLORS.TEXT_MUTED,
        }),
      });
      lbl.position.set(12, y);

      const val = new Text({
        text: r.value,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9.5,
          fontWeight: 'bold',
          fill: UI_COLORS.TEXT_PRIMARY,
          wordWrap: true,
          wordWrapWidth: boxW - 165,
        }),
      });
      val.position.set(150, y);

      this.specsContainer.addChild(lbl);
      this.specsContainer.addChild(val);
      y += 23;
    }
  }

  private renderMissionTelemetry(dest: DestinationRecord): void {
    this.missionContainer.removeChildren();

    const boxW = this.panelWidth - UI_SPACING.LG * 2;
    const boxH = 90;

    const bg = new Graphics();
    bg.roundRect(0, 0, boxW, boxH, UI_RADIUS.SM);
    bg.fill({ color: 0x050d1a, alpha: 0.85 });
    bg.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.missionContainer.addChild(bg);

    const hStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
      letterSpacing: 1.2,
    });
    const header = new Text({ text: '// FLIGHT MANIFEST & MISSION STATUS //', style: hStyle });
    header.position.set(12, 10);
    this.missionContainer.addChild(header);

    const mStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 11,
      fill: UI_COLORS.TEXT_SECONDARY,
    });
    const counts = new Text({
      text: `AVAILABLE MISSIONS: ${dest.availableMissionsCount}   |   COMPLETED: ${dest.completedMissionsCount}`,
      style: mStyle,
    });
    counts.position.set(12, 34);
    this.missionContainer.addChild(counts);

    const isUnlocked = this.registry.isUnlocked(dest.id);
    const statStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10,
      fill: isUnlocked ? UI_COLORS.GREEN : UI_COLORS.AMBER,
    });
    const statusText = new Text({
      text: isUnlocked
        ? 'STATUS: OPERATIONAL FOR FLIGHT MANIFEST'
        : 'STATUS: RESTRICTED // REQUIRES PROGRESSION CLEARANCE',
      style: statStyle,
    });
    statusText.position.set(12, 58);
    this.missionContainer.addChild(statusText);
  }

  private renderLockNotice(dest: DestinationRecord, isUnlocked: boolean): void {
    this.lockNoticeContainer.removeChildren();
    if (isUnlocked) {
      this.lockNoticeContainer.visible = false;
      return;
    }

    this.lockNoticeContainer.visible = true;
    const boxW = this.panelWidth - UI_SPACING.LG * 2;
    const boxH = 120;

    const bg = new Graphics();
    bg.roundRect(0, 0, boxW, boxH, UI_RADIUS.SM);
    bg.fill({ color: 0x1f1105, alpha: 0.9 });
    bg.stroke({ color: UI_COLORS.AMBER, width: 1.2, alpha: 0.8 });
    this.lockNoticeContainer.addChild(bg);

    const warnStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10,
      fontWeight: 'bold',
      fill: UI_COLORS.AMBER,
      letterSpacing: 1.5,
    });
    const warning = new Text({
      text: '⚠ EXPLORATION CLEARANCE RESTRICTED',
      style: warnStyle,
    });
    warning.position.set(12, 8);
    this.lockNoticeContainer.addChild(warning);

    // Query progression evaluation
    const prog = this.registry.evaluateProgression(dest.id);
    const overallPct = prog ? prog.overallProgressPercent : 0;

    // Progress bar background & fill
    const barW = boxW - 24;
    const barH = 5;
    const barBg = new Graphics();
    barBg.roundRect(12, 28, barW, barH, 2);
    barBg.fill({ color: 0x33200a });
    this.lockNoticeContainer.addChild(barBg);

    const barFill = new Graphics();
    const fillW = Math.max(2, (barW * overallPct) / 100);
    barFill.roundRect(12, 28, fillW, barH, 2);
    barFill.fill({ color: UI_COLORS.AMBER });
    this.lockNoticeContainer.addChild(barFill);

    const reqStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_PRIMARY,
      wordWrap: true,
      wordWrapWidth: boxW - 24,
      lineHeight: 14,
    });
    const reqText = new Text({
      text: dest.unlockRequirementsText,
      style: reqStyle,
    });
    reqText.position.set(12, 40);
    this.lockNoticeContainer.addChild(reqText);

    // Show first pending requirement
    const unmet = prog?.requirements.find((r) => !r.isMet);
    const detailText = unmet
      ? `Progress: ${unmet.description} (${unmet.currentValue} / ${unmet.requiredValue} - ${unmet.progressPercent}%)`
      : `Overall Agency Progress: ${overallPct}% Complete`;

    const limStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 9,
      fill: UI_COLORS.TEXT_MUTED,
    });
    const limText = new Text({
      text: detailText,
      style: limStyle,
    });
    limText.position.set(12, 92);
    this.lockNoticeContainer.addChild(limText);
  }

  private renderFrame(): void {
    this.backgroundGfx.clear();

    // Main dark glass container
    this.backgroundGfx.roundRect(0, 0, this.panelWidth, this.panelHeight, UI_RADIUS.MD);
    this.backgroundGfx.fill({ color: 0x030814, alpha: 0.94 });
    this.backgroundGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.5 });

    // Decorative top-left cyan bracket
    this.backgroundGfx.moveTo(0, 24);
    this.backgroundGfx.lineTo(24, 0);
    this.backgroundGfx.lineTo(80, 0);
    this.backgroundGfx.stroke({ color: UI_COLORS.CYAN, width: 2.0, alpha: 0.85 });

    // Header divider
    this.backgroundGfx.moveTo(UI_SPACING.LG, 96);
    this.backgroundGfx.lineTo(this.panelWidth - UI_SPACING.LG, 96);
    this.backgroundGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0, alpha: 0.6 });
  }

  public override destroy(): void {
    super.destroy();
  }
}
