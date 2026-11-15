/**
 * INTERSTELLAR CONTINUUM - Destination Information Panel
 * Tactical aerospace panel presenting comprehensive scientific telemetry,
 * physical metrics, environmental classifications, surface availability,
 * exploration methods, communication profiles, and progression unlock tracking.
 * Enhanced with Educational telemetry cards, multi-tab layout, and live subsystem state.
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
import { SolarSystemNavigationManager } from '../navigation/SolarSystemNavigationManager';
import {
  ExplorationStatusBadge,
  DestinationNavigationSummary,
  EducationalDestinationSummary,
} from '../navigation/NavigationTypes';

export interface DestinationInfoPanelOptions {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  onBrowseMissions?: (destination: DestinationRecord) => void;
  onViewSubDestinations?: (destination: DestinationRecord) => void;
  onClose?: () => void;
}

export type InfoPanelTab = 'TELEMETRY' | 'EDUCATIONAL' | 'OPERATIONS';

export class DestinationInfoPanel extends UIComponent {
  private panelWidth: number;
  private panelHeight: number;
  private currentDestination: DestinationRecord | null = null;
  private registry: DestinationRegistry;
  private navManager: SolarSystemNavigationManager;

  private currentTab: InfoPanelTab = 'TELEMETRY';

  private backgroundGfx: Graphics;
  private headerContainer: Container;
  private tabsContainer: Container;
  private contentContainer: Container;
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
  private surfaceExploreBtn: UIButton;
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
    this.navManager = SolarSystemNavigationManager.getInstance();

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
    this.statusBadgeText.position.set(this.panelWidth - UI_SPACING.LG * 2 - 130, 4);
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
      fontSize: 10,
      fill: UI_COLORS.TEXT_SECONDARY,
      wordWrap: true,
      wordWrapWidth: this.panelWidth - UI_SPACING.LG * 2,
      lineHeight: 15,
    });
    this.descText = new Text({ text: '', style: descStyle });
    this.descText.position.set(UI_SPACING.LG, 102);
    this.container.addChild(this.descText);

    // 4. Tabs Bar
    this.tabsContainer = new Container();
    this.tabsContainer.position.set(UI_SPACING.LG, 172);
    this.container.addChild(this.tabsContainer);

    // 5. Dynamic Content Container (Telemetry / Educational / Operations)
    this.contentContainer = new Container();
    this.contentContainer.position.set(UI_SPACING.LG, 212);
    this.container.addChild(this.contentContainer);

    // 6. Lock Notice Container
    this.lockNoticeContainer = new Container();
    this.lockNoticeContainer.position.set(UI_SPACING.LG, 696);
    this.container.addChild(this.lockNoticeContainer);

    // 7. Actions Container (Bottom)
    this.actionsContainer = new Container();
    this.actionsContainer.position.set(UI_SPACING.LG, this.panelHeight - 54);
    this.container.addChild(this.actionsContainer);

    this.browseMissionsBtn = new UIButton({
      label: 'MISSIONS',
      variant: 'PRIMARY',
      width: 110,
      height: 36,
      onClick: () => {
        if (this.currentDestination) {
          if (this.onBrowseMissionsCb) {
            this.onBrowseMissionsCb(this.currentDestination);
          } else {
            this.navManager.triggerNavigationAction({
              action: 'BROWSE_MISSIONS',
              destinationId: this.currentDestination.id,
            });
          }
        }
      },
    });
    this.actionsContainer.addChild(this.browseMissionsBtn.container);

    this.viewSubDestinationsBtn = new UIButton({
      label: 'MOONS',
      variant: 'SECONDARY',
      width: 110,
      height: 36,
      onClick: () => {
        if (this.currentDestination) {
          if (this.onViewSubDestinationsCb) {
            this.onViewSubDestinationsCb(this.currentDestination);
          } else {
            this.navManager.triggerNavigationAction({
              action: 'INSPECT_SYSTEM',
              destinationId: this.currentDestination.id,
            });
          }
        }
      },
    });
    this.viewSubDestinationsBtn.container.position.set(118, 0);
    this.actionsContainer.addChild(this.viewSubDestinationsBtn.container);

    this.surfaceExploreBtn = new UIButton({
      label: 'SURFACE',
      variant: 'OUTLINE',
      width: 110,
      height: 36,
      onClick: () => {
        if (this.currentDestination) {
          this.navManager.triggerNavigationAction({
            action: 'EXPLORE_SURFACE',
            destinationId: this.currentDestination.id,
          });
        }
      },
    });
    this.surfaceExploreBtn.container.position.set(236, 0);
    this.actionsContainer.addChild(this.surfaceExploreBtn.container);

    this.closeBtn = new UIButton({
      label: 'CLOSE',
      variant: 'GHOST',
      width: 76,
      height: 36,
      onClick: () => {
        if (this.onCloseCb) this.onCloseCb();
      },
    });
    this.closeBtn.container.position.set(this.panelWidth - UI_SPACING.LG * 2 - 76, 0);
    this.actionsContainer.addChild(this.closeBtn.container);

    this.renderFrame();
    this.renderTabs();
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

    const badge = this.navManager.getDestinationExplorationStatus(dest.id);
    this.updateStatusBadge(badge);
    this.updateSurfaceBadge(dest);

    this.descText.text = dest.scientificDescription;

    this.renderActiveTabContent();

    const isUnlocked = this.registry.isUnlocked(dest.id);
    this.renderLockNotice(dest, isUnlocked);

    // Dynamic button states
    this.viewSubDestinationsBtn.container.visible = dest.hasSubDestinations;
    if (dest.id === 'DEST_EARTH' || dest.id === 'dest-earth') {
      this.viewSubDestinationsBtn.setLabel('ORBITAL');
    } else if (dest.hasSubDestinations) {
      this.viewSubDestinationsBtn.setLabel('MOONS');
    }

    this.surfaceExploreBtn.container.visible =
      dest.surfaceAvailability === SurfaceAvailability.WALKABLE_SURFACE ||
      dest.surfaceAvailability === SurfaceAvailability.HAZARDOUS_SURFACE_SPECIALIZED_ONLY;

    this.renderFrame();
  }

  public getDestination(): DestinationRecord | null {
    return this.currentDestination;
  }

  private updateStatusBadge(badge: ExplorationStatusBadge): void {
    switch (badge) {
      case ExplorationStatusBadge.BASE_ESTABLISHED:
        this.statusBadgeText.text = '✦ BASE ACTIVE';
        this.statusBadgeText.style.fill = UI_COLORS.CYAN;
        break;
      case ExplorationStatusBadge.SURFACE_EXPLORED:
        this.statusBadgeText.text = '◈ SURFACE EXPLORED';
        this.statusBadgeText.style.fill = UI_COLORS.GREEN;
        break;
      case ExplorationStatusBadge.VISITED:
        this.statusBadgeText.text = '✓ VISITED';
        this.statusBadgeText.style.fill = UI_COLORS.GREEN;
        break;
      case ExplorationStatusBadge.COMMS_CONNECTED:
        this.statusBadgeText.text = '📡 RELAY ACTIVE';
        this.statusBadgeText.style.fill = UI_COLORS.CYAN;
        break;
      case ExplorationStatusBadge.UNEXPLORED:
        this.statusBadgeText.text = '○ UNEXPLORED';
        this.statusBadgeText.style.fill = 0x94a3b8;
        break;
      case ExplorationStatusBadge.LOCKED:
      default:
        this.statusBadgeText.text = '🔒 RESTRICTED';
        this.statusBadgeText.style.fill = UI_COLORS.AMBER;
        break;
    }
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

  private renderTabs(): void {
    this.tabsContainer.removeChildren();

    const tabs: Array<{ id: InfoPanelTab; label: string }> = [
      { id: 'TELEMETRY', label: 'TELEMETRY' },
      { id: 'EDUCATIONAL', label: 'EDUCATIONAL' },
      { id: 'OPERATIONS', label: 'MISSIONS & BASES' },
    ];

    let x = 0;
    const tabW = (this.panelWidth - UI_SPACING.LG * 2 - 16) / 3;
    const tabH = 28;

    for (const t of tabs) {
      const isActive = this.currentTab === t.id;
      const tabNode = new Container();
      tabNode.position.set(x, 0);
      tabNode.eventMode = 'static';
      tabNode.cursor = 'pointer';

      const bg = new Graphics();
      bg.roundRect(0, 0, tabW, tabH, UI_RADIUS.SM);
      bg.fill({ color: isActive ? 0x072545 : 0x040d1a, alpha: 0.9 });
      bg.stroke({
        color: isActive ? UI_COLORS.CYAN : UI_COLORS.BORDER_SUBTLE,
        width: 1.0,
        alpha: isActive ? 0.9 : 0.4,
      });

      const labelStyle = new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 9.5,
        fontWeight: isActive ? 'bold' : 'normal',
        fill: isActive ? UI_COLORS.CYAN : UI_COLORS.TEXT_MUTED,
        letterSpacing: 0.8,
      });
      const lbl = new Text({ text: t.label, style: labelStyle });
      lbl.anchor.set(0.5, 0.5);
      lbl.position.set(tabW / 2, tabH / 2);

      tabNode.addChild(bg);
      tabNode.addChild(lbl);

      tabNode.on('pointertap', () => {
        this.currentTab = t.id;
        this.renderTabs();
        this.renderActiveTabContent();
      });

      this.tabsContainer.addChild(tabNode);
      x += tabW + 8;
    }
  }

  private renderActiveTabContent(): void {
    if (!this.currentDestination) return;

    this.contentContainer.removeChildren();
    const summary = this.navManager.getDestinationSummary(this.currentDestination.id);

    switch (this.currentTab) {
      case 'TELEMETRY':
        this.renderTelemetryTab(this.currentDestination, summary);
        break;
      case 'EDUCATIONAL':
        this.renderEducationalTab(summary?.educationalSummary);
        break;
      case 'OPERATIONS':
        this.renderOperationsTab(this.currentDestination, summary);
        break;
    }
  }

  private renderTelemetryTab(
    dest: DestinationRecord,
    summary?: DestinationNavigationSummary
  ): void {
    const boxW = this.panelWidth - UI_SPACING.LG * 2;
    const boxH = 470;

    const bg = new Graphics();
    bg.roundRect(0, 0, boxW, boxH, UI_RADIUS.SM);
    bg.fill({ color: 0x050d1a, alpha: 0.85 });
    bg.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.contentContainer.addChild(bg);

    const titleStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
      letterSpacing: 1.5,
    });
    const header = new Text({ text: '// SCIENTIFIC & PHYSICAL TELEMETRY //', style: titleStyle });
    header.position.set(12, 10);
    this.contentContainer.addChild(header);

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
      rows.push({
        label: 'SURFACE GRAVITY:',
        value: `${p.surfaceGravityG.toFixed(2)} g (${dest.gravityClassification})`,
      });
    }
    if (typeof p.escapeVelocityKps === 'number') {
      rows.push({ label: 'ESCAPE VELOCITY:', value: `${p.escapeVelocityKps.toFixed(2)} km/s` });
    }
    if (typeof p.meanTemperatureC === 'number') {
      rows.push({
        label: 'MEAN TEMP:',
        value: `${p.meanTemperatureC} °C (${dest.temperatureClassification})`,
      });
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

    let y = 32;
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

      this.contentContainer.addChild(lbl);
      this.contentContainer.addChild(val);
      y += 22;
    }

    // Environmental Difficulty Breakdown
    if (summary?.environmentalDifficulty) {
      const envDiff = summary.environmentalDifficulty;
      y = Math.max(y + 8, 300);

      const envHeader = new Text({
        text: `// ENVIRONMENTAL HAZARDS [${envDiff.overallHazardLevel}] //`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9.5,
          fontWeight: 'bold',
          fill: UI_COLORS.AMBER,
        }),
      });
      envHeader.position.set(12, y);
      this.contentContainer.addChild(envHeader);
      y += 20;

      const diffMetrics = [
        { label: 'THERMAL HAZARD:', val: envDiff.temperatureDifficulty },
        { label: 'TERRAIN RUGGEDNESS:', val: envDiff.terrainDifficulty },
        { label: 'ATMOSPHERIC LOAD:', val: envDiff.atmosphericDifficulty },
        { label: 'SURFACE ACCESSIBILITY:', val: envDiff.surfaceAccessibility },
      ];

      for (const dm of diffMetrics) {
        const dmLbl = new Text({
          text: dm.label,
          style: new TextStyle({
            fontFamily: UI_FONTS.FAMILY,
            fontSize: 8.5,
            fill: UI_COLORS.TEXT_MUTED,
          }),
        });
        dmLbl.position.set(12, y);
        this.contentContainer.addChild(dmLbl);

        // Render 5-pip difficulty meter
        for (let pip = 1; pip <= 5; pip++) {
          const pipGfx = new Graphics();
          pipGfx.roundRect(160 + (pip - 1) * 18, y + 2, 14, 8, 1);
          pipGfx.fill({
            color: pip <= dm.val ? (dm.val >= 4 ? 0xef4444 : 0x0284c7) : 0x1e293b,
          });
          this.contentContainer.addChild(pipGfx);
        }
        y += 18;
      }
    }
  }

  private renderEducationalTab(edu?: EducationalDestinationSummary): void {
    const boxW = this.panelWidth - UI_SPACING.LG * 2;
    const boxH = 470;

    const bg = new Graphics();
    bg.roundRect(0, 0, boxW, boxH, UI_RADIUS.SM);
    bg.fill({ color: 0x050d1a, alpha: 0.85 });
    bg.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.contentContainer.addChild(bg);

    if (!edu) {
      const placeholder = new Text({
        text: 'Educational telemetry archive synchronising...',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fill: UI_COLORS.TEXT_MUTED,
        }),
      });
      placeholder.position.set(14, 14);
      this.contentContainer.addChild(placeholder);
      return;
    }

    const titleStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
      letterSpacing: 1.5,
    });
    const header = new Text({ text: '// ASTRONOMICAL EDUCATIONAL BRIEFING //', style: titleStyle });
    header.position.set(12, 10);
    this.contentContainer.addChild(header);

    let y = 32;

    const eduFields: Array<{ label: string; text: string }> = [
      { label: 'CLASSIFICATION:', text: edu.classification },
      { label: 'ATMOSPHERE SUMMARY:', text: `${edu.atmosphericPressureSummary} — ${edu.atmosphericComposition}` },
      { label: 'TEMPERATURE REGIME:', text: edu.surfaceTemperatureRange },
      { label: 'ROTATIONAL PERIOD:', text: edu.dayLengthSummary },
      { label: 'NOTABLE MOONS:', text: edu.notableMoons.length > 0 ? edu.notableMoons.join(', ') : 'None' },
    ];

    for (const f of eduFields) {
      const lbl = new Text({
        text: f.label,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 8.5,
          fontWeight: 'bold',
          fill: UI_COLORS.TEXT_MUTED,
        }),
      });
      lbl.position.set(12, y);

      const val = new Text({
        text: f.text,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9,
          fill: UI_COLORS.TEXT_PRIMARY,
          wordWrap: true,
          wordWrapWidth: boxW - 165,
        }),
      });
      val.position.set(150, y);

      this.contentContainer.addChild(lbl);
      this.contentContainer.addChild(val);
      y += 24;
    }

    // Scientific Interests
    y += 4;
    const sciHead = new Text({
      text: 'MAJOR SCIENTIFIC INTERESTS:',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 9,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
      }),
    });
    sciHead.position.set(12, y);
    this.contentContainer.addChild(sciHead);
    y += 18;

    for (const interest of edu.majorScientificInterests.slice(0, 3)) {
      const bullet = new Text({
        text: `• ${interest}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 8.5,
          fill: UI_COLORS.TEXT_SECONDARY,
          wordWrap: true,
          wordWrapWidth: boxW - 24,
        }),
      });
      bullet.position.set(16, y);
      this.contentContainer.addChild(bullet);
      y += bullet.height + 4;
    }

    // Exploration Challenges
    y += 6;
    const chalHead = new Text({
      text: 'EXPLORATION CHALLENGES:',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 9,
        fontWeight: 'bold',
        fill: UI_COLORS.AMBER,
      }),
    });
    chalHead.position.set(12, y);
    this.contentContainer.addChild(chalHead);
    y += 18;

    for (const chal of edu.explorationChallenges.slice(0, 2)) {
      const bullet = new Text({
        text: `▲ ${chal}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 8.5,
          fill: UI_COLORS.TEXT_SECONDARY,
          wordWrap: true,
          wordWrapWidth: boxW - 24,
        }),
      });
      bullet.position.set(16, y);
      this.contentContainer.addChild(bullet);
      y += bullet.height + 4;
    }

    // Fun Fact Box
    if (edu.funFact) {
      y = Math.max(y + 8, 388);
      const factBg = new Graphics();
      factBg.roundRect(12, y, boxW - 24, 70, UI_RADIUS.SM);
      factBg.fill({ color: 0x061b33, alpha: 0.9 });
      factBg.stroke({ color: UI_COLORS.CYAN, width: 1.0, alpha: 0.5 });
      this.contentContainer.addChild(factBg);

      const factTitle = new Text({
        text: '✦ ASTRONOMY FACT:',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 8.5,
          fontWeight: 'bold',
          fill: UI_COLORS.CYAN,
        }),
      });
      factTitle.position.set(20, y + 6);
      this.contentContainer.addChild(factTitle);

      const factBody = new Text({
        text: edu.funFact,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 8.5,
          fill: UI_COLORS.TEXT_PRIMARY,
          wordWrap: true,
          wordWrapWidth: boxW - 44,
          lineHeight: 12,
        }),
      });
      factBody.position.set(20, y + 22);
      this.contentContainer.addChild(factBody);
    }
  }

  private renderOperationsTab(
    dest: DestinationRecord,
    summary?: DestinationNavigationSummary
  ): void {
    const boxW = this.panelWidth - UI_SPACING.LG * 2;
    const boxH = 470;

    const bg = new Graphics();
    bg.roundRect(0, 0, boxW, boxH, UI_RADIUS.SM);
    bg.fill({ color: 0x050d1a, alpha: 0.85 });
    bg.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.contentContainer.addChild(bg);

    const titleStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
      letterSpacing: 1.5,
    });
    const header = new Text({ text: '// FLIGHT MANIFEST, BASES & RELAYS //', style: titleStyle });
    header.position.set(12, 10);
    this.contentContainer.addChild(header);

    let y = 34;

    // Mission Statistics
    const availCount = summary?.availableMissions.length ?? dest.availableMissionsCount;
    const complCount = summary?.completedMissions.length ?? dest.completedMissionsCount;
    const activeCount = summary?.activeMissions.length ?? 0;

    const statRows = [
      `AVAILABLE MISSION OPPORTUNITIES: ${availCount}`,
      `ACTIVE EXPEDITIONS IN PROGRESS: ${activeCount}`,
      `HISTORICAL MISSIONS COMPLETED: ${complCount}`,
      `SCIENTIFIC DISCOVERIES ARCHIVED: ${summary?.knownDiscoveries.length ?? 0}`,
      `OPERATIONAL RESEARCH BASES: ${summary?.operationalBases.length ?? 0}`,
      `COMMS RELAY COVERAGE: ${summary?.commsCoverageSummary.coverageScorePercent ?? 0}% (${summary?.commsCoverageSummary.signalRating ?? 'UNCONNECTED'})`,
    ];

    for (const sr of statRows) {
      const line = new Text({
        text: `◈ ${sr}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9,
          fontWeight: 'bold',
          fill: UI_COLORS.TEXT_PRIMARY,
        }),
      });
      line.position.set(14, y);
      this.contentContainer.addChild(line);
      y += 24;
    }

    // Available Missions Cards
    y += 10;
    const oppHead = new Text({
      text: '// IMMEDIATE EXPLORATION OPPORTUNITIES //',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 9.5,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
      }),
    });
    oppHead.position.set(12, y);
    this.contentContainer.addChild(oppHead);
    y += 20;

    const missions = summary?.availableMissions ?? [];
    if (missions.length === 0) {
      const noneText = new Text({
        text: 'No active authored missions available for current agency tier.',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9,
          fill: UI_COLORS.TEXT_MUTED,
        }),
      });
      noneText.position.set(14, y);
      this.contentContainer.addChild(noneText);
    } else {
      for (const m of missions.slice(0, 3)) {
        const mCard = new Graphics();
        mCard.roundRect(12, y, boxW - 24, 60, UI_RADIUS.SM);
        mCard.fill({ color: 0x091c36, alpha: 0.8 });
        mCard.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
        this.contentContainer.addChild(mCard);

        const mName = new Text({
          text: (m.name || m.title || 'EXPLORATION MISSION').toUpperCase(),
          style: new TextStyle({
            fontFamily: UI_FONTS.FAMILY,
            fontSize: 9,
            fontWeight: 'bold',
            fill: UI_COLORS.CYAN,
          }),
        });
        mName.position.set(20, y + 6);
        this.contentContainer.addChild(mName);

        const mDesc = new Text({
          text: m.objective || m.description || 'Orbital survey and surface sensor deployment.',
          style: new TextStyle({
            fontFamily: UI_FONTS.FAMILY,
            fontSize: 8.5,
            fill: UI_COLORS.TEXT_SECONDARY,
            wordWrap: true,
            wordWrapWidth: boxW - 48,
          }),
        });
        mDesc.position.set(20, y + 24);
        this.contentContainer.addChild(mDesc);

        y += 66;
      }
    }
  }

  private renderLockNotice(dest: DestinationRecord, isUnlocked: boolean): void {
    this.lockNoticeContainer.removeChildren();
    if (isUnlocked) {
      this.lockNoticeContainer.visible = false;
      return;
    }

    this.lockNoticeContainer.visible = true;
    const boxW = this.panelWidth - UI_SPACING.LG * 2;
    const boxH = 135;

    const bg = new Graphics();
    bg.roundRect(0, 0, boxW, boxH, UI_RADIUS.SM);
    bg.fill({ color: 0x1f1105, alpha: 0.95 });
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

    const prog = this.registry.evaluateProgression(dest.id);
    const overallPct = prog ? prog.overallProgressPercent : 0;

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
      fontSize: 9.5,
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

    const unmet = prog?.requirements.find((r) => !r.isMet);
    const detailText = unmet
      ? `Required: ${unmet.description} (${unmet.currentValue} / ${unmet.requiredValue} - ${unmet.progressPercent}%)`
      : `Overall Agency Progress: ${overallPct}% Complete`;

    const limStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 8.5,
      fill: UI_COLORS.TEXT_MUTED,
    });
    const limText = new Text({
      text: detailText,
      style: limStyle,
    });
    limText.position.set(12, 98);
    this.lockNoticeContainer.addChild(limText);
  }

  private renderFrame(): void {
    this.backgroundGfx.clear();

    // Main dark glass container
    this.backgroundGfx.roundRect(0, 0, this.panelWidth, this.panelHeight, UI_RADIUS.MD);
    this.backgroundGfx.fill({ color: 0x030814, alpha: 0.95 });
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
