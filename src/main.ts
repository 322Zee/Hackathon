import { ApplicationController } from './application/ApplicationController';
import { Logger } from './core/logging/Logger';

window.addEventListener('DOMContentLoaded', async () => {
  Logger.info('ENTRY', 'DOM fully loaded. Mounting INTERSTELLAR CONTINUUM...');

  const container = document.getElementById('game-container');
  if (!container) {
    const errorMsg = 'Fatal Error: Could not locate #game-container mount element in DOM.';
    Logger.error('ENTRY', errorMsg);
    throw new Error(errorMsg);
  }

  const app = new ApplicationController({ containerElement: container });

  try {
    await app.bootstrap();
  } catch (err) {
    Logger.error('ENTRY', 'Unhandled exception during application bootstrap:', err);
  }
});
