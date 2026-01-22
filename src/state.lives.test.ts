// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameState } from './state.js';
import { Grid } from './grid.js';
import { EntityType } from './types.js';

describe('GameState Lives and Collision', () => {
  let grid: Grid;
  let state: GameState;

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

  it('should decrease lives on collision with ghost', () => {
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;

    // Move them to same spot
    pacman.x = 2;
    pacman.y = 1;
    ghost.x = 2;
    ghost.y = 1;

    // Trigger update/collision check (we might need to call a method for this)
    // Assuming updatePacman triggers collision check for now or we add a specific method
    state.updatePacman({ dx: 0, dy: 0 }, 16);

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

    // Should be reset
    expect(pacman.x).toBe(initialPacmanX);
    expect(pacman.y).toBe(initialPacmanY);
    expect(ghost.x).toBe(initialGhostX);
    expect(ghost.y).toBe(initialGhostY);
  });

  it('should set gameOver to true when lives reach 0', () => {
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;

    // First collision: 2 -> 1 life
    pacman.x = 2;
    pacman.y = 1;
    ghost.x = 2;
    ghost.y = 1;
    state.updatePacman({ dx: 0, dy: 0 }, 16);
    expect(state.getLives()).toBe(1);
    expect(state.isGameOver()).toBe(false);

    // Second collision: 1 -> 0 lives
    pacman.x = 2;
    pacman.y = 1;
    ghost.x = 2;
    ghost.y = 1;
    state.updatePacman({ dx: 0, dy: 0 }, 16);
    expect(state.getLives()).toBe(0);
    expect(state.isGameOver()).toBe(true);
  });

  it('should stop updating entities when gameOver is true', () => {
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;

    // Force game over
    pacman.x = 2;
    pacman.y = 1;
    ghost.x = 2;
    ghost.y = 1;
    state.updatePacman({ dx: 0, dy: 0 }, 16); // 1 life left
    
    // Move them together again after reset
    pacman.x = 2;
    pacman.y = 1;
    ghost.x = 2;
    ghost.y = 1;
    state.updatePacman({ dx: 0, dy: 0 }, 16); // 0 lives left, gameOver = true

    expect(state.isGameOver()).toBe(true);

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
