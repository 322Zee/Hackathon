/**
 * INTERSTELLAR CONTINUUM - Act VI: The First Step
 * Main Arrival & Security Gate entrance view: open barrier arm, illuminated
 * welcome terminal, approach road into the campus, and ready facilities.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export class FirstStepCinematicScene {
  public readonly container: Container;

  private backdropGfx: Graphics;
  private roadGfx: Graphics;
  private gateGfx: Graphics;
  private welcomeSignContainer: Container;

  private timeElapsed: number = 0;

  constructor() {
    this.container = new Container();
    this.container.label = 'FirstStepCinematicScene';

    this.backdropGfx = new Graphics();
    this.roadGfx = new Graphics();
    this.gateGfx = new Graphics();
    this.welcomeSignContainer = new Container();

    this.container.addChild(this.backdropGfx);
    this.container.addChild(this.roadGfx);
    this.container.addChild(this.gateGfx);
    this.container.addChild(this.welcomeSignContainer);

    this.drawSkyAndHorizon();
    this.drawApproachRoad();
    this.drawArrivalGate();
    this.setupWelcomeSign();
  }

  private drawSkyAndHorizon(): void {
    this.backdropGfx.clear();
    // Atmospheric dawn sky gradient
    this.backdropGfx.rect(0, 0, 1920, 600).fill({ color: 0x091b2e });
    this.backdropGfx.rect(0, 600, 1920, 480).fill({ color: 0x0f291e }); // Lawn horizon

    // Distant facility silhouettes on the horizon
    // VAB Silhouette (Right)
    this.backdropGfx.roundRect(1350, 360, 260, 240, 4).fill({ color: 0x071524 });
    // Launch Tower Silhouette with red beacon
    this.backdropGfx.rect(1680, 240, 22, 360).fill({ color: 0x071524 });
    // MOC Silhouette (Left)
    this.backdropGfx.roundRect(280, 440, 240, 160, 4).fill({ color: 0x071524 });
  }

  private drawApproachRoad(): void {
    this.roadGfx.clear();

    // Perspective asphalt roadway leading from bottom into the gate
    this.roadGfx
      .poly([720, 600, 1200, 600, 1500, 1080, 420, 1080])
      .fill({ color: 0x1e293b });
    this.roadGfx
      .poly([720, 600, 1200, 600, 1500, 1080, 420, 1080])
      .stroke({ color: 0x334155, width: 2 });

    // Roadway Center Dashed Markings
    for (let y = 620; y < 1080; y += 70) {
      const w = 6 + (y - 600) * 0.02;
      this.roadGfx.rect(960 - w / 2, y, w, 40).fill({ color: 0xfacc15, alpha: 0.8 });
    }

    // Streetlight illumination pools
    this.roadGfx.ellipse(750, 780, 90, 40).fill({ color: 0xfef08a, alpha: 0.12 });
    this.roadGfx.ellipse(1170, 780, 90, 40).fill({ color: 0xfef08a, alpha: 0.12 });
  }

  private drawArrivalGate(): void {
    this.gateGfx.clear();

    // Security Gate Portico Pillars (Gate Alpha)
    const gx = 960;
    const gy = 600;

    // Left Security Booth & Pillar
    this.gateGfx.roundRect(gx - 260, gy - 140, 60, 140, 4).fill({ color: 0x0f172a });
    this.gateGfx.roundRect(gx - 260, gy - 140, 60, 140, 4).stroke({ color: 0x00f0ff, width: 2.0 });

    // Right Security Pillar
    this.gateGfx.roundRect(gx + 200, gy - 140, 60, 140, 4).fill({ color: 0x0f172a });
    this.gateGfx.roundRect(gx + 200, gy - 140, 60, 140, 4).stroke({ color: 0x00f0ff, width: 2.0 });

    // Overhead Archway Beam
    this.gateGfx.rect(gx - 260, gy - 150, 520, 30).fill({ color: 0x0284c7 });
    this.gateGfx.rect(gx - 260, gy - 150, 520, 30).stroke({ color: 0x38bdf8, width: 1.5 });

    // Raised Barrier Arm (Access Granted position)
    this.gateGfx
      .poly([gx - 200, gy - 20, gx - 190, gy - 20, gx - 130, gy - 120, gx - 140, gy - 120])
      .fill({ color: 0x22c55e });

    // Green access indicator LEDs
    this.gateGfx.circle(gx - 200, gy - 30, 6).fill({ color: 0x22c55e });
    this.gateGfx.circle(gx + 200, gy - 30, 6).fill({ color: 0x22c55e });
  }

  private setupWelcomeSign(): void {
    const signBox = new Container();
    signBox.position.set(960, 430);

    const signBg = new Graphics();
    signBg.roundRect(-240, -35, 480, 70, 6);
    signBg.fill({ color: 0x020617, alpha: 0.95 });
    signBg.stroke({ color: 0x00f0ff, width: 2.0 });

    const titleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0x00f0ff,
      letterSpacing: 2.0,
      align: 'center',
    });

    const subStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 12,
      fill: 0x4ade80,
      letterSpacing: 1.2,
      align: 'center',
    });

    const tTitle = new Text({
      text: 'INTERSTELLAR CONTINUUM // EARTH HEADQUARTERS',
      style: titleStyle,
    });
    tTitle.anchor.set(0.5, 0.5);
    tTitle.position.set(0, -10);

    const tSub = new Text({
      text: '▶ ACCESS AUTHORIZED // WELCOME MISSION DIRECTOR ◀',
      style: subStyle,
    });
    tSub.anchor.set(0.5, 0.5);
    tSub.position.set(0, 15);

    signBox.addChild(signBg, tTitle, tSub);
    this.welcomeSignContainer.addChild(signBox);
  }

  public update(deltaSeconds: number): void {
    this.timeElapsed += deltaSeconds;

    // Red beacon blinking on the distant launch tower
    const beacon = Math.sin(this.timeElapsed * 4.0) > 0 ? 0.9 : 0.1;
    this.backdropGfx.circle(1691, 235, 4).fill({ color: 0xef4444, alpha: beacon });
  }
}
