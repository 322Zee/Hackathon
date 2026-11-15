import { describe, it, expect, beforeEach } from 'vitest';
import { TutorialPanel } from '../../src/ui/tutorial/TutorialPanel';
import { TutorialManager } from '../../src/tutorial/TutorialManager';
import { EventBus } from '../../src/core/EventBus';
import { TutorialSequenceId } from '../../src/tutorial/TutorialTypes';

describe('TutorialPanel', () => {
  let eventBus: EventBus;
  let tutorialManager: TutorialManager;
  let panel: TutorialPanel;

  beforeEach(() => {
    eventBus = new EventBus();
    tutorialManager = new TutorialManager(eventBus);
    panel = new TutorialPanel({ tutorialManager });
  });

  it('renders with default dimensions and displays step details when set', () => {
    tutorialManager.startSequence(TutorialSequenceId.INITIAL_ONBOARDING);
    const step = tutorialManager.getCurrentStep();
    expect(step).toBeDefined();

    panel.setStep(step, 1, 7);
    expect(panel.container.visible).toBe(true);
    expect(panel.getCurrentStep()?.id).toBe(step?.id);
  });

  it('toggles minimize state and exposes minimized pill', () => {
    tutorialManager.startSequence(TutorialSequenceId.INITIAL_ONBOARDING);
    panel.setStep(tutorialManager.getCurrentStep(), 1, 7);

    expect(panel.getIsMinimized()).toBe(false);
    panel.toggleMinimize();
    expect(panel.getIsMinimized()).toBe(true);
    panel.toggleMinimize();
    expect(panel.getIsMinimized()).toBe(false);
  });

  it('hides container when step is null', () => {
    panel.setStep(null);
    expect(panel.container.visible).toBe(false);
  });

  it('invokes advance on continue click', () => {
    let advanced = false;
    const customPanel = new TutorialPanel({
      tutorialManager,
      onAdvance: () => {
        advanced = true;
      },
    });

    customPanel.handleContinue();
    expect(advanced).toBe(true);
  });

  it('invokes skip on skip click', () => {
    let skipped = false;
    const customPanel = new TutorialPanel({
      tutorialManager,
      onSkip: () => {
        skipped = true;
      },
    });

    customPanel.handleSkip();
    expect(skipped).toBe(true);
  });
});
