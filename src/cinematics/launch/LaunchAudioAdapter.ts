/**
 * INTERSTELLAR CONTINUUM - Launch Audio Presentation Adapter
 * Isolated audio bridge connecting the cinematic launch sequencer with AudioService,
 * featuring countdown audio cues, engine ignition boom, sustained low-frequency
 * ascent rumble, pad ambience, and procedural Web Audio API synthesizers when
 * sound files are missing from cache.
 */

import { AudioService } from '../../audio/AudioService';

export const LAUNCH_AUDIO_KEYS = {
  COUNTDOWN_TICK: 'sfx_launch_countdown_tick',
  COUNTDOWN_ZERO: 'sfx_launch_countdown_zero',
  IGNITION: 'sfx_launch_ignition',
  ENGINE_ROAR: 'sfx_launch_engine_roar',
  PAD_AMBIENCE: 'ambience_launch_complex',
  LOW_FREQ_RUMBLE: 'sfx_launch_sub_rumble',
  TOWER_CLEAR: 'sfx_launch_tower_clear',
} as const;

export interface LaunchAudioAdapterOptions {
  audioService?: AudioService;
  muted?: boolean;
  volume?: number;
}

export class LaunchAudioAdapter {
  private audioService?: AudioService;
  private muted: boolean;
  private volume: number;

  // Web Audio procedural synthesizer state
  private webAudioCtx?: AudioContext;
  private rumbleGain?: GainNode;
  private rumbleOsc?: OscillatorNode;
  private isRumbleActive: boolean = false;

  constructor(options: LaunchAudioAdapterOptions = {}) {
    this.audioService = options.audioService;
    this.muted = options.muted ?? false;
    this.volume = options.volume ?? 1.0;

    this.initWebAudio();
  }

