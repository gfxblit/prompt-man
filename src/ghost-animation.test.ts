import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameState } from './state.js';
import { Grid } from './grid.js';
import { EntityType } from './types.js';
import { GHOST_ANIMATION_SPEED } from './config.js';

describe('GameState Ghost Animation', () => {
  let grid: Grid;
  const template = `
#####
#G..#
#...#
#####
  `.trim();

  beforeEach(() => {
    grid = Grid.fromString(template);
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
    });
  });

  it('should initialize animation properties for Ghosts', () => {
    const state = new GameState(grid);
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;

    expect(ghost.animationFrame).toBe(0);
    expect(ghost.animationTimer).toBe(0);
  });

  it('should update animation timer and frame when Ghost is moving', () => {
    const state = new GameState(grid);
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;

    // Force ghost to move right
    ghost.direction = { dx: 1, dy: 0 };

    state.updateGhosts(GHOST_ANIMATION_SPEED / 2);

    expect(ghost.animationTimer).toBe(GHOST_ANIMATION_SPEED / 2);
    expect(ghost.animationFrame).toBe(0);

    state.updateGhosts(GHOST_ANIMATION_SPEED / 2 + 1);

    expect(ghost.animationTimer).toBe(GHOST_ANIMATION_SPEED + 1);
    expect(ghost.animationFrame).toBe(1);
  });

  it('should cycle animation frame through 0-7', () => {
    const state = new GameState(grid);
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;

    // Force ghost to move right
    ghost.direction = { dx: 1, dy: 0 };

    for (let i = 0; i < 8; i++) {
      expect(ghost.animationFrame).toBe(i);
      state.updateGhosts(GHOST_ANIMATION_SPEED);
    }
    expect(ghost.animationFrame).toBe(0);
  });

  it('should NOT update animation frame when Ghost is NOT moving', () => {
    const trappedGrid = Grid.fromString('###\n#G#\n###');
    const state = new GameState(trappedGrid);
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;

    // Ensure it's not moving
    ghost.direction = { dx: 0, dy: 0 };
    const initialFrame = ghost.animationFrame;

    state.updateGhosts(GHOST_ANIMATION_SPEED * 10);

    expect(ghost.direction).toEqual({ dx: 0, dy: 0 });
    expect(ghost.animationFrame).toBe(initialFrame);
  });
});
