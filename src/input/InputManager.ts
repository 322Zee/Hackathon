import { IInputSystem } from '../systems/interfaces/CoreSystemInterfaces';
import { SystemId } from '../systems/interfaces/IGameSystem';
import { InputAction, ActionBinding, ActionBindingsMap, DEFAULT_ACTION_BINDINGS } from './InputAction';
import { InputContext } from './InputContext';
import { VirtualResolution } from '../rendering/VirtualResolution';
import { Logger } from '../core/logging/Logger';

export class InputManager implements IInputSystem {
  public readonly id = SystemId.INPUT;
  public readonly priority = 10; // High priority: processes inputs first each frame

  private bindings: ActionBindingsMap;
  private currentContext: InputContext = InputContext.GAMEPLAY;
  private activeFocusTarget: string = 'canvas';

  // Physical input states
  private keysDown: Set<string> = new Set();
  private keysJustPressed: Set<string> = new Set();
  private keysJustReleased: Set<string> = new Set();

  private mouseButtonsDown: Set<number> = new Set();
  private mouseButtonsJustPressed: Set<number> = new Set();
  private mouseButtonsJustReleased: Set<number> = new Set();

  private pointerScreenPos: { x: number; y: number } = { x: 0, y: 0 };
  private wheelDelta: number = 0;

  // Lock status
  private lockCount: number = 0;
  private lockReasons: Set<string> = new Set();

  private virtualResolution?: VirtualResolution;
  private isHooked: boolean = false;

  constructor(virtualResolution?: VirtualResolution, customBindings?: Partial<ActionBindingsMap>) {
    this.virtualResolution = virtualResolution;
    this.bindings = {
      ...DEFAULT_ACTION_BINDINGS,
      ...(customBindings || {}),
    };
  }

  public initialize(): void {
    if (this.isHooked || typeof window === 'undefined') return;

    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    window.addEventListener('mousedown', this.handleMouseDown.bind(this));
    window.addEventListener('mouseup', this.handleMouseUp.bind(this));
    window.addEventListener('mousemove', this.handleMouseMove.bind(this));
    window.addEventListener('wheel', this.handleWheel.bind(this), { passive: true });

    this.isHooked = true;
    Logger.info('INPUT_MANAGER', 'InputManager initialized with DOM event hooks.');
  }

  public setVirtualResolution(vr: VirtualResolution): void {
    this.virtualResolution = vr;
  }

  public setContext(contextName: InputContext | string): void {
    this.currentContext = contextName as InputContext;
    Logger.debug('INPUT_MANAGER', `Input context changed to: ${contextName}`);
  }

  public getContext(): InputContext {
    return this.currentContext;
  }

  public setFocus(focusTarget: string): void {
    this.activeFocusTarget = focusTarget;
    Logger.debug('INPUT_MANAGER', `Focus set to: ${focusTarget}`);
  }

  public getFocus(): string {
    return this.activeFocusTarget;
  }

  public lockInput(reason: string = 'generic'): void {
    this.lockCount++;
    this.lockReasons.add(reason);
    Logger.debug('INPUT_MANAGER', `Input locked (count: ${this.lockCount}, reason: ${reason})`);
  }

  public unlockInput(reason?: string): void {
    if (this.lockCount > 0) {
      this.lockCount--;
      if (reason) {
        this.lockReasons.delete(reason);
      }
      if (this.lockCount === 0) {
        this.lockReasons.clear();
      }
    }
  }

  public isInputLocked(): boolean {
    return this.lockCount > 0;
  }

  public isActionActive(actionName: string): boolean {
    if (this.isInputLocked()) return false;
    const binding = this.bindings[actionName as InputAction];
    if (!binding) return false;

    // Check keyboard
    for (const key of binding.keys) {
      if (this.keysDown.has(key)) return true;
    }

    // Check mouse buttons
    if (binding.mouseButtons) {
      for (const btn of binding.mouseButtons) {
        if (this.mouseButtonsDown.has(btn)) return true;
      }
    }

    // Check gamepad polling
    if (binding.gamepadButtons && this.isGamepadButtonPressed(binding.gamepadButtons)) {
      return true;
    }

    return false;
  }

