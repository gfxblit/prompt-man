import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameState } from './state.js';
import { Grid } from './grid.js';
import { EntityType } from './types.js';
import { GHOST_ANIMATION_SPEED } from './config.js';

// Mock configuration to disable the "Ready" state delay for these tests
vi.mock('./config.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('./config.js')>();
  return {
    ...mod,
    READY_DURATION: 0,
  };
});

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

  it('should animate ghosts through two frames and cycle', () => {
    const state = new GameState(grid);
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;

    // Force ghost to move right (East)
    ghost.direction = { dx: 1, dy: 0 };

    // Initial frame
    expect(ghost.animationFrame).toBe(0);
    
    // Move for 1 full frame duration
    state.updateGhosts(GHOST_ANIMATION_SPEED);
    expect(ghost.animationFrame).toBe(1);

    // Move for another frame duration
    state.updateGhosts(GHOST_ANIMATION_SPEED);
    expect(ghost.animationFrame).toBe(0); // Should cycle back to 0
  });

  it('should animate scared ghosts through two frames and cycle', () => {
    const state = new GameState(grid);
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;
    ghost.isScared = true;

    // Initial frame
    expect(ghost.animationFrame).toBe(0);
    
    state.updateGhosts(GHOST_ANIMATION_SPEED);
    expect(ghost.animationFrame).toBe(1);

    state.updateGhosts(GHOST_ANIMATION_SPEED);
    expect(ghost.animationFrame).toBe(0); // Should cycle back to 0
  });
});
