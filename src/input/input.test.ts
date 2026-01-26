import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InputHandler } from './input.js';
import { JOYSTICK } from '../constants/config.js';

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
      const event = new CustomEvent('touchstart') as unknown as TouchEvent;
      Object.defineProperty(event, 'touches', { value: [{ clientX: 100, clientY: 100 }] });
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
      const startEvent = new CustomEvent('touchstart') as unknown as TouchEvent;
      Object.defineProperty(startEvent, 'touches', { value: [{ clientX: 100, clientY: 100 }] });
      window.dispatchEvent(startEvent);

      // Move touch right (outside 10px deadzone)
      const moveEvent = new CustomEvent('touchmove') as unknown as TouchEvent;
      Object.defineProperty(moveEvent, 'touches', { value: [{ clientX: 120, clientY: 100 }] });
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
      const moveUpEvent = new CustomEvent('touchmove') as unknown as TouchEvent;
      Object.defineProperty(moveUpEvent, 'touches', { value: [{ clientX: 120, clientY: 70 }] });
      window.dispatchEvent(moveUpEvent);
      expect(handler.getDirection()).toEqual({ dx: 0, dy: -1 });
    });

    it('should clamp joystick position to MAX_DISTANCE', () => {
      // Start touch at (100, 100)
      const startEvent = new CustomEvent('touchstart') as unknown as TouchEvent;
      Object.defineProperty(startEvent, 'touches', { value: [{ clientX: 100, clientY: 100 }] });
      window.dispatchEvent(startEvent);

      // Move touch far to the right (200, 100)
      const moveEvent = new CustomEvent('touchmove') as unknown as TouchEvent;
      Object.defineProperty(moveEvent, 'touches', { value: [{ clientX: 200, clientY: 100 }] });
      window.dispatchEvent(moveEvent);

      const state = handler.getJoystickState();
      const maxDistance = JOYSTICK.BASE_RADIUS - JOYSTICK.STICK_RADIUS;
      // Distance is 100, but should be clamped to maxDistance (20)
      // originX (100) + 20 = 120
      expect(state.currentX).toBe(100 + maxDistance);
      expect(state.currentY).toBe(100);
      expect(handler.getDirection()).toEqual({ dx: 1, dy: 0 });

      // Move touch far diagonally (200, 200)
      // distance = sqrt(100^2 + 100^2) = 141.4
      // clamped distance = maxDistance (20)
      // normalized dx, dy = (1/sqrt(2), 1/sqrt(2))
      // currentX = 100 + 20 * (1/sqrt(2)) = 100 + 14.14 = 114.14
      const moveDiagonalEvent = new CustomEvent('touchmove') as unknown as TouchEvent;
      Object.defineProperty(moveDiagonalEvent, 'touches', { value: [{ clientX: 200, clientY: 200 }] });
      window.dispatchEvent(moveDiagonalEvent);

      const diagonalState = handler.getJoystickState();
      const expectedOffset = maxDistance / Math.sqrt(2);
      expect(diagonalState.currentX).toBeCloseTo(100 + expectedOffset, 4);
      expect(diagonalState.currentY).toBeCloseTo(100 + expectedOffset, 4);
    });

    it('should deactivate joystick on touchend', () => {
      const startEvent = new CustomEvent('touchstart') as unknown as TouchEvent;
      Object.defineProperty(startEvent, 'touches', { value: [{ clientX: 100, clientY: 100 }] });
      window.dispatchEvent(startEvent);

      const endEvent = new CustomEvent('touchend') as unknown as TouchEvent;
      window.dispatchEvent(endEvent);

      expect(handler.getJoystickState().active).toBe(false);
    });

    it('should ignore small movements within deadzone', () => {
      const startEvent = new CustomEvent('touchstart') as unknown as TouchEvent;
      Object.defineProperty(startEvent, 'touches', { value: [{ clientX: 100, clientY: 100 }] });
      window.dispatchEvent(startEvent);

      const moveEvent = new CustomEvent('touchmove') as unknown as TouchEvent;
      Object.defineProperty(moveEvent, 'touches', { value: [{ clientX: 105, clientY: 105 }] });
      window.dispatchEvent(moveEvent);

      expect(handler.getDirection()).toEqual({ dx: 0, dy: 0 });
    });

    it('should translate coordinates if targetElement is set', () => {
      const mockElement = {
        getBoundingClientRect: vi.fn().mockReturnValue({ left: 10, top: 10, width: 100, height: 100 }),
        width: 200,
        height: 200,
      } as unknown as HTMLCanvasElement;
      handler.setTargetElement(mockElement);

      const event = new CustomEvent('touchstart', { cancelable: true }) as unknown as TouchEvent;
      Object.defineProperty(event, 'touches', { value: [{ clientX: 20, clientY: 20 }] });
      event.preventDefault = vi.fn();
      window.dispatchEvent(event);

      // (20 - 10) * (200 / 100) = 10 * 2 = 20
      expect(handler.getJoystickState().originX).toBe(20);
      expect(handler.getJoystickState().originY).toBe(20);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });
});