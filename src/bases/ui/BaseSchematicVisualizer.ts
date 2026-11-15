/**
 * INTERSTELLAR CONTINUUM - Planetary Base 2D/2.5D Schematic Visualizer
 * Renders an isometric/depth-shaded tactical base layout with ground shadows,
 * power conduit linkages, module status beacons, and ambient planetary palettes.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { DestinationId } from '../../destinations/DestinationTypes';
import {
  BaseRecord,
  InstalledModuleRecord,
  ModuleOperationalState,
} from '../BaseTypes';

export interface VisualizerConfig {
  width?: number;
  height?: number;
  onSlotClicked?: (slotIndex: number) => void;
  onModuleClicked?: (module: InstalledModuleRecord) => void;
}

export class BaseSchematicVisualizer {
  public container: Container;
  private width: number;
  private height: number;
  private onSlotClicked?: (slotIndex: number) => void;
  private onModuleClicked?: (module: InstalledModuleRecord) => void;

  private backgroundGfx: Graphics;
  private gridGfx: Graphics;
  private conduitsGfx: Graphics;
  private modulesContainer: Container;
  private labelsContainer: Container;

  private currentBase?: BaseRecord;

  constructor(config?: VisualizerConfig) {
    this.width = config?.width ?? 760;
    this.height = config?.height ?? 460;
    this.onSlotClicked = config?.onSlotClicked;
    this.onModuleClicked = config?.onModuleClicked;

    this.container = new Container();
    this.container.label = 'BaseSchematicVisualizer';

    this.backgroundGfx = new Graphics();
    this.gridGfx = new Graphics();
    this.conduitsGfx = new Graphics();
    this.modulesContainer = new Container();
    this.labelsContainer = new Container();

    this.container.addChild(this.backgroundGfx);
    this.container.addChild(this.gridGfx);
    this.container.addChild(this.conduitsGfx);
    this.container.addChild(this.modulesContainer);
    this.container.addChild(this.labelsContainer);

    this.renderEmptyState();
  }

  public setBase(base: BaseRecord): void {
    this.currentBase = base;
    this.render();
  }

  public render(): void {
    if (!this.currentBase) {
      this.renderEmptyState();
      return;
    }

    this.clearGfx();
    const dest = this.currentBase.destinationId;
    const { groundColor, accentColor, tintAlpha } = this.getDestinationPalette(dest);

    // 1. Planetary terrain background
    this.safeDrawRect(this.backgroundGfx, 0, 0, this.width, this.height, 0x070c18, 0.95);
    this.safeDrawRect(this.backgroundGfx, 8, 8, this.width - 16, this.height - 16, groundColor, tintAlpha);

    // 2. Grid slots & modules layout
    const slots = this.currentBase.maxSlots;
    const cols = 4;
    const rows = Math.ceil(slots / cols);
    const startX = 80;
    const startY = 70;
    const slotW = 140;
    const slotH = 100;
    const gapX = 25;
    const gapY = 25;

    const moduleSlotMap = new Map<number, InstalledModuleRecord>();
    for (const m of this.currentBase.installedModules) {
      moduleSlotMap.set(m.slotIndex, m);
    }

    const slotCoords: { x: number; y: number; index: number }[] = [];

    for (let i = 0; i < slots; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (slotW + gapX);
      const y = startY + row * (slotH + gapY);
      slotCoords.push({ x, y, index: i });

      const mod = moduleSlotMap.get(i);

      // Ground shadow (2.5D depth illusion)
      this.safeDrawRect(this.gridGfx, x + 6, y + 6, slotW, slotH, 0x02050a, 0.6);

      if (mod) {
        // Module foundation pad
        this.safeDrawRect(this.gridGfx, x, y, slotW, slotH, 0x111c2e, 0.95);
        this.safeDrawRect(this.gridGfx, x, y, slotW, 4, accentColor, 0.9);

        // Status beacon indicator color
        let statusColor = 0x00e676; // Active green
        if (mod.operationalState === ModuleOperationalState.DEGRADED) statusColor = 0xffd600;
        else if (mod.operationalState === ModuleOperationalState.OFFLINE) statusColor = 0xff1744;
        else if (mod.health < 50) statusColor = 0xff9100;

        // Isometric module roof block
        this.safeDrawRect(this.modulesContainer as any, x + 8, y + 10, slotW - 16, slotH - 30, 0x182a44, 0.9);
        this.safeDrawRect(this.modulesContainer as any, x + slotW - 20, y + 14, 8, 8, statusColor, 1.0);

        // Text label
        const titleStyle = new TextStyle({
          fill: 0xffffff,
          fontSize: 11,
          fontWeight: 'bold',
          wordWrap: true,
          wordWrapWidth: slotW - 24,
        });
        const nameText = new Text({ text: mod.name, style: titleStyle });
        nameText.x = x + 12;
        nameText.y = y + 16;
        this.labelsContainer.addChild(nameText);

        const subStyle = new TextStyle({
          fill: 0x81d4fa,
          fontSize: 9,
        });
        const subText = new Text({
          text: `Tier ${mod.level} | ${mod.health}% HP`,
          style: subStyle,
        });
        subText.x = x + 12;
        subText.y = y + slotH - 18;
        this.labelsContainer.addChild(subText);
      } else {
        // Empty open building slot
        this.safeDrawRect(this.gridGfx, x, y, slotW, slotH, 0x0d1522, 0.6);
        const emptyStyle = new TextStyle({
          fill: 0x546e7a,
          fontSize: 10,
        });
        const emptyText = new Text({
          text: `Slot #${i + 1}\n[AVAILABLE]`,
          style: emptyStyle,
        });
        emptyText.x = x + 35;
        emptyText.y = y + 35;
        this.labelsContainer.addChild(emptyText);
      }
    }

    // 3. Draw power conduits between adjacent modules
    for (let i = 0; i < slotCoords.length; i++) {
      const current = slotCoords[i];
      if (!moduleSlotMap.has(current.index)) continue;

      // Check right neighbor
      if (i % cols < cols - 1 && i + 1 < slotCoords.length && moduleSlotMap.has(i + 1)) {
        const next = slotCoords[i + 1];
        this.safeDrawLine(
          this.conduitsGfx,
          current.x + slotW,
          current.y + slotH / 2,
          next.x,
          next.y + slotH / 2,
          0x00e5ff,
          0.8
        );
      }

      // Check bottom neighbor
      const bottomIdx = i + cols;
      if (bottomIdx < slotCoords.length && moduleSlotMap.has(bottomIdx)) {
        const bottom = slotCoords[bottomIdx];
        this.safeDrawLine(
          this.conduitsGfx,
          current.x + slotW / 2,
          current.y + slotH,
          bottom.x + slotW / 2,
          bottom.y,
          0x00e5ff,
          0.8
        );
      }
    }
  }

  private renderEmptyState(): void {
    this.clearGfx();
    this.safeDrawRect(this.backgroundGfx, 0, 0, this.width, this.height, 0x08101e, 0.9);

    const style = new TextStyle({
      fill: 0x78909c,
      fontSize: 14,
    });
    const txt = new Text({ text: 'No Planetary Base Selected', style });
    txt.x = this.width / 2 - 90;
    txt.y = this.height / 2 - 10;
    this.labelsContainer.addChild(txt);
  }

  private clearGfx(): void {
    try {
      this.backgroundGfx.clear?.();
      this.gridGfx.clear?.();
      this.conduitsGfx.clear?.();
      this.modulesContainer.removeChildren?.();
      this.labelsContainer.removeChildren?.();
    } catch {
      // Safe in mocked/headless
    }
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

  private safeDrawLine(
    gfx: any,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: number,
    alpha: number
  ): void {
    try {
      if (typeof gfx.moveTo === 'function' && typeof gfx.lineTo === 'function') {
        gfx.moveTo(x1, y1);
        gfx.lineTo(x2, y2);
        if (typeof gfx.stroke === 'function') {
          gfx.stroke({ color, width: 2, alpha });
        }
      }
    } catch {
      // Defensive
    }
  }

  private getDestinationPalette(dest: DestinationId): {
    groundColor: number;
    accentColor: number;
    tintAlpha: number;
  } {
    switch (dest) {
      case DestinationId.MOON:
        return { groundColor: 0x1a2130, accentColor: 0x90caf9, tintAlpha: 0.35 };
      case DestinationId.MARS:
        return { groundColor: 0x2b1408, accentColor: 0xff7043, tintAlpha: 0.45 };
      case DestinationId.EUROPA:
        return { groundColor: 0x092233, accentColor: 0x80d8ff, tintAlpha: 0.4 };
      case DestinationId.TITAN:
        return { groundColor: 0x2e1e05, accentColor: 0xffb74d, tintAlpha: 0.45 };
      case DestinationId.CERES:
        return { groundColor: 0x161a22, accentColor: 0xa7ffeb, tintAlpha: 0.35 };
      default:
        return { groundColor: 0x111c2e, accentColor: 0x00e5ff, tintAlpha: 0.3 };
    }
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
