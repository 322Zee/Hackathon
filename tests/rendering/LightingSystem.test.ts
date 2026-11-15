import { describe, it, expect } from 'vitest';
import { Container } from 'pixi.js';
import { LightingSystem } from '../../src/rendering/lighting/LightingSystem';
import { LightType, FalloffType } from '../../src/rendering/lighting/LightTypes';
import { LIGHTING_PRESETS } from '../../src/rendering/lighting/LightingPresets';

describe('LightingSystem (2D Dynamic Lightmap)', () => {
  it('initializes with default ambient darkness and creates ambient overlay', () => {
    const layer = new Container();
    const lighting = new LightingSystem(layer, 1920, 1080);

    expect(lighting.getEnabled()).toBe(true);
    expect(lighting.getAmbient().intensity).toBeGreaterThan(0);
    expect(layer.children.length).toBe(2); // Ambient overlay + lights container
  });

  it('adds, retrieves, and removes point lights and spot lights', () => {
    const layer = new Container();
    const lighting = new LightingSystem(layer);

    const light1 = lighting.addLight({
      id: 'point_test_1',
      type: LightType.POINT,
      x: 100,
      y: 200,
      radius: 150,
      color: 0xffaa00,
      intensity: 0.8,
      falloff: FalloffType.SMOOTH,
    });

    expect(lighting.getLight('point_test_1')).toBe(light1);
    expect(lighting.getLights().length).toBe(1);

    const spotLight = lighting.addLight({
      id: 'spot_test_2',
      type: LightType.SPOT,
      x: 300,
      y: 400,
      radius: 250,
      color: 0x00aaff,
      intensity: 1.0,
      direction: Math.PI / 4,
      coneAngle: Math.PI / 3,
    });

    expect(lighting.getLights().length).toBe(2);
    expect(lighting.getLight('spot_test_2')).toBe(spotLight);

    lighting.removeLight('point_test_1');
    expect(lighting.getLight('point_test_1')).toBeUndefined();
    expect(lighting.getLights().length).toBe(1);
  });

  it('updates pulsating lights on tick', () => {
    const layer = new Container();
    const lighting = new LightingSystem(layer);

    const pulseLight = lighting.addLight({
      id: 'pulse_light',
      type: LightType.POINT,
      x: 500,
      y: 500,
      radius: 100,
      color: 0xff0000,
      intensity: 0.5,
      pulseSpeed: 4.0,
      pulseIntensityMin: 0.2,
      pulseIntensityMax: 0.8,
    });

    const initialIntensity = pulseLight.intensity;
    lighting.update(0.3);

    expect(pulseLight.intensity).not.toBe(initialIntensity);
    expect(pulseLight.intensity).toBeGreaterThanOrEqual(0.2);
    expect(pulseLight.intensity).toBeLessThanOrEqual(0.8);
  });

  it('applies lighting environment presets accurately', () => {
    const layer = new Container();
    const lighting = new LightingSystem(layer);

    lighting.applyPreset('HEADQUARTERS');
    expect(lighting.getAmbient().color).toBe(LIGHTING_PRESETS.HEADQUARTERS!.ambient.color);
    expect(lighting.getAmbient().intensity).toBe(LIGHTING_PRESETS.HEADQUARTERS!.ambient.intensity);

    lighting.applyPreset('MARS_SURFACE');
    expect(lighting.getAmbient().color).toBe(LIGHTING_PRESETS.MARS_SURFACE!.ambient.color);
  });

  it('toggles visibility and clears lights cleanly', () => {
    const layer = new Container();
    const lighting = new LightingSystem(layer);

    lighting.addLight({
      id: 'temp_light',
      type: LightType.POINT,
      x: 0,
      y: 0,
      radius: 50,
      color: 0xffffff,
      intensity: 1,
    });

    lighting.setEnabled(false);
    expect(lighting.getEnabled()).toBe(false);
    expect(layer.visible).toBe(false);

    lighting.clearLights();
    expect(lighting.getLights().length).toBe(0);
  });
});
