import { describe, it, expect } from 'vitest';
import { CameraSystem } from '../../src/camera/CameraSystem';
import { CameraMode, ZoomPreset } from '../../src/camera/CameraMode';
import { SystemId } from '../../src/systems/interfaces/IGameSystem';
import { VirtualResolution } from '../../src/rendering/VirtualResolution';
import { Container } from 'pixi.js';
import { LayerManager } from '../../src/rendering/layers/LayerManager';
import { RenderLayerType } from '../../src/rendering/layers/RenderLayerType';

describe('CameraSystem (Central Camera Architecture & Modes)', () => {
  it('initializes with default PlayerFollow mode, priority 12, and ID SystemId.CAMERA', () => {
    const cam = new CameraSystem();
    expect(cam.id).toBe(SystemId.CAMERA);
    expect(cam.priority).toBe(12);
    expect(cam.getMode()).toBe(CameraMode.PLAYER_FOLLOW);
    expect(cam.getZoom()).toBe(ZoomPreset.NORMAL_EXPLORATION);
  });

  it('supports switching through all 7 required camera modes with appropriate constraints', () => {
    const cam = new CameraSystem();

    const modes = [
      CameraMode.PLAYER_FOLLOW,
      CameraMode.FREE,
      CameraMode.CINEMATIC,
      CameraMode.MISSION_OVERVIEW,
      CameraMode.PLANETARY_EXPLORATION,
      CameraMode.HEADQUARTERS,
      CameraMode.INTERFACE_FOCUSED,
    ];

    for (const mode of modes) {
      cam.setMode(mode);
      expect(cam.getMode()).toBe(mode);
      expect(cam.getModeConfig().mode).toBe(mode);
    }
  });

  it('enforces mode permissions on manual pan and zoom', () => {
    const cam = new CameraSystem();

    // CINEMATIC mode forbids manual pan & zoom
    cam.setMode(CameraMode.CINEMATIC, { defaultZoom: 1.0 }, true);
    expect(cam.getModeConfig().allowManualPan).toBe(false);
    expect(cam.getModeConfig().allowManualZoom).toBe(false);

    const initialPos = { ...cam.getPosition() };
    const initialZoom = cam.getZoom();

    cam.panBy(100, 100);
    cam.zoomBy(1.5);
    cam.update(0.016);

    expect(cam.getPosition().x).toBe(initialPos.x);
    expect(cam.getZoom()).toBe(initialZoom);

    // FREE mode allows manual pan & zoom
    cam.setMode(CameraMode.FREE);
    cam.panBy(100, 100);
    cam.zoomBy(1.5);
    cam.update(1.0);

    expect(cam.getPosition().x).not.toBe(initialPos.x);
    expect(cam.getZoom()).toBeGreaterThan(initialZoom);
  });

  it('supports smooth pan transition with onComplete callback', () => {
    const cam = new CameraSystem();
    cam.setPosition(0, 0, true);

    let completed = false;
    cam.panTo(500, 300, {
      durationSeconds: 0.1,
      onComplete: () => {
        completed = true;
      },
    });

    // Advance halfway
    cam.update(0.05);
    expect(cam.getPosition().x).toBeGreaterThan(0);
    expect(cam.getPosition().x).toBeLessThan(500);
    expect(completed).toBe(false);

    // Advance past completion
    cam.update(0.1);
    expect(cam.getPosition().x).toBe(500);
    expect(cam.getPosition().y).toBe(300);
    expect(completed).toBe(true);
  });

  it('integrates seamlessly with LayerManager for parallax scrolling', () => {
    const root = new Container();
    const layerManager = new LayerManager(root);
    const vr = new VirtualResolution(1920, 1080);
    const cam = new CameraSystem(vr);
    cam.setLayerManager(layerManager);

    cam.setPosition(400, 200, true);
    cam.update(0.016);

    // World layer (parallax 1.0) moves to -400, -200
    const worldLayer = layerManager.getContainer(RenderLayerType.WORLD);
    expect(worldLayer.position.x).toBe(-400);
    expect(worldLayer.position.y).toBe(-200);

    // UI Overlay (screen space) stays at 0, 0
    const uiLayer = layerManager.getContainer(RenderLayerType.UI_OVERLAY);
    expect(uiLayer.position.x).toBe(0);
    expect(uiLayer.position.y).toBe(0);
  });

  it('resets camera to center position and default zoom cleanly', () => {
    const cam = new CameraSystem();
    cam.setPosition(1000, 800, true);
    cam.setZoom(2.5, true);
    cam.shake(20);

    cam.reset(true);
    expect(cam.getPosition().x).toBe(0);
    expect(cam.getPosition().y).toBe(0);
    expect(cam.getZoom()).toBe(ZoomPreset.NORMAL_EXPLORATION);
  });

  it('supports accessibility controls for reduced motion and shake intensity', () => {
    const cam = new CameraSystem();
    cam.setReducedMotion(true);
    cam.shake(50); // High shake requested

    cam.update(0.016);
    const state = cam.getStateView();
    // Offset should be exactly 0 due to reducedMotion
    expect(state.x).toBe(cam.getPosition().x);
    expect(state.y).toBe(cam.getPosition().y);
  });
});
