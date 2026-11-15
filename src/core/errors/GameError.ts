export enum ErrorCategory {
  SCENE = 'SCENE',
  ASSET = 'ASSET',
  CONFIG = 'CONFIG',
  STATE = 'STATE',
  EVENT = 'EVENT',
  INPUT = 'INPUT',
  RUNTIME = 'RUNTIME',
}

export class GameError extends Error {
  public readonly category: ErrorCategory;
  public readonly code: string;
  public readonly recoveryAdvice?: string;
  public readonly timestamp: number;

  constructor(
    message: string,
    category: ErrorCategory,
    code: string,
    recoveryAdvice?: string
  ) {
    super(message);
    this.name = `GameError[${category}:${code}]`;
    this.category = category;
    this.code = code;
    this.recoveryAdvice = recoveryAdvice;
    this.timestamp = Date.now();
  }
}

export class SceneError extends GameError {
  constructor(message: string, code: string = 'SCENE_FAULT', recoveryAdvice?: string) {
    super(message, ErrorCategory.SCENE, code, recoveryAdvice || 'Reverting to fallback scene.');
  }
}

export class AssetError extends GameError {
  constructor(message: string, code: string = 'ASSET_LOAD_FAIL', recoveryAdvice?: string) {
    super(message, ErrorCategory.ASSET, code, recoveryAdvice || 'Using fallback placeholder texture.');
  }
}

export class ConfigError extends GameError {
  constructor(message: string, code: string = 'CONFIG_INVALID', recoveryAdvice?: string) {
    super(message, ErrorCategory.CONFIG, code, recoveryAdvice || 'Resetting to default settings.');
  }
}

export class StateError extends GameError {
  constructor(message: string, code: string = 'STATE_INVALID', recoveryAdvice?: string) {
    super(message, ErrorCategory.STATE, code, recoveryAdvice || 'Checking state constraints.');
  }
}

export class EventError extends GameError {
  constructor(message: string, code: string = 'EVENT_DISPATCH_FAIL', recoveryAdvice?: string) {
    super(message, ErrorCategory.EVENT, code, recoveryAdvice || 'Event listener isolated.');
  }
}

export class InputError extends GameError {
  constructor(message: string, code: string = 'INPUT_FAULT', recoveryAdvice?: string) {
    super(message, ErrorCategory.INPUT, code, recoveryAdvice || 'Checking input bindings.');
  }
}
