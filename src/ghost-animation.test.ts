import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameState } from './state.js';
import { Grid } from './grid.js';
import { EntityType } from './types.js';

const GHOST_ANIMATION_SPEED = 100;

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

  it('should only have 1 frame for ghosts', () => {
    const state = new GameState(grid);
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;

    // Force ghost to move right (East)
    ghost.direction = { dx: 1, dy: 0 };

    // It should NOT cycle. Always frame 0.
    expect(ghost.animationFrame).toBe(0);
    
    state.updateGhosts(GHOST_ANIMATION_SPEED);
    expect(ghost.animationFrame).toBe(0);

    state.updateGhosts(GHOST_ANIMATION_SPEED);
    expect(ghost.animationFrame).toBe(0);
  });

  it('should use same frame index for scared ghosts regardless of direction', () => {
    const state = new GameState(grid);
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;
    ghost.isScared = true;

    // Force ghost to move West
    ghost.direction = { dx: -1, dy: 0 };
    
    expect(ghost.animationFrame).toBe(0);
    state.updateGhosts(GHOST_ANIMATION_SPEED);
    expect(ghost.animationFrame).toBe(0);
  });
});
