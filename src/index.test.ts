import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { init } from './index.js';

describe('index', () => {
  let container: HTMLElement;
  let canvas: HTMLCanvasElement;
  let context: CanvasRenderingContext2D;

  beforeEach(() => {
    // Mock context
    context = {
      clearRect: vi.fn(),
      fillStyle: '',
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      stroke: vi.fn(),
      strokeStyle: '',
      lineWidth: 0,
    } as unknown as CanvasRenderingContext2D;

    // Mock canvas
    canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => context),
      classList: {
        add: vi.fn(),
      },
    } as unknown as HTMLCanvasElement;

    // Mock document
    vi.stubGlobal('document', {
      createElement: vi.fn((tagName: string) => {
        if (tagName === 'canvas') return canvas;
        throw new Error(`Unexpected tag name: ${tagName}`);
      }),
    });

    // Mock container
    container = {
      appendChild: vi.fn(),
    } as unknown as HTMLElement;

    // Mock requestAnimationFrame
    let animationFrameId = 0;
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      animationFrameId++;
      // Simulate continuous animation by calling the callback a few times
      if (animationFrameId <= 2) {
        callback(performance.now() + animationFrameId * 16); // ~60fps
      }
      return animationFrameId;
    }));

    vi.stubGlobal('cancelAnimationFrame', vi.fn(() => {
      // Mock implementation
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should initialize the game and render to canvas', () => {
    init(container);

    expect(document.createElement).toHaveBeenCalledWith('canvas');
    expect(container.appendChild).toHaveBeenCalledWith(canvas);
    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);
    expect(canvas.getContext).toHaveBeenCalledWith('2d');
    
    // Check for game-canvas class
    expect(canvas.classList.add).toHaveBeenCalledWith('game-canvas');
    
    // Check if render was called (by checking context calls)
    // The grid is non-empty, so it should clear rect and draw something
    expect(context.clearRect).toHaveBeenCalled();
    // It should draw walls or pellets
    expect(context.fillRect).toHaveBeenCalled();
    // It should draw Pacman and ghosts
    expect(context.lineTo).toHaveBeenCalled();
    expect(context.closePath).toHaveBeenCalled();
  });
});