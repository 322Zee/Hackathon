/**
 * INTERSTELLAR CONTINUUM - Cinematic Launch View
 * High-level visual presentation component hosting the launch cinematic sequence.
 * Can be displayed full-screen over the gameplay canvas or inside facility observation viewports.
 */

import { Container } from 'pixi.js';
import { EventBus } from '../../core/EventBus';
import {
  LaunchCinematicInput,
  LaunchHandoffPayload,
  CinematicLaunchSettings,
} from './LaunchCinematicTypes';
import { CinematicLaunchController } from './CinematicLaunchController';
import { LaunchAudioAdapter } from './LaunchAudioAdapter';

export interface CinematicLaunchViewOptions {
  eventBus?: EventBus;
  audioAdapter?: LaunchAudioAdapter;
  settings?: Partial<CinematicLaunchSettings>;
  onComplete?: (handoff: LaunchHandoffPayload) => void;
  onHandoff?: (handoff: LaunchHandoffPayload) => void;
  onClose?: () => void;
}

export class CinematicLaunchView {
  public readonly container: Container;

  private controller: CinematicLaunchController;
  private isVisible: boolean = false;
  private options: CinematicLaunchViewOptions;

  constructor(options: CinematicLaunchViewOptions = {}) {
    this.options = options;
    this.container = new Container();
    this.container.label = 'CinematicLaunchView';
    this.container.visible = false;
    this.container.zIndex = 3000;

    this.controller = new CinematicLaunchController({
      eventBus: options.eventBus,
      audioAdapter: options.audioAdapter,
      settings: options.settings,
      onComplete: (handoff) => {
        if (this.options.onComplete) {
          this.options.onComplete(handoff);
        }
      },
      onHandoff: (handoff) => {
        if (this.options.onHandoff) {
          this.options.onHandoff(handoff);
        }
      },
    });

    this.container.addChild(this.controller.stageContainer);
  }

  public getController(): CinematicLaunchController {
    return this.controller;
  }

  public show(input: LaunchCinematicInput): Promise<LaunchHandoffPayload> {
    this.isVisible = true;
    this.container.visible = true;
    return this.controller.start(input);
  }

  public hide(): void {
    this.isVisible = false;
    this.container.visible = false;
    if (this.options.onClose) {
      this.options.onClose();
    }
  }

  public skip(): void {
    this.controller.skip();
  }

  public abort(): boolean {
    return this.controller.abort();
  }

  public tick(deltaSeconds: number): void {
    if (this.isVisible) {
      this.controller.update(deltaSeconds);
    }
  }

  public destroy(): void {
    this.controller.destroy();
    this.container.destroy({ children: true });
  }
}
