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

describe('Issue #113: Fruit Transparency Reproduction', () => {
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
    // Cherry offset is {x: 0, y: 144} (from config.ts)
    
    const hudFruitCall = drawImageCalls.find(call => 
        call[0] !== mockSpritesheet && 
        call[5] > 100 && // destX
        call[6] > 100    // destY
    );

    expect(hudFruitCall).toBeDefined();
    expect(hudFruitCall![0]).not.toBe(mockSpritesheet);
  });
});
