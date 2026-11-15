/**
 * INTERSTELLAR CONTINUUM - Mission Event Log Panel Component (Section E)
 * Chronological mission event history audit log with category filtering,
 * sort order toggle (newest/oldest), MET timestamps, and detailed inspection card.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../../../ui/core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS, UI_SPACING } from '../../../ui/core/UIDesignTokens';
import { MissionControlEvent } from '../../types/MissionControlTypes';
import { UIButton } from '../../../ui/components/UIButton';

export interface MissionEventLogPanelOptions {
  width?: number;
  height?: number;
}

export class MissionEventLogPanel extends UIComponent {
  private width: number;
  private height: number;

  private bgGfx: Graphics;
  private filterContainer: Container;
  private listContainer: Container;
  private inspectorContainer: Container;

  private allEvents: MissionControlEvent[] = [];
  private activeCategory: string = 'ALL';
  private sortAscending: boolean = false; // default newest first
  private selectedEventId: string | null = null;

  private sortBtn?: UIButton;

  constructor(options: MissionEventLogPanelOptions = {}) {
    super('MissionEventLogPanel');

    this.width = options.width ?? 1860;
    this.height = options.height ?? 370;

    this.bgGfx = new Graphics();
    this.filterContainer = new Container();
    this.listContainer = new Container();
    this.inspectorContainer = new Container();

    this.container.addChild(this.bgGfx);
    this.container.addChild(this.filterContainer);
    this.container.addChild(this.listContainer);
    this.container.addChild(this.inspectorContainer);

    this.filterContainer.position.set(UI_SPACING.MD, UI_SPACING.MD);
    this.listContainer.position.set(UI_SPACING.MD, 50);
    this.inspectorContainer.position.set(1280, 50);

    this.setupFilterBar();
    this.drawBackground();
  }

  public setEvents(events: MissionControlEvent[]): void {
    this.allEvents = events;
    if (this.allEvents.length > 0 && !this.selectedEventId) {
      this.selectedEventId = this.allEvents[0]?.id ?? null;
    }
    this.renderEvents();
  }

  private setupFilterBar(): void {
    this.filterContainer.removeChildren();

    const categories = ['ALL', 'LIFECYCLE', 'TRAJECTORY', 'COMMUNICATION', 'PAYLOAD', 'SCIENCE'];
    let curX = 0;

    for (const cat of categories) {
      const isSelected = this.activeCategory === cat;
      const btn = new UIButton({
        label: cat,
        width: 140,
        height: 28,
        variant: isSelected ? 'PRIMARY' : 'OUTLINE',
        onClick: () => {
          this.activeCategory = cat;
          this.setupFilterBar();
          this.renderEvents();
        },
      });
      btn.container.position.set(curX, 0);
      this.filterContainer.addChild(btn.container);
      curX += 148;
    }

    // Sort order button
    this.sortBtn = new UIButton({
      label: this.sortAscending ? 'SORT: OLDEST FIRST' : 'SORT: NEWEST FIRST',
      width: 200,
      height: 28,
      variant: 'SECONDARY',
      onClick: () => {
        this.sortAscending = !this.sortAscending;
        if (this.sortBtn) {
          this.sortBtn.setLabel(this.sortAscending ? 'SORT: OLDEST FIRST' : 'SORT: NEWEST FIRST');
        }
        this.renderEvents();
      },
    });
    this.sortBtn.container.position.set(this.width - 240, 0);
    this.filterContainer.addChild(this.sortBtn.container);
  }

  private renderEvents(): void {
    this.listContainer.removeChildren();

    let filtered = [...this.allEvents];
    if (this.activeCategory !== 'ALL') {
      filtered = filtered.filter((e) => e.category === this.activeCategory);
    }

    filtered.sort((a, b) => {
      return this.sortAscending ? a.metSeconds - b.metSeconds : b.metSeconds - a.metSeconds;
    });

    if (filtered.length === 0) {
      const emptyText = new Text({
        text: 'NO EVENT RECORDS FOUND FOR THIS FILTER',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11,
          fill: UI_COLORS.TEXT_MUTED,
        }),
      });
      emptyText.position.set(20, 20);
      this.listContainer.addChild(emptyText);
      this.renderInspector(null);
      return;
    }

    const rowH = 48;
    const maxRows = 6;
    for (let i = 0; i < Math.min(maxRows, filtered.length); i++) {
      const evt = filtered[i];
      if (!evt) continue;
      const isSelected = this.selectedEventId === evt.id;
      const row = this.createEventRow(evt, 0, i * (rowH + 4), 1250, rowH, isSelected);
      this.listContainer.addChild(row);
    }

    const selected = filtered.find((e) => e.id === this.selectedEventId) ?? filtered[0] ?? null;
    this.renderInspector(selected);
  }

  private createEventRow(
    evt: MissionControlEvent,
    x: number,
    y: number,
    w: number,
    h: number,
    isSelected: boolean
  ): Container {
    const row = new Container();
    row.position.set(x, y);

    const gfx = new Graphics();
    gfx.roundRect(0, 0, w, h, UI_RADIUS.XS);
    gfx.fill({ color: isSelected ? 0x0f294a : 0x071526, alpha: 0.9 });
    gfx.stroke({
      color: isSelected ? UI_COLORS.BORDER_FOCUS : UI_COLORS.BORDER_SUBTLE,
      width: isSelected ? 1.5 : 0.8,
    });
    gfx.eventMode = 'static';
    gfx.cursor = 'pointer';
    gfx.on('pointerdown', () => {
      this.selectedEventId = evt.id;
      this.renderEvents();
    });
    row.addChild(gfx);

    // Severity color stripe
    let stripeColor: number = UI_COLORS.CYAN;
    if (evt.severity === 'CRITICAL') stripeColor = UI_COLORS.RED;
    else if (evt.severity === 'CAUTION') stripeColor = UI_COLORS.AMBER;
    else if (evt.severity === 'NOTICE') stripeColor = UI_COLORS.GREEN;

    gfx.rect(0, 0, 4, h).fill({ color: stripeColor, alpha: 0.95 });

    // MET timestamp
    const days = Math.floor(evt.metSeconds / 86400);
    const hours = Math.floor((evt.metSeconds % 86400) / 3600);
    const mins = Math.floor((evt.metSeconds % 3600) / 60);
    const secs = Math.floor(evt.metSeconds % 60);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const metStr = `T+${pad(days)}d ${pad(hours)}:${pad(mins)}:${pad(secs)}`;

    const metText = new Text({
      text: metStr,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_MUTED,
      }),
    });
    metText.position.set(16, 8);
    row.addChild(metText);

    // Category badge
    const catText = new Text({
      text: `[${evt.category}]`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 9.5,
        fontWeight: 'bold',
        fill: stripeColor,
      }),
    });
    catText.position.set(160, 8);
    row.addChild(catText);

    // Title
    const titleText = new Text({
      text: evt.title.toUpperCase(),
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
      }),
    });
    titleText.position.set(290, 7);
    row.addChild(titleText);

    // Summary description
    const descText = new Text({
      text: evt.description.length > 80 ? `${evt.description.substring(0, 77)}...` : evt.description,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 9.5,
        fill: UI_COLORS.TEXT_SECONDARY,
      }),
    });
    descText.position.set(16, 26);
    row.addChild(descText);

    return row;
  }

  private renderInspector(evt: MissionControlEvent | null): void {
    this.inspectorContainer.removeChildren();

    const w = 550;
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
      text: 'EVENT AUDIT DOSSIER',
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
    this.inspectorContainer.addChild(gfx);

    if (!evt) {
      const noneText = new Text({
        text: 'SELECT AN EVENT TO INSPECT DETAILS',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fill: UI_COLORS.TEXT_MUTED,
        }),
      });
      noneText.position.set(20, 50);
      this.inspectorContainer.addChild(noneText);
      return;
    }

    const title = new Text({
      text: evt.title.toUpperCase(),
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 12,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_HIGHLIGHT,
      }),
    });
    title.position.set(15, 38);
    this.inspectorContainer.addChild(title);

    const desc = new Text({
      text: evt.description,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fill: UI_COLORS.TEXT_PRIMARY,
        wordWrap: true,
        wordWrapWidth: w - 30,
        lineHeight: 16,
      }),
    });
    desc.position.set(15, 68);
    this.inspectorContainer.addChild(desc);

    const timeStr = `RECORDED AT: MET T+${evt.metSeconds}s // WALL CLOCK: ${new Date(evt.timestamp).toISOString()}`;
    const timeText = new Text({
      text: timeStr,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 9,
        fill: UI_COLORS.TEXT_MUTED,
      }),
    });
    timeText.position.set(15, 140);
    this.inspectorContainer.addChild(timeText);

    const catBadge = new Text({
      text: `CATEGORY: ${evt.category} // SEVERITY: ${evt.severity ?? 'NORMAL'}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 9.5,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
      }),
    });
    catBadge.position.set(15, 160);
    this.inspectorContainer.addChild(catBadge);
  }

  private drawBackground(): void {
    this.bgGfx.clear();
    this.bgGfx.roundRect(0, 0, this.width, this.height, UI_RADIUS.SM);
    this.bgGfx.fill({ color: 0x020713, alpha: 0.7 });
    this.bgGfx.stroke({ color: UI_COLORS.BORDER_DIM, width: 1.0 });
  }
}
