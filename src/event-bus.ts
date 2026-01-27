import { GameEvent, type EventPayloads } from './types.js';

type Callback<T> = (data: T) => void;

/**
 * A lightweight, type-safe event bus for decoupled communication between game systems.
 */
export class EventBus {
  private subscribers: { [E in GameEvent]?: Set<Callback<EventPayloads[E]>> } = {};

  /**
   * Subscribes to an event.
   * @param event The event to subscribe to.
   * @param callback The callback to execute when the event is emitted.
   * @returns A function to unsubscribe.
   */
  on<E extends GameEvent>(
    event: E,
    callback: Callback<EventPayloads[E]>
  ): () => void {
    if (!this.subscribers[event]) {
      this.subscribers[event] = new Set() as any;
    }
    (this.subscribers[event] as unknown as Set<Callback<EventPayloads[E]>>).add(callback);

    return () => {
      const set = this.subscribers[event];
      if (set) {
        (set as unknown as Set<Callback<EventPayloads[E]>>).delete(callback);
        if (set.size === 0) {
          delete this.subscribers[event];
        }
      }
    };
  }

  /**
   * Emits an event to all subscribers.
   * @param event The event to emit.
   * @param data The data to pass to subscribers, matching the event's payload type.
   */
  emit<E extends GameEvent>(event: E, data: EventPayloads[E]): void {
    const set = this.subscribers[event];
    if (set) {
      // The type assertion is needed due to a TypeScript limitation with correlated types.
      (set as unknown as Set<Callback<EventPayloads[E]>>).forEach((cb) => cb(data));
    }
  }
}
