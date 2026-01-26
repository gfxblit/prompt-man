import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Renderer } from './renderer.js';
import { Grid } from './grid.js';
import type { IGameState } from './types.js';
import { COLORS } from './config.js';

describe('Renderer - Ready State', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockContext: any;
  let renderer: Renderer;
  let mockState: IGameState;

  beforeEach(() => {
    mockContext = {
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      fillStyle: '',
      font: '',
      textAlign: '',
      textBaseline: '',
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      closePath: vi.fn(),
      lineTo: vi.fn(),
    };

    mockState = {
      getEntities: vi.fn().mockReturnValue([]),
      getScore: vi.fn().mockReturnValue(0),
      getHighScore: vi.fn().mockReturnValue(0),
      getLives: vi.fn().mockReturnValue(3),
      getRemainingPellets: vi.fn().mockReturnValue(10),
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

    renderer = new Renderer(mockContext);
  });

  it('should render READY! text when state is ready', () => {
    vi.mocked(mockState.isReady).mockReturnValue(true);
    const grid = new Grid(10, 10);

    renderer.render(grid, mockState);

    expect(mockContext.fillStyle).toBe(COLORS.PACMAN);
    // Expect "READY!" to be drawn
    expect(mockContext.fillText).toHaveBeenCalledWith(
      'READY!',
      expect.any(Number),
      expect.any(Number)
    );
  });

  it('should NOT render READY! text when state is NOT ready', () => {
    vi.mocked(mockState.isReady).mockReturnValue(false);
    const grid = new Grid(10, 10);

    renderer.render(grid, mockState);

    expect(mockContext.fillText).not.toHaveBeenCalledWith(
      'READY!',
      expect.any(Number),
      expect.any(Number)
    );
  });
});