import { GameEvent } from './types';

type Callback = (data?: unknown) => void;

/**
 * A lightweight event bus for decoupled communication between game systems.
 */
export class EventBus {
  private subscribers: Map<GameEvent, Set<Callback>> = new Map();

  /**
   * Subscribes to an event.
   * @param event The event to subscribe to.
   * @param callback The callback to execute when the event is emitted.
   * @returns A function to unsubscribe.
   */
  on(event: GameEvent, callback: Callback): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event)!.add(callback);

    return () => {
      const set = this.subscribers.get(event);
      if (set) {
        set.delete(callback);
      }
    };
  }

  /**
   * Emits an event to all subscribers.
   * @param event The event to emit.
   * @param data Optional data to pass to subscribers.
   */
  emit(event: GameEvent, data?: unknown): void {
    const set = this.subscribers.get(event);
    if (set) {
      set.forEach((callback) => callback(data));
    }
  }
}
