import type { Direction } from './types.js';

export class InputHandler {
  private static instance: InputHandler | null = null;
  private currentDirection: Direction = { dx: 0, dy: 0 };
  private handleKeyDownBound: (event: KeyboardEvent) => void;

  private constructor() {
    this.handleKeyDownBound = this.handleKeyDown.bind(this);
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDownBound);
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

  getDirection(): Direction {
    return this.currentDirection;
  }

  dispose(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleKeyDownBound);
    }
    InputHandler.instance = null;
  }
}
