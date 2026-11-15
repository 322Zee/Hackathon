/**
 * INTERSTELLAR CONTINUUM - Mission Catalogue Operations View
 * Tactical aerospace user interface presenting the categorized mission manifest,
 * status filters, destination queries, engineering specifications, and educational briefings.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../../ui/core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS, UI_SPACING } from '../../ui/core/UIDesignTokens';
import { UIButton } from '../../ui/components/UIButton';
import { DestinationId } from '../../destinations/DestinationTypes';
import { DestinationRegistry } from '../../destinations/DestinationRegistry';
import {
  MissionDefinition,
  MissionCategory,
  MissionStatus,
  EvaluatedMissionStatus,
} from '../MissionTypes';
import { MissionCatalogueRegistry } from '../MissionCatalogueRegistry';

export interface MissionCatalogueViewOptions {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  initialDestinationFilter?: DestinationId | null;
  onSelectMission?: (mission: MissionDefinition) => void;
  onCommencePlanning?: (mission: MissionDefinition) => void;
  onViewOnMap?: (destinationId: DestinationId) => void;
}

export class MissionCatalogueView extends UIComponent {
  private viewWidth: number;
  private viewHeight: number;
  private catalogueRegistry: MissionCatalogueRegistry;
  private destinationRegistry: DestinationRegistry;

  private backgroundGfx: Graphics;
  private leftPanelContainer: Container;
  private rightPanelContainer: Container;
  private filterBarContainer: Container;
  private missionListContainer: Container;
  private detailDossierContainer: Container;

  private selectedMissionId: string | null = null;
  private destinationFilter: DestinationId | null = null;
  private categoryFilter: MissionCategory | 'ALL' = 'ALL';
  private statusFilter: MissionStatus | 'ALL' = 'ALL';

  private onSelectMissionCb?: (mission: MissionDefinition) => void;
  private onCommencePlanningCb?: (mission: MissionDefinition) => void;
  private onViewOnMapCb?: (destinationId: DestinationId) => void;

  private listScrollY: number = 0;
  private maxScrollY: number = 0;

  constructor(options: MissionCatalogueViewOptions = {}) {
    super('MissionCatalogueView');

    this.viewWidth = options.width ?? 1860;
    this.viewHeight = options.height ?? 920;
    this.container.position.set(options.x ?? 30, options.y ?? 130);

    this.catalogueRegistry = MissionCatalogueRegistry.getInstance();
    this.destinationRegistry = DestinationRegistry.getInstance();

    this.destinationFilter = options.initialDestinationFilter ?? null;
    this.onSelectMissionCb = options.onSelectMission;
    this.onCommencePlanningCb = options.onCommencePlanning;
    this.onViewOnMapCb = options.onViewOnMap;

    // 1. Master Background Frame
    this.backgroundGfx = new Graphics();
    this.backgroundGfx.eventMode = 'static';
    this.container.addChild(this.backgroundGfx);

    // 2. Left Panel Container (Filters & Mission List, 600px)
    this.leftPanelContainer = new Container();
    this.leftPanelContainer.position.set(UI_SPACING.LG, UI_SPACING.MD);
    this.container.addChild(this.leftPanelContainer);

    // 3. Filter Bar Container
    this.filterBarContainer = new Container();
    this.leftPanelContainer.addChild(this.filterBarContainer);

    // 4. Mission List Container (Masked)
    this.missionListContainer = new Container();
    this.missionListContainer.position.set(0, 85);
    this.leftPanelContainer.addChild(this.missionListContainer);

    // 5. Right Panel Container (Detailed Dossier, ~1200px)
    this.rightPanelContainer = new Container();
    this.rightPanelContainer.position.set(650, UI_SPACING.MD);
    this.container.addChild(this.rightPanelContainer);

    this.detailDossierContainer = new Container();
    this.rightPanelContainer.addChild(this.detailDossierContainer);

    this.renderFrame();
    this.buildFilterBar();
    this.refreshCatalogue();

    // Select first available mission if any
    const all = this.getFilteredMissions();
    if (all.length > 0 && all[0]) {
      this.selectMission(all[0].id);
    }
  }

  public setDestinationFilter(destinationId: DestinationId | null): void {
    this.destinationFilter = destinationId;
    this.buildFilterBar();
    this.refreshCatalogue();

    const filtered = this.getFilteredMissions();
    if (filtered.length > 0 && filtered[0]) {
      this.selectMission(filtered[0].id);
    }
  }

  public getDestinationFilter(): DestinationId | null {
    return this.destinationFilter;
  }

  public getSelectedMission(): MissionDefinition | null {
    return this.selectedMissionId ? this.catalogueRegistry.getMissionById(this.selectedMissionId) ?? null : null;
  }

  public selectMission(missionId: string): void {
    this.selectedMissionId = missionId;
    const mission = this.catalogueRegistry.getMissionById(missionId);
    if (mission) {
      if (this.onSelectMissionCb) {
        this.onSelectMissionCb(mission);
      }
      this.renderDetailDossier(mission);
      this.renderMissionList(); // update card highlights
    }
  }

  public scrollList(deltaY: number): void {
    this.listScrollY = Math.max(-this.maxScrollY, Math.min(0, this.listScrollY + deltaY));
    this.renderMissionList();
  }

  public getMaxScrollY(): number {
    return this.maxScrollY;
  }

  private getFilteredMissions(): MissionDefinition[] {
    let list = this.catalogueRegistry.getAllMissions();

    // Destination filter
    if (this.destinationFilter) {
      list = list.filter((m) => m.destinationId === this.destinationFilter);
    }

    // Category filter
    if (this.categoryFilter !== 'ALL') {
      list = list.filter((m) => m.category === this.categoryFilter);
    }

    // Status filter
    if (this.statusFilter !== 'ALL') {
      list = list.filter((m) => {
        const evalStatus = this.catalogueRegistry.evaluateMissionStatus(m.id);
        return evalStatus.status === this.statusFilter;
      });
    }

    return list;
  }

  private refreshCatalogue(): void {
    this.renderMissionList();
    if (this.selectedMissionId) {
      const mission = this.catalogueRegistry.getMissionById(this.selectedMissionId);
      if (mission) {
        this.renderDetailDossier(mission);
      }
    }
  }

  private buildFilterBar(): void {
    this.filterBarContainer.removeChildren();

    // 1. Destination Scope Indicator
    const destName = this.destinationFilter
      ? this.destinationRegistry.getDestination(this.destinationFilter)?.name ?? this.destinationFilter
      : 'ALL SOLAR SYSTEM TARGETS';

    const scopeStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 11,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
      letterSpacing: 1.0,
    });
    const scopeLabel = new Text({
      text: `SCOPE: ${destName.toUpperCase()}`,
      style: scopeStyle,
    });
    scopeLabel.position.set(0, 0);
    this.filterBarContainer.addChild(scopeLabel);

    if (this.destinationFilter) {
      const clearBtn = new UIButton({
        label: '✕ CLEAR FILTER',
        variant: 'GHOST',
        width: 110,
        height: 22,
        onClick: () => this.setDestinationFilter(null),
      });
      clearBtn.container.position.set(470, -2);
      this.filterBarContainer.addChild(clearBtn.container);
    }

    // 2. Category Filter Buttons
    const catLabels: Array<{ label: string; cat: MissionCategory | 'ALL' }> = [
      { label: 'ALL', cat: 'ALL' },
      { label: 'TRANSPORT', cat: MissionCategory.TRANSPORTATION },
      { label: 'EXPLORATION', cat: MissionCategory.SCIENTIFIC_EXPLORATION },
      { label: 'COMBINED', cat: MissionCategory.COMBINED },
    ];

    let catX = 0;
    for (const item of catLabels) {
      const isSelected = this.categoryFilter === item.cat;
      const btn = new UIButton({
        label: item.label,
        variant: isSelected ? 'PRIMARY' : 'SECONDARY',
        width: 135,
        height: 28,
        onClick: () => {
          this.categoryFilter = item.cat;
          this.buildFilterBar();
          this.refreshCatalogue();
        },
      });
      btn.container.position.set(catX, 26);
      this.filterBarContainer.addChild(btn.container);
      catX += 145;
    }

    // 3. Status Filter Buttons
    const statusLabels: Array<{ label: string; status: MissionStatus | 'ALL' }> = [
      { label: 'ALL STATUS', status: 'ALL' },
      { label: 'AVAILABLE', status: MissionStatus.AVAILABLE },
      { label: 'LOCKED', status: MissionStatus.LOCKED },
      { label: 'COMPLETED', status: MissionStatus.COMPLETED },
    ];

    let statX = 0;
    for (const s of statusLabels) {
      const isSelected = this.statusFilter === s.status;
      const btn = new UIButton({
        label: s.label,
        variant: isSelected ? 'PRIMARY' : 'GHOST',
        width: 135,
        height: 24,
        onClick: () => {
          this.statusFilter = s.status;
          this.buildFilterBar();
          this.refreshCatalogue();
        },
      });
      btn.container.position.set(statX, 58);
      this.filterBarContainer.addChild(btn.container);
      statX += 145;
    }
  }

  private renderMissionList(): void {
    this.missionListContainer.removeChildren();

    const missions = this.getFilteredMissions();
    const cardW = 590;
    const cardH = 82;
    const cardSpacing = 8;

    let y = this.listScrollY;

    if (missions.length === 0) {
      const emptyText = new Text({
        text: 'NO MISSIONS MATCH ACTIVE CRITERIA.',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11,
          fill: UI_COLORS.TEXT_MUTED,
        }),
      });
      emptyText.position.set(20, 40);
      this.missionListContainer.addChild(emptyText);
      return;
    }

    for (const m of missions) {
      const evalStatus: EvaluatedMissionStatus = this.catalogueRegistry.evaluateMissionStatus(m.id);
      const isSelected = this.selectedMissionId === m.id;

      const card = new Container();
      card.position.set(0, y);
      card.eventMode = 'static';
      card.cursor = 'pointer';

      const bg = new Graphics();
      // Background card shape
      bg.roundRect(0, 0, cardW, cardH, UI_RADIUS.SM);
      bg.fill({
        color: isSelected ? 0x0c2545 : 0x050e1f,
        alpha: 0.9,
      });
      bg.stroke({
        color: isSelected ? UI_COLORS.CYAN : (evalStatus.isAvailable ? UI_COLORS.BORDER_SUBTLE : 0x1e293b),
        width: isSelected ? 2.0 : 1.0,
      });

      // Left category accent bar
      let catColor: number = UI_COLORS.CYAN;
      if (m.category === MissionCategory.SCIENTIFIC_EXPLORATION) catColor = UI_COLORS.PURPLE;
      else if (m.category === MissionCategory.COMBINED) catColor = UI_COLORS.AMBER;

      bg.rect(0, 0, 4, cardH);
      bg.fill({ color: catColor });
      card.addChild(bg);

      // Short Code & Title
      const titleStyle = new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11.5,
        fontWeight: 'bold',
        fill: evalStatus.isAvailable ? UI_COLORS.TEXT_PRIMARY : UI_COLORS.TEXT_MUTED,
        wordWrap: true,
        wordWrapWidth: 420,
      });
      const title = new Text({
        text: `${m.shortCode} // ${m.name}`,
        style: titleStyle,
      });
      title.position.set(12, 10);
      card.addChild(title);

      // Category & Destination Badge
      const destObj = this.destinationRegistry.getDestination(m.destinationId);
      const destName = destObj?.name ?? m.destinationId;
      const subStyle = new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 9.5,
        fill: UI_COLORS.TEXT_SECONDARY,
      });
      const sub = new Text({
        text: `[${m.category}]  •  TARGET: ${destName.toUpperCase()}  •  LVL ${m.sequenceLevel}`,
        style: subStyle,
      });
      sub.position.set(12, 34);
      card.addChild(sub);

      // Rewards summary snippet
      const rewStyle = new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 9,
        fill: UI_COLORS.GREEN,
      });
      const rew = new Text({
        text: `+${m.rewards.credits.toLocaleString()} CR  |  +${m.rewards.researchData} DATA  |  +${m.rewards.agencyPrestige} PRESTIGE`,
        style: rewStyle,
      });
      rew.position.set(12, 54);
      card.addChild(rew);

      // Status Badge (Right side)
      let statusText = '[AVAILABLE]';
      let statusColor: number = UI_COLORS.GREEN;

      if (evalStatus.status === MissionStatus.COMPLETED) {
        statusText = '✓ COMPLETED';
        statusColor = UI_COLORS.CYAN;
      } else if (evalStatus.status === MissionStatus.ACTIVE) {
        statusText = '● IN FLIGHT';
        statusColor = UI_COLORS.AMBER;
      } else if (evalStatus.status === MissionStatus.LOCKED) {
        statusText = '🔒 LOCKED';
        statusColor = 0x64748b;
      }

      const badge = new Text({
        text: statusText,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fontWeight: 'bold',
          fill: statusColor,
        }),
      });
      badge.anchor.set(1, 0);
      badge.position.set(cardW - 14, 12);
      card.addChild(badge);

      card.on('pointertap', () => {
        this.selectMission(m.id);
      });

      this.missionListContainer.addChild(card);
      y += cardH + cardSpacing;
    }

    this.maxScrollY = Math.max(0, y - this.viewHeight + 100);
  }

  private renderDetailDossier(m: MissionDefinition): void {
    this.detailDossierContainer.removeChildren();

    const pWidth = 1170;
    const evalStatus = this.catalogueRegistry.evaluateMissionStatus(m.id);
    const dest = this.destinationRegistry.getDestination(m.destinationId);

    // 1. Header Box
    const headerBg = new Graphics();
    headerBg.roundRect(0, 0, pWidth, 100, UI_RADIUS.SM);
    headerBg.fill({ color: 0x050e1f, alpha: 0.95 });
    headerBg.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.detailDossierContainer.addChild(headerBg);

    // Title
    const title = new Text({
      text: m.name.toUpperCase(),
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 18,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 1.5,
      }),
    });
    title.position.set(16, 12);
    this.detailDossierContainer.addChild(title);

    // Subtitle Line
    const catStr = `CATEGORY: ${m.category}  |  STAGE: ${m.stageType}  |  DIFFICULTY: ${m.difficulty}  |  SEQUENCE LEVEL ${m.sequenceLevel}`;
    const sub = new Text({
      text: catStr,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10.5,
        fontWeight: 'bold',
        fill: UI_COLORS.AMBER,
        letterSpacing: 0.8,
      }),
    });
    sub.position.set(16, 42);
    this.detailDossierContainer.addChild(sub);

    // Destination & Target Corridor
    const targetCorridor = m.engineeringRequirements.targetOrbit
      ? `ORBIT: ${m.engineeringRequirements.targetOrbit.altitudeKmMin}–${m.engineeringRequirements.targetOrbit.altitudeKmMax} KM`
      : 'SURFACE EXPLORATION SECTOR';

    const destLine = new Text({
      text: `TARGET DESTINATION: ${dest?.name.toUpperCase() ?? m.destinationId} (${targetCorridor})`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fill: UI_COLORS.TEXT_SECONDARY,
      }),
    });
    destLine.position.set(16, 68);
    this.detailDossierContainer.addChild(destLine);

    // Status Badge Top-Right
    let statusBadgeStr = '[AVAILABLE FOR FLIGHT MANIFEST]';
    let statusBadgeColor: number = UI_COLORS.GREEN;
    if (evalStatus.status === MissionStatus.COMPLETED) {
      statusBadgeStr = '[MISSION LOG: COMPLETED]';
      statusBadgeColor = UI_COLORS.CYAN;
    } else if (evalStatus.status === MissionStatus.LOCKED) {
      statusBadgeStr = '[FLIGHT MANIFEST RESTRICTED]';
      statusBadgeColor = UI_COLORS.AMBER;
    }

    const statBadge = new Text({
      text: statusBadgeStr,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fontWeight: 'bold',
        fill: statusBadgeColor,
      }),
    });
    statBadge.anchor.set(1, 0);
    statBadge.position.set(pWidth - 16, 16);
    this.detailDossierContainer.addChild(statBadge);

    // 2. Mission Narrative Description
    const narrativeY = 115;
    const descText = new Text({
      text: m.description,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fill: UI_COLORS.TEXT_PRIMARY,
        wordWrap: true,
        wordWrapWidth: pWidth - 32,
        lineHeight: 18,
      }),
    });
    descText.position.set(16, narrativeY);
    this.detailDossierContainer.addChild(descText);

    // 3. Main Objectives Grid
    let currentY = narrativeY + 48;
    const objBg = new Graphics();
    objBg.roundRect(0, currentY, pWidth, 155, UI_RADIUS.SM);
    objBg.fill({ color: 0x050d1a, alpha: 0.85 });
    objBg.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.detailDossierContainer.addChild(objBg);

    const objHeader = new Text({
      text: '// PRIMARY FLIGHT OBJECTIVES //',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 1.5,
      }),
    });
    objHeader.position.set(16, currentY + 10);
    this.detailDossierContainer.addChild(objHeader);

    let objY = currentY + 32;
    for (const obj of m.mainObjectives) {
      let typeTag = `[${obj.type}]`;
      if (obj.isDeliveryObjective) typeTag = `[DELIVERY]`;
      else if (obj.isExplorationObjective) typeTag = `[EXPLORATION]`;

      const objLine = new Text({
        text: `◻  ${typeTag} ${obj.title}: ${obj.description}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fill: obj.isExplorationObjective ? 0xd8b4fe : UI_COLORS.TEXT_PRIMARY,
          wordWrap: true,
          wordWrapWidth: pWidth - 32,
        }),
      });
      objLine.position.set(16, objY);
      this.detailDossierContainer.addChild(objLine);
      objY += 24;
    }

    // 4. Engineering Specifications Box
    currentY += 170;
    const engBg = new Graphics();
    engBg.roundRect(0, currentY, pWidth, 140, UI_RADIUS.SM);
    engBg.fill({ color: 0x050d1a, alpha: 0.85 });
    engBg.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.detailDossierContainer.addChild(engBg);

    const engHeader = new Text({
      text: '// VEHICLE ENGINEERING & PAYLOAD REQUIREMENTS //',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 1.5,
      }),
    });
    engHeader.position.set(16, currentY + 10);
    this.detailDossierContainer.addChild(engHeader);

    const eng = m.engineeringRequirements;
    const engRows = [
      `SPACECRAFT CLASS: ${eng.spacecraftType}   |   PAYLOAD CLASS: ${eng.payloadType}`,
      `MASS BUDGET: ${eng.minPayloadMassKg}–${eng.maxPayloadMassKg} kg   |   POWER: >= ${eng.minPowerWatts} W (${eng.minBatteryCapacityWh} Wh Battery)`,
      `COMMS BANDWIDTH: ${eng.communicationBandwidthKbps} Kbps   |   DSN RELAY REQUIRED: ${eng.relayRequired ? 'YES' : 'NO'}`,
      `REQUIRED INSTRUMENTS: ${eng.requiredInstruments.join(', ')}`,
    ];

    let eY = currentY + 32;
    for (const er of engRows) {
      const eLine = new Text({
        text: er,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9.5,
          fontWeight: 'bold',
          fill: UI_COLORS.TEXT_SECONDARY,
        }),
      });
      eLine.position.set(16, eY);
      this.detailDossierContainer.addChild(eLine);
      eY += 22;
    }

    // 5. Educational Briefing Banner
    currentY += 155;
    const eduBg = new Graphics();
    eduBg.roundRect(0, currentY, pWidth, 110, UI_RADIUS.SM);
    eduBg.fill({ color: 0x071e3d, alpha: 0.85 });
    eduBg.stroke({ color: UI_COLORS.CYAN, width: 1.0, alpha: 0.7 });
    this.detailDossierContainer.addChild(eduBg);

    const eduHeader = new Text({
      text: `// SCIENTIFIC & AEROSPACE PRINCIPLE: ${m.educationalContent.coreConcept.toUpperCase()} //`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 1.2,
      }),
    });
    eduHeader.position.set(16, currentY + 10);
    this.detailDossierContainer.addChild(eduHeader);

    const eduExp = new Text({
      text: m.educationalContent.explanation,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fill: UI_COLORS.TEXT_PRIMARY,
        wordWrap: true,
        wordWrapWidth: pWidth - 32,
        lineHeight: 16,
      }),
    });
    eduExp.position.set(16, currentY + 30);
    this.detailDossierContainer.addChild(eduExp);

    const eduPar = new Text({
      text: `HISTORICAL FLIGHT REFERENCE: ${m.educationalContent.realWorldParallel}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 9,
        fontWeight: 'bold',
        fill: UI_COLORS.AMBER,
      }),
    });
    eduPar.position.set(16, currentY + 84);
    this.detailDossierContainer.addChild(eduPar);

    // 6. Rewards & Prerequisites Strip
    currentY += 125;
    const rewBg = new Graphics();
    rewBg.roundRect(0, currentY, pWidth, 55, UI_RADIUS.SM);
    rewBg.fill({ color: 0x050e1f, alpha: 0.9 });
    rewBg.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.detailDossierContainer.addChild(rewBg);

    const rewText = new Text({
      text: `REWARDS: +${m.rewards.credits.toLocaleString()} CR  |  +${m.rewards.researchData} RESEARCH DATA  |  +${m.rewards.rawMaterials} MATERIALS  |  +${m.rewards.technologyPoints} TECH PTS  |  +${m.rewards.agencyPrestige} PRESTIGE`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10.5,
        fontWeight: 'bold',
        fill: UI_COLORS.GREEN,
      }),
    });
    rewText.position.set(16, currentY + 18);
    this.detailDossierContainer.addChild(rewText);

    // 7. Action Button Bar
    currentY += 70;
    const planBtn = new UIButton({
      label: 'OPEN MISSION BRIEFING',
      variant: 'PRIMARY',
      width: 240,
      height: 38,
      onClick: () => {
        if (this.onCommencePlanningCb) {
          this.onCommencePlanningCb(m);
        }
      },
    });
    planBtn.container.position.set(0, currentY);
    this.detailDossierContainer.addChild(planBtn.container);

    const mapBtn = new UIButton({
      label: 'VIEW ON SOLAR MAP',
      variant: 'SECONDARY',
      width: 180,
      height: 38,
      onClick: () => {
        if (this.onViewOnMapCb) {
          this.onViewOnMapCb(m.destinationId);
        }
      },
    });
    mapBtn.container.position.set(275, currentY);
    this.detailDossierContainer.addChild(mapBtn.container);
  }

  private renderFrame(): void {
    this.backgroundGfx.clear();

    // Dark technical command canvas
    this.backgroundGfx.roundRect(0, 0, this.viewWidth, this.viewHeight, UI_RADIUS.MD);
    this.backgroundGfx.fill({ color: 0x020714, alpha: 0.98 });
    this.backgroundGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.5 });

    // Vertical Divider between list & dossier
    this.backgroundGfx.moveTo(630, 20);
    this.backgroundGfx.lineTo(630, this.viewHeight - 20);
    this.backgroundGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0, alpha: 0.5 });
  }

  public override destroy(): void {
    super.destroy();
  }
}
