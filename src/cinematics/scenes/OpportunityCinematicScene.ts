/**
 * INTERSTELLAR CONTINUUM - Act IV: The Opportunity
 * Vector CAD engineering schematics: 2-stage rocket blueprint, satellite bus design,
 * planetary telemetry charts, and mission trajectory calculation displays.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export class OpportunityCinematicScene {
  public readonly container: Container;

  private backdropGfx: Graphics;
  private rocketCadGfx: Graphics;
  private satelliteCadGfx: Graphics;
  private trajectoryCadGfx: Graphics;
  private scanlineGfx: Graphics;
  private labelContainer: Container;

  private timeElapsed: number = 0;

  constructor() {
    this.container = new Container();
    this.container.label = 'OpportunityCinematicScene';

    this.backdropGfx = new Graphics();
    this.rocketCadGfx = new Graphics();
    this.satelliteCadGfx = new Graphics();
    this.trajectoryCadGfx = new Graphics();
    this.scanlineGfx = new Graphics();
    this.labelContainer = new Container();

    this.container.addChild(this.backdropGfx);
    this.container.addChild(this.rocketCadGfx);
    this.container.addChild(this.satelliteCadGfx);
    this.container.addChild(this.trajectoryCadGfx);
    this.container.addChild(this.scanlineGfx);
    this.container.addChild(this.labelContainer);

    this.drawBlueprintGrid();
    this.drawRocketCad();
    this.drawSatelliteCad();
    this.drawTrajectoryCad();
    this.setupLabels();
  }

  private drawBlueprintGrid(): void {
    this.backdropGfx.clear();
    // Blueprint navy backdrop
    this.backdropGfx.rect(0, 0, 1920, 1080).fill({ color: 0x030d1a });

    // Technical grid lines
    const gridSize = 60;
    for (let x = 0; x < 1920; x += gridSize) {
      this.backdropGfx.moveTo(x, 0).lineTo(x, 1080).stroke({ color: 0x0c2540, width: 1.0 });
    }
    for (let y = 0; y < 1080; y += gridSize) {
      this.backdropGfx.moveTo(0, y).lineTo(1920, y).stroke({ color: 0x0c2540, width: 1.0 });
    }

    // Panel Framing
    // Panel 1: Rocket Blueprint (Left)
    this.backdropGfx.roundRect(100, 120, 520, 820, 6).stroke({ color: 0x0284c7, width: 1.5, alpha: 0.8 });
    // Panel 2: Satellite Bus (Center)
    this.backdropGfx.roundRect(660, 120, 580, 820, 6).stroke({ color: 0x0284c7, width: 1.5, alpha: 0.8 });
    // Panel 3: Trajectory & Flight Plan (Right)
    this.backdropGfx.roundRect(1280, 120, 540, 820, 6).stroke({ color: 0x0284c7, width: 1.5, alpha: 0.8 });
  }

  private drawRocketCad(): void {
    this.rocketCadGfx.clear();

    const rx = 360;
    const ry = 220;

    // Payload Fairing (top cone)
    this.rocketCadGfx
      .poly([rx, ry, rx + 45, ry + 110, rx - 45, ry + 110])
      .stroke({ color: 0x38bdf8, width: 2.0 });

    // Second Stage Tank
    this.rocketCadGfx
      .roundRect(rx - 45, ry + 115, 90, 160, 4)
      .stroke({ color: 0x38bdf8, width: 2.0 });
    // Interstage Ring
    this.rocketCadGfx
      .rect(rx - 40, ry + 278, 80, 18)
      .fill({ color: 0x0e7490, alpha: 0.4 });

    // First Stage Main Booster Tank
    this.rocketCadGfx
      .roundRect(rx - 55, ry + 300, 110, 310, 4)
      .stroke({ color: 0x00f0ff, width: 2.2 });

    // Rocket Engine Bell Nozzle
    this.rocketCadGfx
      .poly([rx - 25, ry + 615, rx + 25, ry + 615, rx + 45, ry + 675, rx - 45, ry + 675])
      .stroke({ color: 0xf59e0b, width: 2.0 });

    // Aerodynamic Stabilizer Fins
    this.rocketCadGfx
      .poly([rx - 55, ry + 560, rx - 105, ry + 650, rx - 55, ry + 640])
      .stroke({ color: 0x38bdf8, width: 1.5 });
    this.rocketCadGfx
      .poly([rx + 55, ry + 560, rx + 105, ry + 650, rx + 55, ry + 640])
      .stroke({ color: 0x38bdf8, width: 1.5 });

    // Dimension lines & technical markers
    this.rocketCadGfx.moveTo(rx + 125, ry).lineTo(rx + 125, ry + 675).stroke({ color: 0x64748b, width: 1.0 });
  }

  private drawSatelliteCad(): void {
    this.satelliteCadGfx.clear();

    const sx = 950;
    const sy = 480;

    // CubeSat Main Bus
    this.satelliteCadGfx
      .roundRect(sx - 75, sy - 75, 150, 150, 6)
      .stroke({ color: 0x4ade80, width: 2.2 });
    this.satelliteCadGfx
      .rect(sx - 65, sy - 65, 130, 130)
      .fill({ color: 0x064e3b, alpha: 0.25 });

    // Optical Lens Aperture
    this.satelliteCadGfx.circle(sx, sy, 38).stroke({ color: 0x4ade80, width: 1.8 });
    this.satelliteCadGfx.circle(sx, sy, 22).stroke({ color: 0x00f0ff, width: 1.5 });

    // Solar Panel Array Wings (Left & Right)
    this.satelliteCadGfx
      .rect(sx - 260, sy - 50, 170, 100)
      .stroke({ color: 0x38bdf8, width: 1.8 });
    this.satelliteCadGfx
      .rect(sx + 90, sy - 50, 170, 100)
      .stroke({ color: 0x38bdf8, width: 1.8 });

    // Solar panel cell divisions
    for (let i = 0; i < 4; i++) {
      this.satelliteCadGfx
        .moveTo(sx - 260 + i * 42, sy - 50)
        .lineTo(sx - 260 + i * 42, sy + 50)
        .stroke({ color: 0x0284c7, width: 1.0 });
      this.satelliteCadGfx
        .moveTo(sx + 90 + i * 42, sy - 50)
        .lineTo(sx + 90 + i * 42, sy + 50)
        .stroke({ color: 0x0284c7, width: 1.0 });
    }

    // Deployable Magnetometer Boom Antenna
    this.satelliteCadGfx.moveTo(sx, sy - 75).lineTo(sx, sy - 170).stroke({ color: 0xfacc15, width: 2.0 });
    this.satelliteCadGfx.circle(sx, sy - 175, 6).fill({ color: 0xfacc15 });
  }

  private drawTrajectoryCad(): void {
    this.trajectoryCadGfx.clear();

    const tx = 1550;
    const ty = 460;

    // Earth Sphere
    this.trajectoryCadGfx.circle(tx, ty, 65).fill({ color: 0x0369a1, alpha: 0.5 });
    this.trajectoryCadGfx.circle(tx, ty, 65).stroke({ color: 0x38bdf8, width: 2.0 });

    // Parking Orbit Ellipse
    this.trajectoryCadGfx
      .ellipse(tx, ty, 130, 100)
      .stroke({ color: 0x4ade80, width: 1.8 });

    // Hohmann Transfer Ellipse Arc to MEO
    this.trajectoryCadGfx
      .ellipse(tx + 40, ty, 200, 150)
      .stroke({ color: 0xf59e0b, width: 2.0, alpha: 0.8 });

    // Apoapsis & Periapsis Nodes
    this.trajectoryCadGfx.circle(tx - 130, ty, 6).fill({ color: 0x22c55e }); // Periapsis (Pe)
    this.trajectoryCadGfx.circle(tx + 240, ty, 6).fill({ color: 0xef4444 }); // Apoapsis (Ap)
  }

  private setupLabels(): void {
    const headerStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 13,
      fontWeight: 'bold',
      fill: 0x00f0ff,
      letterSpacing: 1.2,
    });

    const infoStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 11,
      fill: 0x94a3b8,
      lineHeight: 18,
    });

    // Panel 1 Text
    const t1Head = new Text({ text: 'CAD // LAUNCH VEHICLE 01', style: headerStyle });
    t1Head.position.set(125, 140);
    const t1Info = new Text({
      text: 'CONFIGURATION: 2-STAGE ORBITAL\nPROPELLANT: LOX / RP-1\nPAYLOAD CAPACITY: 450 KG TO LEO\nSTATUS: BLUEPRINT VALIDATED',
      style: infoStyle,
    });
    t1Info.position.set(125, 840);

    // Panel 2 Text
    const t2Head = new Text({ text: 'PAYLOAD // SCIENTIFIC SATELLITE', style: headerStyle });
    t2Head.position.set(685, 140);
    const t2Info = new Text({
      text: 'CLASS: CUBESAT 12U SCIENTIFIC\nINSTRUMENTS: SPECTROMETER + CAM\nPOWER: DUAL SOLAR ARRAYS (180W)\nSTATUS: CLEANROOM ASSEMBLY',
      style: infoStyle,
    });
    t2Info.position.set(685, 840);

    // Panel 3 Text
    const t3Head = new Text({ text: 'TRAJECTORY // FLIGHT PROFILE', style: headerStyle });
    t3Head.position.set(1305, 140);
    const t3Info = new Text({
      text: 'TARGET ORBIT: 250 KM CIRCULAR\nINCLINATION: 28.5° (EASTWARD)\nREQUIRED DELTA-V: 9,250 M/S\nMARGIN: +340 M/S [OPTIMAL]',
      style: infoStyle,
    });
    t3Info.position.set(1305, 840);

    this.labelContainer.addChild(t1Head, t1Info, t2Head, t2Info, t3Head, t3Info);
  }

  public update(deltaSeconds: number): void {
    this.timeElapsed += deltaSeconds;

    // Moving horizontal scanning laser line across panels
    this.scanlineGfx.clear();
    const scanY = 140 + ((this.timeElapsed * 140) % 780);

    this.scanlineGfx.moveTo(100, scanY).lineTo(1820, scanY).stroke({ color: 0x00f0ff, width: 1.2, alpha: 0.35 });
  }
}
