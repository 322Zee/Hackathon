import { Logger } from '../logging/Logger';
import { EventBus } from '../EventBus';
import { GameError, ErrorCategory, SceneError, AssetError, ConfigError, StateError, EventError } from './GameError';

export interface ErrorReport {
  timestamp: number;
  message: string;
  category: ErrorCategory;
  code: string;
  source?: string;
  stack?: string;
  context?: string;
  recoveryAdvice?: string;
  fatal: boolean;
}

export class ErrorHandler {
  private static instance: ErrorHandler | null = null;
  private eventBus?: EventBus;
  private errorReports: ErrorReport[] = [];
  private isHooked = false;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus;
  }

  public static initialize(eventBus?: EventBus): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler(eventBus);
      ErrorHandler.instance.setupGlobalHooks();
    }
    return ErrorHandler.instance;
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  public setupGlobalHooks(): void {
    if (this.isHooked || typeof window === 'undefined') return;

    window.addEventListener('error', (event: ErrorEvent) => {
      this.handleError(
        event.error || event.message,
        ErrorCategory.RUNTIME,
        'WINDOW_ERROR',
        event.filename,
        event.error?.stack,
        'window.onerror',
        false
      );
    });

    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason);
      const stack = reason instanceof Error ? reason.stack : undefined;
      this.handleError(
        message,
        ErrorCategory.RUNTIME,
        'UNHANDLED_PROMISE',
        'Promise',
        stack,
        'unhandledrejection',
        false
      );
    });

    this.isHooked = true;
    Logger.info('ERROR_HANDLER', 'Global error boundary hooks installed successfully.');
  }

  public report(
    error: Error | string,
    context: string = 'Application',
    fatal: boolean = false
  ): void {
    if (error instanceof GameError) {
      this.handleError(
        error.message,
        error.category,
        error.code,
        context,
        error.stack,
        context,
        fatal,
        error.recoveryAdvice
      );
      return;
    }

    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    this.handleError(message, ErrorCategory.RUNTIME, 'GENERIC_ERROR', context, stack, context, fatal);
  }

  public handleSceneError(error: SceneError | Error, sceneId: string): void {
    const code = error instanceof SceneError ? error.code : 'SCENE_ERROR';
    const advice = error instanceof SceneError ? error.recoveryAdvice : undefined;
    this.handleError(error.message, ErrorCategory.SCENE, code, `Scene:${sceneId}`, error.stack, 'SceneManager', false, advice);
  }

  public handleAssetError(error: AssetError | Error, assetKey: string): void {
    const code = error instanceof AssetError ? error.code : 'ASSET_ERROR';
    const advice = error instanceof AssetError ? error.recoveryAdvice : undefined;
    this.handleError(error.message, ErrorCategory.ASSET, code, `Asset:${assetKey}`, error.stack, 'AssetManager', false, advice);
  }

  public handleConfigError(error: ConfigError | Error, category: string): void {
    const code = error instanceof ConfigError ? error.code : 'CONFIG_ERROR';
    this.handleError(error.message, ErrorCategory.CONFIG, code, `Config:${category}`, error.stack, 'ConfigManager', false);
  }

  public handleStateError(error: StateError | Error, context: string): void {
    const code = error instanceof StateError ? error.code : 'STATE_ERROR';
    this.handleError(error.message, ErrorCategory.STATE, code, context, error.stack, 'GameStateManager', false);
  }

  public handleEventError(error: EventError | Error, eventName: string): void {
    const code = error instanceof EventError ? error.code : 'EVENT_ERROR';
    this.handleError(error.message, ErrorCategory.EVENT, code, `Event:${eventName}`, error.stack, 'EventBus', false);
  }

  public getRecentErrors(): readonly ErrorReport[] {
    return this.errorReports;
  }

  public clearErrors(): void {
    this.errorReports = [];
  }

  private handleError(
    message: string,
    category: ErrorCategory,
    code: string,
    source?: string,
    stack?: string,
    context?: string,
    fatal: boolean = false,
    recoveryAdvice?: string
  ): void {
    const report: ErrorReport = {
      timestamp: Date.now(),
      message,
      category,
      code,
      source,
      stack,
      context,
      recoveryAdvice,
      fatal,
    };

    this.errorReports.push(report);
    if (this.errorReports.length > 50) {
      this.errorReports.shift();
    }

    Logger.error('ERROR_HANDLER', `[${category}:${code}] (${context || 'Unknown'}) ${message}`, {
      source,
      stack,
      fatal,
      recoveryAdvice,
    });

    if (this.eventBus) {
      this.eventBus.emit('error:captured', { message, stack, fatal });
    }

    if (fatal && typeof document !== 'undefined') {
      this.displayFatalErrorScreen(report);
    }
  }

  private displayFatalErrorScreen(report: ErrorReport): void {
    let errorContainer = document.getElementById('critical-error-boundary');
    if (!errorContainer) {
      errorContainer = document.createElement('div');
      errorContainer.id = 'critical-error-boundary';
      errorContainer.style.position = 'fixed';
      errorContainer.style.top = '0';
      errorContainer.style.left = '0';
      errorContainer.style.width = '100vw';
      errorContainer.style.height = '100vh';
      errorContainer.style.backgroundColor = 'rgba(3, 7, 18, 0.95)';
      errorContainer.style.color = '#ff1744';
      errorContainer.style.display = 'flex';
      errorContainer.style.flexDirection = 'column';
      errorContainer.style.justifyContent = 'center';
      errorContainer.style.alignItems = 'center';
      errorContainer.style.fontFamily = 'Rajdhani, monospace';
      errorContainer.style.zIndex = '999999';
      errorContainer.style.padding = '40px';
      errorContainer.style.boxSizing = 'border-box';
      document.body.appendChild(errorContainer);
    }

    errorContainer.innerHTML = `
      <div style="max-width: 800px; border: 1px solid #ff1744; background: rgba(255, 23, 68, 0.05); padding: 30px; border-radius: 6px; box-shadow: 0 0 40px rgba(255, 23, 68, 0.2);">
        <h2 style="font-family: Orbitron, sans-serif; margin-bottom: 12px; letter-spacing: 2px;">INTERSTELLAR CONTINUUM // [${report.category}:${report.code}]</h2>
        <p style="color: #f0f6fc; margin-bottom: 12px; font-size: 16px;">${report.message}</p>
        ${report.recoveryAdvice ? `<p style="color: #00e5ff; font-size: 14px; margin-bottom: 16px;">ADVICE: ${report.recoveryAdvice}</p>` : ''}
        <div style="background: #000; padding: 15px; border: 1px solid #333; font-family: monospace; font-size: 13px; color: #ff5252; overflow-x: auto; margin-bottom: 25px; white-space: pre-wrap;">
${report.stack || 'No stack trace available.'}
        </div>
        <button id="error-reload-btn" style="background: #00e5ff; color: #030712; border: none; padding: 10px 24px; font-family: Orbitron, sans-serif; font-weight: bold; cursor: pointer; border-radius: 4px; letter-spacing: 1px;">
          REBOOT CORE SYSTEMS
        </button>
      </div>
    `;

    const btn = document.getElementById('error-reload-btn');
    if (btn) {
      btn.onclick = () => window.location.reload();
    }
  }
}
