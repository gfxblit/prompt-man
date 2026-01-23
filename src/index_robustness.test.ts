/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { init } from './index.js';
import { setupMockImage, mock2dContext, MockImage } from './test-utils.js';

describe('index robustness', () => {
  let container: HTMLElement;
  let canvas: HTMLCanvasElement;
  let mockContext: CanvasRenderingContext2D;

  // These will hold references to our mocked DOM elements
  let scoreElMock: any;
  let highScoreElMock: any;
  let scoreContainerMock: any;

  beforeEach(() => {
    mockContext = mock2dContext();
    MockImage.shouldFail = false; // Ensure assets load successfully

    // Reset mocks before each test
    scoreElMock = {
      id: 'score',
      _innerText: '',
      get innerText() { return this._innerText; },
      set innerText(val: string) { this._innerText = val; },
      classList: { add: vi.fn() },
    };
    highScoreElMock = {
      id: 'highscore',
      _innerText: '',
      get innerText() { return this._innerText; },
      set innerText(val: string) { this._innerText = val; },
      classList: { add: vi.fn() },
    };
    scoreContainerMock = {
      id: '',
      classList: { add: vi.fn() },
      appendChild: vi.fn(),
      children: [scoreElMock, highScoreElMock], // Pre-fill with our mocked score/highscore elements
    };


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
    let scoreContainerUsed = false;
    vi.stubGlobal('document', {
      createElement: vi.fn((tagName: string) => {
        if (tagName === 'canvas') return canvas;
        if (tagName === 'div') {
          const div = {
            id: '',
            classList: { add: vi.fn() },
            appendChild: vi.fn(),
            _innerText: '',
            get innerText() { return this._innerText; },
            set innerText(val: string) { this._innerText = val; },
          };

          // Instead of relying on creation order, assign mocks based on how they're used.
          // We assume the first div created is the score container.
          if (!scoreContainerUsed) {
            scoreContainerUsed = true;
            // Simulate appendChild behavior to link score/highscore elements
            div.appendChild = vi.fn((child: any) => {
              if (child.id === 'score') {
                Object.defineProperty(scoreElMock, 'innerText', {
                  get: () => child.innerText,
                  set: (v) => { child.innerText = v; },
                  configurable: true
                });
              }
              if (child.id === 'highscore') {
                Object.defineProperty(highScoreElMock, 'innerText', {
                  get: () => child.innerText,
                  set: (v) => { child.innerText = v; },
                  configurable: true
                });
              }
            });
            return div;
          }
          
          return div;
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
    await init(container);

    expect(canvas.getContext).toHaveBeenCalledWith('2d');
    expect(requestAnimationFrame).toHaveBeenCalled();
  });

  it('should render game and UI elements when a valid 2D context is available and update high score display', async () => {
    setupMockImage();
    
    // Set up localStorage mock BEFORE init is called
    vi.spyOn(localStorage, 'getItem').mockReturnValue('100');

    await init(container);

    expect(canvas.getContext).toHaveBeenCalledWith('2d');

    // Execute the captured loop callback manually
    const loop = (globalThis as any).lastRafCallback;
    if (loop) loop(100);

    expect(mockContext.clearRect).toHaveBeenCalled(); 

    // Verify initial high score display
    expect(highScoreElMock.innerText).toBe('High Score: 100');

    // Manually trigger a frame update
    (performance.now as Mock).mockReturnValue(100); 
    
    expect(highScoreElMock.innerText).toContain('High Score:');
  });
});
