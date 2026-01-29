import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Renderer } from './renderer.js';
import { Grid } from './grid.js';
import type { IGameState } from './types.js';
import {
  TILE_SIZE,
  MAZE_RENDER_OFFSET_X,
  MAZE_RENDER_OFFSET_Y,
  MAZE_RENDER_MARGIN_BOTTOM,
  PALETTE_PADDING_X,
  PALETTE_PADDING_Y,
  SOURCE_FRUIT_SIZE
} from './config.js';
import { createMockContext, createMockState, type MockContext } from './test-utils.js';

describe('Renderer HUD Fruits', () => {
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

    mockSpritesheet = {} as HTMLImageElement;

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

  it('should render fruits in HUD for Level 2 (Cherry, Strawberry) at correct positions', () => {
    renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D, mockSpritesheet);
    const grid = new Grid(10, 10);
    vi.mocked(mockState.getLevel).mockReturnValue(2);

    renderer.render(grid, mockState);

    // Expect drawImage to be called for Cherry and Strawberry

    const width = 10 * TILE_SIZE + MAZE_RENDER_OFFSET_X * 2;
    const height = 15 * TILE_SIZE + MAZE_RENDER_OFFSET_Y + MAZE_RENDER_MARGIN_BOTTOM;
    const startX = width - TILE_SIZE * 2 - MAZE_RENDER_OFFSET_X;
    const startY = height - TILE_SIZE * 2;
    const gap = TILE_SIZE * 1.2;

    const strawberryDestX = startX - TILE_SIZE / 2;
    const strawberryDestY = startY;

    const cherryDestX = startX - gap - TILE_SIZE / 2;
    const cherryDestY = startY;

    // Check for Cherry draw call
    expect(mockContext.drawImage).toHaveBeenCalledWith(
      expect.anything(),
      0, // sourceX (from canvas)
      0, // sourceY (from canvas)
      SOURCE_FRUIT_SIZE - PALETTE_PADDING_X,
      SOURCE_FRUIT_SIZE - PALETTE_PADDING_Y,
      cherryDestX,
      cherryDestY,
      TILE_SIZE,
      TILE_SIZE
    );

    // Check for Strawberry draw call
    expect(mockContext.drawImage).toHaveBeenCalledWith(
      expect.anything(),
      0, // sourceX (from canvas)
      0, // sourceY (from canvas)
      SOURCE_FRUIT_SIZE - PALETTE_PADDING_X,
      SOURCE_FRUIT_SIZE - PALETTE_PADDING_Y,
      strawberryDestX,
      strawberryDestY,
      TILE_SIZE,
      TILE_SIZE
    );
  });
  
  it('should not render fruits if spritesheet is missing', () => {
      renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D, undefined);
      const grid = new Grid(10, 10);
      vi.mocked(mockState.getLevel).mockReturnValue(2);
      
      renderer.render(grid, mockState);
      
      expect(mockContext.drawImage).not.toHaveBeenCalled();
  });
});