// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameState } from './state.js';
import { Grid } from './grid.js';
import { PACMAN_DEATH_ANIMATION_SPEED } from './config.js';
import { EntityType, type IGrid } from './types.js';

describe('GameState Lives', () => {
  let grid: IGrid;
  let state: GameState;
  const DEATH_TIME = 12 * PACMAN_DEATH_ANIMATION_SPEED + 1;

  const TEST_LEVEL = `
#####
#P.G#
#####
`.trim();

  beforeEach(() => {
    // Mock localStorage
    const store: Record<string, string> = {};
    const localStorageMock = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        for (const key in store) delete store[key];
      },
      length: 0,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      key: (_index: number) => null,
    };
    
    vi.stubGlobal('localStorage', localStorageMock);

    grid = Grid.fromString(TEST_LEVEL);
    state = new GameState(grid);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should start with 2 lives', () => {
    expect(state.getLives()).toBe(2);
  });

  it('should decrease lives after death animation completes', () => {
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;

    // Move them to same spot
    pacman.x = 2;
    pacman.y = 1;
    ghost.x = 2;
    ghost.y = 1;

    // Trigger update/collision check
    state.updatePacman({ dx: 0, dy: 0 }, 16);

    // Should NOT be decremented yet
    expect(state.getLives()).toBe(2);

    // Wait for death animation
    state.updatePacman({ dx: 0, dy: 0 }, DEATH_TIME);

    expect(state.getLives()).toBe(1);
  });

  it('should reset positions on collision', () => {
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;

    const initialPacmanX = pacman.x;
    const initialPacmanY = pacman.y;
    const initialGhostX = ghost.x;
    const initialGhostY = ghost.y;

    // Move away
    pacman.x = 2;
    ghost.x = 2;

    // Trigger collision
    state.updatePacman({ dx: 0, dy: 0 }, 16);

    // Should NOT be reset yet
    expect(pacman.x).not.toBe(initialPacmanX);

    // Wait for death animation
    state.updatePacman({ dx: 0, dy: 0 }, DEATH_TIME);

    // Should be reset
    expect(pacman.x).toBe(initialPacmanX);
    expect(pacman.y).toBe(initialPacmanY);
    expect(ghost.x).toBe(initialGhostX);
    expect(ghost.y).toBe(initialGhostY);
  });

  it('should set gameOver to true when all lives are lost after animation', () => {
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;

    // First collision
    pacman.x = 2;
    pacman.y = 1;
    ghost.x = 2;
    ghost.y = 1;
    state.updatePacman({ dx: 0, dy: 0 }, 16);
    expect(state.getLives()).toBe(2); // Still 2 during animation
    state.updatePacman({ dx: 0, dy: 0 }, DEATH_TIME);
    expect(state.getLives()).toBe(1);

    // Second collision
    pacman.x = 2;
    pacman.y = 1;
    ghost.x = 2;
    ghost.y = 1;
    state.updatePacman({ dx: 0, dy: 0 }, 16);
    expect(state.getLives()).toBe(1);
    state.updatePacman({ dx: 0, dy: 0 }, DEATH_TIME);
    expect(state.getLives()).toBe(0);

    // Third collision (last life)
    pacman.x = 2;
    pacman.y = 1;
    ghost.x = 2;
    ghost.y = 1;
    state.updatePacman({ dx: 0, dy: 0 }, 16);
    expect(state.getLives()).toBe(0);
    expect(state.isGameOver()).toBe(false);

    // Finish last death animation
    state.updatePacman({ dx: 0, dy: 0 }, DEATH_TIME);
    expect(state.getLives()).toBe(0);
    expect(state.isGameOver()).toBe(true);
  });

  it('should stop updating entities when gameOver is true', () => {
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;

    // Force game over (3 deaths)
    for (let i = 0; i < 3; i++) {
      pacman.x = 2;
      pacman.y = 1;
      ghost.x = 2;
      ghost.y = 1;
      state.updatePacman({ dx: 0, dy: 0 }, 16);
      state.updatePacman({ dx: 0, dy: 0 }, DEATH_TIME);
    }

    const posAfterGameOver = { x: pacman.x, y: pacman.y };
    
    // Try to move Pacman
    state.updatePacman({ dx: 1, dy: 0 }, 16);
    expect(pacman.x).toBe(posAfterGameOver.x);
    expect(pacman.y).toBe(posAfterGameOver.y);

    // Try to move ghosts
    const ghostPosAfterGameOver = { x: ghost.x, y: ghost.y };
    state.updateGhosts(16);
    expect(ghost.x).toBe(ghostPosAfterGameOver.x);
    expect(ghost.y).toBe(ghostPosAfterGameOver.y);
  });
});
