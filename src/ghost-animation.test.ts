import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameState } from './state.js';
import { Grid } from './grid.js';
import { EntityType } from './types.js';
import { GHOST_ANIMATION_SPEED } from './config.js';

describe('Ghost Directional Animation', () => {
  let grid: Grid;
  const template = `
###########
#G........#
###########
  `.trim();

  beforeEach(() => {
    grid = Grid.fromString(template);
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
    });
  });

  it('should only cycle between 2 frames for ghosts', () => {
    const state = new GameState(grid);
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;

    // Force ghost to move right (East)
    ghost.direction = { dx: 1, dy: 0 };

    // It should cycle 0, 1, 0, 1... instead of 0, 1, 2, 3, 4, 5, 6, 7, 0...
    expect(ghost.animationFrame).toBe(0);
    
    state.updateGhosts(GHOST_ANIMATION_SPEED);
    expect(ghost.animationFrame).toBe(1);

    state.updateGhosts(GHOST_ANIMATION_SPEED);
    expect(ghost.animationFrame).toBe(0);
  });

  it('should use same frame indices for scared ghosts regardless of direction', () => {
    const state = new GameState(grid);
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;
    ghost.isScared = true;

    // Force ghost to move West
    ghost.direction = { dx: -1, dy: 0 };
    
    // We can't easily test the renderer's output here, but we can verify the state
    // and then we'll have to manually ensure renderer handles it.
    // Actually, I'll update the renderer to always use EAST frames (0,1) when scared.
    
    expect(ghost.animationFrame).toBe(0);
    state.updateGhosts(GHOST_ANIMATION_SPEED);
    expect(ghost.animationFrame).toBe(1);
  });
});
