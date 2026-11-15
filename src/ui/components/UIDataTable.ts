/**
 * INTERSTELLAR CONTINUUM - Reusable Data Table Component
 * Structured telemetry grid with formatted columns and zebra rows.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_SPACING } from '../core/UIDesignTokens';

export interface UIDataTableColumn {
  key: string;
  label?: string;
  title?: string;
  width: number;
  align?: 'left' | 'center' | 'right';
  formatter?: (value: any) => string;
}

export interface UIDataTableOptions {
  columns: UIDataTableColumn[];
  width?: number;
  rowHeight?: number;
  rows?: Array<Record<string, any>>;
}

export class UIDataTable extends UIComponent {
  private columns: UIDataTableColumn[];
  private tableWidth: number;
  private rowHeight: number;

  private headerContainer: Container;
  private rowsContainer: Container;

  constructor(options: UIDataTableOptions) {
    super('DataTable');

    this.columns = options.columns;
    this.tableWidth = options.width ?? options.columns.reduce((acc, col) => acc + col.width, 32);
    this.rowHeight = options.rowHeight ?? 28;

    this.headerContainer = new Container();
    this.rowsContainer = new Container();
    this.rowsContainer.position.set(0, this.rowHeight + 2);

    this.container.addChild(this.headerContainer);
    this.container.addChild(this.rowsContainer);

    this.drawHeader();
    if (options.rows) {
      this.setRows(options.rows);
    }
  }

  private drawHeader(): void {
    const bg = new Graphics();
    bg.rect(0, 0, this.tableWidth, this.rowHeight);
    bg.fill({ color: UI_COLORS.BG_PANEL_ELEVATED, alpha: 0.9 });
    bg.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });

    this.headerContainer.addChild(bg);

    const headerStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_ACCENT,
      letterSpacing: 1.0,
    });

    let currentX = UI_SPACING.MD;
    for (const col of this.columns) {
      const headerTitle = (col.label ?? col.title ?? col.key).toUpperCase();
      const txt = new Text({ text: headerTitle, style: headerStyle });
      txt.position.set(currentX, this.rowHeight / 2 - 6);
      this.headerContainer.addChild(txt);
      currentX += col.width;
    }
  }

  public setRows(data: Array<Record<string, any>>): void {
    this.rowsContainer.removeChildren();

    const cellStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 11,
      fill: UI_COLORS.TEXT_PRIMARY,
      letterSpacing: 0.5,
    });

    data.forEach((row, rowIndex) => {
      const rowContainer = new Container();
      rowContainer.position.set(0, rowIndex * this.rowHeight);

      const bg = new Graphics();
      bg.rect(0, 0, this.tableWidth, this.rowHeight);
      const isEven = rowIndex % 2 === 0;
      bg.fill({
        color: isEven ? UI_COLORS.BG_PANEL : UI_COLORS.BG_PANEL_ELEVATED,
        alpha: isEven ? 0.7 : 0.85,
      });

      rowContainer.addChild(bg);

      let currentX = UI_SPACING.MD;
      for (const col of this.columns) {
        const rawVal = row[col.key];
        const formatted = col.formatter ? col.formatter(rawVal) : (rawVal !== undefined ? String(rawVal) : '-');
        const txt = new Text({ text: formatted, style: cellStyle });
        txt.position.set(currentX, this.rowHeight / 2 - 6);
        rowContainer.addChild(txt);
        currentX += col.width;
      }

      this.rowsContainer.addChild(rowContainer);
    });
  }
}
