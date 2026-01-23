import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameState } from './state.js';
import { Grid } from './grid.js';
import { EntityType } from './types.js';
import { PACMAN_ANIMATION_SPEED } from './config.js';

describe('GameState Animation', () => {
  let grid: Grid;
  const template = `
#####
#P..#
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

  it('should initialize animation properties for Pacman', () => {
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;

    expect(pacman.animationFrame).toBe(0);
    expect(pacman.animationTimer).toBe(0);
  });

  it('should update animation timer and frame when Pacman is moving', () => {
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;

    // Move Pacman Right
    state.updatePacman({ dx: 1, dy: 0 }, PACMAN_ANIMATION_SPEED / 2);

    expect(pacman.animationTimer).toBe(PACMAN_ANIMATION_SPEED / 2);
    expect(pacman.animationFrame).toBe(0);

    state.updatePacman({ dx: 1, dy: 0 }, PACMAN_ANIMATION_SPEED / 2 + 1);

    expect(pacman.animationTimer).toBe(PACMAN_ANIMATION_SPEED + 1);
    expect(pacman.animationFrame).toBe(1);
  });

  it('should cycle animation frame through 0, 1, 2, 1', () => {
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;

    // Move for 4 full frames
    state.updatePacman({ dx: 1, dy: 0 }, PACMAN_ANIMATION_SPEED * 0); // Frame 0
    expect(pacman.animationFrame).toBe(0);

    state.updatePacman({ dx: 1, dy: 0 }, PACMAN_ANIMATION_SPEED); // Frame 1
    expect(pacman.animationFrame).toBe(1);

    state.updatePacman({ dx: 1, dy: 0 }, PACMAN_ANIMATION_SPEED); // Frame 2
    expect(pacman.animationFrame).toBe(2);

    state.updatePacman({ dx: 1, dy: 0 }, PACMAN_ANIMATION_SPEED); // Frame 1 again
    expect(pacman.animationFrame).toBe(1);

    state.updatePacman({ dx: 1, dy: 0 }, PACMAN_ANIMATION_SPEED); // Frame 0 again
    expect(pacman.animationFrame).toBe(0);
  });

  it('should reset animation frame to 0 when Pacman stops', () => {
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;

    // Move to frame 1
    state.updatePacman({ dx: 1, dy: 0 }, PACMAN_ANIMATION_SPEED);
    expect(pacman.animationFrame).toBe(1);

    // Stop Pacman manually (simulating hitting a wall or other stopping condition)
    pacman.direction = { dx: 0, dy: 0 };

    // Call updatePacman with no new direction to update animation
    state.updatePacman({ dx: 0, dy: 0 }, 1000);

    expect(pacman.animationFrame).toBe(0);
    expect(pacman.animationTimer).toBe(PACMAN_ANIMATION_SPEED);
  });

  it('should reset animation timer and frame if Pacman is re-initialized (sanity check)', () => {
    // This is more about checking that it's initialized in constructor
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
    expect(pacman.animationFrame).toBe(0);
    expect(pacman.animationTimer).toBe(0);
  });
});