  private initWebAudio(): void {
    if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        this.webAudioCtx = new AudioCtxClass();
      } catch (err) {
        // Handled silently for security/sandboxed environments
      }
    }
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.rumbleGain && this.webAudioCtx) {
      this.rumbleGain.gain.setValueAtTime(muted ? 0 : this.volume * 0.4, this.webAudioCtx.currentTime);
    }
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.rumbleGain && this.webAudioCtx && !this.muted) {
      this.rumbleGain.gain.setValueAtTime(this.volume * 0.4, this.webAudioCtx.currentTime);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Countdown audio cue (T-10 to T-1)
   */
  public playCountdownTick(remainingSeconds: number): void {
    if (this.muted) return;

    if (this.audioService) {
      this.audioService.playSfx(LAUNCH_AUDIO_KEYS.COUNTDOWN_TICK, this.volume);
    }

    // Procedural synthesized beep fallback (880Hz crisp electronic tone, higher pitch at T-1)
    const freq = remainingSeconds === 1 ? 980 : 880;
    this.synthTone(freq, 0.08, 0.15 * this.volume);
  }

  /**
   * Countdown zero commit chime (T-0)
   */
  public playCountdownZero(): void {
    if (this.muted) return;

    if (this.audioService) {
      this.audioService.playSfx(LAUNCH_AUDIO_KEYS.COUNTDOWN_ZERO, this.volume);
    }

    // High affirmative commitment chime (1760Hz)
    this.synthTone(1760, 0.35, 0.25 * this.volume);
  }

  /**
   * Engine ignition transient event
   */
  public playIgnitionSound(): void {
    if (this.muted) return;

    if (this.audioService) {
      this.audioService.playSfx(LAUNCH_AUDIO_KEYS.IGNITION, this.volume);
      this.audioService.playSfx(LAUNCH_AUDIO_KEYS.ENGINE_ROAR, this.volume * 0.8);
    }

    // Deep sub-bass ignition impact thump (70Hz swept down to 30Hz)
    this.synthIgnitionThump();
    this.startRumble(0.6);
  }

  /**
   * Continuous low-frequency cinematic engine roar tracking vehicle throttle
   */
  public setPlumeRoarThrottle(throttle: number): void {
    if (this.muted) return;

    if (throttle > 0.05 && !this.isRumbleActive) {
      this.startRumble(throttle);
    } else if (throttle <= 0.01 && this.isRumbleActive) {
      this.stopRumble();
    } else if (this.isRumbleActive && this.rumbleGain && this.webAudioCtx) {
      const targetGain = this.volume * throttle * 0.35;
      this.rumbleGain.gain.setTargetAtTime(targetGain, this.webAudioCtx.currentTime, 0.1);
    }
  }

  /**
   * Pad environmental ambience (ambient coastal breeze and distant gantry hum)
   */
  public startLaunchAmbience(): void {
    if (this.muted) return;
    if (this.audioService) {
      this.audioService.playSfx(LAUNCH_AUDIO_KEYS.PAD_AMBIENCE, this.volume * 0.5);
    }
  }

  /**
   * Tower clearance notification audio
   */
  public playTowerClearCallout(): void {
    if (this.muted) return;
    if (this.audioService) {
      this.audioService.playSfx(LAUNCH_AUDIO_KEYS.TOWER_CLEAR, this.volume);
    }
  }

  // =========================================================================
  // Web Audio API Procedural Synthesizers (Guarantees Sound Without Assets)
  // =========================================================================

  private synthTone(frequency: number, durationSeconds: number, gainLevel: number): void {
    if (!this.webAudioCtx || this.muted) return;
    try {
      const now = this.webAudioCtx.currentTime;
      const osc = this.webAudioCtx.createOscillator();
      const gain = this.webAudioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, now);

      gain.gain.setValueAtTime(gainLevel, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

      osc.connect(gain);
      gain.connect(this.webAudioCtx.destination);

      osc.start(now);
      osc.stop(now + durationSeconds);
    } catch (e) {
      // Ignored in restricted environments
    }
  }

  private synthIgnitionThump(): void {
    if (!this.webAudioCtx || this.muted) return;
    try {
      const now = this.webAudioCtx.currentTime;
      const osc = this.webAudioCtx.createOscillator();
      const gain = this.webAudioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(85, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.6);

      gain.gain.setValueAtTime(this.volume * 0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

      osc.connect(gain);
      gain.connect(this.webAudioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.75);
    } catch (e) {}
  }

  private startRumble(initialThrottle: number): void {
    if (!this.webAudioCtx || this.isRumbleActive) return;
    try {
      const now = this.webAudioCtx.currentTime;

      // Low frequency sub-rumble oscillator
      this.rumbleOsc = this.webAudioCtx.createOscillator();
      this.rumbleOsc.type = 'sawtooth';
      this.rumbleOsc.frequency.setValueAtTime(42, now);

      // Low-pass filter for deep muffled thunder
      const filter = this.webAudioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, now);

      this.rumbleGain = this.webAudioCtx.createGain();
      const targetGain = this.muted ? 0 : this.volume * initialThrottle * 0.35;
      this.rumbleGain.gain.setValueAtTime(0.001, now);
      this.rumbleGain.gain.linearRampToValueAtTime(targetGain, now + 0.4);

      this.rumbleOsc.connect(filter);
      filter.connect(this.rumbleGain);
      this.rumbleGain.connect(this.webAudioCtx.destination);

      this.rumbleOsc.start(now);
      this.isRumbleActive = true;
    } catch (e) {}
  }

  private stopRumble(): void {
    if (!this.isRumbleActive) return;
    try {
      if (this.rumbleGain && this.webAudioCtx && this.rumbleOsc) {
        const now = this.webAudioCtx.currentTime;
        this.rumbleGain.gain.linearRampToValueAtTime(0.0001, now + 0.3);
        const osc = this.rumbleOsc;
        setTimeout(() => {
          try {
            osc.stop();
            osc.disconnect();
          } catch (e) {}
        }, 350);
      }
    } catch (e) {}
    this.isRumbleActive = false;
  }

  public stopAll(): void {
    this.stopRumble();
  }

  public destroy(): void {
    this.stopAll();
    if (this.webAudioCtx && this.webAudioCtx.state !== 'closed') {
      try {
        this.webAudioCtx.close();
      } catch (e) {}
    }
  }
}
