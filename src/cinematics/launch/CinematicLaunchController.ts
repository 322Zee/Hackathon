/**
 * INTERSTELLAR CONTINUUM - Cinematic Launch Controller
 * Authoritative controller and state machine driving the 12-stage cinematic rocket launch sequence.
 * Coordinates multi-layer parallax environment, dynamic particle systems, heat distortion shaders,
 * trauma-based camera tracking, countdown audio, telemetry calculations, and mission handoff.
 */

import { Container } from 'pixi.js';
import { EventBus } from '../../core/EventBus';
import { Logger } from '../../core/logging/Logger';
import {
  LaunchCinematicStage,
  LaunchCinematicState,
  LaunchCinematicInput,
  LaunchCinematicTelemetry,
  LaunchHandoffPayload,
  CinematicLaunchSettings,
  DEFAULT_LAUNCH_CINEMATIC_SETTINGS,
  LAUNCH_CINEMATIC_EVENTS,
} from './LaunchCinematicTypes';
import { LaunchVehicleAdapter } from './LaunchVehicleAdapter';
import { LaunchParticleSystem } from './LaunchParticleSystem';
import { LaunchEnvironmentView } from './LaunchEnvironmentView';
import { LaunchEffectsRenderer } from './LaunchEffectsRenderer';
import { LaunchCameraDirector } from './LaunchCameraDirector';
import { LaunchAudioAdapter } from './LaunchAudioAdapter';
import { LaunchCinematicOverlay } from './LaunchCinematicOverlay';

export interface CinematicLaunchControllerOptions {
  eventBus?: EventBus;
  audioAdapter?: LaunchAudioAdapter;
  settings?: Partial<CinematicLaunchSettings>;
  onComplete?: (handoff: LaunchHandoffPayload) => void;
  onHandoff?: (handoff: LaunchHandoffPayload) => void;
  onStageChange?: (stage: LaunchCinematicStage) => void;
}

export class CinematicLaunchController {
  public readonly stageContainer: Container;

  private eventBus?: EventBus;
  private settings: CinematicLaunchSettings;
  private state: LaunchCinematicState = LaunchCinematicState.IDLE;
  private currentStage: LaunchCinematicStage = LaunchCinematicStage.CONFIRMATION;

  // Subsystems
  private environmentView: LaunchEnvironmentView;
  private particleSystem: LaunchParticleSystem;
  private effectsRenderer: LaunchEffectsRenderer;
  private cameraDirector: LaunchCameraDirector;
  private audioAdapter: LaunchAudioAdapter;
  private overlay: LaunchCinematicOverlay;

  // Vehicle visual node
  private vehicleContainer: Container;
  private vehicleNozzleGlow?: (throttle: number) => void;

  // Active launch parameters
  private activeInput?: LaunchCinematicInput;
  private stageTimer: number = 0;
  private totalElapsedSeconds: number = 0;
  private countdownRemaining: number = 10;
  private missionTimeElapsed: number = 0;

  // Vehicle Physics & Telemetry State
  private vehicleInitialY: number = 690;
  private vehicleCurrentY: number = 690;
  private vehicleVelocityY: number = 0; // px/s
  private vehicleThrottle: number = 0; // 0 to 1
  private currentAltitudeKm: number = 0;
  private currentVelocityMps: number = 0;
  private currentAccelG: number = 0;
  private currentDynamicPressureKPa: number = 0;

  // Umbilical swing arm retraction (0 to 1)
  private umbilicalRetraction: number = 0;

  // Callbacks
  private onCompleteCallback?: (handoff: LaunchHandoffPayload) => void;
  private onHandoffCallback?: (handoff: LaunchHandoffPayload) => void;
  private onStageChangeCallback?: (stage: LaunchCinematicStage) => void;

  // Async completion promise resolver
  private resolveHandoffPromise?: (handoff: LaunchHandoffPayload) => void;

