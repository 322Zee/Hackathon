import { describe, it, expect } from 'vitest';
import { ShaderManager } from '../../src/rendering/shaders/ShaderManager';
import { AtmosphericHazeFilter } from '../../src/rendering/shaders/filters/AtmosphericHazeFilter';
import { ScanlineHologramFilter } from '../../src/rendering/shaders/filters/ScanlineHologramFilter';
import { ThrusterHeatFilter } from '../../src/rendering/shaders/filters/ThrusterHeatFilter';
import { VignetteFilter } from '../../src/rendering/shaders/filters/VignetteFilter';

describe('ShaderManager (Shaders & Filters Architecture)', () => {
  it('instantiates cleanly and manages master toggle', () => {
    const sm = new ShaderManager();
    expect(sm.areShadersEnabled()).toBe(true);

    sm.setShadersEnabled(false);
    expect(sm.areShadersEnabled()).toBe(false);

    sm.setShadersEnabled(true);
    expect(sm.areShadersEnabled()).toBe(true);
  });

  it('instantiates all 4 custom filters without throwing in headless environment', () => {
    const haze = new AtmosphericHazeFilter();
    const scanline = new ScanlineHologramFilter();
    const heat = new ThrusterHeatFilter();
    const vignette = new VignetteFilter();

    expect(haze.id).toBe('AtmosphericHaze');
    expect(scanline.id).toBe('ScanlineHologram');
    expect(heat.id).toBe('ThrusterHeat');
    expect(vignette.id).toBe('Vignette');
  });

  it('registers, retrieves, and updates filters with delta time', () => {
    const sm = new ShaderManager();
    const haze = new AtmosphericHazeFilter();
    sm.registerFilter(haze);

    expect(sm.getFilter('AtmosphericHaze')).toBe(haze);

    sm.update(0.016);
    // Should not throw and uniforms should receive time ticks
    expect(haze.enabled).toBe(true);
  });

  it('adjusts active filters when quality profile changes', () => {
    const sm = new ShaderManager();
    const haze = new AtmosphericHazeFilter();
    const heat = new ThrusterHeatFilter();

    sm.registerFilter(haze);
    sm.registerFilter(heat);

    sm.setQuality('LOW');
    expect(sm.getQuality()).toBe('LOW');
    expect(haze.enabled).toBe(false);
    expect(heat.enabled).toBe(false);

    sm.setQuality('HIGH');
    expect(sm.getQuality()).toBe('HIGH');
    expect(haze.enabled).toBe(true);
    expect(heat.enabled).toBe(true);
  });
});
