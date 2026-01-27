import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Renderer } from './renderer.js';
import { Grid } from './grid.js';
import { EntityType } from './types.js';
import type { IGameState, IPacman } from './types.js';
import { TILE_SIZE } from './config.js';

describe('Issue 89: Hide Pacman During Ghost Bonus Score', () => {
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
    rotate: ReturnType<typeof vi.fn>;
    fillStyle: string;
    fillText: ReturnType<typeof vi.fn>;
    font: string;
    textAlign: string;
    textBaseline: string;
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
      rotate: vi.fn(),
      fillStyle: '',
      fillText: vi.fn(),
      font: '',
      textAlign: '',
      textBaseline: '',
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
      startReady: vi.fn(),
    };
  });

  it('should skip rendering Pacman if a point effect is at its position', () => {
    const pacman: IPacman = { 
      type: EntityType.Pacman, 
      x: 5, 
      y: 5, 
      direction: { x: 1, y: 0 }, 
      nextDirection: { x: 1, y: 0 },
      isMoving: false,
      mouthOpen: 0.5
    };
    vi.mocked(mockState.getEntities).mockReturnValue([pacman]);
    vi.mocked(mockState.getPointEffects).mockReturnValue([
      { x: 5, y: 5, points: 200 }
    ]);
    renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D);
    const grid = new Grid(10, 10);

    const fillStyleSetter = vi.spyOn(mockContext, 'fillStyle', 'set');
    renderer.render(grid, mockState);

    // In primitive rendering, Pacman uses 'yellow'
    expect(fillStyleSetter).not.toHaveBeenCalledWith('yellow');

    // Should still draw the point effect
    expect(mockContext.fillText).toHaveBeenCalledWith('200', 5 * TILE_SIZE + TILE_SIZE / 2, 5 * TILE_SIZE + TILE_SIZE / 2);
  });

  it('should skip rendering Pacman (spritesheet) if a point effect is at its position', () => {
    const pacman: IPacman = { 
      type: EntityType.Pacman, 
      x: 5, 
      y: 5, 
      direction: { x: 1, y: 0 }, 
      nextDirection: { x: 1, y: 0 },
      isMoving: false,
      mouthOpen: 0.5
    };
    vi.mocked(mockState.getEntities).mockReturnValue([pacman]);
    vi.mocked(mockState.getPointEffects).mockReturnValue([
      { x: 5, y: 5, points: 200 }
    ]);
    
    const mockSpritesheet = {} as HTMLImageElement;
    renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D, mockSpritesheet);
    const grid = new Grid(10, 10);

    renderer.render(grid, mockState);

    // Should NOT call drawImage for Pacman
    expect(mockContext.drawImage).not.toHaveBeenCalled();

    // Should still draw the point effect
    expect(mockContext.fillText).toHaveBeenCalledWith('200', 5 * TILE_SIZE + TILE_SIZE / 2, 5 * TILE_SIZE + TILE_SIZE / 2);
  });
});