  constructor(options: CinematicLaunchControllerOptions = {}) {
    this.eventBus = options.eventBus;
    this.settings = { ...DEFAULT_LAUNCH_CINEMATIC_SETTINGS, ...options.settings };
    this.onCompleteCallback = options.onComplete;
    this.onHandoffCallback = options.onHandoff;
    this.onStageChangeCallback = options.onStageChange;

    // Master World Container (Camera director moves/scales this)
    this.stageContainer = new Container();
    this.stageContainer.label = 'CinematicLaunchController_Root';

    const worldContainer = new Container();
    worldContainer.label = 'CinematicLaunch_World';
    this.stageContainer.addChild(worldContainer);

    // 1. Environment & Sky Parallax
    this.environmentView = new LaunchEnvironmentView();
    worldContainer.addChild(this.environmentView.container);

    // 2. Back Particle Layer (billowing smoke & trench deflector plumes)
    this.particleSystem = new LaunchParticleSystem({
      quality: this.settings.quality,
    });
    worldContainer.addChild(this.particleSystem.backContainer);

    // 3. Vehicle Container
    this.vehicleContainer = new Container();
    this.vehicleContainer.label = 'LaunchVehicle_Mount';
    this.vehicleContainer.position.set(960, this.vehicleInitialY);
    worldContainer.addChild(this.vehicleContainer);

    // 4. Effects Renderer (Exhaust glow, supersonic shock diamonds, heat shaders)
    this.effectsRenderer = new LaunchEffectsRenderer({
      enableShaders: this.settings.enableShaders,
      quality: this.settings.quality,
    });
    worldContainer.addChild(this.effectsRenderer.container);

    // 5. Front Particle Layer (core flames, sparks, transonic vapor cones)
    worldContainer.addChild(this.particleSystem.frontContainer);

    // 6. Camera Director
    this.cameraDirector = new LaunchCameraDirector(worldContainer, this.settings);

    // 7. Audio Adapter
    this.audioAdapter = options.audioAdapter ?? new LaunchAudioAdapter({
      muted: !this.settings.soundEnabled,
      volume: this.settings.soundVolume,
    });

    // 8. Overlay HUD (Rendered directly in stageContainer above world camera transform)
    this.overlay = new LaunchCinematicOverlay(this.settings, {
      onSkip: () => this.skip(),
      onTogglePause: () => {
        if (this.state === LaunchCinematicState.RUNNING) {
          this.pause();
        } else if (this.state === LaunchCinematicState.PAUSED) {
          this.resume();
        }
      },
      onAbort: () => this.abort(),
    });
    this.stageContainer.addChild(this.overlay.container);

    Logger.info('CINEMATIC_LAUNCH_CONTROLLER', 'Cinematic Launch Controller initialized.');
  }

  // =========================================================================
  // PUBLIC CONTROLS
  // =========================================================================

  public getState(): LaunchCinematicState {
    return this.state;
  }

  public getCurrentStage(): LaunchCinematicStage {
    return this.currentStage;
  }

  public getTelemetry(): LaunchCinematicTelemetry {
    return this.calculateTelemetry();
  }

  /**
   * Starts the cinematic launch presentation sequence
   */
  public start(input: LaunchCinematicInput): Promise<LaunchHandoffPayload> {
    if (this.state === LaunchCinematicState.RUNNING) {
      Logger.warn('CINEMATIC_LAUNCH_CONTROLLER', 'Launch sequence already running.');
      return Promise.reject(new Error('Cinematic launch sequence already running.'));
    }

    this.activeInput = input;
    if (input.settings) {
      this.settings = { ...this.settings, ...input.settings };
      this.cameraDirector.updateSettings(this.settings);
      this.effectsRenderer.setShadersEnabled(this.settings.enableShaders);
      this.effectsRenderer.setQuality(this.settings.quality);
      this.audioAdapter.setMuted(!this.settings.soundEnabled);
      this.audioAdapter.setVolume(this.settings.soundVolume);
    }

    this.state = LaunchCinematicState.RUNNING;
    this.stageTimer = 0;
    this.totalElapsedSeconds = 0;
    this.countdownRemaining = 10;
    this.missionTimeElapsed = 0;
    this.vehicleCurrentY = this.vehicleInitialY;
    this.vehicleVelocityY = 0;
    this.vehicleThrottle = 0;
    this.currentAltitudeKm = 0;
    this.currentVelocityMps = 0;
    this.currentAccelG = 0;
    this.currentDynamicPressureKPa = 0;
    this.umbilicalRetraction = 0;

    // Build vehicle visual from input data
    this.setupVehicleVisual(input);

    // Initialize HUD and audio
    const missionName = input.missionName || input.missionId;
    const vehicleName = input.vehicleData.vehicleName;
    const padCode = input.padCode || 'PAD-01';
    this.overlay.setMissionInfo(missionName, vehicleName, padCode);
    this.audioAdapter.startLaunchAmbience();

    // Emit CinematicStarted
    this.emitEvent(LAUNCH_CINEMATIC_EVENTS.CINEMATIC_STARTED, {
      missionId: input.missionId,
      vehicleName,
      launchSiteId: input.launchSiteId,
      timestamp: Date.now(),
    });

    Logger.info(
      'CINEMATIC_LAUNCH_CONTROLLER',
      `Cinematic Launch Started for Mission "${input.missionId}", Vehicle: ${vehicleName}`
    );

    this.setStage(LaunchCinematicStage.CONFIRMATION);

    return new Promise<LaunchHandoffPayload>((resolve) => {
      this.resolveHandoffPromise = resolve;
    });
  }

