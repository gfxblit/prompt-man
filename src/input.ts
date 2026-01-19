import type { Direction, JoystickState } from './types.js';

export class InputHandler {
  private static instance: InputHandler | null = null;
  private currentDirection: Direction = { dx: 0, dy: 0 };
  private handleKeyDownBound: (event: KeyboardEvent) => void;
  private handleTouchStartBound: (event: TouchEvent) => void;
  private handleTouchMoveBound: (event: TouchEvent) => void;
  private handleTouchEndBound: (event: TouchEvent) => void;

  private joystickState: JoystickState = {
    active: false,
    originX: 0,
    originY: 0,
    currentX: 0,
    currentY: 0,
  };

  private constructor() {
    this.handleKeyDownBound = this.handleKeyDown.bind(this);
    this.handleTouchStartBound = this.handleTouchStart.bind(this);
    this.handleTouchMoveBound = this.handleTouchMove.bind(this);
    this.handleTouchEndBound = this.handleTouchEnd.bind(this);

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDownBound);
      window.addEventListener('touchstart', this.handleTouchStartBound, { passive: false });
      window.addEventListener('touchmove', this.handleTouchMoveBound, { passive: false });
      window.addEventListener('touchend', this.handleTouchEndBound);
    }
  }

  public static getInstance(): InputHandler {
    if (!InputHandler.instance) {
      InputHandler.instance = new InputHandler();
    }
    return InputHandler.instance;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        this.currentDirection = { dx: 0, dy: -1 };
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        this.currentDirection = { dx: 0, dy: 1 };
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.currentDirection = { dx: -1, dy: 0 };
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.currentDirection = { dx: 1, dy: 0 };
        break;
    }
  }

  private handleTouchStart(event: TouchEvent): void {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.joystickState = {
        active: true,
        originX: touch.clientX,
        originY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
      };
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    if (this.joystickState.active && event.touches.length > 0) {
      const touch = event.touches[0];
      this.joystickState.currentX = touch.clientX;
      this.joystickState.currentY = touch.clientY;

      const dx = this.joystickState.currentX - this.joystickState.originX;
      const dy = this.joystickState.currentY - this.joystickState.originY;

      const DEADZONE = 10;
      if (Math.sqrt(dx * dx + dy * dy) > DEADZONE) {
        if (Math.abs(dx) > Math.abs(dy)) {
          this.currentDirection = { dx: Math.sign(dx) as -1 | 0 | 1, dy: 0 };
        } else {
          this.currentDirection = { dx: 0, dy: Math.sign(dy) as -1 | 0 | 1 };
        }
      }
    }
  }

  private handleTouchEnd(): void {
    this.joystickState.active = false;
  }

  getDirection(): Direction {
    return this.currentDirection;
  }

  getJoystickState(): JoystickState {
    return this.joystickState;
  }

  dispose(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleKeyDownBound);
      window.removeEventListener('touchstart', this.handleTouchStartBound);
      window.removeEventListener('touchmove', this.handleTouchMoveBound);
      window.removeEventListener('touchend', this.handleTouchEndBound);
    }
    InputHandler.instance = null;
  }
}
