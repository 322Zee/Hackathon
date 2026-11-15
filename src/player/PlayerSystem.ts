/**
 * INTERSTELLAR CONTINUUM - Central Player System
 * Lifecycle management, state querying, and system registration for playable character
 */

import { IGameSystem, SystemId } from '../systems/interfaces/IGameSystem';
import { IPlayerSystem } from '../systems/interfaces/CoreSystemInterfaces';
import { PlayerCharacter, FacingDirection } from './PlayerCharacter';
import { PlayerController } from './PlayerController';
import { Logger } from '../core/logging/Logger';

export interface PlayerSystemConfig {
  controller?: PlayerController;
  character?: PlayerCharacter;
}

export class PlayerSystem implements IPlayerSystem, IGameSystem {
  public readonly id = SystemId.PLAYER;
  public readonly priority = 13; // Runs after input (10), collision (11), camera (12)

  private controller?: PlayerController;
  private character?: PlayerCharacter;

  constructor(config?: PlayerSystemConfig) {
    this.controller = config?.controller;
    this.character = config?.character;
  }

  public setController(controller: PlayerController): void {
    this.controller = controller;
    this.character = controller.character;
  }

  public getController(): PlayerController | undefined {
    return this.controller;
  }

  public getCharacter(): PlayerCharacter | undefined {
    return this.character;
  }

  public initialize(): void {
    Logger.info('PLAYER_SYSTEM', 'Player System initialized.');
  }

  public update(deltaSeconds: number): void {
    if (this.controller) {
      this.controller.update(deltaSeconds);
    }
  }

  public shutdown(): void {
    this.controller = undefined;
    this.character = undefined;
    Logger.info('PLAYER_SYSTEM', 'Player System shut down.');
  }

  // ==================== IPlayerSystem Interface ====================

  public getPlayerPosition(): { x: number; y: number; heading: number } {
    if (!this.character) {
      return { x: 0, y: 0, heading: 0 };
    }
    const facing = this.character.getFacing();
    let heading = 0;
    switch (facing) {
      case FacingDirection.NORTH:
        heading = -Math.PI / 2;
        break;
      case FacingDirection.SOUTH:
        heading = Math.PI / 2;
        break;
      case FacingDirection.EAST:
        heading = 0;
        break;
      case FacingDirection.WEST:
        heading = Math.PI;
        break;
    }
    return {
      x: this.character.x,
      y: this.character.y,
      heading,
    };
  }

  public setPlayerPosition(x: number, y: number, _heading?: number): void {
    if (this.character) {
      this.character.updatePosition(x, y);
    }
  }

  public isPlayerControllable(): boolean {
    return this.controller ? this.controller.isControllable() : false;
  }

  public setPlayerControllable(controllable: boolean): void {
    if (this.controller) {
      this.controller.setControllable(controllable);
    }
  }
}