  /**
   * Skips the cinematic sequence, fast-forwarding to orbital handoff immediately
   */
  public skip(): void {
    if (this.state !== LaunchCinematicState.RUNNING && this.state !== LaunchCinematicState.PAUSED) {
      return;
    }

    Logger.info('CINEMATIC_LAUNCH_CONTROLLER', 'Cinematic skipped by player.');
    const skippedAtStage = this.currentStage;
    this.state = LaunchCinematicState.SKIPPED;

    this.audioAdapter.stopAll();
    this.particleSystem.clear();
    this.effectsRenderer.clear();

    // Emit CinematicSkipped
    if (this.activeInput) {
      this.emitEvent(LAUNCH_CINEMATIC_EVENTS.CINEMATIC_SKIPPED, {
        missionId: this.activeInput.missionId,
        skippedAtStage,
        elapsedSeconds: this.totalElapsedSeconds,
        timestamp: Date.now(),
      });
    }

    // Produce nominal orbital insertion telemetry
    const finalTelemetry: LaunchCinematicTelemetry = {
      stage: LaunchCinematicStage.SPACE_REACH,
      countdownSeconds: 0,
      missionTimeSeconds: Math.max(120, this.missionTimeElapsed),
      altitudeKm: 185.0,
      velocityMps: 7650.0,
      accelerationG: 1.0,
      dynamicPressureKPa: 0.0,
      throttlePercent: 100,
      distanceDownrangeKm: 420.0,
    };

    const handoffPayload: LaunchHandoffPayload = {
      missionId: this.activeInput?.missionId ?? 'unknown_mission',
      launchSiteId: this.activeInput?.launchSiteId ?? 'FAC_LAUNCH_COMPLEX_PAD_ALPHA',
      timestamp: Date.now(),
      finalTelemetry,
      vehicleData: this.activeInput?.vehicleData ?? LaunchVehicleAdapter.getDefaultVehicleData(),
      environment: this.activeInput?.environment,
      wasSkipped: true,
      handoffStatus: 'SKIPPED_TO_ORBITAL_INSERTION',
    };

    this.executeHandoffAndComplete(handoffPayload);
  }

  /**
   * Pauses cinematic timeline
   */
  public pause(): void {
    if (this.state !== LaunchCinematicState.RUNNING) return;
    this.state = LaunchCinematicState.PAUSED;
    this.overlay.setPaused(true);
    Logger.info('CINEMATIC_LAUNCH_CONTROLLER', 'Cinematic paused.');
  }

  /**
   * Resumes cinematic timeline
   */
  public resume(): void {
    if (this.state !== LaunchCinematicState.PAUSED) return;
    this.state = LaunchCinematicState.RUNNING;
    this.overlay.setPaused(false);
    Logger.info('CINEMATIC_LAUNCH_CONTROLLER', 'Cinematic resumed.');
  }

