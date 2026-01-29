import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Renderer } from './renderer.js';
import { Grid } from './grid.js';
import { EntityType, FruitType } from './types.js';
import type { IGameState } from './types.js';
import {
  TILE_SIZE,
  MAZE_RENDER_OFFSET_X,
  MAZE_RENDER_OFFSET_Y,
  MAZE_RENDER_MARGIN_BOTTOM,
} from './config.js';
import { createMockContext, createMockState, type MockContext } from './test-utils.js';

describe('Issue #113: Fruit Transparency Reproduction', () => {
  let mockContext: MockContext;
  let mockState: IGameState;
  let renderer: Renderer;
  let mockSpritesheet: HTMLImageElement;

  beforeEach(() => {
    mockContext = createMockContext(
      10 * TILE_SIZE + MAZE_RENDER_OFFSET_X * 2,
      15 * TILE_SIZE + MAZE_RENDER_OFFSET_Y + MAZE_RENDER_MARGIN_BOTTOM
    );
    mockState = createMockState();

    mockSpritesheet = {
        width: 256,
        height: 256
    } as HTMLImageElement;

    // Mock document.createElement for canvas
    const mockCanvas = {
      getContext: vi.fn().mockReturnValue({
        drawImage: vi.fn(),
        getImageData: vi.fn().mockReturnValue({
          data: new Uint8ClampedArray(16 * 16 * 4)
        }),
        putImageData: vi.fn()
      }),
      width: 0,
      height: 0
    };
    vi.stubGlobal('document', {
      createElement: vi.fn().mockReturnValue(mockCanvas)
    });
  });

  it('should render fruits on board using transparency cache (canvas instead of spritesheet)', () => {
    renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D, mockSpritesheet);
    const grid = new Grid(10, 10);
    
    vi.mocked(mockState.getEntities).mockReturnValue([{
      type: EntityType.Fruit,
      fruitType: FruitType.Cherry,
      x: 5,
      y: 5
    }]);

    renderer.render(grid, mockState);

    // Should NOT call drawImage with mockSpritesheet for the fruit
    // It should call it with an HTMLCanvasElement (the cache)
    const drawImageCalls = mockContext.drawImage.mock.calls;
    const fruitDrawCall = drawImageCalls.find(call => 
        call[5] === 5 * TILE_SIZE + TILE_SIZE / 2 + MAZE_RENDER_OFFSET_X - TILE_SIZE / 2 &&
        call[6] === 5 * TILE_SIZE + TILE_SIZE / 2 + MAZE_RENDER_OFFSET_Y - TILE_SIZE / 2
    );

    expect(fruitDrawCall).toBeDefined();
    expect(fruitDrawCall![0]).not.toBe(mockSpritesheet);
    expect(fruitDrawCall![0].constructor.name).toBe('Object'); // Our mocked canvas is an object
  });

  it('should render fruits in HUD using transparency cache (canvas instead of spritesheet)', () => {
    renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D, mockSpritesheet);
    const grid = new Grid(10, 10);
    vi.mocked(mockState.getLevel).mockReturnValue(1); // Level 1 has Cherry

    renderer.render(grid, mockState);

    // Find the HUD fruit draw call. It should be near the bottom right.
    const drawImageCalls = mockContext.drawImage.mock.calls;
    
    // We expect at least one drawImage call for the HUD fruit
    // HUD fruits are rendered after tiles and entities.
    // Cherry offset is { x: 600, y: 488 } (from config.ts)
    
    const hudFruitCall = drawImageCalls.find(call => 
        call[0] !== mockSpritesheet && 
        call[5] > 100 && // destX
        call[6] > 100    // destY
    );

    expect(hudFruitCall).toBeDefined();
    expect(hudFruitCall![0]).not.toBe(mockSpritesheet);
  });
});