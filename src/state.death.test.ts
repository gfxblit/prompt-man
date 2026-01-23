import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameState } from './state.js';
import { Grid } from './grid.js';
import { EntityType } from './types.js';
import { PACMAN_DEATH_ANIMATION } from './config.js';

describe('GameState Death Logic', () => {
  let grid: Grid;
  const template = `
#####
#P.G#
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

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should enter dying state on collision with ghost', () => {
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;
    const initialLives = state.getLives();

    // Move Pacman towards ghost until collision
    pacman.x = ghost.x - 0.4; // Trigger collision (dist < 0.5)
    
    // We need to trigger the collision check.
    // updatePacman calls checkCollisions at the beginning.
    state.updatePacman({ dx: 0, dy: 0 }, 0);

    expect(state.isDying()).toBe(true);
    expect(state.getLives()).toBe(initialLives - 1);
    // Positions should NOT be reset yet
    expect(pacman.x).toBe(ghost.x - 0.4);
  });

  it('should increment deathTimer and update animationFrame during dying state', () => {
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;

    pacman.x = ghost.x - 0.4;
    state.updatePacman({ dx: 0, dy: 0 }, 0);
    expect(state.isDying()).toBe(true);

    // Initial death state
    expect(pacman.deathTimer).toBe(0);
    expect(pacman.animationFrame).toBe(0);

    // Update with half animation speed
    state.updatePacman({ dx: 0, dy: 0 }, PACMAN_DEATH_ANIMATION.SPEED / 2);
    expect(pacman.deathTimer).toBe(PACMAN_DEATH_ANIMATION.SPEED / 2);
    expect(pacman.animationFrame).toBe(0);

    // Update to next frame
    state.updatePacman({ dx: 0, dy: 0 }, PACMAN_DEATH_ANIMATION.SPEED / 2);
    expect(pacman.deathTimer).toBe(PACMAN_DEATH_ANIMATION.SPEED);
    expect(pacman.animationFrame).toBe(1);
  });

  it('should pause ghost updates during dying state', () => {
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;
    const initialGhostX = ghost.x;

    pacman.x = ghost.x - 0.4;
    state.updatePacman({ dx: 0, dy: 0 }, 0);
    expect(state.isDying()).toBe(true);

    // Try to update ghosts
    state.updateGhosts(100);
    expect(ghost.x).toBe(initialGhostX);
  });

  it('should reset positions after death animation completes', () => {
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;
    const initialPacmanX = pacman.x;

    pacman.x = ghost.x - 0.4;
    state.updatePacman({ dx: 0, dy: 0 }, 0);
    expect(state.isDying()).toBe(true);

    // Total animation time is 12 frames * speed
    const totalTime = 12 * PACMAN_DEATH_ANIMATION.SPEED;
    state.updatePacman({ dx: 0, dy: 0 }, totalTime + 1);

    expect(state.isDying()).toBe(false);
    expect(pacman.x).toBe(initialPacmanX);
    expect(pacman.deathTimer).toBeUndefined();
  });

  it('should trigger game over if no lives left after death animation', () => {
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;

    // First collision to get to 1 life
    pacman.x = ghost.x - 0.4;
    state.updatePacman({ dx: 0, dy: 0 }, 0);
    expect(state.getLives()).toBe(1);
    // Finish animation
    state.updatePacman({ dx: 0, dy: 0 }, 12 * PACMAN_DEATH_ANIMATION.SPEED + 1);
    expect(state.getLives()).toBe(1);

    // Second collision to get to 0 lives
    pacman.x = ghost.x - 0.4;
    state.updatePacman({ dx: 0, dy: 0 }, 0);
    expect(state.getLives()).toBe(0);
    expect(state.isGameOver()).toBe(false); // Game over should only be true AFTER animation

    const totalTime = 12 * PACMAN_DEATH_ANIMATION.SPEED;
    state.updatePacman({ dx: 0, dy: 0 }, totalTime + 1);

    expect(state.isDying()).toBe(false);
    expect(state.isGameOver()).toBe(true);
  });
});
