/**
 * INTERSTELLAR CONTINUUM - Act V: The Mission Director's Role
 * Directorate command console presenting authorization credentials,
 * executive responsibilities, mission pillars, and operational mandate.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export class PlayerRoleCinematicScene {
  public readonly container: Container;

  private backdropGfx: Graphics;
  private consoleGfx: Graphics;
  private cardContainer: Container;

  private timeElapsed: number = 0;

  constructor() {
    this.container = new Container();
    this.container.label = 'PlayerRoleCinematicScene';

    this.backdropGfx = new Graphics();
    this.consoleGfx = new Graphics();
    this.cardContainer = new Container();

    this.container.addChild(this.backdropGfx);
    this.container.addChild(this.consoleGfx);
    this.container.addChild(this.cardContainer);

    this.drawConsoleBackdrop();
    this.setupDirectorCredentials();
    this.setupResponsibilityCards();
  }

  private drawConsoleBackdrop(): void {
    this.backdropGfx.clear();
    // Dark command terminal background
    this.backdropGfx.rect(0, 0, 1920, 1080).fill({ color: 0x050a14 });

    // Console Outer Trim
    this.backdropGfx.roundRect(80, 70, 1760, 940, 8).stroke({ color: 0x0284c7, width: 2.0, alpha: 0.8 });
    this.backdropGfx.rect(80, 140, 1760, 2).fill({ color: 0x0284c7, alpha: 0.5 });
  }

  private setupDirectorCredentials(): void {
    // Header Credentials
    const titleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0x00f0ff,
      letterSpacing: 2.0,
    });

    const subStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 12,
      fill: 0x94a3b8,
      letterSpacing: 1.0,
    });

    const headerTitle = new Text({
      text: 'DIRECTORATE APPOINTMENT PROTOCOL // EXECUTIVE ORDER 001',
      style: titleStyle,
    });
    headerTitle.position.set(110, 95);

    const headerSub = new Text({
      text: 'APPOINTMENT: MISSION DIRECTOR | CLEARANCE: UNRESTRICTED COMMAND | STATUS: ACTIVE',
      style: subStyle,
    });
    headerSub.position.set(110, 120);

    this.cardContainer.addChild(headerTitle, headerSub);
  }

  private setupResponsibilityCards(): void {
    const cards = [
      {
        x: 120,
        y: 180,
        w: 800,
        h: 360,
        iconColor: 0x38bdf8,
        title: 'I. VEHICLE ENGINEERING & SPACECRAFT DESIGN',
        bullets: [
          '• Design multi-stage launch vehicles with optimal mass and thrust ratios.',
          '• Configure scientific satellites, deep-space probes, and planetary landers.',
          '• Balance propellant capacities, engine clusters, and staging sequences.',
        ],
      },
      {
        x: 1000,
        y: 180,
        w: 800,
        h: 360,
        iconColor: 0x4ade80,
        title: 'II. MISSION OPERATIONS & TRAJECTORY GUIDANCE',
        bullets: [
          '• Plan launch windows, orbital insertion burns, and interplanetary transfers.',
          '• Execute real-time countdowns and atmospheric ascent profiles.',
          '• Monitor telemetry, manage communications downlinks, and ensure recovery.',
        ],
      },
      {
        x: 120,
        y: 580,
        w: 800,
        h: 360,
        iconColor: 0xfacc15,
        title: 'III. RESOURCE & TREASURY ALLOCATION',
        bullets: [
          '• Allocate modest starting capital and balance operational budgets.',
          '• Fulfill commercial and scientific contracts to earn vital Mission Credits.',
          '• Reinvest scientific Research Data into advanced propulsion and avionics.',
        ],
      },
      {
        x: 1000,
        y: 580,
        w: 800,
        h: 360,
        iconColor: 0xf87171,
        title: 'IV. CAMPUS EXPANSION & EXPLORATION MANDATE',
        bullets: [
          '• Expand the Earth headquarters from modest beginnings into a premier spaceport.',
          '• Upgrade cleanrooms, manufacturing foundries, and tracking antennas.',
          '• Lead exploration from Earth orbit to the Moon, Mars, and the Solar System.',
        ],
      },
    ];

    const cardTitleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 14,
      fontWeight: 'bold',
      letterSpacing: 1.2,
    });

    const bulletStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 12,
      fill: 0xcbd5e1,
      lineHeight: 28,
      letterSpacing: 0.8,
    });

    for (const c of cards) {
      const box = new Container();
      box.position.set(c.x, c.y);

      const bg = new Graphics();
      bg.roundRect(0, 0, c.w, c.h, 6);
      bg.fill({ color: 0x091424, alpha: 0.9 });
      bg.stroke({ color: c.iconColor, width: 1.5, alpha: 0.75 });

      const tTitle = new Text({
        text: c.title,
        style: new TextStyle({ ...cardTitleStyle, fill: c.iconColor }),
      });
      tTitle.position.set(25, 25);

      const tBullets = new Text({
        text: c.bullets.join('\n'),
        style: bulletStyle,
      });
      tBullets.position.set(25, 80);

      box.addChild(bg);
      box.addChild(tTitle);
      box.addChild(tBullets);

      this.cardContainer.addChild(box);
    }
  }

  public update(deltaSeconds: number): void {
    this.timeElapsed += deltaSeconds;

    this.consoleGfx.clear();

    // Subtle pulsing corner brackets
    const pulse = 0.5 + Math.sin(this.timeElapsed * 3.0) * 0.5;
    this.consoleGfx.roundRect(80, 70, 1760, 940, 8).stroke({ color: 0x00f0ff, width: 1.5, alpha: 0.3 * pulse });
  }
}
