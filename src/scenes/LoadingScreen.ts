import { Graphics, Text, TextStyle } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { SceneId } from './SceneId';
import { ViewportTransform } from '../rendering/VirtualResolution';

export class LoadingScreen extends BaseScene {
  public readonly id = SceneId.LOADING_SCREEN;

  private radarGraphics: Graphics = new Graphics();
  private progressBarGraphics: Graphics = new Graphics();
  private titleText!: Text;
  private statusText!: Text;
  private telemetryText!: Text;

  private progress: number = 0;
  private targetProgress: number = 1.0;
  private radarAngle: number = 0;
  private elapsedTime: number = 0;

  protected onInitialize(): void {
    const titleStyle = new TextStyle({
      fontFamily: 'Orbitron, sans-serif',
      fontSize: 34,
      fontWeight: 'bold',
      fill: 0xffffff,
      letterSpacing: 4,
    });

    const statusStyle = new TextStyle({
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: 18,
      fontWeight: '600',
      fill: 0x00e5ff,
      letterSpacing: 3,
    });

    const telemetryStyle = new TextStyle({
      fontFamily: 'Rajdhani, monospace',
      fontSize: 14,
      fill: 0x8b949e,
      letterSpacing: 1,
    });

    this.titleText = new Text({
      text: 'INTERSTELLAR CONTINUUM',
      style: titleStyle,
    });
    this.titleText.anchor.set(0.5, 0.5);
    this.titleText.position.set(960, 420);

    this.statusText = new Text({
      text: 'INITIALIZING APPLICATION FOUNDATION // STANDBY...',
      style: statusStyle,
    });
    this.statusText.anchor.set(0.5, 0.5);
    this.statusText.position.set(960, 480);

    this.telemetryText = new Text({
      text: 'CORE SUBSYSTEMS: ONLINE | VIRTUAL RES: 1920x1080 | RENDERER: PIXI v8',
      style: telemetryStyle,
    });
    this.telemetryText.anchor.set(0.5, 0.5);
    this.telemetryText.position.set(960, 680);

    this.container.addChild(this.radarGraphics);
    this.container.addChild(this.progressBarGraphics);
    this.container.addChild(this.titleText);
    this.container.addChild(this.statusText);
    this.container.addChild(this.telemetryText);

    this.renderProgressBar(0);
    this.renderRadar(0);
  }

  public setProgress(progress: number, statusMessage?: string): void {
    this.targetProgress = Math.max(0, Math.min(1.0, progress));
    if (statusMessage && this.statusText) {
      this.statusText.text = statusMessage.toUpperCase();
    }
  }

  protected onUpdate(deltaSeconds: number): void {
    this.elapsedTime += deltaSeconds;

    // Smooth progress interpolation
    this.progress += (this.targetProgress - this.progress) * Math.min(1.0, deltaSeconds * 8);

    // Rotate radar
    this.radarAngle += deltaSeconds * 2.2;
    if (this.radarAngle > Math.PI * 2) {
      this.radarAngle -= Math.PI * 2;
    }

    this.renderRadar(this.radarAngle);
    this.renderProgressBar(this.progress);

    // Pulse status
    if (this.statusText) {
      const pulseAlpha = 0.8 + 0.2 * Math.sin(this.elapsedTime * 4);
      this.statusText.alpha = pulseAlpha;
    }
  }

  private renderRadar(angle: number): void {
    const cx = 960;
    const cy = 290;
    const radius = 60;

    this.radarGraphics.clear();

    // Outer rings
    this.radarGraphics.circle(cx, cy, radius);
    this.radarGraphics.stroke({ color: 0x00e5ff, width: 1.5, alpha: 0.4 });

    this.radarGraphics.circle(cx, cy, radius * 0.6);
    this.radarGraphics.stroke({ color: 0x00e5ff, width: 1, alpha: 0.2 });

    this.radarGraphics.circle(cx, cy, radius * 0.2);
    this.radarGraphics.stroke({ color: 0x00e5ff, width: 1, alpha: 0.2 });

    // Crosshairs
    this.radarGraphics.moveTo(cx - radius - 10, cy);
    this.radarGraphics.lineTo(cx + radius + 10, cy);
    this.radarGraphics.stroke({ color: 0x00e5ff, width: 1, alpha: 0.2 });

    this.radarGraphics.moveTo(cx, cy - radius - 10);
    this.radarGraphics.lineTo(cx, cy + radius + 10);
    this.radarGraphics.stroke({ color: 0x00e5ff, width: 1, alpha: 0.2 });

    // Rotating sweep beam
    const targetX = cx + Math.cos(angle) * radius;
    const targetY = cy + Math.sin(angle) * radius;
    this.radarGraphics.moveTo(cx, cy);
    this.radarGraphics.lineTo(targetX, targetY);
    this.radarGraphics.stroke({ color: 0x00e5ff, width: 2, alpha: 0.9 });

    // Center pivot blip
    this.radarGraphics.circle(cx, cy, 3);
    this.radarGraphics.fill({ color: 0x00e5ff, alpha: 0.9 });
  }

  private renderProgressBar(ratio: number): void {
    const x = 710;
    const y = 530;
    const width = 500;
    const height = 12;

    this.progressBarGraphics.clear();

    // Background track
    this.progressBarGraphics.roundRect(x, y, width, height, 3);
    this.progressBarGraphics.fill({ color: 0x0a192f, alpha: 0.8 });
    this.progressBarGraphics.stroke({ color: 0x00e5ff, width: 1, alpha: 0.3 });

    // Active fill
    const fillWidth = Math.max(0, width * ratio);
    if (fillWidth > 0) {
      this.progressBarGraphics.roundRect(x + 2, y + 2, fillWidth - 4, height - 4, 2);
      this.progressBarGraphics.fill({ color: 0x00e5ff, alpha: 0.85 });
    }

    // Tick markers
    for (let i = 1; i <= 3; i++) {
      const tickX = x + (width / 4) * i;
      this.progressBarGraphics.moveTo(tickX, y - 4);
      this.progressBarGraphics.lineTo(tickX, y + height + 4);
      this.progressBarGraphics.stroke({ color: 0x00e5ff, width: 1, alpha: 0.25 });
    }
  }

  protected handleResize(_transform: ViewportTransform): void {
    // Virtual coordinates maintain layout
  }

  protected onCleanup(): void {
    this.radarGraphics.clear();
    this.progressBarGraphics.clear();
  }
}
