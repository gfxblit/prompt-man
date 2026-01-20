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
      drawImage: vi.fn(),
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

  it('should initialize the game and render to canvas', async () => {
    // Mock Image for AssetLoader
    class MockImage {
      _src: string = '';
      onload: (() => void) | null = null;
      set src(value: string) {
        this._src = value;
        setTimeout(() => { if (this.onload) this.onload(); }, 0);
      }
    }
    vi.stubGlobal('Image', MockImage);

    await init(container);

    expect(document.createElement).toHaveBeenCalledWith('canvas');
    expect(container.appendChild).toHaveBeenCalledWith(canvas);
    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);
    expect(canvas.getContext).toHaveBeenCalledWith('2d');
    
    // Check for border classes
    expect(canvas.classList.add).toHaveBeenCalledWith('border-2', 'border-gray-600');
    
    // Check if render was called (by checking context calls)
    // The grid is non-empty, so it should clear rect and draw something
    expect(context.clearRect).toHaveBeenCalled();
    // It should draw walls or pellets
    expect(context.fillRect).toHaveBeenCalled();
    // It should draw Pacman and ghosts
    expect(context.lineTo).toHaveBeenCalled();
    expect(context.closePath).toHaveBeenCalled();
  });

  it('should initialize with fallback when asset loading fails', async () => {
    // Mock Image for AssetLoader to fail
    class MockImage {
      _src: string = '';
      onerror: (() => void) | null = null;
      set src(value: string) {
        this._src = value;
        setTimeout(() => { if (this.onerror) this.onerror(); }, 0);
      }
    }
    vi.stubGlobal('Image', MockImage);

    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await init(container);

    expect(document.createElement).toHaveBeenCalledWith('canvas');
    expect(container.appendChild).toHaveBeenCalledWith(canvas);
    expect(canvas.classList.add).toHaveBeenCalledWith('border-2', 'border-gray-600');
    expect(canvas.getContext).toHaveBeenCalledWith('2d');
    
    expect(context.clearRect).toHaveBeenCalled();
    // Should use solid colors (fillRect) instead of drawImage when no spritesheet
    expect(context.fillRect).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});