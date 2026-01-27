import { describe, it, expect, vi } from 'vitest';
import { EventBus } from './event-bus.js';
import { GameEvent } from './types.js';

describe('EventBus', () => {
  it('should allow subscribing to and emitting events', () => {
    const bus = new EventBus();
    const callback = vi.fn();

    bus.on(GameEvent.PELLET_EATEN, callback);
    bus.emit(GameEvent.PELLET_EATEN, { tileType: 'Pellet' });

    expect(callback).toHaveBeenCalledWith({ tileType: 'Pellet' });
  });

  it('should allow unsubscribing from events', () => {
    const bus = new EventBus();
    const callback = vi.fn();

    const unsubscribe = bus.on(GameEvent.PELLET_EATEN, callback);
    unsubscribe();
    bus.emit(GameEvent.PELLET_EATEN, { tileType: 'Pellet' });

    expect(callback).not.toHaveBeenCalled();
  });

  it('should support multiple subscribers for the same event', () => {
    const bus = new EventBus();
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    bus.on(GameEvent.PELLET_EATEN, callback1);
    bus.on(GameEvent.PELLET_EATEN, callback2);
    bus.emit(GameEvent.PELLET_EATEN, { tileType: 'Pellet' });

    expect(callback1).toHaveBeenCalled();
    expect(callback2).toHaveBeenCalled();
  });

  it('should not affect other events when emitting', () => {
    const bus = new EventBus();
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    bus.on(GameEvent.PELLET_EATEN, callback1);
    bus.on(GameEvent.GHOST_EATEN, callback2);
    bus.emit(GameEvent.PELLET_EATEN, { tileType: 'Pellet' });

    expect(callback1).toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();
  });

  it('should not throw when emitting an event with no subscribers', () => {
    const bus = new EventBus();
    expect(() =>
      bus.emit(GameEvent.PELLET_EATEN, { tileType: 'Pellet' })
    ).not.toThrow();
  });
});