  /**
   * Safely aborts launch sequence prior to ignition commitment (Stages 1-4).
   * Returns true if abort succeeded, false if launch was already committed.
   */
  public abort(): boolean {
    const isPreIgnition =
      this.currentStage === LaunchCinematicStage.CONFIRMATION ||
      this.currentStage === LaunchCinematicStage.APPROACH ||
      this.currentStage === LaunchCinematicStage.ATMOSPHERE ||
      this.currentStage === LaunchCinematicStage.COUNTDOWN;

    if (!isPreIgnition || (this.state !== LaunchCinematicState.RUNNING && this.state !== LaunchCinematicState.PAUSED)) {
      Logger.warn(
        'CINEMATIC_LAUNCH_CONTROLLER',
        `Cannot abort launch: sequence is past commitment window (Stage: ${this.currentStage}).`
      );
      return false;
    }

    this.state = LaunchCinematicState.ABORTED;
    this.audioAdapter.stopAll();
    this.particleSystem.clear();
    this.effectsRenderer.clear();
    this.cameraDirector.snapTo(960, 680, 0.95);

    this.overlay.setSubtitle('RANGE SAFETY HOLD // LAUNCH SEQUENCE ABORTED');
    Logger.info('CINEMATIC_LAUNCH_CONTROLLER', 'Launch sequence safely aborted by operator.');
    return true;
  }

  // =========================================================================
  // TIMELINE & PER-FRAME TICK
  // =========================================================================

  public update(deltaSeconds: number): void {
    if (this.state !== LaunchCinematicState.RUNNING) return;

    this.stageTimer += deltaSeconds;
    this.totalElapsedSeconds += deltaSeconds;

    // 1. Advance through the 12 Stages
    this.updateStageLogic(deltaSeconds);

    // 2. Physics & Vehicle Motion
    this.updateVehiclePhysics(deltaSeconds);

    // 3. Environment & Parallax altitude
    this.environmentView.setAltitudeKm(this.currentAltitudeKm);
    this.environmentView.renderUmbilicalArms(this.umbilicalRetraction);
    this.environmentView.tick(deltaSeconds);
    this.environmentView.setEnginePlumeIllumination(960, this.vehicleCurrentY, this.vehicleThrottle);

    // 4. Particles & Plumes
    if (this.vehicleThrottle > 0.01) {
      this.particleSystem.emitEnginePlume(960, this.vehicleCurrentY, this.vehicleThrottle, deltaSeconds);
      if (this.currentAltitudeKm < 1.2) {
        this.particleSystem.emitTrenchSmoke(960, 710, this.vehicleThrottle);
      }
    }
    if (this.currentStage === LaunchCinematicStage.ATMOSPHERE) {
      this.particleSystem.emitCryoVenting(960, this.vehicleInitialY - 140, deltaSeconds);
    }
    this.particleSystem.update(deltaSeconds);

    // 5. Effects & Shaders
    this.effectsRenderer.update(960, this.vehicleCurrentY, this.vehicleThrottle, deltaSeconds);

    // 6. Camera Director
    this.cameraDirector.onStageChanged(this.currentStage, this.vehicleCurrentY);
    this.cameraDirector.update(deltaSeconds);

    // 7. Audio Roar Throttle
    this.audioAdapter.setPlumeRoarThrottle(this.vehicleThrottle);

    // 8. Telemetry & Overlay HUD
    const telemetry = this.calculateTelemetry();
    this.overlay.updateTelemetry(telemetry);
  }