  public isActionJustPressed(actionName: string): boolean {
    if (this.isInputLocked()) return false;
    const binding = this.bindings[actionName as InputAction];
    if (!binding) return false;

    for (const key of binding.keys) {
      if (this.keysJustPressed.has(key)) return true;
    }

    if (binding.mouseButtons) {
      for (const btn of binding.mouseButtons) {
        if (this.mouseButtonsJustPressed.has(btn)) return true;
      }
    }

    return false;
  }

  public isActionJustReleased(actionName: string): boolean {
    if (this.isInputLocked()) return false;
    const binding = this.bindings[actionName as InputAction];
    if (!binding) return false;

    for (const key of binding.keys) {
      if (this.keysJustReleased.has(key)) return true;
    }

    if (binding.mouseButtons) {
      for (const btn of binding.mouseButtons) {
        if (this.mouseButtonsJustReleased.has(btn)) return true;
      }
    }

    return false;
  }

  public isKeyJustPressed(code: string): boolean {
    if (this.isInputLocked()) return false;
    return this.keysJustPressed.has(code);
  }

  public isKeyDown(code: string): boolean {
    if (this.isInputLocked()) return false;
    return this.keysDown.has(code);
  }

  public getPointerVirtualPosition(): { x: number; y: number } {
    if (this.virtualResolution) {
      return this.virtualResolution.screenToVirtual(this.pointerScreenPos.x, this.pointerScreenPos.y);
    }
    return { ...this.pointerScreenPos };
  }

  public getPointerScreenPosition(): { x: number; y: number } {
    return { ...this.pointerScreenPos };
  }

  public getWheelDelta(): number {
    return this.wheelDelta;
  }

  public getMovementVector(): { x: number; y: number } {
    if (this.isInputLocked()) return { x: 0, y: 0 };

    let x = 0;
    let y = 0;

    if (this.isActionActive(InputAction.MoveRight)) x += 1;
    if (this.isActionActive(InputAction.MoveLeft)) x -= 1;
    if (this.isActionActive(InputAction.MoveDown)) y += 1;
    if (this.isActionActive(InputAction.MoveUp)) y -= 1;

    // Normalize diagonal movement
    if (x !== 0 && y !== 0) {
      const invSqrt = 1 / Math.SQRT2;
      x *= invSqrt;
      y *= invSqrt;
    }

    return { x, y };
  }

  public rebind(action: InputAction, binding: ActionBinding): void {
    this.bindings[action] = { ...binding };
    Logger.info('INPUT_MANAGER', `Rebound action: ${action}`);
  }

  public getBindings(): ActionBindingsMap {
    return { ...this.bindings };
  }

  public update(_deltaSeconds: number): void {
    // Clear transient one-frame states at start of frame
    this.keysJustPressed.clear();
    this.keysJustReleased.clear();
    this.mouseButtonsJustPressed.clear();
    this.mouseButtonsJustReleased.clear();
    this.wheelDelta = 0;
  }

  public shutdown(): void {
    if (!this.isHooked || typeof window === 'undefined') return;

    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
    window.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    window.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    window.removeEventListener('mousemove', this.handleMouseMove.bind(this));

    this.keysDown.clear();
    this.mouseButtonsDown.clear();
    this.isHooked = false;
    Logger.info('INPUT_MANAGER', 'InputManager shutdown.');
  }

  // DOM Event Handlers
  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.keysDown.has(e.code)) {
      this.keysJustPressed.add(e.code);
    }
    this.keysDown.add(e.code);
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keysDown.delete(e.code);
    this.keysJustReleased.add(e.code);
  }

  private handleMouseDown(e: MouseEvent): void {
    if (!this.mouseButtonsDown.has(e.button)) {
      this.mouseButtonsJustPressed.add(e.button);
    }
    this.mouseButtonsDown.add(e.button);
  }

  private handleMouseUp(e: MouseEvent): void {
    this.mouseButtonsDown.delete(e.button);
    this.mouseButtonsJustReleased.add(e.button);
  }

  private handleMouseMove(e: MouseEvent): void {
    this.pointerScreenPos.x = e.clientX;
    this.pointerScreenPos.y = e.clientY;
  }

  private handleWheel(e: WheelEvent): void {
    this.wheelDelta = e.deltaY;
  }

  private isGamepadButtonPressed(buttonIndices: number[]): boolean {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return false;
    const gamepads = navigator.getGamepads();
    for (const gp of gamepads) {
      if (gp && gp.connected) {
        for (const idx of buttonIndices) {
          if (gp.buttons[idx]?.pressed) return true;
        }
      }
    }
    return false;
  }
}
