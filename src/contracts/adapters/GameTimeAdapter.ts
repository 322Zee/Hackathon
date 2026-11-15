/**
 * INTERSTELLAR CONTINUUM - Contracts Game-Time Adapter
 * Bridges contract countdowns, deadlines, and timestamping to GameTimeSystem.
 */

import { GameTimeSystem } from '../../simulation/GameTimeSystem';

export class ContractsGameTimeAdapter {
  private gameTimeSystem?: GameTimeSystem;
  private fallbackElapsedSeconds: number = 0;

  constructor(gameTimeSystem?: GameTimeSystem) {
    this.gameTimeSystem = gameTimeSystem;
  }

  public setGameTimeSystem(gameTimeSystem?: GameTimeSystem): void {
    this.gameTimeSystem = gameTimeSystem;
  }

  public getElapsedGameSeconds(): number {
    if (this.gameTimeSystem) {
      return this.gameTimeSystem.getElapsedGameTimeSeconds();
    }
    return this.fallbackElapsedSeconds;
  }

  public advanceFallbackTime(seconds: number): void {
    if (seconds > 0) {
      this.fallbackElapsedSeconds += seconds;
    }
  }

  public formatDuration(seconds: number): string {
    if (seconds < 0) seconds = 0;
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
