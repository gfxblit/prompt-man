import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { init } from './index.js';
import { setupMockImage } from './test-utils.js';

describe('index robustness', () => {
  let container: HTMLElement;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    // Mock canvas
    canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => null), // Return null context
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
            classList: {
              add: vi.fn(),
            },
            appendChild: vi.fn(),
            set innerText(val: string) {},
            get innerText() { return ''; }
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
    vi.stubGlobal('requestAnimationFrame', vi.fn());

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

  it('should not start the game loop if getContext(2d) returns null', async () => {
    setupMockImage();

    await init(container);

    expect(canvas.getContext).toHaveBeenCalledWith('2d');
    // If context is null, the loop should NOT have been started via requestAnimationFrame
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });
});
