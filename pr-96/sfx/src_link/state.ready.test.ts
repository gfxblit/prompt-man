import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameState } from './state.js';
import { Grid } from './grid.js';
import { EntityType } from './types.js';
import { READY_DURATION, PACMAN_SPEED, PACMAN_DEATH_ANIMATION_SPEED, PACMAN_DEATH_ANIMATION_FRAMES } from './config.js';

describe('GameState - Ready State', () => {
  let grid: Grid;
  const template = `
#####
#P.G#
#o..#
#####
  `.trim();
  const deltaTimeForOneTile = 1 / PACMAN_SPEED;

  beforeEach(() => {
    grid = Grid.fromString(template);
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should start in ready state', () => {
    const state = new GameState(grid);
    expect(state.isReady()).toBe(true);
  });

  it('should block Pacman movement when ready', () => {
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman);
    if (!pacman) throw new Error('Pacman not found');
    
    const initialX = pacman.x;
    
    // Attempt to move right
    state.updatePacman({ dx: 1, dy: 0 }, deltaTimeForOneTile);
    
    // Should not have moved
    expect(pacman.x).toBe(initialX);
    expect(state.isReady()).toBe(true);
  });

  it('should block Ghost movement when ready', () => {
    const state = new GameState(grid);
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost);
    if (!ghost) throw new Error('Ghost not found');
    
    const initialX = ghost.x;
    
    // Update ghosts
    state.updateGhosts(deltaTimeForOneTile);
    
    // Should not have moved
    expect(ghost.x).toBe(initialX);
  });

  it('should exit ready state after READY_DURATION', () => {
    const state = new GameState(grid);
    
    // Advance time by slightly less than duration
    state.updatePacman({ dx: 0, dy: 0 }, READY_DURATION - 100);
    expect(state.isReady()).toBe(true);
    
    // Advance time to exceed duration
    state.updatePacman({ dx: 0, dy: 0 }, 101);
    expect(state.isReady()).toBe(false);
  });

  it('should allow movement after ready state ends', () => {
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman);
    if (!pacman) throw new Error('Pacman not found');
    
    // End ready state
    state.updatePacman({ dx: 0, dy: 0 }, READY_DURATION + 10);
    expect(state.isReady()).toBe(false);
    
    const initialX = pacman.x;
    // Move right
    state.updatePacman({ dx: 1, dy: 0 }, deltaTimeForOneTile);
    
    // Should have moved
    expect(pacman.x).toBeGreaterThan(initialX);
  });

  it('should enter ready state after Pacman dies and respawns', () => {
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman);
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost);
    
    // End initial ready state
    state.updatePacman({ dx: 0, dy: 0 }, READY_DURATION + 10);
    expect(state.isReady()).toBe(false);
    
    // Force collision
    if (pacman && ghost) {
      pacman.x = 2; 
      pacman.y = 1;
      ghost.x = 2;
      ghost.y = 1;
    }
    
    // Update to trigger death
    state.updatePacman({ dx: 0, dy: 0 }, 10);
    expect(state.isDying()).toBe(true);
    
    // Finish dying animation
    // We need to advance time enough for death animation to finish
    // PACMAN_DEATH_ANIMATION_SPEED * PACMAN_DEATH_ANIMATION_FRAMES
    const deathDuration = PACMAN_DEATH_ANIMATION_SPEED * PACMAN_DEATH_ANIMATION_FRAMES + 100;
    state.updatePacman({ dx: 0, dy: 0 }, deathDuration);
    
    expect(state.isDying()).toBe(false);
    // Should be back in ready state
    expect(state.isReady()).toBe(true);
    
    // Check positions reset (implied by ready state usually, but good to check)
    // Assuming resetPositions puts them back to spawn.
    // P spawn at (1,1), G spawn at (3,1)
    if (pacman) expect(pacman.x).toBe(1);
    if (ghost) expect(ghost.x).toBe(3);
  });
});
