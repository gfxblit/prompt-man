import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameState } from './state.js';
import { Grid } from './grid.js';
import { EntityType } from './types.js';

describe('GameState', () => {
  let grid: Grid;
  const template = `
#####
#P.G#
#o..#
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

  it('should initialize entities from grid spawns', () => {
    const state = new GameState(grid);
    const entities = state.getEntities();
    
    expect(entities).toHaveLength(2);
    
    const pacman = entities.find(e => e.type === EntityType.Pacman);
    expect(pacman).toBeDefined();
    expect(pacman?.x).toBe(1);
    expect(pacman?.y).toBe(1);

    const ghost = entities.find(e => e.type === EntityType.Ghost);
    expect(ghost).toBeDefined();
    expect(ghost?.x).toBe(3);
    expect(ghost?.y).toBe(1);
  });

  it('should count initial pellets correctly', () => {
    const state = new GameState(grid);
    // 1 pellet at (2,1), 2 pellets at (2,2) and (3,2). Total 3 pellets.
    // Plus 1 power pellet at (1,2). Total 4.
    expect(state.getRemainingPellets()).toBe(4);
  });

  it('should initialize score to 0', () => {
    const state = new GameState(grid);
    expect(state.getScore()).toBe(0);
  });

  it('should update score and pellet count when consuming a pellet', () => {
    const state = new GameState(grid);
    
    state.consumePellet(2, 1);
    expect(state.getRemainingPellets()).toBe(3);
    expect(state.getScore()).toBe(10);
    
    // Consuming empty space should do nothing
    state.consumePellet(1, 1);
    expect(state.getRemainingPellets()).toBe(3);
    expect(state.getScore()).toBe(10);
  });

  it('should update score and pellet count when consuming a power pellet', () => {
    const state = new GameState(grid);
    
    state.consumePellet(1, 2);
    expect(state.getRemainingPellets()).toBe(3);
    expect(state.getScore()).toBe(50);
  });

  it('should move Pacman and consume pellets', () => {
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
    
    // Move to (2,1) which has a pellet
    state.movePacman(2, 1);
    expect(pacman.x).toBe(2);
    expect(pacman.y).toBe(1);
    expect(state.getRemainingPellets()).toBe(3);
    expect(state.getScore()).toBe(10);
  });

  it('should not move Pacman into walls', () => {
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
    const initialX = pacman.x;
    const initialY = pacman.y;
    
    // Move to (1,0) which is a wall
    state.movePacman(1, 0);
    expect(pacman.x).toBe(initialX);
    expect(pacman.y).toBe(initialY);
  });

  it('should update Pacman position based on direction', () => {
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
    const initialX = pacman.x;
    const initialY = pacman.y;

    // Move right (dx=1, dy=0)
    state.updatePacman({ dx: 1, dy: 0 });
    expect(pacman.x).toBe(initialX + 1);
    expect(pacman.y).toBe(initialY);
  });

  it('should continue in current direction if requested direction is blocked by a wall', () => {
    const customTemplate = `
#####
#P..#
###.#
#####
    `.trim();
    const customGrid = Grid.fromString(customTemplate);
    const state = new GameState(customGrid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;

    // Initially at (1,1).
    // Set initial direction to Right
    state.updatePacman({ dx: 1, dy: 0 }); 
    expect(pacman.x).toBe(2);
    expect(pacman.y).toBe(1);
    expect(pacman.direction).toEqual({ dx: 1, dy: 0 });

    // Now at (2,1). Above (2,0) is wall. Right (3,1) is empty.
    // Request Up { dx: 0, dy: -1 }
    state.updatePacman({ dx: 0, dy: -1 });
    
    // Should NOT move Up (blocked), but SHOULD move Right (buffered)
    expect(pacman.x).toBe(3);
    expect(pacman.y).toBe(1);
    expect(pacman.direction).toEqual({ dx: 1, dy: 0 });
  });

  it('should turn when requested direction becomes walkable', () => {
    const customTemplate = `
#####
#P..#
###.#
#...#
#####
    `.trim();
    const customGrid = Grid.fromString(customTemplate);
    const state = new GameState(customGrid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;

    // 1. Move Right to (2,1)
    state.updatePacman({ dx: 1, dy: 0 });
    expect(pacman.x).toBe(2);
    expect(pacman.y).toBe(1);
    expect(pacman.direction).toEqual({ dx: 1, dy: 0 });

    // 2. Request Down. (2,2) is wall, so it should continue Right to (3,1)
    state.updatePacman({ dx: 0, dy: 1 });
    expect(pacman.x).toBe(3);
    expect(pacman.y).toBe(1);
    expect(pacman.direction).toEqual({ dx: 1, dy: 0 });

    // 3. Request Down again. Now at (3,1), (3,2) is walkable. Should move Down to (3,2)
    state.updatePacman({ dx: 0, dy: 1 });
    expect(pacman.x).toBe(3);
    expect(pacman.y).toBe(2);
    expect(pacman.direction).toEqual({ dx: 0, dy: 1 });
    
    // 4. Continue Down to (3,3)
    state.updatePacman({ dx: 0, dy: 1 });
    expect(pacman.x).toBe(3);
    expect(pacman.y).toBe(3);
    expect(pacman.direction).toEqual({ dx: 0, dy: 1 });
  });

  it('should stop and clear direction when hitting a wall in both requested and current directions', () => {
    const customTemplate = `
#####
#P..#
#####
    `.trim();
    const customGrid = Grid.fromString(customTemplate);
    const state = new GameState(customGrid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;

    // 1. Move Right to (2,1)
    state.updatePacman({ dx: 1, dy: 0 });
    expect(pacman.x).toBe(2);
    expect(pacman.direction).toEqual({ dx: 1, dy: 0 });

    // 2. Move Right to (3,1)
    state.updatePacman({ dx: 1, dy: 0 });
    expect(pacman.x).toBe(3);
    expect(pacman.direction).toEqual({ dx: 1, dy: 0 });

    // 3. Try to move Right again, but (4,1) is a wall.
    // Also try to move Up (blocked).
    state.updatePacman({ dx: 0, dy: -1 });

    expect(pacman.x).toBe(3); // Should not have moved
    // Now reflects that movement has stopped
    expect(pacman.direction).toEqual({ dx: 0, dy: 0 });
    // But rotation should be preserved (facing Right)
    expect(pacman.rotation).toBeCloseTo(0);
  });
});
