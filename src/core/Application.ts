import { ApplicationController, ApplicationOptions } from '../application/ApplicationController';

/**
 * Backward-compatible facade wrapping ApplicationController.
 */
export class Application extends ApplicationController {
  constructor(containerElement: HTMLElement) {
    super({ containerElement });
  }
}

export { ApplicationController };
export type { ApplicationOptions };
