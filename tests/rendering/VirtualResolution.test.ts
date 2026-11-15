import { describe, it, expect } from 'vitest';
import { VirtualResolution } from '../../src/rendering/VirtualResolution';

describe('VirtualResolution', () => {
  it('computes 1:1 scale and 0 offsets for exact 1920x1080 display', () => {
    const vr = new VirtualResolution(1920, 1080, 1.0);
    const transform = vr.updateViewport(1920, 1080);

    expect(transform.scale).toBe(1.0);
    expect(transform.offsetX).toBe(0);
    expect(transform.offsetY).toBe(0);
    expect(transform.viewportWidth).toBe(1920);
    expect(transform.viewportHeight).toBe(1080);
  });

  it('computes pillarbox offsets on ultrawide viewports (2560x1080)', () => {
    const vr = new VirtualResolution(1920, 1080, 1.0);
    const transform = vr.updateViewport(2560, 1080);

    expect(transform.scale).toBe(1.0); // Height constrained
    expect(transform.offsetX).toBe(320); // (2560 - 1920) / 2
    expect(transform.offsetY).toBe(0);
  });

  it('computes letterbox offsets on tall viewports (1920x1440)', () => {
    const vr = new VirtualResolution(1920, 1080, 1.0);
    const transform = vr.updateViewport(1920, 1440);

    expect(transform.scale).toBe(1.0); // Width constrained
    expect(transform.offsetX).toBe(0);
    expect(transform.offsetY).toBe(180); // (1440 - 1080) / 2
  });

  it('scales down uniformly on smaller screens (960x540)', () => {
    const vr = new VirtualResolution(1920, 1080, 1.0);
    const transform = vr.updateViewport(960, 540);

    expect(transform.scale).toBe(0.5);
    expect(transform.offsetX).toBe(0);
    expect(transform.offsetY).toBe(0);
  });

  it('accurately maps screen coordinates to virtual coordinates and back', () => {
    const vr = new VirtualResolution(1920, 1080, 1.0);
    vr.updateViewport(2560, 1080); // offsetX = 320, scale = 1.0

    // Click at center of ultrawide screen: (1280, 540)
    const virtualCoord = vr.screenToVirtual(1280, 540);
    expect(virtualCoord.x).toBe(960);
    expect(virtualCoord.y).toBe(540);

    // Map back
    const screenCoord = vr.virtualToScreen(virtualCoord.x, virtualCoord.y);
    expect(screenCoord.x).toBe(1280);
    expect(screenCoord.y).toBe(540);
  });
});
