import { EventBus, EventSubscription, EventCallback } from '../EventBus';
import { AllGameEvents } from './GameEvents';

export class ScopedEventSubscriber {
  private eventBus: EventBus;
  private subscriptions: Set<EventSubscription> = new Set();
  private ownerName: string;

  constructor(eventBus: EventBus, ownerName: string = 'AnonymousScope') {
    this.eventBus = eventBus;
    this.ownerName = ownerName;
  }

  public subscribe<K extends keyof AllGameEvents>(
    event: K,
    callback: EventCallback<AllGameEvents[K]>
  ): EventSubscription {
    const sub = this.eventBus.on(event, callback);

    const trackedSub: EventSubscription = {
      unsubscribe: () => {
        sub.unsubscribe();
        this.subscriptions.delete(trackedSub);
      },
    };

    this.subscriptions.add(trackedSub);
    return trackedSub;
  }

  public subscribeOnce<K extends keyof AllGameEvents>(
    event: K,
    callback: EventCallback<AllGameEvents[K]>
  ): EventSubscription {
    let trackedSub: EventSubscription;

    const wrappedCallback: EventCallback<AllGameEvents[K]> = (payload) => {
      this.subscriptions.delete(trackedSub);
      callback(payload);
    };

    const sub = this.eventBus.once(event, wrappedCallback);
    trackedSub = {
      unsubscribe: () => {
        sub.unsubscribe();
        this.subscriptions.delete(trackedSub);
      },
    };

    this.subscriptions.add(trackedSub);
    return trackedSub;
  }

  public getOwnerName(): string {
    return this.ownerName;
  }

  public getActiveSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  public unsubscribeAll(): void {
    for (const sub of this.subscriptions) {
      sub.unsubscribe();
    }
    this.subscriptions.clear();
  }

  public dispose(): void {
    this.unsubscribeAll();
  }
}
