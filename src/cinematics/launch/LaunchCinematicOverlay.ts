/**
 * INTERSTELLAR CONTINUUM - Launch Cinematic Overlay & HUD
 * Cinematic anamorphic letterbox framing, real-time telemetry readout,
 * countdown sequencer display, subtitle voice callouts, and interactive playback controls
 * (Skip, Pause/Resume, and Pre-Commit Abort).
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_COLORS, UI_FONTS } from '../../ui/core/UIDesignTokens';
import { UIButton } from '../../ui/components/UIButton';
import {
  LaunchCinematicStage,
  LaunchCinematicTelemetry,
  CinematicLaunchSettings,
} from './LaunchCinematicTypes';

export interface LaunchCinematicOverlayCallbacks {
  onSkip?: () => void;
  onTogglePause?: () => void;
  onAbort?: () => void;
}

export class LaunchCinematicOverlay {
  public readonly container: Container;

  // Visual layout containers
  private letterboxContainer: Container;
  private headerContainer: Container;
  private countdownContainer: Container;
  private telemetryContainer: Container;
  private subtitlesContainer: Container;
  private controlsContainer: Container;

  // Graphics and text elements
  private topBarGfx: Graphics;
  private bottomBarGfx: Graphics;
  private missionTitleText: Text;
  private vehicleNameText: Text;
  private padDesignatorText: Text;

  private clockLabelText: Text;
  private clockValueText: Text;
  private clockStatusText: Text;

  private telemetryText: Text;
  private subtitleText: Text;

  private skipButton?: UIButton;
  private pauseButton?: UIButton;
  private abortButton?: UIButton;

  private isPaused: boolean = false;
  private callbacks: LaunchCinematicOverlayCallbacks;

  constructor(
    settings: Partial<CinematicLaunchSettings> = {},
    callbacks: LaunchCinematicOverlayCallbacks = {}
  ) {
    this.callbacks = callbacks;

    this.container = new Container();
    this.container.label = 'LaunchCinematicOverlay';
    this.container.zIndex = 2000;

    // 1. Cinematic Letterbox Bars (Top & Bottom anamorphic 80px borders)
    this.letterboxContainer = new Container();
    this.container.addChild(this.letterboxContainer);

    this.topBarGfx = new Graphics();
    this.topBarGfx.rect(0, 0, 1920, 80).fill({ color: 0x020617, alpha: 0.95 });
    this.letterboxContainer.addChild(this.topBarGfx);

    this.bottomBarGfx = new Graphics();
    this.bottomBarGfx.rect(0, 1000, 1920, 80).fill({ color: 0x020617, alpha: 0.95 });
    this.letterboxContainer.addChild(this.bottomBarGfx);

    // Subtle edge borders
    const borderGfx = new Graphics();
    borderGfx.moveTo(0, 80).lineTo(1920, 80).stroke({ color: 0x334155, width: 1 });
    borderGfx.moveTo(0, 1000).lineTo(1920, 1000).stroke({ color: 0x334155, width: 1 });
    this.letterboxContainer.addChild(borderGfx);

    // 2. Header Container (Top Bar Left & Center)
    this.headerContainer = new Container();
    this.headerContainer.position.set(40, 16);
    this.container.addChild(this.headerContainer);

    this.missionTitleText = new Text({
      text: 'MISSION LAUNCH SEQUENCE',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 18,
        fontWeight: 'bold',
        fill: UI_COLORS.AMBER,
        letterSpacing: 2,
      }),
    });
    this.headerContainer.addChild(this.missionTitleText);

    this.vehicleNameText = new Text({
      text: 'VEHICLE: UNKNOWN',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 12,
        fill: 0x94a3b8,
      }),
    });
    this.vehicleNameText.position.set(0, 26);
    this.headerContainer.addChild(this.vehicleNameText);

    this.padDesignatorText = new Text({
      text: 'LAUNCH COMPLEX PAD ALPHA // RANGE STATUS: GREEN',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fill: 0x22c55e,
        letterSpacing: 1,
      }),
    });
    this.padDesignatorText.position.set(420, 26);
    this.headerContainer.addChild(this.padDesignatorText);

    // 3. Countdown Box (Top Right)
    this.countdownContainer = new Container();
    this.countdownContainer.position.set(1560, 12);
    this.container.addChild(this.countdownContainer);

    this.clockLabelText = new Text({
      text: 'COUNTDOWN CLOCK',
      style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 10, fill: 0x64748b }),
    });
    this.countdownContainer.addChild(this.clockLabelText);

    this.clockValueText = new Text({
      text: 'T - 00:10',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 26,
        fontWeight: 'bold',
        fill: 0x22c55e,
        letterSpacing: 2,
      }),
    });
    this.clockValueText.position.set(0, 14);
    this.countdownContainer.addChild(this.clockValueText);

    this.clockStatusText = new Text({
      text: 'HOLDING STANDBY',
      style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 9, fill: 0x94a3b8 }),
    });
    this.clockStatusText.position.set(0, 46);
    this.countdownContainer.addChild(this.clockStatusText);

    // 4. Telemetry Teletext Display (Bottom Bar Left)
    this.telemetryContainer = new Container();
    this.telemetryContainer.position.set(40, 1014);
    this.container.addChild(this.telemetryContainer);

    this.telemetryText = new Text({
      text: 'ALTITUDE: 0.00 km   |   VELOCITY: 0 m/s   |   ACCEL: 0.00 G   |   Q: 0.0 kPa   |   THROTTLE: 0%',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 13,
        fill: 0xe2e8f0,
        letterSpacing: 1,
      }),
    });
    this.telemetryContainer.addChild(this.telemetryText);

    // 5. Narrative Callouts & Subtitles (Center Screen Lower)
    this.subtitlesContainer = new Container();
    this.subtitlesContainer.position.set(960, 930);
    this.container.addChild(this.subtitlesContainer);

    this.subtitleText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 16,
        fill: 0xffffff,
        align: 'center',
        stroke: { color: 0x000000, width: 3 },
      }),
    });
    this.subtitleText.anchor.set(0.5, 0.5);
    this.subtitlesContainer.addChild(this.subtitleText);

    // 6. Interactive Playback Controls (Bottom Bar Right)
    this.controlsContainer = new Container();
    this.controlsContainer.position.set(1320, 1020);
    this.container.addChild(this.controlsContainer);

    // Abort button (Only active during pre-ignition countdown)
    this.abortButton = new UIButton({
      label: 'ABORT',
      width: 90,
      height: 36,
      variant: 'DANGER',
      onClick: () => {
        if (this.callbacks.onAbort) this.callbacks.onAbort();
      },
    });
    this.abortButton.container.position.set(0, 0);
    this.controlsContainer.addChild(this.abortButton.container);

    // Pause button
    this.pauseButton = new UIButton({
      label: 'PAUSE',
      width: 90,
      height: 36,
      variant: 'SECONDARY',
      onClick: () => {
        this.isPaused = !this.isPaused;
        this.pauseButton?.setLabel(this.isPaused ? 'RESUME' : 'PAUSE');
        if (this.callbacks.onTogglePause) this.callbacks.onTogglePause();
      },
    });
    this.pauseButton.container.position.set(100, 0);
    this.controlsContainer.addChild(this.pauseButton.container);

    // Skip button
    if (settings.allowSkip ?? true) {
      this.skipButton = new UIButton({
        label: 'SKIP ⏩',
        width: 100,
        height: 36,
        variant: 'SECONDARY',
        onClick: () => {
          if (this.callbacks.onSkip) this.callbacks.onSkip();
        },
      });
      this.skipButton.container.position.set(200, 0);
      this.controlsContainer.addChild(this.skipButton.container);
    }
  }

  public setMissionInfo(missionName: string, vehicleName: string, padCode: string = 'PAD-01'): void {
    this.missionTitleText.text = `MISSION: ${missionName.toUpperCase()}`;
    this.vehicleNameText.text = `VEHICLE: ${vehicleName.toUpperCase()}`;
    this.padDesignatorText.text = `LAUNCH COMPLEX ${padCode} // RANGE: GREEN`;
  }

  public setSubtitle(text: string): void {
    this.subtitleText.text = text;
    this.subtitlesContainer.visible = text.length > 0;
  }

  public updateTelemetry(telemetry: LaunchCinematicTelemetry): void {
    // 1. Clock update
    if (telemetry.stage === LaunchCinematicStage.COUNTDOWN) {
      const sec = Math.max(0, Math.ceil(telemetry.countdownSeconds));
      this.clockValueText.text = `T - 00:${sec.toString().padStart(2, '0')}`;
      this.clockValueText.style.fill = sec <= 3 ? 0xef4444 : 0xf59e0b;
      this.clockStatusText.text = 'FINAL TERMINAL COUNT';
      this.clockStatusText.style.fill = 0xef4444;
      this.abortButton?.setDisabled(false);
    } else if (
      telemetry.stage === LaunchCinematicStage.CONFIRMATION ||
      telemetry.stage === LaunchCinematicStage.APPROACH ||
      telemetry.stage === LaunchCinematicStage.ATMOSPHERE
    ) {
      this.clockValueText.text = 'T - 00:10 (STANDBY)';
      this.clockValueText.style.fill = 0x22c55e;
      this.clockStatusText.text = 'READY FOR TERMINAL COUNTDOWN';
      this.clockStatusText.style.fill = 0x22c55e;
      this.abortButton?.setDisabled(false);
    } else {
      // Post-ignition (T-plus)
      const sec = Math.floor(telemetry.missionTimeSeconds);
      const min = Math.floor(sec / 60);
      const remSec = sec % 60;
      this.clockValueText.text = `T + ${min.toString().padStart(2, '0')}:${remSec.toString().padStart(2, '0')}`;
      this.clockValueText.style.fill = 0x38bdf8;
      this.clockStatusText.text = 'ACTIVE ASCENT PHASE';
      this.clockStatusText.style.fill = 0x38bdf8;
      // Abort is disabled after ignition commitment
      this.abortButton?.setDisabled(true);
    }

    // 2. Telemetry strip update
    const altStr = telemetry.altitudeKm.toFixed(2);
    const velStr = Math.round(telemetry.velocityMps).toLocaleString();
    const gStr = telemetry.accelerationG.toFixed(2);
    const qStr = telemetry.dynamicPressureKPa.toFixed(1);
    const thrStr = Math.round(telemetry.throttlePercent);

    this.telemetryText.text = `ALTITUDE: ${altStr} km   |   VELOCITY: ${velStr} m/s   |   ACCEL: ${gStr} G   |   Q: ${qStr} kPa   |   THROTTLE: ${thrStr}%`;
  }

  public setPaused(paused: boolean): void {
    this.isPaused = paused;
    this.pauseButton?.setLabel(paused ? 'RESUME' : 'PAUSE');
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
