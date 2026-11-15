/**
 * INTERSTELLAR CONTINUUM - Global In-Game HUD System
 * Primary user-interface overlay integrating organisation badges, location detection,
 * real-time resources, contextual interaction prompt, minimap, and notifications.
 */

import { UIComponent } from '../core/UIComponent';
import { UI_SPACING } from '../core/UIDesignTokens';
import { OrganisationBadgeHUD } from './OrganisationBadgeHUD';
import { ResourcesDisplayHUD } from './ResourcesDisplayHUD';
import { InteractionPromptHUD } from './InteractionPromptHUD';
import { CampusMinimap } from './CampusMinimap';
import { UIButton } from '../components/UIButton';
import { NotificationManager } from '../notifications/NotificationManager';
import { TooltipManager } from '../tooltips/TooltipManager';
import { EventBus } from '../../core/EventBus';
import { GameStateManager } from '../../state/GameStateManager';
import { InteractionSystem } from '../../interaction/InteractionSystem';
import { ServiceLocator } from '../../core/ServiceLocator';
import { Logger } from '../../core/logging/Logger';

export interface GlobalHUDOptions {
  eventBus?: EventBus;
  gameStateManager?: GameStateManager;
  interactionSystem?: InteractionSystem;
  onOpenMenu?: () => void;
}

export class GlobalHUD extends UIComponent {
  public readonly organisationBadge: OrganisationBadgeHUD;
  public readonly resourcesDisplay: ResourcesDisplayHUD;
  public readonly interactionPrompt: InteractionPromptHUD;
  public readonly minimap: CampusMinimap;
  public readonly notificationManager: NotificationManager;
  public readonly tooltipManager: TooltipManager;

  private menuButton: UIButton;
  private minimapToggleBtn: UIButton;

  private eventBus?: EventBus;
  private gameStateManager?: GameStateManager;
  private interactionSystem?: InteractionSystem;
  private onOpenMenuCallback?: () => void;

  private currentLocationName: string = 'EARTH HEADQUARTERS';
  private currentDistrictName: string = 'CENTRAL PLAZA';

  constructor(options: GlobalHUDOptions = {}) {
    super('GlobalHUD');

    this.eventBus = options.eventBus ?? (ServiceLocator.has('EventBus') ? ServiceLocator.get<EventBus>('EventBus') : undefined);
    this.gameStateManager = options.gameStateManager ?? (ServiceLocator.has('GameStateManager') ? ServiceLocator.get<GameStateManager>('GameStateManager') : undefined);
    this.interactionSystem = options.interactionSystem ?? (ServiceLocator.has('InteractionSystem') ? ServiceLocator.get<InteractionSystem>('InteractionSystem') : undefined);
    this.onOpenMenuCallback = options.onOpenMenu;

    // 1. Top-Left: Organisation Badge & Telemetry
    this.organisationBadge = new OrganisationBadgeHUD(UI_SPACING.SAFE_MARGIN, UI_SPACING.SAFE_MARGIN);
    this.container.addChild(this.organisationBadge.container);

    // 2. Top-Center: Live Resources Display
    this.resourcesDisplay = new ResourcesDisplayHUD(680, UI_SPACING.SAFE_MARGIN);
    this.container.addChild(this.resourcesDisplay.container);

    // 3. Top-Right: Operational Menu Button
    this.menuButton = new UIButton({
      label: 'MENU',
      shortcut: 'ESC',
      variant: 'OUTLINE',
      width: 110,
      height: 34,
      onClick: () => {
        if (this.onOpenMenuCallback) this.onOpenMenuCallback();
      },
    });
    this.menuButton.container.position.set(1786, UI_SPACING.SAFE_MARGIN);
    this.container.addChild(this.menuButton.container);

    // 4. Bottom-Center: Contextual Interaction Prompt
    this.interactionPrompt = new InteractionPromptHUD();
    this.container.addChild(this.interactionPrompt.container);

    // 5. Bottom-Right: Campus Minimap
    this.minimap = new CampusMinimap(1656, 860);
    this.container.addChild(this.minimap.container);

    // Minimap Toggle Pill
    this.minimapToggleBtn = new UIButton({
      label: 'MAP',
      shortcut: 'M',
      variant: 'GHOST',
      width: 80,
      height: 24,
      onClick: () => {
        this.minimap.toggleCollapse();
      },
    });
    this.minimapToggleBtn.container.position.set(1816, 830);
    this.container.addChild(this.minimapToggleBtn.container);

    // 6. Top-Right Notifications Stack
    this.notificationManager = new NotificationManager(this.eventBus);
    this.container.addChild(this.notificationManager.container);

    // 7. Tooltips Overlay
    this.tooltipManager = new TooltipManager(this.container);

    this.subscribeInteractions();
    this.syncGameState();

    Logger.info('GLOBAL_HUD', 'Global In-Game HUD initialized successfully.');
  }

