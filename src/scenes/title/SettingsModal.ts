/**
 * INTERSTELLAR CONTINUUM - Settings Modal Interface Architecture
 * Unifies Title Screen settings with the authoritative SettingsView component.
 */

import { Container } from 'pixi.js';
import { ConfigManager } from '../../configuration/ConfigManager';
import { AudioService } from '../../audio/AudioService';
import { SettingsView } from '../../ui/settings/SettingsView';

export class SettingsModal {
  public readonly container: Container;
  private isVisible: boolean = false;
  private settingsView?: SettingsView;
  private onCloseCallback?: () => void;

  constructor(_configManager?: ConfigManager, _audioService?: AudioService) {
    this.container = new Container();
    this.container.label = 'SettingsModal';
    this.container.visible = false;
  }

  public setServices(_configManager?: ConfigManager, _audioService?: AudioService): void {
    // Kept for backward compatibility
  }

  public show(onClose?: () => void): void {
    this.onCloseCallback = onClose;
    this.isVisible = true;
    this.container.visible = true;

    if (this.settingsView) {
      this.container.removeChild(this.settingsView.container);
      this.settingsView.destroy();
    }

    this.settingsView = new SettingsView({
      width: 840,
      height: 620,
      onClose: () => {
        this.hide();
      },
    });
    this.settingsView.container.position.set((1920 - 840) / 2, (1080 - 620) / 2);
    this.container.addChild(this.settingsView.container);
  }

  public hide(): void {
    if (!this.isVisible) return;
    this.isVisible = false;
    this.container.visible = false;

    if (this.settingsView) {
      this.container.removeChild(this.settingsView.container);
      this.settingsView.destroy();
      this.settingsView = undefined;
    }

    if (this.onCloseCallback) {
      this.onCloseCallback();
    }
  }

  public isOpen(): boolean {
    return this.isVisible;
  }

  public destroy(): void {
    this.hide();
    this.container.destroy({ children: true });
  }
}