  private updateStageLogic(deltaSeconds: number): void {
    switch (this.currentStage) {
      case LaunchCinematicStage.CONFIRMATION:
        if (this.stageTimer >= 1.5) {
          this.setStage(LaunchCinematicStage.APPROACH);
        }
        break;

      case LaunchCinematicStage.APPROACH:
        if (this.stageTimer >= 2.0) {
          this.setStage(LaunchCinematicStage.ATMOSPHERE);
        }
        break;

      case LaunchCinematicStage.ATMOSPHERE:
        if (this.stageTimer >= 2.0) {
          this.setStage(LaunchCinematicStage.COUNTDOWN);
        }
        break;

      case LaunchCinematicStage.COUNTDOWN: {
        const prevCountdownSec = Math.ceil(this.countdownRemaining);
        this.countdownRemaining = Math.max(0, 10 - this.stageTimer);
        const curCountdownSec = Math.ceil(this.countdownRemaining);

        // Countdown audio ticks on integer transitions
        if (curCountdownSec < prevCountdownSec && curCountdownSec > 0) {
          this.audioAdapter.playCountdownTick(curCountdownSec);
        }

        // Subtitle callouts
        if (curCountdownSec <= 10 && curCountdownSec >= 6) {
          this.overlay.setSubtitle(`TERMINAL COUNTDOWN: T - ${curCountdownSec}`);
        } else if (curCountdownSec === 5) {
          this.overlay.setSubtitle('T-5 // GSE PROPELLANT TANKS PRESSURIZED');
        } else if (curCountdownSec === 3) {
          this.overlay.setSubtitle('T-3 // ENGINE CHILL CONFIRMED // IGNITERS ACTIVE');
          this.particleSystem.emitIgnitionSparks(960, 690, 12);
        } else if (curCountdownSec <= 1) {
          this.overlay.setSubtitle('T-1 // TERMINAL GUIDANCE GO FOR FLIGHT');
        }

        if (this.countdownRemaining <= 0.05) {
          this.setStage(LaunchCinematicStage.IGNITION);
        }
        break;
      }

      case LaunchCinematicStage.IGNITION: {
        // Throttle spools up from 0 to 1
        const spool = Math.min(1.0, this.stageTimer / 1.2);
        this.vehicleThrottle = spool;
        if (this.vehicleNozzleGlow) this.vehicleNozzleGlow(spool);

        if (this.stageTimer >= 1.4) {
          this.setStage(LaunchCinematicStage.EXHAUST_EXPANSION);
        }
        break;
      }

      case LaunchCinematicStage.EXHAUST_EXPANSION:
        this.vehicleThrottle = 1.0;
        if (this.vehicleNozzleGlow) this.vehicleNozzleGlow(1.0);
        this.cameraDirector.addTrauma(0.2);

        if (this.stageTimer >= 1.5) {
          this.setStage(LaunchCinematicStage.CAMERA_RUMBLE);
        }
        break;

      case LaunchCinematicStage.CAMERA_RUMBLE:
        // Hold-down clamp release & swing arms retracting
        this.umbilicalRetraction = Math.min(1.0, this.stageTimer / 1.0);
        this.cameraDirector.addTrauma(0.35);

        if (this.stageTimer >= 1.2) {
          this.setStage(LaunchCinematicStage.LIFTOFF_ASCENT);
        }
        break;

      case LaunchCinematicStage.LIFTOFF_ASCENT:
        this.umbilicalRetraction = 1.0;
        this.missionTimeElapsed += deltaSeconds;

        if (this.stageTimer > 2.0 && this.stageTimer < 2.1) {
          this.overlay.setSubtitle('LIFTOFF // VEHICLE HAS CLEARED THE TOWER');
          this.audioAdapter.playTowerClearCallout();
        }

        // Transonic condensation ring at Max-Q (~3.2s into ascent)
        if (this.stageTimer >= 3.2 && this.stageTimer <= 3.3) {
          this.particleSystem.emitVaporCondensation(960, this.vehicleCurrentY - 80, 50);
          this.overlay.setSubtitle('APPROACHING MAX-Q // TRANSONIC FLIGHT CORRIDOR');
        }

        if (this.stageTimer >= 4.5) {
          this.setStage(LaunchCinematicStage.SKY_TRANSITION);
        }
        break;

      case LaunchCinematicStage.SKY_TRANSITION:
        this.missionTimeElapsed += deltaSeconds;

        if (this.currentAltitudeKm > 30 && this.currentAltitudeKm < 35) {
          this.overlay.setSubtitle('PENETRATING STRATOSPHERE // CONTINUING TO ORBIT');
        }

        if (this.stageTimer >= 4.5) {
          this.setStage(LaunchCinematicStage.SPACE_REACH);
        }
        break;

      case LaunchCinematicStage.SPACE_REACH:
        this.missionTimeElapsed += deltaSeconds;

        if (this.stageTimer > 1.0 && this.stageTimer < 1.1) {
          this.overlay.setSubtitle('KÁRMÁN LINE CROSSED // VEHICLE IN SPACE CORRIDOR');
        }

        if (this.stageTimer >= 2.5) {
          this.setStage(LaunchCinematicStage.MISSION_HANDOFF);
        }
        break;

      case LaunchCinematicStage.MISSION_HANDOFF:
        if (this.stageTimer >= 0.5) {
          this.setStage(LaunchCinematicStage.COMPLETED);
        }
        break;

      case LaunchCinematicStage.COMPLETED:
        // Already completed
        break;
    }
  }

