/**
 * INTERSTELLAR CONTINUUM - Mission Contracts & Funding Management View
 * Comprehensive multi-tab organizational revenue interface providing:
 * 1. Global funding overview & verified transaction ledger
 * 2. Contract procurement board across 9 mission disciplines
 * 3. Active flight contract management with live countdowns & deadline extension
 * 4. Fictional institutional sponsor directory & recurring grant portfolio
 * 5. Permanent completed contract archive
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_COLORS, UI_FONTS, UI_RADIUS } from '../../ui/core/UIDesignTokens';
import { UIButton } from '../../ui/components/UIButton';
import { UITabGroup } from '../../ui/components/UITabGroup';
import { ContractsFundingManager } from '../ContractsFundingManager';
import { ContractCard } from './ContractCard';
import { SponsorDossierPanel } from './SponsorDossierPanel';
import {
  ContractCategory,
  ContractStatus,
  FUNDING_SOURCE_LABELS,
} from '../ContractTypes';
import { DestinationId } from '../../destinations/DestinationTypes';

export interface ContractsFundingViewOptions {
  width?: number;
  height?: number;
  onClose?: () => void;
  manager?: ContractsFundingManager;
}

export class ContractsFundingView {
  public readonly container: Container;

  private width: number;
  private height: number;
  private manager: ContractsFundingManager;
  private options: ContractsFundingViewOptions;

  private backdropGfx: Graphics;
  private panelGfx: Graphics;
  private headerContainer: Container;
  private contentContainer: Container;
  private tabGroup?: UITabGroup;

  private currentTabId: string = 'tab_overview';
  private filterCategory: ContractCategory | 'ALL' = 'ALL';
  private filterDestination: DestinationId | 'ALL' = 'ALL';

  private feedbackText?: Text;
  private feedbackTimer: number = 0;

  constructor(options: ContractsFundingViewOptions = {}) {
    this.options = options;
    this.width = options.width ?? 1560;
    this.height = options.height ?? 880;
    this.manager = options.manager ?? ContractsFundingManager.getInstance();

    this.container = new Container();
    this.container.label = 'ContractsFundingView';
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
    if (this.options.onClose) {
      this.options.onClose();
    }
  }

  public toggle(): void {
    if (this.container.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  public isVisible(): boolean {
    return this.container.visible;
  }

  public update(deltaSeconds: number): void {
    if (!this.container.visible) return;

    if (this.feedbackTimer > 0) {
      this.feedbackTimer -= deltaSeconds;
      if (this.feedbackTimer <= 0 && this.feedbackText) {
        this.feedbackText.text = '';
      }
    }
  }

  public destroy(): void {
    if (this.tabGroup) {
      this.tabGroup.destroy();
    }
    this.container.destroy({ children: true });
  }

  // ─── Shell Construction ──────────────────────────────────────────────────────

  private buildBackdrop(): void {
    this.backdropGfx.clear();
    this.backdropGfx.rect(0, 0, this.width, this.height);
    this.backdropGfx.fill({ color: UI_COLORS.BG_OVERLAY, alpha: 0.85 });
    this.backdropGfx.eventMode = 'static';
  }

  private buildPanel(): void {
    const pad = 24;
    const pWidth = this.width - pad * 2;
    const pHeight = this.height - pad * 2;

    this.panelGfx.clear();
    this.panelGfx.roundRect(pad, pad, pWidth, pHeight, UI_RADIUS.LG);
    this.panelGfx.fill({ color: UI_COLORS.BG_PANEL, alpha: 0.96 });
    this.panelGfx.stroke({ color: UI_COLORS.BORDER_DEFAULT, width: 1.5, alpha: 0.8 });

    this.panelGfx.moveTo(pad, pad + 72);
    this.panelGfx.lineTo(pad + pWidth, pad + 72);
    this.panelGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
  }

  private buildHeader(): void {
    this.headerContainer.removeChildren();

    const titleText = new Text({
      text: 'MISSION CONTRACTS & SPONSORSHIP FUNDING',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 18,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
        letterSpacing: 2,
      }),
    });
    titleText.position.set(48, 40);
    this.headerContainer.addChild(titleText);

    const subText = new Text({
      text: 'FINANCIAL MANAGEMENT // INSTITUTIONAL GRANTS // SPONSOR RELATIONSHIPS',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fill: UI_COLORS.TEXT_HIGHLIGHT,
        letterSpacing: 1.2,
      }),
    });
    subText.position.set(48, 64);
    this.headerContainer.addChild(subText);

    // Feedback notification message
    this.feedbackText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fill: UI_COLORS.TEXT_SUCCESS,
        letterSpacing: 0.8,
      }),
    });
    this.feedbackText.position.set(640, 52);
    this.headerContainer.addChild(this.feedbackText);

    // Close button
    const closeBtn = new UIButton({
      label: 'CLOSE [ESC]',
      variant: 'GHOST',
      width: 130,
      height: 32,
      onClick: () => this.hide(),
    });
    closeBtn.container.position.set(this.width - 48 - 130, 42);
    this.headerContainer.addChild(closeBtn.container);
  }

  private buildTabGroup(): void {
    if (this.tabGroup) {
      this.headerContainer.removeChild(this.tabGroup.container);
      this.tabGroup.destroy();
    }

    this.tabGroup = new UITabGroup({
      tabs: [
        { id: 'tab_overview', label: 'FUNDING OVERVIEW' },
        { id: 'tab_available', label: 'AVAILABLE CONTRACTS' },
        { id: 'tab_active', label: 'ACTIVE CONTRACTS' },
        { id: 'tab_sponsors', label: 'SPONSOR DIRECTORY' },
        { id: 'tab_history', label: 'CONTRACT HISTORY' },
      ],
      width: 820,
      height: 32,
      initialTabId: this.currentTabId,
      onTabChange: (tabId) => this.switchTab(tabId),
    });

    this.tabGroup.container.position.set(48, 104);
    this.headerContainer.addChild(this.tabGroup.container);
  }

  private switchTab(tabId: string): void {
    this.currentTabId = tabId;
    this.refreshContent();
  }

  private showFeedback(message: string, isError: boolean = false): void {
    if (this.feedbackText) {
      this.feedbackText.text = message;
      this.feedbackText.style.fill = isError ? UI_COLORS.TEXT_DANGER : UI_COLORS.TEXT_SUCCESS;
      this.feedbackTimer = 3.5;
    }
  }

  // ─── Content Routing ─────────────────────────────────────────────────────────

  private refreshContent(): void {
    this.contentContainer.removeChildren();

    switch (this.currentTabId) {
      case 'tab_overview':
        this.renderOverviewTab();
        break;
      case 'tab_available':
        this.renderAvailableContractsTab();
        break;
      case 'tab_active':
        this.renderActiveContractsTab();
        break;
      case 'tab_sponsors':
        this.renderSponsorsTab();
        break;
      case 'tab_history':
        this.renderHistoryTab();
        break;
      default:
        this.renderOverviewTab();
        break;
    }
  }

  // ─── TAB 1: Funding Overview & Activity Log ──────────────────────────────────

  private renderOverviewTab(): void {
    const overview = this.manager.getFundingOverview();
    const startY = 152;
    const startX = 48;
    const usableWidth = this.width - 96;

    // 1. KPI Cards Row
    const kpis = [
      {
        label: 'CONFIRMED REVENUE',
        value: `$₵${overview.confirmedFunding.toLocaleString()}`,
        color: UI_COLORS.GREEN,
      },
      {
        label: 'ACTIVE CONTRACT VALUE',
        value: `$₵${overview.activeContractValue.toLocaleString()}`,
        color: UI_COLORS.CYAN,
      },
      {
        label: 'PROJECTED GRANTS',
        value: `$₵${overview.projectedGrants.toLocaleString()}`,
        color: UI_COLORS.BLUE,
      },
      {
        label: 'CURRENT LIQUIDITY',
        value: `$₵${overview.currentCreditsBalance.toLocaleString()}`,
        color: UI_COLORS.AMBER,
      },
      {
        label: 'CONTRACT RATIO',
        value: `${overview.contractsCompleted} COMPLETED / ${overview.contractsActive} ACTIVE`,
        color: UI_COLORS.PURPLE,
      },
    ];

    const cardWidth = Math.floor((usableWidth - 16 * (kpis.length - 1)) / kpis.length);
    kpis.forEach((kpi, idx) => {
      const cardX = startX + idx * (cardWidth + 16);
      const cardGfx = new Graphics();
      cardGfx.roundRect(cardX, startY, cardWidth, 80, UI_RADIUS.MD);
      cardGfx.fill({ color: UI_COLORS.BG_SURFACE, alpha: 0.9 });
      cardGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });

      const label = new Text({
        text: kpi.label,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fontWeight: 'bold',
          fill: UI_COLORS.TEXT_MUTED,
          letterSpacing: 0.8,
        }),
      });
      label.position.set(cardX + 16, startY + 14);

      const val = new Text({
        text: kpi.value,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 15,
          fontWeight: 'bold',
          fill: kpi.color,
          letterSpacing: 0.8,
        }),
      });
      val.position.set(cardX + 16, startY + 38);

      this.contentContainer.addChild(cardGfx);
      this.contentContainer.addChild(label);
      this.contentContainer.addChild(val);
    });

    // 2. Verified Funding Activity Log (Transaction Table)
    const tableY = startY + 104;
    const tableHeight = 540;

    const tablePanel = new Graphics();
    tablePanel.roundRect(startX, tableY, usableWidth, tableHeight, UI_RADIUS.MD);
    tablePanel.fill({ color: UI_COLORS.BG_SURFACE, alpha: 0.7 });
    tablePanel.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    this.contentContainer.addChild(tablePanel);

    const logTitle = new Text({
      text: 'TRANSACTION LEDGER & VERIFIED REVENUE LOG',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 12,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_HIGHLIGHT,
        letterSpacing: 1.0,
      }),
    });
    logTitle.position.set(startX + 24, tableY + 18);
    this.contentContainer.addChild(logTitle);

    const transactions = this.manager.getFundingEngine().getTransactions();

    if (transactions.length === 0) {
      const emptyText = new Text({
        text: 'No transaction records found. Complete contracts or collect grants to populate ledger.',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11,
          fill: UI_COLORS.TEXT_MUTED,
        }),
      });
      emptyText.position.set(startX + 24, tableY + 54);
      this.contentContainer.addChild(emptyText);
    } else {
      // Table Header Row
      const rowHeaderY = tableY + 52;
      const thStyle = new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_MUTED,
        letterSpacing: 0.8,
      });

      const cols = [
        { title: 'TX IDENTIFIER', x: startX + 24 },
        { title: 'FUNDING SOURCE', x: startX + 180 },
        { title: 'ISSUING SPONSOR', x: startX + 420 },
        { title: 'REASON / DESCRIPTION', x: startX + 700 },
        { title: 'AMOUNT (CREDITS)', x: startX + usableWidth - 160 },
      ];

      cols.forEach((c) => {
        const hText = new Text({ text: c.title, style: thStyle });
        hText.position.set(c.x, rowHeaderY);
        this.contentContainer.addChild(hText);
      });

      // Render up to 10 latest transactions
      const recent = [...transactions].reverse().slice(0, 10);
      recent.forEach((tx, i) => {
        const rowY = rowHeaderY + 28 + i * 42;

        const rowGfx = new Graphics();
        rowGfx.roundRect(startX + 16, rowY - 4, usableWidth - 32, 34, UI_RADIUS.XS);
        rowGfx.fill({ color: i % 2 === 0 ? UI_COLORS.BG_GLASS : UI_COLORS.BG_PANEL, alpha: 0.6 });
        this.contentContainer.addChild(rowGfx);

        const idText = new Text({
          text: tx.id,
          style: new TextStyle({
            fontFamily: UI_FONTS.FAMILY,
            fontSize: 10,
            fill: UI_COLORS.TEXT_MUTED,
          }),
        });
        idText.position.set(startX + 24, rowY + 6);
        this.contentContainer.addChild(idText);

        const srcText = new Text({
          text: FUNDING_SOURCE_LABELS[tx.source] || tx.source,
          style: new TextStyle({
            fontFamily: UI_FONTS.FAMILY,
            fontSize: 10,
            fill: UI_COLORS.TEXT_PRIMARY,
          }),
        });
        srcText.position.set(startX + 180, rowY + 6);
        this.contentContainer.addChild(srcText);

        const entText = new Text({
          text: tx.sourceEntityName,
          style: new TextStyle({
            fontFamily: UI_FONTS.FAMILY,
            fontSize: 10,
            fill: UI_COLORS.TEXT_SECONDARY,
          }),
        });
        entText.position.set(startX + 420, rowY + 6);
        this.contentContainer.addChild(entText);

        const rsnText = new Text({
          text: tx.reason.length > 50 ? tx.reason.substring(0, 47) + '...' : tx.reason,
          style: new TextStyle({
            fontFamily: UI_FONTS.FAMILY,
            fontSize: 10,
            fill: UI_COLORS.TEXT_SECONDARY,
          }),
        });
        rsnText.position.set(startX + 700, rowY + 6);
        this.contentContainer.addChild(rsnText);

        const amtText = new Text({
          text: `+$₵${tx.amountCredits.toLocaleString()}`,
          style: new TextStyle({
            fontFamily: UI_FONTS.FAMILY,
            fontSize: 11,
            fontWeight: 'bold',
            fill: UI_COLORS.GREEN,
          }),
        });
        amtText.position.set(startX + usableWidth - 160, rowY + 4);
        this.contentContainer.addChild(amtText);
      });
    }
  }

  // ─── TAB 2: Available Contracts Board ────────────────────────────────────────

  private renderAvailableContractsTab(): void {
    const startY = 152;
    const startX = 48;
    const usableWidth = this.width - 96;

    // Filters Row
    const filterRow = new Container();
    filterRow.position.set(startX, startY);
    this.contentContainer.addChild(filterRow);

    const catLabel = new Text({
      text: 'CATEGORY:',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_MUTED,
        letterSpacing: 0.8,
      }),
    });
    catLabel.position.set(0, 6);
    filterRow.addChild(catLabel);

    const categories: Array<{ id: ContractCategory | 'ALL'; label: string }> = [
      { id: 'ALL', label: 'ALL DISCIPLINES' },
      { id: ContractCategory.SATELLITE_DEPLOYMENT, label: 'SATELLITE' },
      { id: ContractCategory.COMMUNICATIONS_INFRASTRUCTURE, label: 'COMMS' },
      { id: ContractCategory.SCIENTIFIC_RESEARCH, label: 'SCIENCE' },
      { id: ContractCategory.PLANETARY_OBSERVATION, label: 'OBSERVATION' },
      { id: ContractCategory.ROBOTIC_EXPLORATION, label: 'ROBOTIC' },
      { id: ContractCategory.PAYLOAD_TRANSPORTATION, label: 'TRANSPORT' },
      { id: ContractCategory.PLANETARY_BASE_DEVELOPMENT, label: 'BASES' },
      { id: ContractCategory.LONG_TERM_PROGRAMME, label: 'PROGRAMMES' },
    ];

    let catX = 80;
    categories.forEach((cat) => {
      const isSelected = this.filterCategory === cat.id;
      const btn = new UIButton({
        label: cat.label,
        variant: isSelected ? 'PRIMARY' : 'GHOST',
        width: 120,
        height: 26,
        onClick: () => {
          this.filterCategory = cat.id;
          this.refreshContent();
        },
      });
      btn.container.position.set(catX, 0);
      filterRow.addChild(btn.container);
      catX += 128;
    });

    // Destination Filters Row
    const destRow = new Container();
    destRow.position.set(startX, startY + 34);
    this.contentContainer.addChild(destRow);

    const destLabel = new Text({
      text: 'DESTINATION:',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_MUTED,
        letterSpacing: 0.8,
      }),
    });
    destLabel.position.set(0, 6);
    destRow.addChild(destLabel);

    const destinations: Array<{ id: DestinationId | 'ALL'; label: string }> = [
      { id: 'ALL', label: 'ALL DESTINATIONS' },
      { id: DestinationId.EARTH_ORBIT_LEO, label: 'EARTH ORBIT' },
      { id: DestinationId.MOON, label: 'THE MOON' },
      { id: DestinationId.MARS, label: 'MARS' },
      { id: DestinationId.VENUS, label: 'VENUS' },
      { id: DestinationId.JUPITER, label: 'OUTER GIANTS' },
    ];

    let destX = 80;
    destinations.forEach((d) => {
      const isSelected = this.filterDestination === d.id;
      const btn = new UIButton({
        label: d.label,
        variant: isSelected ? 'PRIMARY' : 'GHOST',
        width: 130,
        height: 26,
        onClick: () => {
          this.filterDestination = d.id;
          this.refreshContent();
        },
      });
      btn.container.position.set(destX, 0);
      destRow.addChild(btn.container);
      destX += 138;
    });

    // Available Contracts Grid
    const available = this.manager.listAvailableContracts();
    const filtered = available.filter((c) => {
      if (this.filterCategory !== 'ALL' && c.category !== this.filterCategory) {
        return false;
      }
      if (this.filterDestination !== 'ALL') {
        if (this.filterDestination === DestinationId.EARTH_ORBIT_LEO) {
          if (
            c.destinationId !== DestinationId.EARTH_ORBIT_LEO &&
            c.destinationId !== DestinationId.EARTH_ORBIT_GEO &&
            c.destinationId !== DestinationId.EARTH_ORBIT_HEO
          ) {
            return false;
          }
        } else if (c.destinationId !== this.filterDestination) {
          return false;
        }
      }
      return true;
    });

    const cardYStart = startY + 76;
    const colWidth = Math.floor((usableWidth - 24) / 2);
    const cardHeight = 210;

    if (filtered.length === 0) {
      const emptyText = new Text({
        text: 'No contracts match the current filters. Adjust your destination or category criteria.',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 12,
          fill: UI_COLORS.TEXT_MUTED,
        }),
      });
      emptyText.position.set(startX, cardYStart + 20);
      this.contentContainer.addChild(emptyText);
    } else {
      filtered.slice(0, 4).forEach((contract, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const cardX = startX + col * (colWidth + 24);
        const cardY = cardYStart + row * (cardHeight + 16);

        const card = new ContractCard({
          contract,
          width: colWidth,
          height: cardHeight,
          onAccept: (cId) => {
            try {
              this.manager.acceptContract(cId);
              this.showFeedback(`Contract "${contract.title}" accepted!`);
              this.refreshContent();
            } catch (err: any) {
              this.showFeedback(err.message, true);
            }
          },
        });
        card.container.position.set(cardX, cardY);
        this.contentContainer.addChild(card.container);
      });
    }
  }

  // ─── TAB 3: Active Flight Contracts ──────────────────────────────────────────

  private renderActiveContractsTab(): void {
    const startY = 152;
    const startX = 48;
    const usableWidth = this.width - 96;

    const activeContracts = this.manager
      .listContracts()
      .filter((c) => c.status === ContractStatus.ACCEPTED || c.status === ContractStatus.IN_PROGRESS);

    const title = new Text({
      text: `ACTIVE FLIGHT CONTRACTS DIRECTORY (${activeContracts.length} IN FLIGHT)`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 12,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_HIGHLIGHT,
        letterSpacing: 1.0,
      }),
    });
    title.position.set(startX, startY);
    this.contentContainer.addChild(title);

    const colWidth = Math.floor((usableWidth - 24) / 2);
    const cardHeight = 220;
    const cardYStart = startY + 28;

    if (activeContracts.length === 0) {
      const emptyText = new Text({
        text: 'No contracts currently active. Visit the Available Contracts board to authorize new agreements.',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 12,
          fill: UI_COLORS.TEXT_MUTED,
        }),
      });
      emptyText.position.set(startX, cardYStart + 20);
      this.contentContainer.addChild(emptyText);
    } else {
      activeContracts.slice(0, 4).forEach((contract, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const cardX = startX + col * (colWidth + 24);
        const cardY = cardYStart + row * (cardHeight + 16);

        const card = new ContractCard({
          contract,
          width: colWidth,
          height: cardHeight,
          onComplete: (cId) => {
            try {
              this.manager.completeContract(cId);
              this.showFeedback(`Contract "${contract.title}" completed! Payout deposited.`);
              this.refreshContent();
            } catch (err: any) {
              this.showFeedback(err.message, true);
            }
          },
          onExtend: (cId) => {
            const res = this.manager.requestDeadlineExtension(cId);
            if (res.success) {
              this.showFeedback(`Deadline extended for "${contract.title}".`);
              this.refreshContent();
            } else {
              this.showFeedback(res.error || 'Extension failed', true);
            }
          },
          onCancel: (cId) => {
            try {
              this.manager.cancelContract(cId, 'Cancelled by Flight Director');
              this.showFeedback(`Contract "${contract.title}" cancelled.`);
              this.refreshContent();
            } catch (err: any) {
              this.showFeedback(err.message, true);
            }
          },
        });
        card.container.position.set(cardX, cardY);
        this.contentContainer.addChild(card.container);
      });
    }
  }

  // ─── TAB 4: Sponsor Directory & Agreements ───────────────────────────────────

  private renderSponsorsTab(): void {
    const startY = 152;
    const startX = 48;
    const usableWidth = this.width - 96;

    const title = new Text({
      text: 'INSTITUTIONAL SPONSOR DIRECTORY & RECURRING GRANT AGREEMENTS',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 12,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_HIGHLIGHT,
        letterSpacing: 1.0,
      }),
    });
    title.position.set(startX, startY);
    this.contentContainer.addChild(title);

    const sponsors = this.manager.listSponsors();
    const colWidth = Math.floor((usableWidth - 24) / 2);
    const cardHeight = 240;
    const startCardY = startY + 28;

    sponsors.slice(0, 4).forEach((sponsor, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cardX = startX + col * (colWidth + 24);
      const cardY = startCardY + row * (cardHeight + 16);

      const panel = new SponsorDossierPanel({
        sponsor,
        width: colWidth,
        height: cardHeight,
      });
      panel.container.position.set(cardX, cardY);
      this.contentContainer.addChild(panel.container);
    });
  }

  // ─── TAB 5: Contract History ─────────────────────────────────────────────────

  private renderHistoryTab(): void {
    const startY = 152;
    const startX = 48;
    const usableWidth = this.width - 96;

    const completed = this.manager
      .listContracts()
      .filter((c) => c.status === ContractStatus.COMPLETED);

    const title = new Text({
      text: `COMPLETED CONTRACTS ARCHIVE (${completed.length} FULFILLED DIRECTIVES)`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 12,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_HIGHLIGHT,
        letterSpacing: 1.0,
      }),
    });
    title.position.set(startX, startY);
    this.contentContainer.addChild(title);

    const colWidth = Math.floor((usableWidth - 24) / 2);
    const cardHeight = 210;
    const startCardY = startY + 28;

    if (completed.length === 0) {
      const emptyText = new Text({
        text: 'No completed contracts in historical log. Authorize and fulfill missions to establish contract history.',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 12,
          fill: UI_COLORS.TEXT_MUTED,
        }),
      });
      emptyText.position.set(startX, startCardY + 20);
      this.contentContainer.addChild(emptyText);
    } else {
      completed.slice(0, 4).forEach((contract, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const cardX = startX + col * (colWidth + 24);
        const cardY = startCardY + row * (cardHeight + 16);

        const card = new ContractCard({
          contract,
          width: colWidth,
          height: cardHeight,
        });
        card.container.position.set(cardX, cardY);
        this.contentContainer.addChild(card.container);
      });
    }
  }
}
