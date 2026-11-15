/**
 * INTERSTELLAR CONTINUUM - Cinematic Controls & Pause Overlay
 * Manages skip prompt, pause modal screen, and timeline act dots.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export class CinematicControlsOverlay {
  public readonly container: Container;

  private topBarContainer: Container;
  private skipPromptContainer: Container;
  private pauseModalContainer: Container;
  private dotsGfx: Graphics;

  private isPaused: boolean = false;
  private timeElapsed: number = 0;

  private readonly onSkipCallback: () => void;
  private readonly onTogglePauseCallback: () => void;

  constructor(onSkip: () => void, onTogglePause: () => void) {
    this.onSkipCallback = onSkip;
    this.onTogglePauseCallback = onTogglePause;

    this.container = new Container();
    this.container.label = 'CinematicControlsOverlay';

    this.topBarContainer = new Container();
    this.skipPromptContainer = new Container();
    this.pauseModalContainer = new Container();
    this.dotsGfx = new Graphics();

    this.container.addChild(this.topBarContainer);
    this.container.addChild(this.skipPromptContainer);
    this.container.addChild(this.pauseModalContainer);

    this.topBarContainer.addChild(this.dotsGfx);

    this.setupSkipPrompt();
    this.setupPauseModal();
    this.pauseModalContainer.visible = false;
  }

  private setupSkipPrompt(): void {
    const promptStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 11,
      fontWeight: 'bold',
      fill: 0x94a3b8,
      letterSpacing: 1.2,
    });

    const skipBtn = new Container();
    skipBtn.position.set(1720, 40);
    skipBtn.eventMode = 'static';
    skipBtn.cursor = 'pointer';

    const bg = new Graphics();
    bg.roundRect(-140, -16, 280, 32, 4);
    bg.fill({ color: 0x0f172a, alpha: 0.8 });
    bg.stroke({ color: 0x38bdf8, width: 1.0, alpha: 0.6 });

    const txt = new Text({
      text: '▶ SKIP [ESC / SPACE] ◀',
      style: promptStyle,
    });
    txt.anchor.set(0.5, 0.5);

    skipBtn.addChild(bg, txt);

    skipBtn.on('pointerover', () => {
      bg.stroke({ color: 0xffffff, width: 1.5, alpha: 1.0 });
    });
    skipBtn.on('pointerout', () => {
      bg.stroke({ color: 0x38bdf8, width: 1.0, alpha: 0.6 });
    });
    skipBtn.on('pointertap', (e) => {
      e.stopPropagation();
      this.onSkipCallback();
    });

    this.skipPromptContainer.addChild(skipBtn);
  }

  private setupPauseModal(): void {
    const bg = new Graphics();
    bg.rect(0, 0, 1920, 1080).fill({ color: 0x020617, alpha: 0.75 });

    const modalBox = new Container();
    modalBox.position.set(960, 540);

    const boxGfx = new Graphics();
    boxGfx.roundRect(-240, -80, 480, 160, 8);
    boxGfx.fill({ color: 0x0b1322, alpha: 0.95 });
    boxGfx.stroke({ color: 0x00f0ff, width: 2.0 });

    const pauseStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 20,
      fontWeight: 'bold',
      fill: 0x00f0ff,
      letterSpacing: 2.5,
    });

    const subStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 12,
      fill: 0xe2e8f0,
      letterSpacing: 1.0,
      align: 'center',
    });

    const tPause = new Text({
      text: 'CINEMATIC PAUSED',
      style: pauseStyle,
    });
    tPause.anchor.set(0.5, 0.5);
    tPause.position.set(0, -25);

    const tSub = new Text({
      text: 'PRESS [ESCAPE] OR CLICK TO RESUME\nPRESS [SPACE / ENTER] TO SKIP',
      style: subStyle,
    });
    tSub.anchor.set(0.5, 0.5);
    tSub.position.set(0, 25);

    modalBox.addChild(boxGfx, tPause, tSub);

    this.pauseModalContainer.addChild(bg, modalBox);
    this.pauseModalContainer.eventMode = 'static';
    this.pauseModalContainer.cursor = 'pointer';
    this.pauseModalContainer.on('pointertap', () => {
      this.onTogglePauseCallback();
    });
  }

  public updateTimeline(sceneIndex: number, totalScenes: number): void {
    this.dotsGfx.clear();

    const startX = 960 - ((totalScenes - 1) * 28) / 2;
    const y = 35;

    for (let i = 0; i < totalScenes; i++) {
      const dx = startX + i * 28;
      const isCurrent = i === sceneIndex;

      if (isCurrent) {
        this.dotsGfx.circle(dx, y, 6).fill({ color: 0x00f0ff });
        this.dotsGfx.circle(dx, y, 10).stroke({ color: 0x00f0ff, width: 1.5, alpha: 0.8 });
      } else if (i < sceneIndex) {
        this.dotsGfx.circle(dx, y, 4).fill({ color: 0x22c55e });
      } else {
        this.dotsGfx.circle(dx, y, 3).fill({ color: 0x475569 });
      }
    }
  }

  public setPaused(paused: boolean): void {
    this.isPaused = paused;
    this.pauseModalContainer.visible = paused;
  }

  public getPaused(): boolean {
    return this.isPaused;
  }

  public update(deltaSeconds: number): void {
    this.timeElapsed += deltaSeconds;

    // Pulse skip prompt alpha slightly
    this.skipPromptContainer.alpha = 0.85 + Math.sin(this.timeElapsed * 3.0) * 0.15;
  }
}
