import { describe, it, expect, beforeEach } from 'vitest';
import { InputManager } from '../../src/input/InputManager';
import { InputAction } from '../../src/input/InputAction';
import { InputContext } from '../../src/input/InputContext';
import { VirtualResolution } from '../../src/rendering/VirtualResolution';

describe('InputManager', () => {
  let inputManager: InputManager;
  let virtualResolution: VirtualResolution;

  beforeEach(() => {
    if (typeof globalThis.KeyboardEvent === 'undefined') {
      (globalThis as any).KeyboardEvent = class {
        code: string;
        type: string;
        constructor(type: string, init?: { code?: string }) {
          this.type = type;
          this.code = init?.code || '';
        }
      };
    }

    if (typeof globalThis.MouseEvent === 'undefined') {
      (globalThis as any).MouseEvent = class {
        type: string;
        button: number;
        clientX: number;
        clientY: number;
        constructor(type: string, init?: { button?: number; clientX?: number; clientY?: number }) {
          this.type = type;
          this.button = init?.button ?? 0;
          this.clientX = init?.clientX ?? 0;
          this.clientY = init?.clientY ?? 0;
        }
      };
    }

    virtualResolution = new VirtualResolution(1920, 1080);
    virtualResolution.updateViewport(1920, 1080);
    inputManager = new InputManager(virtualResolution);
  });

  it('detects keyboard action bindings', () => {
    // Simulate pressing KeyW
    (inputManager as any).handleKeyDown(new KeyboardEvent('keydown', { code: 'KeyW' }));

    expect(inputManager.isActionActive(InputAction.MoveUp)).toBe(true);
    expect(inputManager.isActionJustPressed(InputAction.MoveUp)).toBe(true);
    expect(inputManager.isActionActive(InputAction.MoveDown)).toBe(false);

    // After frame update, justPressed clears but active remains
    inputManager.update(0.016);
    expect(inputManager.isActionActive(InputAction.MoveUp)).toBe(true);
    expect(inputManager.isActionJustPressed(InputAction.MoveUp)).toBe(false);

    // Key up
    (inputManager as any).handleKeyUp(new KeyboardEvent('keyup', { code: 'KeyW' }));
    expect(inputManager.isActionActive(InputAction.MoveUp)).toBe(false);
    expect(inputManager.isActionJustReleased(InputAction.MoveUp)).toBe(true);
  });

  it('calculates normalized movement vector', () => {
    (inputManager as any).handleKeyDown(new KeyboardEvent('keydown', { code: 'KeyD' }));
    (inputManager as any).handleKeyDown(new KeyboardEvent('keydown', { code: 'KeyS' }));

    const vec = inputManager.getMovementVector();
    // Diagonal move normalized (1 / sqrt(2) ~= 0.7071)
    expect(vec.x).toBeCloseTo(0.7071, 3);
    expect(vec.y).toBeCloseTo(0.7071, 3);
  });

  it('respects input locking and ignores input during locks', () => {
    (inputManager as any).handleKeyDown(new KeyboardEvent('keydown', { code: 'KeyE' }));
    expect(inputManager.isActionActive(InputAction.Interact)).toBe(true);

    // Lock input (e.g. during scene transition or cutscene)
    inputManager.lockInput('transition');
    expect(inputManager.isInputLocked()).toBe(true);
    expect(inputManager.isActionActive(InputAction.Interact)).toBe(false);

    // Unlock
    inputManager.unlockInput('transition');
    expect(inputManager.isInputLocked()).toBe(false);
    expect(inputManager.isActionActive(InputAction.Interact)).toBe(true);
  });

  it('maps physical screen pointer to virtual coordinates', () => {
    // Screen is 2560x1080, virtual is 1920x1080 -> offsetX is 320
    virtualResolution.updateViewport(2560, 1080);

    (inputManager as any).handleMouseMove(new MouseEvent('mousemove', { clientX: 1280, clientY: 540 }));

    const virtualPos = inputManager.getPointerVirtualPosition();
    expect(virtualPos.x).toBe(960);
    expect(virtualPos.y).toBe(540);
  });

  it('manages input context and focus targets', () => {
    inputManager.setContext(InputContext.UI);
    expect(inputManager.getContext()).toBe(InputContext.UI);

    inputManager.setFocus('dialog_modal');
    expect(inputManager.getFocus()).toBe('dialog_modal');
  });

  it('supports action rebinding', () => {
    inputManager.rebind(InputAction.Interact, { keys: ['KeyF'] });

    (inputManager as any).handleKeyDown(new KeyboardEvent('keydown', { code: 'KeyE' }));
    expect(inputManager.isActionActive(InputAction.Interact)).toBe(false);

    (inputManager as any).handleKeyDown(new KeyboardEvent('keydown', { code: 'KeyF' }));
    expect(inputManager.isActionActive(InputAction.Interact)).toBe(true);
  });
});
