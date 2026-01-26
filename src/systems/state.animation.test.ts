import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameState } from './state.js';
import { Grid } from '../utils/grid.js';
import { EntityType } from '../core/types.js';
import { PACMAN_ANIMATION_SPEED, GHOST_ANIMATION_SPEED } from '../constants/config.js';

// Mock configuration to disable the "Ready" state delay for these tests. This allows tests to focus on core logic without waiting for the initial pause.
vi.mock('../constants/config.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../constants/config.js')>();
  return {
    ...mod,
    READY_DURATION: 0,
  };
});

describe('GameState Animation', () => {
  let grid: Grid;
  const template = `
##########
#P.......#
##########
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
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('Pacman', () => {
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

    it('should reset animation timer when animation frame cycles', () => {
      const state = new GameState(grid);
      const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;

      state.updatePacman({ dx: 1, dy: 0 }, PACMAN_ANIMATION_SPEED); // 100
      state.updatePacman({ dx: 1, dy: 0 }, PACMAN_ANIMATION_SPEED); // 200
      state.updatePacman({ dx: 1, dy: 0 }, PACMAN_ANIMATION_SPEED); // 300
      state.updatePacman({ dx: 1, dy: 0 }, PACMAN_ANIMATION_SPEED); // 400 -> 0 (Full cycle)
      expect(pacman.animationTimer).toBe(0);
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
  });

  describe('Ghosts', () => {
    it('should initialize animation properties for Ghosts', () => {
      const ghostTemplate = `
#####
#G..#
#####
      `.trim();
      const ghostGrid = Grid.fromString(ghostTemplate);
      const state = new GameState(ghostGrid);
      const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;

      expect(ghost.animationFrame).toBe(0);
      expect(ghost.animationTimer).toBe(0);
    });

    it('should update animation timer and frame correctly when Ghost is moving', () => {
      const ghostTemplate = `
###########
#G........#
###########
      `.trim();
      const ghostGrid = Grid.fromString(ghostTemplate);
      const state = new GameState(ghostGrid);
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

    it('should cycle animation frame through two frames', () => {
      const ghostTemplate = `
###########
#G........#
###########
      `.trim();
      const ghostGrid = Grid.fromString(ghostTemplate);
      const state = new GameState(ghostGrid);
      const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;

      // Force ghost to move right
      ghost.direction = { dx: 1, dy: 0 };

      expect(ghost.animationFrame).toBe(0);
      state.updateGhosts(GHOST_ANIMATION_SPEED);
      expect(ghost.animationFrame).toBe(1);
      state.updateGhosts(GHOST_ANIMATION_SPEED);
      expect(ghost.animationFrame).toBe(0); // Should cycle
    });

    it('should cycle animation frame through two frames even when Ghost is NOT moving', () => {
      const trappedGrid = Grid.fromString('###\n#G#\n###');
      const state = new GameState(trappedGrid);
      const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;

      // Ensure it's not moving
      ghost.direction = { dx: 0, dy: 0 };
      
      expect(ghost.animationFrame).toBe(0);
      state.updateGhosts(GHOST_ANIMATION_SPEED);
      expect(ghost.animationFrame).toBe(1);
      state.updateGhosts(GHOST_ANIMATION_SPEED);
      expect(ghost.animationFrame).toBe(0); // Should cycle
    });
  });
});
