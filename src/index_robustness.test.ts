/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { init } from './index.js';
import { setupMockImage, mock2dContext, MockImage, setupMockAudio } from './test-utils.js';

describe('index robustness', () => {
  let container: HTMLElement;
  let canvas: HTMLCanvasElement;
  let mockContext: CanvasRenderingContext2D;

  beforeEach(() => {
    mockContext = mock2dContext();
    MockImage.shouldFail = false; // Ensure assets load successfully

    // Mock canvas
    canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => mockContext), // Return mockContext
      classList: {
        add: vi.fn(),
      },
    } as unknown as HTMLCanvasElement;

    // Mock document
    vi.stubGlobal('document', {
      createElement: vi.fn((tagName: string) => {
        if (tagName === 'canvas') return canvas;
        if (tagName === 'div') {
          return {
            id: '',
            classList: { add: vi.fn() },
            appendChild: vi.fn(),
            _innerText: '',
            get innerText() { return this._innerText; },
            set innerText(val: string) { this._innerText = val; },
          };
        }
        throw new Error(`Unexpected tag name: ${tagName}`);
      }),
    });

    // Mock container
    container = {
      appendChild: vi.fn(),
      classList: {
        add: vi.fn(),
      },
    } as unknown as HTMLElement;

    // Mock requestAnimationFrame
    vi.stubGlobal('requestAnimationFrame', vi.fn((cb) => {
      // Store callback for manual execution if needed, but don't auto-run
        // biome-ignore lint/suspicious/noExplicitAny: lastRafCallback is a test utility not part of the production code.
      (globalThis as any).lastRafCallback = cb; 
      return 1;
    }));


    vi.stubGlobal('performance', {
      now: vi.fn(() => 0)
    });

    // Mock localStorage
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should start the game loop even if getContext(2d) returns null', async () => {
    // Override getContext for this specific test
    canvas.getContext = vi.fn(() => null);

    setupMockImage();
    setupMockAudio();
    await init(container);

    expect(canvas.getContext).toHaveBeenCalledWith('2d');
    expect(requestAnimationFrame).toHaveBeenCalled();
  });

  it('should render game and UI elements when a valid 2D context is available', async () => {
    setupMockImage();
    setupMockAudio();
    
    // Set up localStorage mock BEFORE init is called
    vi.spyOn(localStorage, 'getItem').mockReturnValue('100');

    await init(container);

    expect(canvas.getContext).toHaveBeenCalledWith('2d');

    // Execute the captured loop callback manually
      // biome-ignore lint/suspicious/noExplicitAny: lastRafCallback is a test utility not part of the production code.
    const loop = (globalThis as any).lastRafCallback;
    if (loop) loop(100);

    expect(mockContext.clearRect).toHaveBeenCalled(); 
  });
});