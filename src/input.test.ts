import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InputHandler } from './input.js';

describe('InputHandler', () => {
  let handler: InputHandler;

  beforeEach(() => {
    handler = InputHandler.getInstance();
  });

  afterEach(() => {
    handler.dispose();
  });

  it('should initialize with no direction', () => {
    expect(handler.getDirection()).toEqual({ dx: 0, dy: 0 });
  });

  it('should update direction on ArrowUp', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(handler.getDirection()).toEqual({ dx: 0, dy: -1 });
  });

  it('should update direction on ArrowDown', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(handler.getDirection()).toEqual({ dx: 0, dy: 1 });
  });

  it('should update direction on ArrowLeft', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(handler.getDirection()).toEqual({ dx: -1, dy: 0 });
  });

  it('should update direction on ArrowRight', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(handler.getDirection()).toEqual({ dx: 1, dy: 0 });
  });

  it('should update direction on WASD keys', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
    expect(handler.getDirection()).toEqual({ dx: 0, dy: -1 });

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));
    expect(handler.getDirection()).toEqual({ dx: 0, dy: 1 });

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    expect(handler.getDirection()).toEqual({ dx: -1, dy: 0 });

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
    expect(handler.getDirection()).toEqual({ dx: 1, dy: 0 });
  });

  it('should ignore non-directional keys', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(handler.getDirection()).toEqual({ dx: 0, dy: 0 });
  });

  describe('Touch Controls', () => {
    it('should return inactive joystick state initially', () => {
      expect(handler.getJoystickState()).toEqual({
        active: false,
        originX: 0,
        originY: 0,
        currentX: 0,
        currentY: 0,
      });
    });

    it('should activate joystick on touchstart', () => {
      const event = new CustomEvent('touchstart') as any;
      event.touches = [{ clientX: 100, clientY: 100 }];
      window.dispatchEvent(event);

      expect(handler.getJoystickState()).toEqual({
        active: true,
        originX: 100,
        originY: 100,
        currentX: 100,
        currentY: 100,
      });
    });

    it('should update current position and direction on touchmove', () => {
      // Start touch
      const startEvent = new CustomEvent('touchstart') as any;
      startEvent.touches = [{ clientX: 100, clientY: 100 }];
      window.dispatchEvent(startEvent);

      // Move touch right (outside 10px deadzone)
      const moveEvent = new CustomEvent('touchmove') as any;
      moveEvent.touches = [{ clientX: 120, clientY: 100 }];
      window.dispatchEvent(moveEvent);

      expect(handler.getJoystickState()).toEqual({
        active: true,
        originX: 100,
        originY: 100,
        currentX: 120,
        currentY: 100,
      });
      expect(handler.getDirection()).toEqual({ dx: 1, dy: 0 });

      // Move touch up (dx=20, dy=-30 -> abs(dy) > abs(dx) -> Up)
      const moveUpEvent = new CustomEvent('touchmove') as any;
      moveUpEvent.touches = [{ clientX: 120, clientY: 70 }];
      window.dispatchEvent(moveUpEvent);
      expect(handler.getDirection()).toEqual({ dx: 0, dy: -1 });
    });

    it('should deactivate joystick on touchend', () => {
      const startEvent = new CustomEvent('touchstart') as any;
      startEvent.touches = [{ clientX: 100, clientY: 100 }];
      window.dispatchEvent(startEvent);

      const endEvent = new CustomEvent('touchend') as any;
      window.dispatchEvent(endEvent);

      expect(handler.getJoystickState().active).toBe(false);
    });

    it('should ignore small movements within deadzone', () => {
      const startEvent = new CustomEvent('touchstart') as any;
      startEvent.touches = [{ clientX: 100, clientY: 100 }];
      window.dispatchEvent(startEvent);

      const moveEvent = new CustomEvent('touchmove') as any;
      moveEvent.touches = [{ clientX: 105, clientY: 105 }]; // 5px movement
      window.dispatchEvent(moveEvent);

      expect(handler.getDirection()).toEqual({ dx: 0, dy: 0 });
    });
  });
});