  private setStage(newStage: LaunchCinematicStage): void {
    this.currentStage = newStage;
    this.stageTimer = 0;

    Logger.info('CINEMATIC_LAUNCH_CONTROLLER', `Stage transitioned -> ${newStage}`);

    if (this.onStageChangeCallback) {
      this.onStageChangeCallback(newStage);
    }

    // Stage specific trigger events
    if (newStage === LaunchCinematicStage.CONFIRMATION) {
      this.overlay.setSubtitle('MISSION LAUNCH AUTHORIZATION GRANTED');
    } else if (newStage === LaunchCinematicStage.APPROACH) {
      this.overlay.setSubtitle('CAMERA ALIGNING WITH LAUNCH MOUNT PAD ALPHA');
    } else if (newStage === LaunchCinematicStage.ATMOSPHERE) {
      this.overlay.setSubtitle('CRYO REPRESSURIZATION // RANGE STATUS GO');
    } else if (newStage === LaunchCinematicStage.COUNTDOWN) {
      this.emitEvent(LAUNCH_CINEMATIC_EVENTS.COUNTDOWN_STARTED, {
        missionId: this.activeInput?.missionId ?? '',
        initialSeconds: 10,
        timestamp: Date.now(),
      });
    } else if (newStage === LaunchCinematicStage.IGNITION) {
      this.audioAdapter.playCountdownZero();
      this.audioAdapter.playIgnitionSound();
      this.overlay.setSubtitle('MAIN ENGINE IGNITION SEQUENCE INITIATED');
      this.emitEvent(LAUNCH_CINEMATIC_EVENTS.IGNITION_PRESENTED, {
        missionId: this.activeInput?.missionId ?? '',
        thrusterCount: this.activeInput?.vehicleData.thruster.count ?? 1,
        throttlePercent: 100,
        timestamp: Date.now(),
      });
    } else if (newStage === LaunchCinematicStage.LIFTOFF_ASCENT) {
      this.overlay.setSubtitle('LIFTOFF CONFIRMED // VEHICLE ASCENDING');
      this.emitEvent(LAUNCH_CINEMATIC_EVENTS.ASCENT_PRESENTED, {
        missionId: this.activeInput?.missionId ?? '',
        altitudeKm: this.currentAltitudeKm,
        velocityMps: this.currentVelocityMps,
        timestamp: Date.now(),
      });
    } else if (newStage === LaunchCinematicStage.MISSION_HANDOFF) {
      const handoffPayload = this.createHandoffPayload('SUCCESS_NOMINAL_ASCENT', false);
      this.emitEvent(LAUNCH_CINEMATIC_EVENTS.MISSION_HANDOFF_REQUESTED, handoffPayload);
      if (this.onHandoffCallback) {
        this.onHandoffCallback(handoffPayload);
      }
      if (this.resolveHandoffPromise) {
        this.resolveHandoffPromise(handoffPayload);
      }
    } else if (newStage === LaunchCinematicStage.COMPLETED) {
      this.state = LaunchCinematicState.COMPLETED;
      this.emitEvent(LAUNCH_CINEMATIC_EVENTS.CINEMATIC_COMPLETED, {
        missionId: this.activeInput?.missionId ?? '',
        totalDurationSeconds: this.totalElapsedSeconds,
        timestamp: Date.now(),
      });
      const handoffPayload = this.createHandoffPayload('SUCCESS_NOMINAL_ASCENT', false);
      if (this.onCompleteCallback) {
        this.onCompleteCallback(handoffPayload);
      }
    }
  }

  // =========================================================================
  // VEHICLE PHYSICS & TELEMETRY
  // =========================================================================