  private subscribeInteractions(): void {
    if (this.interactionSystem) {
      // Connect contextual prompt to interaction target updates
      const currentTarget = this.interactionSystem.getActiveTarget();
      if (currentTarget) {
        this.interactionPrompt.setTarget(currentTarget);
      }
    }

    if (this.eventBus) {
      this.eventBus.on('interaction:target-changed', ({ currentTarget }) => {
        this.interactionPrompt.setTarget(currentTarget ?? null);
      });

      this.eventBus.on('economy:credits_changed', () => this.syncGameState());
      this.eventBus.on('economy:research_changed', () => this.syncGameState());
    }
  }

  public syncGameState(): void {
    if (!this.gameStateManager) return;

    const state = this.gameStateManager.getState();

    // Organisation & Director credentials
    const org = state.organisation;
    const activeMission = (state as any).activeMission ?? state.mission;
    const mission = activeMission?.missionId ? activeMission : undefined;

    this.organisationBadge.updateData({
      agencyName: org.agencyName || 'ASTRA CONTINUUM',
      rank: org.rank || 1,
      rankTitle: org.rankTitle || 'Suborbital Pioneer',
      locationName: `${this.currentLocationName} // ${this.currentDistrictName}`,
      playerStatus: 'ACTIVE // ON-STATION',
      activeMissionTitle: mission?.title,
      activeMissionObjective: mission?.phase,
    });

    // Strategic Resources
    const res = state.resources;
    this.resourcesDisplay.updateResources({
      credits: res.credits,
      researchData: res.researchData,
      rawMaterials: res.rawMaterials,
      technologyPoints: res.technologyPoints,
    });
  }

  public setMenuCallback(cb: () => void): void {
    this.onOpenMenuCallback = cb;
  }

  public setLocation(locationName: string, districtName?: string): void {
    this.currentLocationName = locationName;
    if (districtName) {
      this.currentDistrictName = districtName;
    }
    this.syncGameState();
  }

  public updatePlayerTelemetry(
    x: number,
    y: number,
    vx: number,
    vy: number,
    facing: string,
    state: string,
    cameraView?: { x: number; y: number; width: number; height: number }
  ): void {
    const speed = Math.round(Math.hypot(vx, vy));
    const statusText = `${state.toUpperCase()} // ${speed} px/s [${facing.toUpperCase()}]`;

    // Calculate heading degrees from facing string
    let heading = 0;
    switch (facing.toUpperCase()) {
      case 'NORTH':
        heading = 270;
        break;
      case 'SOUTH':
        heading = 90;
        break;
      case 'EAST':
        heading = 0;
        break;
      case 'WEST':
        heading = 180;
        break;
      case 'NORTH_EAST':
        heading = 315;
        break;
      case 'NORTH_WEST':
        heading = 225;
        break;
      case 'SOUTH_EAST':
        heading = 45;
        break;
      case 'SOUTH_WEST':
        heading = 135;
        break;
    }

    // Determine district from coordinates on Earth campus
    const district = this.getDistrictFromCoordinates(x, y);
    if (district !== this.currentDistrictName) {
      this.currentDistrictName = district;
      this.syncGameState();
    }

    // Update minimap blip and radar position
    this.minimap.updatePlayer(x, y, heading, district, cameraView);

    // Update status line on badge
    if (this.gameStateManager) {
      const state = this.gameStateManager.getState();
      const org = state.organisation;
      const activeMission = (state as any).activeMission ?? state.mission;
      const mission = activeMission?.missionId
        ? activeMission
        : undefined;

      this.organisationBadge.updateData({
        agencyName: org.agencyName || 'ASTRA CONTINUUM',
        rank: org.rank || 1,
        rankTitle: org.rankTitle || 'Suborbital Pioneer',
        locationName: `${this.currentLocationName} // ${this.currentDistrictName}`,
        playerStatus: statusText,
        activeMissionTitle: mission?.title,
        activeMissionObjective: mission?.phase,
      });
    }
  }

  private getDistrictFromCoordinates(x: number, y: number): string {
    if (x > 2500 && y > 1500) return 'PAD ALPHA LAUNCH COMPLEX';
    if (x > 2400 && y >= 800 && y <= 1450) return 'ROCKET ENGINEERING (VAB)';
    if (x > 1400 && x < 2200 && y >= 950 && y <= 1450) return 'CENTRAL PLAZA';
    if (x > 1400 && x < 2200 && y > 1600) return 'MISSION OPERATIONS (MOC)';
    if (y < 800) return 'NORTH SCIENCE QUAD';
    if (x < 1000 && y > 1600) return 'ROBOTICS & DSN ARRAY';
    if (x < 1000) return 'ARRIVAL & SECURITY GATE';
    return 'CAMPUS PROMENADE';
  }

  public override update(deltaSeconds: number): void {
    super.update(deltaSeconds);
    this.notificationManager.update(deltaSeconds);
    this.tooltipManager.update(deltaSeconds);
    this.minimap.update(deltaSeconds);
    this.interactionPrompt.update(deltaSeconds);
  }
}
