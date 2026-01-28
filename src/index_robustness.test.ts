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

    (mockContext as { canvas: HTMLCanvasElement }).canvas = canvas;

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
      classList: {
        add: vi.fn(),
      },
    } as unknown as HTMLElement;

    // Mock requestAnimationFrame
    vi.stubGlobal('requestAnimationFrame', vi.fn((cb) => {
      // Store callback for manual execution if needed, but don't auto-run
        // biome-ignore lint/suspicious/noExplicitAny: lastRafCallback is a test utility not part of the production code.
      (globalThis as unknown as { lastRafCallback: FrameRequestCallback }).lastRafCallback = cb; 
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
    const loop = (globalThis as unknown as { lastRafCallback: FrameRequestCallback }).lastRafCallback;
    if (loop) loop(100);

    expect(mockContext.clearRect).toHaveBeenCalled(); 
  });
});