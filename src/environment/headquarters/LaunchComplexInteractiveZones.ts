/**
 * INTERSTELLAR CONTINUUM - Physical Launch Complex Interactive Zones
 * Dedicated physical campus area housing 7 interactive launch installations:
 * Launchpad, Rocket Preparation Area, Assembly/Rollout Interface,
 * Pre-Launch Inspection Station, Launch Observation Bunker,
 * Ground-Support Equipment (GSE), and Launch Infrastructure.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { InteractiveObject } from '../../interaction/InteractiveObject';
import { InteractionCategory } from '../../interaction/InteractionTypes';
import { BoxCollider } from '../../collision/BoxCollider';
import { CollisionCategory, ICollider } from '../../collision/ColliderTypes';

export interface LaunchZoneEntity {
  id: string;
  name: string;
  zone: string;
  actionText: string;
  x: number;
  y: number;
  radius: number;
  description: string;
  specs: Array<{ label: string; value: string; highlight?: boolean }>;
}

export interface LaunchComplexInteractiveZonesOptions {
  onOpenLaunchDashboard?: (zoneId: string) => void;
  onOpenObservationBunker?: () => void;
}

export class LaunchComplexInteractiveZones {
  public readonly container: Container;
  public readonly interactiveObjects: InteractiveObject[] = [];
  public readonly colliders: ICollider[] = [];

  private onOpenLaunchDashboardCb?: (zoneId: string) => void;
  private onOpenObservationBunkerCb?: () => void;

  constructor(options: LaunchComplexInteractiveZonesOptions = {}) {
    this.container = new Container();
    this.container.label = 'LaunchComplexInteractiveZones';
    this.container.sortableChildren = true;

    this.onOpenLaunchDashboardCb = options.onOpenLaunchDashboard;
    this.onOpenObservationBunkerCb = options.onOpenObservationBunker;

    this.buildZones();
  }

  public setCallbacks(options: LaunchComplexInteractiveZonesOptions): void {
    if (options.onOpenLaunchDashboard) this.onOpenLaunchDashboardCb = options.onOpenLaunchDashboard;
    if (options.onOpenObservationBunker) this.onOpenObservationBunkerCb = options.onOpenObservationBunker;
  }

  private buildZones(): void {
    const zones: LaunchZoneEntity[] = [
      // 1. Launchpad Surface & Hold-Down Clamps
      {
        id: 'LC_ZONE_LAUNCHPAD',
        name: 'Launchpad Mount & Hold-Down Clamps',
        zone: 'PAD ALPHA PRIMARY MOUNT',
        actionText: 'Inspect Launchpad Mount & Clamps',
        x: 3150,
        y: 1850,
        radius: 95,
        description:
          'Hexagonal reinforced launch mount fitted with four high-capacity hydraulic hold-down clamps, sound suppression water injectors, and flame deflector exhaust trench.',
        specs: [
          { label: 'PAD STATUS', value: 'READY FOR STACK ROLLOUT', highlight: true },
          { label: 'HOLD-DOWN CLAMPS', value: '4x HYDRAULIC // ARMED', highlight: false },
          { label: 'FLAME TRENCH', value: 'REFRACTORY BRICK DEFLECTOR', highlight: false },
          { label: 'LAUNCH SIMULATION', value: 'STANDBY // PENDING VEHICLE', highlight: true },
        ],
      },

      // 2. Launch Infrastructure & Umbilical Tower
      {
        id: 'LC_ZONE_INFRASTRUCTURE',
        name: 'Umbilical Service Tower Infrastructure',
        zone: 'PAD ALPHA GANTRY INFRASTRUCTURE',
        actionText: 'Examine Launch Infrastructure & Umbilicals',
        x: 3250,
        y: 1820,
        radius: 85,
        description:
          '180px vertical steel lattice service tower with swing-arm propellant feed lines, electrical umbilicals, nitrogen purge ducts, and 35m lightning arrestor mast.',
        specs: [
          { label: 'UMBILICAL SWING ARMS', value: '3x CRYOGENIC BOOMS NOMINAL', highlight: true },
          { label: 'LIGHTNING MAST', value: 'GROUNDED // FARADAY SHIELD', highlight: false },
          { label: 'PURGE PRESSURE', value: '250 BAR GN2 MANIFOLD', highlight: true },
        ],
      },

      // 3. Rocket Preparation & Rollout Apron
      {
        id: 'LC_ZONE_ROCKET_PREPARATION',
        name: 'Rocket Preparation Area & Crawler Apron',
        zone: 'CRAWLER ROLLOUT APRON',
        actionText: 'Access Rocket Preparation Area',
        x: 2880,
        y: 1750,
        radius: 90,
        description:
          'Dual-gauge heavy crawler transporter apron where rockets are transferred from the VAB, aligned with the pad azimuth, and mated to ground power umbilical links.',
        specs: [
          { label: 'ROLLOUT TRACKS', value: 'DUAL-GAUGE REINFORCED CONCRETE', highlight: false },
          { label: 'TRANSFER PLATFORM', value: 'MOBILE LAUNCHER TRANSPORTER', highlight: true },
          { label: 'MAX ROLLOUT LOAD', value: '3,200 METRIC TONS', highlight: false },
        ],
      },

      // 4. Assembly / Integration Rollout Interface
      {
        id: 'LC_ZONE_ASSEMBLY_ROLLOUT',
        name: 'VAB Assembly Rollout Interface',
        zone: 'HIGH-BAY ROLLOUT INTERFACE',
        actionText: 'View Assembly Facility Rollout Gate',
        x: 2750,
        y: 1340,
        radius: 85,
        description:
          'South portal of the Rocket Engineering Vehicle Assembly Building featuring a 60-meter vertical guillotine door and rollout track junction directly to Pad Alpha.',
        specs: [
          { label: 'HIGH-BAY DOOR', value: 'MOTORISED // SEALED', highlight: true },
          { label: 'VAB HIGH-BAY STACK', value: 'STAGE 1 BOOSTERS INTEGRATED', highlight: true },
          { label: 'RAIL SWITCH', value: 'ALIGNED DIRECT TO PAD ALPHA', highlight: false },
        ],
      },

      // 5. Pre-Launch Systems Inspection Station
      {
        id: 'LC_ZONE_PRELAUNCH_INSPECTION',
        name: 'Pre-Launch Inspection & GSE Checkout Station',
        zone: 'LAUNCH SYSTEMS CHECKOUT',
        actionText: 'Conduct Pre-Launch Systems Inspection',
        x: 2980,
        y: 1620,
        radius: 80,
        description:
          'Weather-hardened avionics diagnostic shelter housing bus analyzers, pyrotechnic ignition safety interlocks, and inertial guidance calibration terminals.',
        specs: [
          { label: 'AVIONICS BUS', value: 'MIL-STD-1553B VERIFIED', highlight: true },
          { label: 'PYRO SAFE INTERLOCK', value: 'KEYED IN SAFE POSITION', highlight: false },
          { label: 'IMU CALIBRATION', value: 'LAT: 28.5721° N // ZEROED', highlight: true },
        ],
      },

      // 6. Launch Observation Bunker
      {
        id: 'LC_ZONE_OBSERVATION_BUNKER',
        name: 'Launch Observation Area & Blast Bunker',
        zone: 'RANGE SAFETY OBSERVATION BERM',
        actionText: 'Access Launch Observation Bunker',
        x: 2620,
        y: 1680,
        radius: 85,
        description:
          'Reinforced concrete blast bunker outside the primary thermal hazard zone equipped with periscope viewports, high-speed tracking monitors, and launch abort switches.',
        specs: [
          { label: 'BLAST PROTECTION', value: 'OVERPRESSURE RATED: 50 PSI', highlight: true },
          { label: 'VIEWPORT OPTICS', value: 'LAMINATED QUARTZ PERISCOPE', highlight: false },
          { label: 'COUNTDOWN CLOCK', value: 'T-MINUS HOLD // STANDBY', highlight: true },
        ],
      },

      // 7. Ground Support Equipment (GSE) & Cryo Manifold
      {
        id: 'LC_ZONE_GSE_CRYO',
        name: 'Ground Support Equipment (GSE) & Cryo Depots',
        zone: 'PROPELLANT DEPOT & MANIFOLD',
        actionText: 'Inspect Ground Support Equipment & Cryo Depots',
        x: 3360,
        y: 1650,
        radius: 85,
        description:
          'High-capacity cryogenic storage farm housing spherical vacuum-jacketed liquid oxygen and liquid hydrogen tanks, high-pressure helium boil-off pumps, and chilldown manifolds.',
        specs: [
          { label: 'LOX STORAGE', value: '180,000 GALLONS // -183°C', highlight: true },
          { label: 'LH2 STORAGE', value: '250,000 GALLONS // -253°C', highlight: true },
          { label: 'HELIUM PURGE', value: '450 BAR HIGH-PRESSURE GN2', highlight: false },
        ],
      },
    ];

    for (const z of zones) {
      this.renderZoneVisual(z);
      this.createInteractiveObject(z);
      this.createZoneCollider(z);
    }
  }

  private renderZoneVisual(z: LaunchZoneEntity): void {
    const zoneCont = new Container();
    zoneCont.zIndex = z.y;

    const gfx = new Graphics();

    // 1. Ambient Occlusion / Base Decal
    gfx.ellipse(z.x, z.y + 4, z.radius * 0.45, z.radius * 0.22).fill({ color: 0x050a14, alpha: 0.55 });

    // 2. Concrete Station Slab
    gfx
      .roundRect(z.x - 24, z.y - 18, 48, 36, 4)
      .fill({ color: 0x1e293b })
      .stroke({ color: 0xef4444, width: 1.5 });

    // 3. Technical Console / Station Geometry
    gfx
      .rect(z.x - 18, z.y - 14, 36, 20)
      .fill({ color: 0x0f172a })
      .stroke({ color: 0x38bdf8, width: 1.0 });

    // Screen readout
    gfx.rect(z.x - 14, z.y - 11, 28, 8).fill({ color: 0x0284c7 });

    // Status indicator LED (Blinking/Solid Amber/Red)
    gfx.circle(z.x + 10, z.y + 2, 2.5).fill({ color: 0x22c55e });

    // Floor Caution Line Ring
    gfx
      .ellipse(z.x, z.y + 2, z.radius * 0.55, z.radius * 0.3)
      .stroke({ color: 0xf59e0b, width: 1.0, alpha: 0.4 });

    // Station Identifier Label
    const lbl = new Text({
      text: z.zone,
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 8.5,
        fontWeight: 'bold',
        fill: 0x94a3b8,
        letterSpacing: 0.6,
      }),
    });
    lbl.anchor.set(0.5, 0);
    lbl.position.set(z.x, z.y + 22);

    zoneCont.addChild(gfx);
    zoneCont.addChild(lbl);
    this.container.addChild(zoneCont);
  }

  private createInteractiveObject(z: LaunchZoneEntity): void {
    const isDashboardZone =
      z.id === 'LC_ZONE_LAUNCHPAD' ||
      z.id === 'LC_ZONE_PRELAUNCH_INSPECTION' ||
      z.id === 'LC_ZONE_ROCKET_PREPARATION';
    const isObservationZone = z.id === 'LC_ZONE_OBSERVATION_BUNKER';

    const interactive = new InteractiveObject({
      id: z.id,
      displayName: z.name,
      actionText: z.actionText,
      category: InteractionCategory.LAUNCH_INFRASTRUCTURE,
      x: z.x,
      y: z.y,
      interactionRadius: z.radius,
      priority: 6,
      onInteract: async () => {
        if (isObservationZone && this.onOpenObservationBunkerCb) {
          this.onOpenObservationBunkerCb();
        }

        if (isDashboardZone && this.onOpenLaunchDashboardCb) {
          this.onOpenLaunchDashboardCb(z.id);
        }

        return {
          success: true,
          action: 'OPEN_PANEL',
          message: `Inspected ${z.name}`,
          data: {
            title: z.name.toUpperCase(),
            category: `LAUNCH OPERATIONS // ${z.zone}`,
            description: `${z.description}\n\n[NOTE: Launch simulation and orbital staging operations are online. Launch Operations and mission deployment systems active.]`,
            specs: z.specs,
          },
        };
      },
    });

    this.interactiveObjects.push(interactive);
  }

  private createZoneCollider(z: LaunchZoneEntity): void {
    const col = new BoxCollider({
      id: `col_${z.id}`,
      x: z.x - 24,
      y: z.y - 18,
      width: 48,
      height: 36,
      category: CollisionCategory.SOLID,
      tag: 'LAUNCH_COMPLEX_INSTALLATION',
    });
    this.colliders.push(col);
  }

  public destroy(): void {
    this.container.destroy({ children: true });
    this.interactiveObjects.length = 0;
    this.colliders.length = 0;
  }
}
