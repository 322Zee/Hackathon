/**
 * INTERSTELLAR CONTINUUM - 2D Communications Network Schematic Map
 * Interactive 2D vector schematic displaying Earth ground stations, orbital shells,
 * satellite relays, planetary destinations, and active telemetry signal paths.
 *
 * NOTE: 2D vector graphics only. Fully compliant with project rendering guidelines.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../../ui/core/UIComponent';
import { UI_COLORS, UI_FONTS } from '../../ui/core/UIDesignTokens';
import {
  CommunicationsNetworkManager,
} from '../CommunicationsNetworkManager';
import { DestinationId } from '../../destinations/DestinationTypes';
import { SpacecraftCommStatus } from '../NetworkTypes';

export interface NetworkSchematicMapOptions {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  manager?: CommunicationsNetworkManager;
}

interface MapNode {
  id: string;
  label: string;
  x: number;
  y: number;
  radius: number;
  color: number;
  type: 'EARTH' | 'MOON' | 'MARS' | 'JUPITER' | 'GROUND_STATION' | 'SATELLITE' | 'RELAY' | 'SPACECRAFT';
  status: string;
}

export class NetworkSchematicMap extends UIComponent {
  private mapWidth: number;
  private mapHeight: number;
  private manager: CommunicationsNetworkManager;

  private backgroundGfx: Graphics;
  private gridGfx: Graphics;
  private orbitsGfx: Graphics;
  private linksGfx: Graphics;
  private nodesContainer: Container;
  private tooltipsContainer: Container;

  private animationTimer: number = 0;
  private nodes: Map<string, MapNode> = new Map();

  constructor(options: NetworkSchematicMapOptions = {}) {
    super();
    this.mapWidth = options.width ?? 960;
    this.mapHeight = options.height ?? 540;
    this.manager = options.manager ?? CommunicationsNetworkManager.getInstance();

    if (options.x !== undefined) this.container.x = options.x;
    if (options.y !== undefined) this.container.y = options.y;

    this.backgroundGfx = new Graphics();
    this.gridGfx = new Graphics();
    this.orbitsGfx = new Graphics();
    this.linksGfx = new Graphics();
    this.nodesContainer = new Container();
    this.tooltipsContainer = new Container();

    this.container.addChild(this.backgroundGfx);
    this.container.addChild(this.gridGfx);
    this.container.addChild(this.orbitsGfx);
    this.container.addChild(this.linksGfx);
    this.container.addChild(this.nodesContainer);
    this.container.addChild(this.tooltipsContainer);

    this.render();
  }

  public render(): void {
    this.drawBackground();
    this.drawGridAndOrbits();
    this.updateNodes();
    this.drawSignalLinks();
    this.renderNodes();
  }

  private drawBackground(): void {
    this.backgroundGfx.clear();
    // Dark aerospace backdrop
    this.backgroundGfx
      .roundRect(0, 0, this.mapWidth, this.mapHeight, 8)
      .fill({ color: UI_COLORS.BG_DARK, alpha: 0.95 })
      .stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.5 });
  }

  private drawGridAndOrbits(): void {
    this.gridGfx.clear();
    this.orbitsGfx.clear();

    // Subtle coordinate grid
    const step = 60;
    for (let x = step; x < this.mapWidth; x += step) {
      this.gridGfx.moveTo(x, 0).lineTo(x, this.mapHeight).stroke({ color: 0x1e293b, width: 0.5, alpha: 0.4 });
    }
    for (let y = step; y < this.mapHeight; y += step) {
      this.gridGfx.moveTo(0, y).lineTo(this.mapWidth, y).stroke({ color: 0x1e293b, width: 0.5, alpha: 0.4 });
    }

    // Schematic celestial positions (Center Earth at (260, 270))
    const earthX = 220;
    const earthY = this.mapHeight / 2;

    // LEO and GEO orbital rings around Earth
    this.orbitsGfx.circle(earthX, earthY, 70).stroke({ color: UI_COLORS.BORDER_DEFAULT, width: 1, alpha: 0.5 });
    this.orbitsGfx.circle(earthX, earthY, 130).stroke({ color: UI_COLORS.BORDER_HIGHLIGHT, width: 1, alpha: 0.4 });

    // Orbital path line to Moon and Mars
    this.orbitsGfx.moveTo(earthX, earthY).lineTo(480, 160).stroke({ color: 0x334155, width: 1, alpha: 0.3 });
    this.orbitsGfx.moveTo(earthX, earthY).lineTo(700, 270).stroke({ color: 0x334155, width: 1, alpha: 0.3 });
    this.orbitsGfx.moveTo(700, 270).lineTo(880, 380).stroke({ color: 0x334155, width: 1, alpha: 0.2 });
  }

  private updateNodes(): void {
    this.nodes.clear();

    const earthX = 220;
    const earthY = this.mapHeight / 2;

    // Central Earth
    this.nodes.set('NODE_EARTH', {
      id: 'NODE_EARTH',
      label: 'Earth (Terra)',
      x: earthX,
      y: earthY,
      radius: 28,
      color: 0x38bdf8,
      type: 'EARTH',
      status: 'OPERATIONAL',
    });

    // Moon
    this.nodes.set('NODE_MOON', {
      id: 'NODE_MOON',
      label: 'The Moon (Luna)',
      x: 480,
      y: 160,
      radius: 14,
      color: 0x94a3b8,
      type: 'MOON',
      status: 'OPERATIONAL',
    });

    // Mars
    this.nodes.set('NODE_MARS', {
      id: 'NODE_MARS',
      label: 'Mars',
      x: 700,
      y: 270,
      radius: 20,
      color: 0xf97316,
      type: 'MARS',
      status: 'OPERATIONAL',
    });

    // Jupiter
    this.nodes.set('NODE_JUPITER', {
      id: 'NODE_JUPITER',
      label: 'Jupiter / Europa',
      x: 880,
      y: 380,
      radius: 26,
      color: 0xeab308,
      type: 'JUPITER',
      status: 'OPERATIONAL',
    });

    // Ground Stations positioned on Earth perimeter
    const stations = this.manager.getAllGroundStations().filter((s) => s.isUnlocked);
    stations.forEach((st, idx) => {
      const angle = (idx / Math.max(1, stations.length)) * Math.PI * 2;
      const sx = earthX + Math.cos(angle) * 36;
      const sy = earthY + Math.sin(angle) * 36;
      this.nodes.set(st.id, {
        id: st.id,
        label: st.name,
        x: sx,
        y: sy,
        radius: 6,
        color: st.status === 'OPERATIONAL' ? UI_COLORS.CYAN : UI_COLORS.AMBER,
        type: 'GROUND_STATION',
        status: st.status,
      });
    });

    // Communication Satellites in LEO / GEO / Mars
    const satellites = this.manager.getAllSatellites();
    satellites.forEach((sat, idx) => {
      let sx = earthX;
      let sy = earthY;
      if (sat.satelliteType === 'LEO_RELAY') {
        const angle = (idx * 1.5) + this.animationTimer * 0.5;
        sx = earthX + Math.cos(angle) * 70;
        sy = earthY + Math.sin(angle) * 70;
      } else if (sat.satelliteType === 'GEO_STATIONARY') {
        const angle = (idx * 2.2) + this.animationTimer * 0.2;
        sx = earthX + Math.cos(angle) * 130;
        sy = earthY + Math.sin(angle) * 130;
      } else if (sat.destinationId === DestinationId.MOON) {
        sx = 480 + Math.cos(this.animationTimer) * 32;
        sy = 160 + Math.sin(this.animationTimer) * 32;
      } else if (sat.destinationId === DestinationId.MARS) {
        sx = 700 + Math.cos(this.animationTimer * 0.8) * 44;
        sy = 270 + Math.sin(this.animationTimer * 0.8) * 44;
      }

      this.nodes.set(sat.id, {
        id: sat.id,
        label: sat.name,
        x: sx,
        y: sy,
        radius: 5,
        color: sat.status === 'ACTIVE' ? UI_COLORS.GREEN : UI_COLORS.AMBER,
        type: 'SATELLITE',
        status: sat.status,
      });
    });

    // Planetary Relays
    const relays = this.manager.getAllRelays();
    relays.forEach((relay) => {
      let rx = 480;
      let ry = 160;
      if (relay.deploymentLocation === DestinationId.MARS) {
        rx = 700 + 15;
        ry = 270 - 15;
      } else if (relay.deploymentLocation === DestinationId.EUROPA) {
        rx = 880 + 20;
        ry = 380 - 18;
      } else {
        rx = 480 + 12;
        ry = 160 - 10;
      }

      this.nodes.set(relay.id, {
        id: relay.id,
        label: relay.name,
        x: rx,
        y: ry,
        radius: 6,
        color: relay.operationalState === 'OPERATIONAL' ? UI_COLORS.CYAN : UI_COLORS.AMBER,
        type: 'RELAY',
        status: relay.operationalState,
      });
    });

    // Connected Spacecraft
    const connections = this.manager.getAllSpacecraftConnections();
    connections.forEach((conn, idx) => {
      let cx = 350;
      let cy = 200;
      if (conn.destinationId === DestinationId.MARS) {
        cx = 640 + idx * 20;
        cy = 240 + idx * 15;
      } else if (conn.destinationId === DestinationId.MOON) {
        cx = 430 + idx * 15;
        cy = 140;
      } else {
        cx = 280 + idx * 25;
        cy = 190;
      }

      this.nodes.set(conn.spacecraftId, {
        id: conn.spacecraftId,
        label: conn.name,
        x: cx,
        y: cy,
        radius: 5,
        color: conn.communicationStatus === SpacecraftCommStatus.CONNECTED ? UI_COLORS.CYAN : UI_COLORS.RED,
        type: 'SPACECRAFT',
        status: conn.communicationStatus,
      });
    });
  }

  private drawSignalLinks(): void {
    this.linksGfx.clear();

    const earthNode = this.nodes.get('NODE_EARTH');
    if (!earthNode) return;

    // Draw active links between Ground Stations and Satellites
    const satellites = this.manager.getAllSatellites().filter((s) => s.status === 'ACTIVE');
    const stations = this.manager.getAllGroundStations().filter((s) => s.status === 'OPERATIONAL');

    if (stations.length > 0 && stations[0]) {
      const firstStationId = stations[0].id;
      const stNode = this.nodes.get(firstStationId);
      if (stNode) {
        for (const sat of satellites) {
          const satNode = this.nodes.get(sat.id);
          if (satNode) {
            this.linksGfx
              .moveTo(stNode.x, stNode.y)
              .lineTo(satNode.x, satNode.y)
              .stroke({ color: UI_COLORS.CYAN, width: 1.2, alpha: 0.6 });
          }
        }
      }
    }

    // Draw Spacecraft signal routes
    const connections = this.manager.getAllSpacecraftConnections();
    for (const conn of connections) {
      const craftNode = this.nodes.get(conn.spacecraftId);
      if (!craftNode) continue;

      let sourceNode = earthNode;
      if (conn.activeRoute.satelliteId && this.nodes.has(conn.activeRoute.satelliteId)) {
        sourceNode = this.nodes.get(conn.activeRoute.satelliteId)!;
      } else if (conn.activeRoute.groundStationId && this.nodes.has(conn.activeRoute.groundStationId)) {
        sourceNode = this.nodes.get(conn.activeRoute.groundStationId)!;
      }

      const linkColor = conn.communicationStatus === SpacecraftCommStatus.CONNECTED ? UI_COLORS.CYAN : UI_COLORS.AMBER;
      this.linksGfx
        .moveTo(sourceNode.x, sourceNode.y)
        .lineTo(craftNode.x, craftNode.y)
        .stroke({ color: linkColor, width: 1.8, alpha: 0.8 });

      // Signal telemetry pulse along link
      const pulseProgress = (this.animationTimer * 2) % 1.0;
      const px = sourceNode.x + (craftNode.x - sourceNode.x) * pulseProgress;
      const py = sourceNode.y + (craftNode.y - sourceNode.y) * pulseProgress;

      this.linksGfx.circle(px, py, 2.5).fill({ color: 0xffffff, alpha: 0.9 });
    }
  }

  private renderNodes(): void {
    this.nodesContainer.removeChildren();

    for (const node of this.nodes.values()) {
      const nodeGfx = new Graphics();

      // Outer glow ring
      nodeGfx.circle(node.x, node.y, node.radius + 3).fill({ color: node.color, alpha: 0.25 });
      // Core circle
      nodeGfx.circle(node.x, node.y, node.radius).fill({ color: node.color, alpha: 0.9 });
      nodeGfx.stroke({ color: 0xffffff, width: 1, alpha: 0.8 });

      this.nodesContainer.addChild(nodeGfx);

      // Label
      if (node.type !== 'GROUND_STATION') {
        const textStyle = new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: node.type === 'EARTH' || node.type === 'MARS' ? 12 : 10,
          fill: UI_COLORS.TEXT_PRIMARY,
        });
        const labelText = new Text({ text: node.label, style: textStyle });
        labelText.anchor.set(0.5, 0);
        labelText.x = node.x;
        labelText.y = node.y + node.radius + 4;
        this.nodesContainer.addChild(labelText);
      }
    }
  }

  public updateAnimation(deltaSeconds: number): void {
    this.animationTimer += deltaSeconds;
    this.updateNodes();
    this.drawSignalLinks();
    this.renderNodes();
  }

  public destroy(): void {
    this.nodesContainer.destroy({ children: true });
    this.tooltipsContainer.destroy({ children: true });
    this.backgroundGfx.destroy();
    this.gridGfx.destroy();
    this.orbitsGfx.destroy();
    this.linksGfx.destroy();
    super.destroy();
  }
}
