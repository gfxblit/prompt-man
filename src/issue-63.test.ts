import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameState } from './state.js';
import { Renderer } from './renderer.js';
import { Grid } from './grid.js';
import { READY_DURATION, COLORS, PACMAN_SPEED } from './config.js';
import { TileType, EntityType } from './types.js';

describe('Issue #63 Verification: Ready Title and State', () => {
  let grid: Grid;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockContext: any;
  let renderer: Renderer;

  beforeEach(() => {
    grid = new Grid(10, 10);
    grid.setTile(0, 0, TileType.PacmanSpawn);
    grid.setTile(1, 1, TileType.GhostSpawn);
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
    });

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
    renderer = new Renderer(mockContext);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should initialize game in READY state', () => {
    const state = new GameState(grid);
    expect(state.isReady()).toBe(true);
  });

  it('should render "READY!" text in yellow when in ready state', () => {
    const state = new GameState(grid);
    // Ensure we are in ready state
    expect(state.isReady()).toBe(true);

    renderer.render(grid, state);

    // Verify text
    expect(mockContext.fillText).toHaveBeenCalledWith(
      'READY!',
      expect.any(Number), // x
      expect.any(Number)  // y
    );

    // Verify color
    expect(mockContext.fillStyle).toBe(COLORS.PACMAN);
  });

  it('should transition out of READY state after READY_DURATION', () => {
    const state = new GameState(grid);
    
    // Advance time just before duration
    state.updatePacman({ dx: 0, dy: 0 }, READY_DURATION - 1);
    expect(state.isReady()).toBe(true);

    // Advance past duration
    state.updatePacman({ dx: 0, dy: 0 }, 2);
    expect(state.isReady()).toBe(false);
  });

  it('should stop showing "READY!" text after ready state ends', () => {
    const state = new GameState(grid);
    
    // Advance past duration
    state.updatePacman({ dx: 0, dy: 0 }, READY_DURATION + 100);
    expect(state.isReady()).toBe(false);

    // Reset mocks to clear previous calls
    vi.clearAllMocks();

    renderer.render(grid, state);

    expect(mockContext.fillText).not.toHaveBeenCalledWith(
      'READY!',
      expect.any(Number),
      expect.any(Number)
    );
  });

  it('should re-enter READY state after Pacman dies (and has lives)', () => {
    // Setup a state with Pacman and a Ghost colliding
    const template = `
#####
#PG.#
#####
    `.trim();
    const deathGrid = Grid.fromString(template);
    const state = new GameState(deathGrid);

    // Exit initial ready state
    state.updatePacman({ dx: 0, dy: 0 }, READY_DURATION + 100);
    expect(state.isReady()).toBe(false);

    // Move Pacman towards the ghost to trigger collision
    // P is at (1, 1), G is at (2, 1). Distance is 1.0.
    // Moving 0.6 tiles right will bring distance to 0.4 (< 0.5 threshold)
    state.updatePacman({ dx: 1, dy: 0 }, 0.6 / PACMAN_SPEED); 
    state.updatePacman({ dx: 0, dy: 0 }, 1); // Trigger collision check at new position
    
    // Should be dying now
    expect(state.isDying()).toBe(true);

    // Fast forward death animation
    // PACMAN_DEATH_ANIMATION_SPEED * PACMAN_DEATH_ANIMATION_FRAMES + padding
    state.updatePacman({ dx: 0, dy: 0 }, 5000);

    // Should be ready again
    expect(state.isReady()).toBe(true);
    expect(state.getLives()).toBeGreaterThan(0);
  });

  it('should display "READY!" again after respawn', () => {
    const template = `
#####
#PG.#
#####
    `.trim();
    const deathGrid = Grid.fromString(template);
    const state = new GameState(deathGrid);

    // Fast forward to death and respawn
    state.updatePacman({ dx: 0, dy: 0 }, READY_DURATION + 100);
    
    // Move Pacman towards the ghost to trigger collision
    // P is at (1, 1), G is at (2, 1). Distance is 1.0.
    // Moving 0.6 tiles right will bring distance to 0.4 (< 0.5 threshold)
    state.updatePacman({ dx: 1, dy: 0 }, 0.6 / PACMAN_SPEED); 
    state.updatePacman({ dx: 0, dy: 0 }, 1); // Trigger collision check at new position
    state.updatePacman({ dx: 0, dy: 0 }, 5000); // Finish dying

    expect(state.isReady()).toBe(true);

    vi.clearAllMocks();
    renderer.render(deathGrid, state);

    expect(mockContext.fillText).toHaveBeenCalledWith(
      'READY!',
      expect.any(Number),
      expect.any(Number)
    );
  });

  it('should not show "READY!" when game is over', () => {
    const template = `
#####
#PG.#
#####
    `.trim();
    const gameOverGrid = Grid.fromString(template);
    const state = new GameState(gameOverGrid);
    
    // Force game over
    // We need to die enough times (starting lives is 2, so 3 deaths to lose)
    for (let i = 0; i < 3; i++) {
      // Exit ready state
      state.updatePacman({ dx: 0, dy: 0 }, READY_DURATION + 100);
      
      // Move Pacman towards the ghost to trigger collision
      // P is at (1, 1), G is at (2, 1). Distance is 1.0.
      // Moving 0.6 tiles right will bring distance to 0.4 (< 0.5 threshold)
      state.updatePacman({ dx: 1, dy: 0 }, 0.6 / PACMAN_SPEED); 
      state.updatePacman({ dx: 0, dy: 0 }, 1); // Trigger collision check
      state.updatePacman({ dx: 0, dy: 0 }, 10000); // Finish dying
    }

    expect(state.isGameOver()).toBe(true);
    expect(state.isReady()).toBe(false);

    vi.clearAllMocks();
    renderer.render(gameOverGrid, state);

    expect(mockContext.fillText).not.toHaveBeenCalledWith(
      'READY!',
      expect.any(Number),
      expect.any(Number)
    );
    expect(mockContext.fillText).toHaveBeenCalledWith(
      'GAME OVER',
      expect.any(Number),
      expect.any(Number)
    );
  });
});
