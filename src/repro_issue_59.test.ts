import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Renderer } from './renderer.js';
import { Grid } from './grid.js';
import { EntityType } from './types.js';
import type { IGameState } from './types.js';
import {
  TILE_SIZE,
  MAZE_RENDER_OFFSET_X,
  MAZE_RENDER_OFFSET_Y,
  MAZE_RENDER_MARGIN_BOTTOM
} from './config.js';

describe('Issue 59: Ghost Rendering on Death', () => {
  let mockContext: {
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
  };
  let mockState: IGameState;
  let renderer: Renderer;

  beforeEach(() => {
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
      fillStyle: '',
      fillText: vi.fn(),
      font: '',
      textAlign: '',
      textBaseline: '',
      canvas: {
        width: 10 * TILE_SIZE + MAZE_RENDER_OFFSET_X * 2,
        height: 10 * TILE_SIZE + MAZE_RENDER_OFFSET_Y + MAZE_RENDER_MARGIN_BOTTOM
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
  });

  it('should NOT render ghosts when state.isDying() is true', () => {
    const grid = new Grid(1, 1);
    const entities = [{ type: EntityType.Ghost, x: 0, y: 0, color: 'red' }];
    vi.mocked(mockState.getEntities).mockReturnValue(entities);
    vi.mocked(mockState.isDying).mockReturnValue(true);

    renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D);
    renderer.render(grid, mockState);

    // Ghost rendering calls (simple circle rendering without spritesheet)
    expect(mockContext.arc).not.toHaveBeenCalled();
    expect(mockContext.fill).not.toHaveBeenCalled();
    expect(mockContext.drawImage).not.toHaveBeenCalled();
  });

  it('should render ghosts when state.isDying() is false', () => {
    const grid = new Grid(1, 1);
    const entities = [{ type: EntityType.Ghost, x: 0, y: 0, color: 'red' }];
    vi.mocked(mockState.getEntities).mockReturnValue(entities);
    vi.mocked(mockState.isDying).mockReturnValue(false);

    renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D);
    const fillStyleSpy = vi.spyOn(mockContext, 'fillStyle', 'set');
    renderer.render(grid, mockState);

    // Should render ghost (fallback rendering)
    expect(fillStyleSpy).toHaveBeenCalledWith('red');
    expect(mockContext.beginPath).toHaveBeenCalled();
    expect(mockContext.arc).toHaveBeenCalled();
    expect(mockContext.fill).toHaveBeenCalled();
  });

  it('should NOT render ghosts using spritesheet when state.isDying() is true', () => {
    const mockSpritesheet = {} as HTMLImageElement;
    renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D, mockSpritesheet);
    const grid = new Grid(1, 1);
    const entities = [{ type: EntityType.Ghost, x: 0, y: 0, color: 'red', animationFrame: 0 }];
    vi.mocked(mockState.getEntities).mockReturnValue(entities);
    vi.mocked(mockState.isDying).mockReturnValue(true);

        renderer.render(grid, mockState);

    

        // Should NOT call drawImage for Ghost (sourceY < 400)

        // It might be called for HUD fruits (sourceY > 400)

        const calls = mockContext.drawImage.mock.calls;

        const ghostCalls = calls.filter(args => args[2] < 400);

        expect(ghostCalls.length).toBe(0);

      });

    });

    