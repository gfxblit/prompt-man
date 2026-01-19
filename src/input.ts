import type { Direction, JoystickState } from './types.js';
import { JOYSTICK } from './config.js';

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

  private targetElement: HTMLElement | null = null;

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

  public setTargetElement(element: HTMLElement): void {
    this.targetElement = element;
  }

  private translateCoordinates(clientX: number, clientY: number): { x: number; y: number } {
    if (!this.targetElement) {
      return { x: clientX, y: clientY };
    }

    const rect = this.targetElement.getBoundingClientRect();
    const scaleX = (this.targetElement as HTMLCanvasElement).width / rect.width;
    const scaleY = (this.targetElement as HTMLCanvasElement).height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
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
    const touch = event.touches[0];
    if (touch) {
      const coords = this.translateCoordinates(touch.clientX, touch.clientY);
      this.joystickState = {
        active: true,
        originX: coords.x,
        originY: coords.y,
        currentX: coords.x,
        currentY: coords.y,
      };
      if (this.targetElement) {
        event.preventDefault();
      }
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    const touch = event.touches[0];
    if (this.joystickState.active && touch) {
      const coords = this.translateCoordinates(touch.clientX, touch.clientY);
      
      let dx = coords.x - this.joystickState.originX;
      let dy = coords.y - this.joystickState.originY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > JOYSTICK.MAX_DISTANCE) {
        const ratio = JOYSTICK.MAX_DISTANCE / distance;
        dx *= ratio;
        dy *= ratio;
      }

      this.joystickState.currentX = this.joystickState.originX + dx;
      this.joystickState.currentY = this.joystickState.originY + dy;

      if (distance > JOYSTICK.DEADZONE) {
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