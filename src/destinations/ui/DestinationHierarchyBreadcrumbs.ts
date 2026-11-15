/**
 * INTERSTELLAR CONTINUUM - Destination Hierarchy Breadcrumbs UI Component
 * Renders tactical aerospace breadcrumb trail reflecting current celestial navigation depth
 * e.g., [ SOLAR SYSTEM ] > [ JUPITER ] > [ EUROPA ]
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../../ui/core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS } from '../../ui/core/UIDesignTokens';
import { DestinationRecord } from '../DestinationTypes';
import { DestinationHierarchyEngine } from '../navigation/DestinationHierarchyEngine';
import { SolarSystemNavigationManager } from '../navigation/SolarSystemNavigationManager';

export interface BreadcrumbItem {
  readonly id: string;
  readonly label: string;
  readonly isRoot: boolean;
  readonly destination?: DestinationRecord;
}

export interface DestinationHierarchyBreadcrumbsOptions {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  onNavigate?: (destinationId: string | null) => void;
}

export class DestinationHierarchyBreadcrumbs extends UIComponent {
  private navManager: SolarSystemNavigationManager;
  private hierarchyEngine: DestinationHierarchyEngine;
  private backgroundGfx: Graphics;
  private itemsContainer: Container;
  private currentItems: BreadcrumbItem[] = [];
  private onNavigateCb?: (destinationId: string | null) => void;
  private unsubscribe?: () => void;

  constructor(options: DestinationHierarchyBreadcrumbsOptions = {}) {
    super('DestinationHierarchyBreadcrumbs');

    this.navManager = SolarSystemNavigationManager.getInstance();
    this.hierarchyEngine = DestinationHierarchyEngine.getInstance();
    this.onNavigateCb = options.onNavigate;

    this.container.position.set(options.x ?? 30, options.y ?? 86);

    this.backgroundGfx = new Graphics();
    this.container.addChild(this.backgroundGfx);

    this.itemsContainer = new Container();
    this.container.addChild(this.itemsContainer);

    this.updateBreadcrumbs(this.navManager.getSelectedDestinationId());

    this.unsubscribe = this.navManager.on('navigation:destination_selected', (payload) => {
      this.updateBreadcrumbs(payload.destinationId);
    });
  }

  public updateBreadcrumbs(destinationId: string | null): void {
    this.itemsContainer.removeChildren();

    const items: BreadcrumbItem[] = [
      {
        id: 'SOLAR_SYSTEM',
        label: 'SOLAR SYSTEM',
        isRoot: true,
      },
    ];

    if (destinationId) {
      const trail = this.hierarchyEngine.getBreadcrumbs(destinationId);
      for (const dest of trail) {
        if (dest.id === 'dest-sun' && trail.length > 1) {
          continue; // Root star can be omitted if viewing planets
        }
        items.push({
          id: dest.id,
          label: dest.name.toUpperCase(),
          isRoot: false,
          destination: dest,
        });
      }
    }

    this.currentItems = items;
    this.renderItems();
  }

  private renderItems(): void {
    let currentX = 14;
    const paddingY = 8;
    const itemHeight = 24;

    for (let i = 0; i < this.currentItems.length; i++) {
      const item = this.currentItems[i]!;
      const isLast = i === this.currentItems.length - 1;

      // Item button container
      const itemNode = new Container();
      itemNode.position.set(currentX, paddingY);
      itemNode.eventMode = 'static';
      itemNode.cursor = isLast ? 'default' : 'pointer';

      const labelStyle = new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: isLast ? 'bold' : 'normal',
        fill: isLast ? UI_COLORS.CYAN : UI_COLORS.TEXT_SECONDARY,
        letterSpacing: 1.0,
      });

      const labelText = new Text({ text: item.label, style: labelStyle });
      labelText.position.set(8, 5);

      const textWidth = typeof document !== 'undefined' ? (labelText.width || item.label.length * 7.5) : item.label.length * 7.5;
      const chipWidth = textWidth + 16;

      const chipGfx = new Graphics();
      chipGfx.roundRect(0, 0, chipWidth, itemHeight, UI_RADIUS.SM);
      chipGfx.fill({
        color: isLast ? 0x072545 : 0x051326,
        alpha: isLast ? 0.9 : 0.6,
      });
      chipGfx.stroke({
        color: isLast ? UI_COLORS.CYAN : UI_COLORS.BORDER_SUBTLE,
        width: 1.0,
        alpha: isLast ? 0.8 : 0.4,
      });

      itemNode.addChild(chipGfx);
      itemNode.addChild(labelText);

      if (!isLast) {
        itemNode.on('pointerover', () => {
          chipGfx.fill({ color: 0x0a2f58, alpha: 0.9 });
          labelText.style.fill = UI_COLORS.TEXT_PRIMARY;
        });

        itemNode.on('pointerout', () => {
          chipGfx.fill({ color: 0x051326, alpha: 0.6 });
          labelText.style.fill = UI_COLORS.TEXT_SECONDARY;
        });

        itemNode.on('pointertap', () => {
          const targetId = item.isRoot ? null : item.id;
          if (this.onNavigateCb) {
            this.onNavigateCb(targetId);
          } else {
            this.navManager.setSelectedDestination(targetId);
            if (item.isRoot) {
              this.navManager.inspectSystem(null);
            } else {
              this.navManager.triggerNavigationAction({
                action: 'FOCUS_MAP',
                destinationId: item.id,
              });
            }
          }
        });
      }

      this.itemsContainer.addChild(itemNode);
      currentX += chipWidth + 8;

      // Separator chevron '>'
      if (!isLast) {
        const sepStyle = new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11,
          fontWeight: 'bold',
          fill: UI_COLORS.TEXT_MUTED,
        });
        const sep = new Text({ text: '>', style: sepStyle });
        sep.position.set(currentX, paddingY + 5);
        this.itemsContainer.addChild(sep);
        const sepWidth = typeof document !== 'undefined' ? (sep.width || 8) : 8;
        currentX += sepWidth + 8;
      }
    }

    // Render panel background
    const totalW = Math.max(300, currentX + 14);
    const totalH = 40;

    this.backgroundGfx.clear();
    this.backgroundGfx.roundRect(0, 0, totalW, totalH, UI_RADIUS.SM);
    this.backgroundGfx.fill({ color: 0x030814, alpha: 0.85 });
    this.backgroundGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
  }

  public override destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
    super.destroy();
  }
}
