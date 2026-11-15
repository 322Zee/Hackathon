import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GlobalHUD } from '../../src/ui/hud/GlobalHUD';
import { EventBus } from '../../src/core/EventBus';
import { GameStateManager } from '../../src/state/GameStateManager';
import { ServiceLocator } from '../../src/core/ServiceLocator';
import { IInteractiveObject, InteractionCategory } from '../../src/interaction/InteractionTypes';

describe('Global In-Game HUD System (GlobalHUD)', () => {
  let eventBus: EventBus;
  let gameStateManager: GameStateManager;
  let hud: GlobalHUD;
  let menuCallback: () => void;

  beforeEach(() => {
    ServiceLocator.reset();
    eventBus = new EventBus();
    ServiceLocator.register('EventBus', eventBus);

    gameStateManager = new GameStateManager(eventBus);
    ServiceLocator.register('GameStateManager', gameStateManager);

    menuCallback = vi.fn();
    hud = new GlobalHUD({
      eventBus,
      gameStateManager,
      onOpenMenu: menuCallback,
    });
  });

  afterEach(() => {
    hud.destroy();
    ServiceLocator.reset();
  });

  it('initializes all HUD subsystems and mounts them to the master container', () => {
    expect(hud.container).toBeDefined();
    expect(hud.organisationBadge).toBeDefined();
    expect(hud.resourcesDisplay).toBeDefined();
    expect(hud.interactionPrompt).toBeDefined();
    expect(hud.minimap).toBeDefined();
    expect(hud.notificationManager).toBeDefined();
    expect(hud.tooltipManager).toBeDefined();
  });

  it('data-binds organisation badge and credentials strictly from GameStateManager', () => {
    expect(hud.organisationBadge.getAgencyName()).toBe('ASTRA CONTINUUM PROJECT');
    expect(hud.organisationBadge.getLocationText()).toContain('EARTH HEADQUARTERS');

    // By default, no mission is active: mission objective must be hidden (no fabricated data)
    expect(hud.organisationBadge.isMissionVisible()).toBe(false);

    // Start a real active mission in GameStateManager
    gameStateManager.startMission('MIS-001', 'SUB-1', 'Suborbital Sounding Probe');

    hud.syncGameState();
    expect(hud.organisationBadge.isMissionVisible()).toBe(true);
  });

  it('data-binds strategic resources strictly from GameStateManager', () => {
    // Initial resources from createInitialGameState: credits 500,000, RD 50, RM 100, TP 0
    expect(hud.resourcesDisplay.getCreditsText()).toBe('$500,000');
    expect(hud.resourcesDisplay.getResearchText()).toBe('50 RD');
    expect(hud.resourcesDisplay.getMaterialsText()).toBe('100 T');
    expect(hud.resourcesDisplay.getTechPointsText()).toBe('0 TP');

    // Modify resources via GameStateManager mutator
    gameStateManager.adjustCredits(150000, 'Mission contract bonus');
    gameStateManager.grantResources({ researchData: 35 }, 'Atmospheric telemetry');

    hud.syncGameState();
    expect(hud.resourcesDisplay.getCreditsText()).toBe('$650,000');
    expect(hud.resourcesDisplay.getResearchText()).toBe('85 RD');
  });

  it('updates contextual interaction prompt when target changes via EventBus', () => {
    const mockTarget: IInteractiveObject = {
      id: 'LC_ZONE_LAUNCHPAD',
      displayName: 'Pad Alpha Mount',
      description: 'Primary launch pad structure',
      actionText: 'LAUNCH',
      category: InteractionCategory.LAUNCH_INFRASTRUCTURE,
      x: 2850,
      y: 1850,
      interactionRadius: 100,
      priority: 10,
      enabled: true,
      cooldownSeconds: 0,
      requirements: [],
      canInteract: () => ({ available: true }),
      onInteract: async () => ({ success: true, action: 'TRIGGER_ACTION' }),
      getWorldPosition: () => ({ x: 2850, y: 1850 }),
      isOnCooldown: () => false,
      getRemainingCooldown: () => 0,
      triggerCooldown: () => {},
      update: () => {},
    };

    // Initially prompt should be hidden (no active target)
    expect(hud.interactionPrompt.isVisible()).toBe(false);

    // Target acquired
    eventBus.emit('interaction:target-changed', {
      previousTarget: null,
      currentTarget: mockTarget,
    });

    expect(hud.interactionPrompt.isVisible()).toBe(true);
    expect(hud.interactionPrompt.getActionText()).toBe('LAUNCH');
    expect(hud.interactionPrompt.getTargetNameText()).toBe('PAD ALPHA MOUNT');

    // Target cleared
    eventBus.emit('interaction:target-changed', {
      previousTarget: mockTarget,
      currentTarget: null,
    });

    expect(hud.interactionPrompt.isVisible()).toBe(false);
  });

  it('updates campus telemetry, player position, and camera frustum on minimap', () => {
    hud.setLocation('EARTH HEADQUARTERS', 'PAD ALPHA LAUNCH COMPLEX');
    expect(hud.organisationBadge.getLocationText()).toContain('PAD ALPHA LAUNCH COMPLEX');

    hud.updatePlayerTelemetry(2850, 1850, 120, 0, 'EAST', 'WALKING', {
      x: 2850,
      y: 1850,
      width: 1920,
      height: 1080,
    });

    expect(hud.minimap.isMinimapCollapsed()).toBe(false);

    // Toggle collapse
    hud.minimap.toggleCollapse();
    expect(hud.minimap.isMinimapCollapsed()).toBe(true);
  });

  it('executes menu callback when operational menu button is triggered', () => {
    const menuBtn = (hud as any).menuButton;
    expect(menuBtn).toBeDefined();

    menuBtn.container.emit('pointertap' as any, { stopPropagation: () => {} });
    expect(menuCallback).toHaveBeenCalledTimes(1);
  });
});
