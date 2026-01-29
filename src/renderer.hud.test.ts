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
  FRUIT_OFFSETS
} from './config.js';
import { SOURCE_TILE_SIZE } from './sprites.js';

interface MockContext {
  fillRect: ReturnType<typeof vi.fn>;
  beginPath: ReturnType<typeof vi.fn>;
  arc: ReturnType<typeof vi.fn>;
  fill: ReturnType<typeof vi.fn>;
  clearRect: ReturnType<typeof vi.fn>;
  lineTo: ReturnType<typeof vi.fn>;
  closePath: ReturnType<typeof vi.fn>;
  drawImage: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
  restore: ReturnType<typeof vi.fn>;
  translate: ReturnType<typeof vi.fn>;
  scale: ReturnType<typeof vi.fn>;
  fillStyle: string;
  fillText: ReturnType<typeof vi.fn>;
  font: string;
  textAlign: string;
  textBaseline: string;
  canvas: {
    width: number;
    height: number;
  };
  _fillStyle: string;
  fillStyleSpy: ReturnType<typeof vi.fn>;
}

describe('Renderer HUD Fruits', () => {
  let mockContext: MockContext;
  let mockState: IGameState;
  let renderer: Renderer;
  let mockSpritesheet: HTMLImageElement;

  beforeEach(() => {
    const fillStyleSpy = vi.fn((val: string) => {
      mockContext._fillStyle = val;
    });

    mockContext = {
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      clearRect: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      get fillStyle() { return this._fillStyle; },
      set fillStyle(val) { fillStyleSpy(val); },
      _fillStyle: '',
      fillStyleSpy: fillStyleSpy,
      fillText: vi.fn(),
      font: '',
      textAlign: '',
      textBaseline: '',
      canvas: {
        width: 10 * TILE_SIZE + MAZE_RENDER_OFFSET_X * 2,
        height: 15 * TILE_SIZE + MAZE_RENDER_OFFSET_Y + MAZE_RENDER_MARGIN_BOTTOM
      }
    };
    mockState = {
      getEntities: vi.fn().mockReturnValue([]),
      getScore: vi.fn().mockReturnValue(0),
      getHighScore: vi.fn().mockReturnValue(0),
      getLives: vi.fn().mockReturnValue(0),
      getRemainingPellets: vi.fn().mockReturnValue(0),
      getSpawnPosition: vi.fn(),
      consumePellet: vi.fn(),
      isPelletEaten: vi.fn().mockReturnValue(false),
      updatePacman: vi.fn(),
      updateGhosts: vi.fn(),
      isGameOver: vi.fn().mockReturnValue(false),
      isWin: vi.fn().mockReturnValue(false),
      getLevel: vi.fn().mockReturnValue(1),
      isDying: vi.fn().mockReturnValue(false),
      isReady: vi.fn().mockReturnValue(false),
      getPowerUpTimer: vi.fn().mockReturnValue(0),
      getPointEffects: vi.fn().mockReturnValue([]),
      getFruit: vi.fn().mockReturnValue(null),
      startReady: vi.fn(),
    };

    mockSpritesheet = {} as HTMLImageElement;
  });

  it('should render fruits in HUD for Level 2 (Cherry, Strawberry)', () => {
    renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D, mockSpritesheet);
    const grid = new Grid(10, 10);
    vi.mocked(mockState.getLevel).mockReturnValue(2);

    renderer.render(grid, mockState);

    // Expect drawImage to be called for Cherry and Strawberry
    const cherryOffset = FRUIT_OFFSETS.Cherry;
    const strawberryOffset = FRUIT_OFFSETS.Strawberry;

    // Check for Cherry draw call
    expect(mockContext.drawImage).toHaveBeenCalledWith(
      mockSpritesheet,
      cherryOffset.x + PALETTE_PADDING_X,
      cherryOffset.y + PALETTE_PADDING_Y,
      SOURCE_TILE_SIZE - PALETTE_PADDING_X,
      SOURCE_TILE_SIZE - PALETTE_PADDING_Y,
      expect.any(Number), // destX
      expect.any(Number), // destY
      TILE_SIZE,
      TILE_SIZE
    );

    // Check for Strawberry draw call
    expect(mockContext.drawImage).toHaveBeenCalledWith(
      mockSpritesheet,
      strawberryOffset.x + PALETTE_PADDING_X,
      strawberryOffset.y + PALETTE_PADDING_Y,
      SOURCE_TILE_SIZE - PALETTE_PADDING_X,
      SOURCE_TILE_SIZE - PALETTE_PADDING_Y,
      expect.any(Number), // destX
      expect.any(Number), // destY
      TILE_SIZE,
      TILE_SIZE
    );
  });
  
  it('should not render fruits if spritesheet is missing', () => {
      renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D, undefined);
      const grid = new Grid(10, 10);
      vi.mocked(mockState.getLevel).mockReturnValue(2);
      
      renderer.render(grid, mockState);
      
      // Should not call drawImage for fruits (or at all if no other sprites)
      // Since getEntities returns [], only walls/pellets might be drawn.
      // But walls/pellets use rects if no spritesheet.
      // So drawImage should not be called.
      expect(mockContext.drawImage).not.toHaveBeenCalled();
  });
});