  private updateVehiclePhysics(deltaSeconds: number): void {
    const isAscending =
      this.currentStage === LaunchCinematicStage.LIFTOFF_ASCENT ||
      this.currentStage === LaunchCinematicStage.SKY_TRANSITION ||
      this.currentStage === LaunchCinematicStage.SPACE_REACH ||
      this.currentStage === LaunchCinematicStage.MISSION_HANDOFF ||
      this.currentStage === LaunchCinematicStage.COMPLETED;

    if (!isAscending) {
      this.vehicleCurrentY = this.vehicleInitialY;
      this.vehicleContainer.position.y = this.vehicleCurrentY;
      return;
    }

    // Acceleration curve in Gs (1.2G at liftoff ramping to 3.8G as propellant expends)
    const t = this.missionTimeElapsed;
    this.currentAccelG = Math.min(3.8, 1.25 + t * 0.22);

    // Pixel velocity scaling (upward is negative Y in 2D space)
    const accelerationPx = this.currentAccelG * 95; // px/s^2
    this.vehicleVelocityY += accelerationPx * deltaSeconds;
    this.vehicleCurrentY -= this.vehicleVelocityY * deltaSeconds;
    this.vehicleContainer.position.y = this.vehicleCurrentY;

    // Real world physical telemetry calculation
    // Speed: 0 -> ~2800 m/s during cinematic ascent
    this.currentVelocityMps = Math.min(2850, (this.currentAccelG - 1.0) * 9.81 * t * 8.5);

    // Altitude: 0 -> 115 km (Space reach)
    const altitudeFactor = Math.pow(t / 11.5, 2.2);
    this.currentAltitudeKm = Math.min(115.0, altitudeFactor * 115.0);

    // Dynamic Pressure Q (Rises to peak at Max-Q ~35 kPa around 12km, then drops to 0 in vacuum)
    const altRatio = this.currentAltitudeKm / 12.0;
    if (this.currentAltitudeKm <= 12.0) {
      this.currentDynamicPressureKPa = 35.0 * altRatio;
    } else {
      this.currentDynamicPressureKPa = Math.max(0, 35.0 * Math.exp(-(this.currentAltitudeKm - 12.0) / 10.0));
    }
  }

  private calculateTelemetry(): LaunchCinematicTelemetry {
    return {
      stage: this.currentStage,
      countdownSeconds: this.countdownRemaining,
      missionTimeSeconds: this.missionTimeElapsed,
      altitudeKm: this.currentAltitudeKm,
      velocityMps: this.currentVelocityMps,
      accelerationG: this.currentAccelG,
      dynamicPressureKPa: this.currentDynamicPressureKPa,
      throttlePercent: this.vehicleThrottle * 100,
      distanceDownrangeKm: this.currentAltitudeKm * 0.45,
    };
  }

  private createHandoffPayload(
    status: 'SUCCESS_NOMINAL_ASCENT' | 'SKIPPED_TO_ORBITAL_INSERTION',
    wasSkipped: boolean
  ): LaunchHandoffPayload {
    return {
      missionId: this.activeInput?.missionId ?? 'unknown_mission',
      launchSiteId: this.activeInput?.launchSiteId ?? 'FAC_LAUNCH_COMPLEX_PAD_ALPHA',
      timestamp: Date.now(),
      finalTelemetry: this.calculateTelemetry(),
      vehicleData: this.activeInput?.vehicleData ?? LaunchVehicleAdapter.getDefaultVehicleData(),
      environment: this.activeInput?.environment,
      wasSkipped,
      handoffStatus: status,
    };
  }

  private executeHandoffAndComplete(payload: LaunchHandoffPayload): void {
    this.emitEvent(LAUNCH_CINEMATIC_EVENTS.MISSION_HANDOFF_REQUESTED, payload);
    this.emitEvent(LAUNCH_CINEMATIC_EVENTS.CINEMATIC_COMPLETED, {
      missionId: payload.missionId,
      totalDurationSeconds: this.totalElapsedSeconds,
      timestamp: Date.now(),
    });

    if (this.onHandoffCallback) {
      this.onHandoffCallback(payload);
    }
    if (this.onCompleteCallback) {
      this.onCompleteCallback(payload);
    }
    if (this.resolveHandoffPromise) {
      this.resolveHandoffPromise(payload);
    }
  }

  private setupVehicleVisual(input: LaunchCinematicInput): void {
    this.vehicleContainer.removeChildren();

    const visual = LaunchVehicleAdapter.buildVehicleVisual(input.vehicleData);
    this.vehicleContainer.addChild(visual.container);
    this.vehicleNozzleGlow = visual.setThrottleGlow;
    this.vehicleNozzleGlow(0);
  }

  private emitEvent(eventName: string, payload: any): void {
    if (this.eventBus) {
      this.eventBus.emit(eventName as any, payload);
    }
  }

  public destroy(): void {
    this.audioAdapter.destroy();
    this.particleSystem.destroy();
    this.effectsRenderer.destroy();
    this.environmentView.destroy();
    this.cameraDirector.destroy();
    this.overlay.destroy();
    this.stageContainer.destroy({ children: true });
    Logger.info('CINEMATIC_LAUNCH_CONTROLLER', 'Cinematic Launch Controller destroyed.');
  }
}
