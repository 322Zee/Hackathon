import { Howl, Howler } from 'howler';
import { AudioConfig } from '../configuration/GameConfig';
import { Logger } from '../core/logging/Logger';
import { EventBus } from '../core/EventBus';

export type AudioChannel = 'master' | 'music' | 'sfx' | 'ui' | 'ambience' | 'dialogue';

export class AudioService {
  private config: AudioConfig;
  private currentMusic: Howl | null = null;
  private currentAmbience: Howl | null = null;
  private soundCache: Map<string, Howl> = new Map();
  private isAudioUnlocked: boolean = false;

  constructor(config: AudioConfig, eventBus?: EventBus) {
    this.config = { ...config };
    this.applyVolumes();
    this.setupUnlockListeners();

    if (eventBus) {
      eventBus.on('config:changed', ({ category, config: newConfig }) => {
        if (category === 'audio' || category === 'all') {
          this.updateConfig(newConfig.audio);
        }
      });
    }
  }

  public updateConfig(newConfig: AudioConfig): void {
    this.config = { ...newConfig };
    this.applyVolumes();
  }

  public setChannelVolume(channel: AudioChannel, volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    switch (channel) {
      case 'master':
        this.config.masterVolume = clamped;
        break;
      case 'music':
        this.config.musicVolume = clamped;
        break;
      case 'sfx':
        this.config.sfxVolume = clamped;
        break;
      case 'ui':
        this.config.uiVolume = clamped;
        break;
      case 'ambience':
        this.config.ambienceVolume = clamped;
        break;
      case 'dialogue':
        this.config.dialogueVolume = clamped;
        break;
    }
    this.applyVolumes();
  }

  public setMuted(muted: boolean): void {
    this.config.muted = muted;
    Howler.mute(muted);
    Logger.info('AUDIO', `Audio mute state set to: ${muted}`);
  }

  public isMuted(): boolean {
    return this.config.muted;
  }

  public getChannelVolume(channel: AudioChannel): number {
    switch (channel) {
      case 'master':
        return this.config.masterVolume;
      case 'music':
        return this.config.musicVolume;
      case 'sfx':
        return this.config.sfxVolume;
      case 'ui':
        return this.config.uiVolume;
      case 'ambience':
        return this.config.ambienceVolume;
      case 'dialogue':
        return this.config.dialogueVolume ?? 0.9;
    }
  }

  public playMusic(key: string, loop: boolean = true, fadeDurationMs: number = 1000): void {
    if (this.currentMusic) {
      this.currentMusic.fade(this.currentMusic.volume(), 0, fadeDurationMs);
      const prev = this.currentMusic;
      setTimeout(() => prev.stop(), fadeDurationMs);
    }

    const sound = this.soundCache.get(key);
    if (!sound) {
      Logger.debug('AUDIO', `Music track "${key}" not loaded in cache.`);
      return;
    }

    this.currentMusic = sound;
    sound.loop(loop);
    sound.volume(0);
    sound.play();
    sound.fade(0, this.config.masterVolume * this.config.musicVolume, fadeDurationMs);
  }

  public stopMusic(fadeDurationMs: number = 1000): void {
    if (this.currentMusic) {
      this.currentMusic.fade(this.currentMusic.volume(), 0, fadeDurationMs);
      const prev = this.currentMusic;
      setTimeout(() => {
        prev.stop();
        if (this.currentMusic === prev) {
          this.currentMusic = null;
        }
      }, fadeDurationMs);
    }
  }

  public playSfx(key: string, volumeScale: number = 1.0): void {
    const sound = this.soundCache.get(key);
    if (sound) {
      const vol = this.config.masterVolume * this.config.sfxVolume * volumeScale;
      sound.volume(vol);
      sound.play();
    }
  }

  public playUi(key: string): void {
    const sound = this.soundCache.get(key);
    if (sound) {
      sound.volume(this.config.masterVolume * this.config.uiVolume);
      sound.play();
    }
  }

  public registerSound(key: string, howl: Howl): void {
    this.soundCache.set(key, howl);
  }

  private applyVolumes(): void {
    Howler.volume(this.config.masterVolume);
    Howler.mute(this.config.muted);

    if (this.currentMusic) {
      this.currentMusic.volume(this.config.masterVolume * this.config.musicVolume);
    }
    if (this.currentAmbience) {
      this.currentAmbience.volume(this.config.masterVolume * this.config.ambienceVolume);
    }
  }

  private setupUnlockListeners(): void {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      if (!this.isAudioUnlocked) {
        if (Howler.ctx && Howler.ctx.state === 'suspended') {
          Howler.ctx.resume().then(() => {
            this.isAudioUnlocked = true;
            Logger.info('AUDIO', 'AudioContext unlocked by user interaction.');
          });
        } else {
          this.isAudioUnlocked = true;
        }
      }
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
  }
}
