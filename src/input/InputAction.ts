export enum InputAction {
  MoveUp = 'MoveUp',
  MoveDown = 'MoveDown',
  MoveLeft = 'MoveLeft',
  MoveRight = 'MoveRight',
  Sprint = 'Sprint',
  Interact = 'Interact',
  Confirm = 'Confirm',
  Cancel = 'Cancel',
  Pause = 'Pause',
  OpenMap = 'OpenMap',
  OpenInventory = 'OpenInventory',
  CameraZoom = 'CameraZoom',
  CameraPan = 'CameraPan',
  ToggleDebug = 'ToggleDebug',
}

export type ActionBinding = {
  keys: string[];
  mouseButtons?: number[]; // 0: Left, 1: Middle, 2: Right
  gamepadButtons?: number[];
};

export type ActionBindingsMap = Record<InputAction, ActionBinding>;

export const DEFAULT_ACTION_BINDINGS: ActionBindingsMap = {
  [InputAction.MoveUp]: { keys: ['KeyW', 'ArrowUp'], gamepadButtons: [12] },
  [InputAction.MoveDown]: { keys: ['KeyS', 'ArrowDown'], gamepadButtons: [13] },
  [InputAction.MoveLeft]: { keys: ['KeyA', 'ArrowLeft'], gamepadButtons: [14] },
  [InputAction.MoveRight]: { keys: ['KeyD', 'ArrowRight'], gamepadButtons: [15] },
  [InputAction.Sprint]: { keys: ['ShiftLeft', 'ShiftRight'], gamepadButtons: [10] },
  [InputAction.Interact]: { keys: ['KeyE'], gamepadButtons: [0] },
  [InputAction.Confirm]: { keys: ['Enter', 'Space'], mouseButtons: [0], gamepadButtons: [0] },
  [InputAction.Cancel]: { keys: ['Escape', 'Backspace'], mouseButtons: [2], gamepadButtons: [1] },
  [InputAction.Pause]: { keys: ['Escape', 'KeyP'], gamepadButtons: [9] },
  [InputAction.OpenMap]: { keys: ['KeyM'], gamepadButtons: [8] },
  [InputAction.OpenInventory]: { keys: ['KeyI', 'Tab'], gamepadButtons: [3] },
  [InputAction.CameraZoom]: { keys: ['Equal', 'Minus'] },
  [InputAction.CameraPan]: { keys: [], mouseButtons: [1] }, // Middle drag
  [InputAction.ToggleDebug]: { keys: ['F1', 'KeyC'] },
};
