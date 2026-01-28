import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameState } from './state.js';
import { Grid } from './grid.js';
import { EntityType, GameEvent } from './types.js';
import { PACMAN_DEATH_ANIMATION_SPEED } from './config.js';
import { EventBus } from './event-bus.js';

// Mock configuration to disable the "Ready" state delay for these tests. This allows tests to focus on core logic without waiting for the initial pause.
vi.mock('./config.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('./config.js')>();
  return {
    ...mod,
    READY_DURATION: 0,
  };
});

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

  it('should emit PACMAN_DEATH on collision', () => {
    const eventBus = new EventBus();
    const emitSpy = vi.spyOn(eventBus, 'emit');
    
    const state = new GameState(grid, eventBus);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;

    // Trigger collision
    pacman.x = ghost.x - 0.4;
    state.updatePacman({ dx: 0, dy: 0 }, 0);

    expect(state.isDying()).toBe(true);
    expect(emitSpy).toHaveBeenCalledWith(GameEvent.PACMAN_DEATH);
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
    // Lives should NOT be decremented yet
    expect(state.getLives()).toBe(initialLives);
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
    state.updatePacman({ dx: 0, dy: 0 }, PACMAN_DEATH_ANIMATION_SPEED / 2);
    expect(pacman.deathTimer).toBe(PACMAN_DEATH_ANIMATION_SPEED / 2);
    expect(pacman.animationFrame).toBe(0);

    // Update to next frame
    state.updatePacman({ dx: 0, dy: 0 }, PACMAN_DEATH_ANIMATION_SPEED / 2);
    expect(pacman.deathTimer).toBe(PACMAN_DEATH_ANIMATION_SPEED);
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

  it('should reset positions and decrement lives after death animation completes', () => {
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;
    const initialPacmanX = pacman.x;
    const initialLives = state.getLives();

    pacman.x = ghost.x - 0.4;
    state.updatePacman({ dx: 0, dy: 0 }, 0);
    expect(state.isDying()).toBe(true);

    // Total animation time is 12 frames * speed
    const totalTime = 12 * PACMAN_DEATH_ANIMATION_SPEED;
    state.updatePacman({ dx: 0, dy: 0 }, totalTime + 1);

    expect(state.isDying()).toBe(false);
    expect(pacman.x).toBe(initialPacmanX);
    expect(state.getLives()).toBe(initialLives - 1);
    expect(pacman.deathTimer).toBeUndefined();
    expect(pacman.animationFrame).toBe(0);
  });

  it('should trigger game over if no lives left after death animation', () => {
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;

    // Start with 2 extra lives (total 3)
    expect(state.getLives()).toBe(2);

    // First collision
    pacman.x = ghost.x - 0.4;
    state.updatePacman({ dx: 0, dy: 0 }, 0);
    state.updatePacman({ dx: 0, dy: 0 }, 12 * PACMAN_DEATH_ANIMATION_SPEED + 1);
    expect(state.getLives()).toBe(1);

    // Second collision
    pacman.x = ghost.x - 0.4;
    state.updatePacman({ dx: 0, dy: 0 }, 0);
    state.updatePacman({ dx: 0, dy: 0 }, 12 * PACMAN_DEATH_ANIMATION_SPEED + 1);
    expect(state.getLives()).toBe(0);

    // Third collision (last life)
    pacman.x = ghost.x - 0.4;
    state.updatePacman({ dx: 0, dy: 0 }, 0);
    expect(state.getLives()).toBe(0);
    expect(state.isGameOver()).toBe(false);

    const totalTime = 12 * PACMAN_DEATH_ANIMATION_SPEED;
    state.updatePacman({ dx: 0, dy: 0 }, totalTime + 1);

    expect(state.isDying()).toBe(false);
    expect(state.getLives()).toBe(0); // Lives clamped to 0
    expect(state.isGameOver()).toBe(true);
  });

  it('should reset ghost states after death animation completes', () => {
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;

    // Trigger collision
    pacman.x = ghost.x - 0.4;
    state.updatePacman({ dx: 0, dy: 0 }, 0);
    expect(state.isDying()).toBe(true);

    // Set ghost to scared and dead manually
    ghost.isScared = true;
    ghost.isDead = true;

    // Finish animation
    const totalTime = 12 * PACMAN_DEATH_ANIMATION_SPEED;
    state.updatePacman({ dx: 0, dy: 0 }, totalTime + 1);

    expect(state.isDying()).toBe(false);
    expect(ghost.isScared).toBe(false);
    expect(ghost.isDead).toBe(false);
  });


});
