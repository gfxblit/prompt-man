import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { init } from './index.js';
import { setupMockImage } from './test-utils.js';

describe('Issue #42: iPhone portrait mode cropping', () => {
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

    // Mock container
    container = {
      appendChild: vi.fn(),
      classList: {
        add: vi.fn(),
      },
    } as unknown as HTMLElement;

    // Mock document
    vi.stubGlobal('document', {
      createElement: vi.fn((tagName: string) => {
        if (tagName === 'canvas') return canvas;
        if (tagName === 'div') {
          return {
            id: '',
            classList: {
              add: vi.fn(),
            },
            appendChild: vi.fn(),
          };
        }
        return {
           classList: { add: vi.fn() },
           appendChild: vi.fn()
        };
      }),
    });

    // Mock requestAnimationFrame
    vi.stubGlobal('requestAnimationFrame', vi.fn());
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal('localStorage', { getItem: vi.fn(), setItem: vi.fn() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should apply "game-canvas" class to canvas for responsive sizing', async () => {
    setupMockImage();
    await init(container);

    // This checks if 'game-canvas' was ever passed to classList.add
    // classList.add can be called with multiple args: add('a', 'b')
    // or multiple times: add('a'); add('b');
    // We want to ensure 'game-canvas' is present to pick up the CSS rules:
    // max-width: 100%; max-height: 100%; object-fit: contain;
    
    const addSpy = canvas.classList.add as unknown as { mock: { calls: string[][] } };
    const allAddedClasses = addSpy.mock.calls.flat();
    
    expect(allAddedClasses).toContain('game-canvas');
  });

  it('should apply responsive classes to the container for mobile centering', async () => {
    setupMockImage();
    await init(container);

    const addSpy = container.classList.add as unknown as { mock: { calls: string[][] } };
    const allAddedClasses = addSpy.mock.calls.flat();
    
    expect(allAddedClasses).toContain('flex');
    expect(allAddedClasses).toContain('flex-col');
    expect(allAddedClasses).toContain('items-center');
    expect(allAddedClasses).toContain('justify-center');
    expect(allAddedClasses).toContain('max-w-full');
    expect(allAddedClasses).toContain('max-h-full');
  });
});
