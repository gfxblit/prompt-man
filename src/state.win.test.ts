import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameState } from './state.js';
import { Grid } from './grid.js';
import { EntityType } from './types.js';
import { PACMAN_SPEED } from './config.js';

describe('GameState Win Condition', () => {
  let grid: Grid;
  const smallTemplate = `
#####
#P.#
#####
  `.trim();

  const deltaTimeForOneTile = 1 / PACMAN_SPEED;

  beforeEach(() => {
    grid = Grid.fromString(smallTemplate);
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should detect win when all pellets are eaten', () => {
    const state: GameState = new GameState(grid);
    expect(state.isWin()).toBe(false);

    // Consume the only pellet
    state.consumePellet(2, 1);
    
    expect(state.getRemainingPellets()).toBe(0);
    expect(state.isWin()).toBe(true);
  });

  it('should stop entities moving during win delay', () => {
    const state: GameState = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
    
    // Win by eating the last pellet
    state.consumePellet(2, 1);
    expect(state.isWin()).toBe(true);

    const initialX = pacman.x;
    const initialY = pacman.y;

    // Try to update Pacman, should not move
    state.updatePacman({ dx: 1, dy: 0 }, deltaTimeForOneTile);
    expect(pacman.x).toBe(initialX);
    expect(pacman.y).toBe(initialY);

    // Try to update Ghosts, should not move
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost);
    if (ghost) {
      const ghostInitialX = ghost.x;
      const ghostInitialY = ghost.y;
      state.updateGhosts(100);
      expect(ghost.x).toBe(ghostInitialX);
      expect(ghost.y).toBe(ghostInitialY);
    }
  });

  it('should reset level and increase difficulty after delay', () => {
    // We need to define WIN_DELAY in config, but for now let's assume 3000ms
    const WIN_DELAY = 3000;
    const state: GameState = new GameState(grid);
    
    // Win
    state.consumePellet(2, 1);
    expect(state.isWin()).toBe(true);
    expect(state.getLevel()).toBe(1);

    // Advance time by WIN_DELAY
    // We might need to call an update function that handles the win timer.
    // Let's assume updateGhosts or a new update method handles it.
    // For now let's assume updatePacman or updateGhosts handles it.
    state.updateGhosts(WIN_DELAY + 100);

    expect(state.isWin()).toBe(false);
    expect(state.getLevel()).toBe(2);
    expect(state.getRemainingPellets()).toBe(1); // Pellets restored
  });
});