/**
 * INTERSTELLAR CONTINUUM - Act III: Independent Organisation Campus Overview
 * 2.5D panoramic architectural overview of the Earth-based aerospace campus:
 * VAB high-bay, R&D lab, Mission Operations room, and Pad Alpha launch complex.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export class HeadquartersOverviewCinematicScene {
  public readonly container: Container;

  private backdropGfx: Graphics;
  private groundGfx: Graphics;
  private buildingsGfx: Graphics;
  private markersGfx: Graphics;
  private calloutContainer: Container;

  private timeElapsed: number = 0;

  constructor() {
    this.container = new Container();
    this.container.label = 'HeadquartersOverviewCinematicScene';

    this.backdropGfx = new Graphics();
    this.groundGfx = new Graphics();
    this.buildingsGfx = new Graphics();
    this.markersGfx = new Graphics();
    this.calloutContainer = new Container();

    this.container.addChild(this.backdropGfx);
    this.container.addChild(this.groundGfx);
    this.container.addChild(this.buildingsGfx);
    this.container.addChild(this.markersGfx);
    this.container.addChild(this.calloutContainer);

    this.drawGround();
    this.drawBuildings();
    this.setupCallouts();
  }

  private drawGround(): void {
    this.backdropGfx.clear();
    // Sky gradient backdrop (coastal twilight)
    this.backdropGfx.rect(0, 0, 1920, 1080).fill({ color: 0x07111e });

    this.groundGfx.clear();
    // Campus terrain base
    this.groundGfx.rect(80, 80, 1760, 920).fill({ color: 0x0f291e }); // Coastal lawn green
    this.groundGfx.rect(80, 80, 1760, 920).stroke({ color: 0x1e3a2b, width: 2 });

    // Perimeter security fence
    this.groundGfx.rect(100, 100, 1720, 880).stroke({ color: 0x334155, width: 2.5, alpha: 0.8 });

    // Asphalt Main Arterial Roads
    // West-to-East Avenue
    this.groundGfx.rect(100, 500, 1720, 80).fill({ color: 0x1e293b });
    // North-to-South Promenade
    this.groundGfx.rect(880, 100, 160, 880).fill({ color: 0x1e293b });

    // Central Plaza circle
    this.groundGfx.circle(960, 540, 130).fill({ color: 0x0f172a });
    this.groundGfx.circle(960, 540, 130).stroke({ color: 0x00f0ff, width: 1.5, alpha: 0.7 });
    // Plaza Compass Rose
    this.groundGfx.circle(960, 540, 50).stroke({ color: 0x38bdf8, width: 1.0, alpha: 0.5 });

    // Dual-gauge Crawler Rollout Track to Pad Alpha
    this.groundGfx.rect(1220, 510, 320, 30).fill({ color: 0x334155 });
    this.groundGfx.rect(1220, 570, 320, 30).fill({ color: 0x334155 });

    // Pad Alpha Hexagonal Blast Apron
    this.groundGfx
      .poly([
        1550, 480,
        1680, 420,
        1800, 480,
        1800, 640,
        1680, 700,
        1550, 640,
      ])
      .fill({ color: 0x1e293b });
    this.groundGfx
      .poly([
        1550, 480,
        1680, 420,
        1800, 480,
        1800, 640,
        1680, 700,
        1550, 640,
      ])
      .stroke({ color: 0xf59e0b, width: 2, alpha: 0.8 });

    // Flame Trench Grate
    this.groundGfx.rect(1620, 530, 120, 60).fill({ color: 0x020617 });
  }

  private drawBuildings(): void {
    this.buildingsGfx.clear();

    // 1. Basic Rocket Engineering Facility (VAB) - East Campus (1300, 320)
    const vabX = 1200;
    const vabY = 240;
    // Shadow
    this.buildingsGfx.rect(vabX + 10, vabY + 180, 240, 25).fill({ color: 0x000000, alpha: 0.4 });
    // Structural Mass
    this.buildingsGfx.roundRect(vabX, vabY, 240, 180, 6).fill({ color: 0x1e293b });
    this.buildingsGfx.roundRect(vabX, vabY, 240, 180, 6).stroke({ color: 0x38bdf8, width: 2.0 });
    // High-bay vertical roll-up door
    this.buildingsGfx.rect(vabX + 60, vabY + 40, 120, 140).fill({ color: 0x0f172a });
    this.buildingsGfx.rect(vabX + 60, vabY + 40, 120, 140).stroke({ color: 0xf59e0b, width: 1.5 });
    // Roof Crane Fixture
    this.buildingsGfx.rect(vabX + 90, vabY - 20, 60, 20).fill({ color: 0xf59e0b });

    // 2. Small Research & Development Facility - North Campus (860, 180)
    const rdX = 840;
    const rdY = 160;
    this.buildingsGfx.rect(rdX + 10, rdY + 130, 200, 20).fill({ color: 0x000000, alpha: 0.4 });
    this.buildingsGfx.roundRect(rdX, rdY, 200, 130, 6).fill({ color: 0x0f172a });
    this.buildingsGfx.roundRect(rdX, rdY, 200, 130, 6).stroke({ color: 0x00f0ff, width: 2.0 });
    // Observatory Dome on roof
    this.buildingsGfx.arc(rdX + 100, rdY, 35, Math.PI, 0).fill({ color: 0xe2e8f0 });
    this.buildingsGfx.arc(rdX + 100, rdY, 35, Math.PI, 0).stroke({ color: 0x00f0ff, width: 1.5 });

    // 3. Modest Mission Operations Flight Centre (MOC) - South Campus (840, 720)
    const mocX = 840;
    const mocY = 700;
    this.buildingsGfx.rect(mocX + 10, mocY + 140, 240, 20).fill({ color: 0x000000, alpha: 0.4 });
    this.buildingsGfx.roundRect(mocX, mocY, 240, 140, 6).fill({ color: 0x111827 });
    this.buildingsGfx.roundRect(mocX, mocY, 240, 140, 6).stroke({ color: 0x4ade80, width: 2.0 });
    // Tinted Control Room Glass Ribbon
    this.buildingsGfx.rect(mocX + 20, mocY + 40, 200, 40).fill({ color: 0x064e3b });
    this.buildingsGfx.rect(mocX + 20, mocY + 40, 200, 40).stroke({ color: 0x10b981, width: 1.0 });
    // Roof Comms Dish
    this.buildingsGfx.circle(mocX + 200, mocY - 10, 18).stroke({ color: 0xe2e8f0, width: 2.0 });

    // 4. Umbilical Service Tower on Pad Alpha (1680, 500)
    const twrX = 1680;
    const twrY = 380;
    this.buildingsGfx.rect(twrX, twrY, 24, 180).fill({ color: 0xb91c1c });
    this.buildingsGfx.rect(twrX, twrY, 24, 180).stroke({ color: 0xf87171, width: 1.5 });
    // Swing arms
    this.buildingsGfx.rect(twrX - 35, twrY + 50, 35, 8).fill({ color: 0x94a3b8 });
    this.buildingsGfx.rect(twrX - 45, twrY + 110, 45, 8).fill({ color: 0x94a3b8 });

    // 5. Main Arrival & Security Gate - West Campus (120, 510)
    this.buildingsGfx.rect(120, 480, 24, 120).fill({ color: 0x334155 });
    this.buildingsGfx.rect(120, 530, 70, 8).fill({ color: 0xfacc15 }); // Gate boom barrier
  }

  private setupCallouts(): void {
    this.calloutContainer.removeChildren();

    const callouts = [
      { x: 1320, y: 200, label: 'ROCKET ENGINEERING (VAB)', sub: 'VEHICLE STAGING & FABRICATION' },
      { x: 940, y: 120, label: 'RESEARCH & DEVELOPMENT', sub: 'PROPULSION & MATERIALS LAB' },
      { x: 960, y: 880, label: 'MISSION OPERATIONS (MOC)', sub: 'FLIGHT DYNAMICS & TELEMETRY' },
      { x: 1680, y: 340, label: 'PAD ALPHA LAUNCHPAD', sub: 'ORBITAL FLIGHT COMPLEX' },
    ];

    const titleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 11,
      fontWeight: 'bold',
      fill: 0x38bdf8,
      letterSpacing: 1.0,
    });

    const subStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 9,
      fill: 0x94a3b8,
      letterSpacing: 0.5,
    });

    for (const c of callouts) {
      const box = new Container();
      box.position.set(c.x, c.y);

      const bg = new Graphics();
      bg.roundRect(-120, -16, 240, 36, 4);
      bg.fill({ color: 0x070d17, alpha: 0.88 });
      bg.stroke({ color: 0x0284c7, width: 1.0, alpha: 0.7 });

      const t1 = new Text({ text: c.label, style: titleStyle });
      t1.anchor.set(0.5, 0.5);
      t1.position.set(0, -3);

      const t2 = new Text({ text: c.sub, style: subStyle });
      t2.anchor.set(0.5, 0.5);
      t2.position.set(0, 11);

      box.addChild(bg);
      box.addChild(t1);
      box.addChild(t2);
      this.calloutContainer.addChild(box);
    }
  }

  public update(deltaSeconds: number): void {
    this.timeElapsed += deltaSeconds;

    this.markersGfx.clear();

    // Flashing red aviation safety beacon on top of Umbilical Service Tower (1692, 375)
    const towerBeacon = Math.sin(this.timeElapsed * 4.0) > 0 ? 0.9 : 0.15;
    this.markersGfx.circle(1692, 375, 5).fill({ color: 0xef4444, alpha: towerBeacon });
    this.markersGfx.circle(1692, 375, 12).stroke({ color: 0xef4444, width: 1.0, alpha: towerBeacon * 0.5 });

    // Soft pulsing callout borders
    const pulse = 0.5 + Math.sin(this.timeElapsed * 2.5) * 0.3;
    for (const child of this.calloutContainer.children) {
      child.alpha = 0.85 + pulse * 0.15;
    }
  }
}
