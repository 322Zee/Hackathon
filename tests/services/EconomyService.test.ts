import { describe, it, expect, beforeEach } from 'vitest';
import { EconomyService } from '../../src/services/EconomyService';
import { EventBus } from '../../src/core/EventBus';

describe('EconomyService', () => {
  let eventBus: EventBus;
  let economyService: EconomyService;

  beforeEach(() => {
    eventBus = new EventBus();
    economyService = new EconomyService(
      {
        credits: 100000,
        researchData: 50,
        rawMaterials: 20,
        technologyPoints: 0,
      },
      eventBus
    );
  });

  it('correctly checks affordability of resources', () => {
    expect(economyService.canAfford({ credits: 50000, researchData: 20 })).toBe(true);
    expect(economyService.canAfford({ credits: 150000 })).toBe(false);
    expect(economyService.canAfford({ rawMaterials: 25 })).toBe(false);
  });

  it('spends resources and updates wallet correctly', () => {
    const success = economyService.spend({ credits: 25000, researchData: 10 });
    expect(success).toBe(true);
    expect(economyService.getCredits()).toBe(75000);
    expect(economyService.getResearchData()).toBe(40);
  });

  it('rejects spending when funds are insufficient and leaves wallet unchanged', () => {
    const success = economyService.spend({ credits: 200000 });
    expect(success).toBe(false);
    expect(economyService.getCredits()).toBe(100000);
  });

  it('grants rewards and emits events', () => {
    let creditEventFired = false;
    eventBus.on('economy:credits_changed', (payload) => {
      if (payload.delta === 50000) {
        creditEventFired = true;
      }
    });

    economyService.grant({ credits: 50000, rawMaterials: 30 });
    expect(economyService.getCredits()).toBe(150000);
    expect(economyService.getRawMaterials()).toBe(50);
    expect(creditEventFired).toBe(true);
  });
});
