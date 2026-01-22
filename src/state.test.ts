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

  it('should consume pellets when Pacman moves over them', () => {
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman);
    if (!pacman) throw new Error('Pacman not found');
    
    // Move Pacman to (2,1) which has a pellet
    state.updatePacman({ dx: 1, dy: 0 }, 200); // Move right, speed is 0.005 tiles/ms, so 200ms moves 1 tile

    expect(pacman.x).toBe(2);
    expect(pacman.y).toBe(1);
    expect(state.getRemainingPellets()).toBe(3);
    expect(state.getScore()).toBe(10);
  });

  it('should not move Pacman into walls from standstill', () => {
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman);
    if (!pacman) throw new Error('Pacman not found');
    const initialX = pacman.x;
    const initialY = pacman.y;
    pacman.direction = { dx: 0, dy: 0 }; // Ensure starting from standstill
    
    // Move Left (1,1) -> (0,1) is wall
    state.updatePacman({ dx: -1, dy: 0 }, 100);
    
    expect(pacman.x).toBe(initialX);
    expect(pacman.y).toBe(initialY);
    expect(pacman.direction).toEqual({ dx: 0, dy: 0 });
  });

  it('should update Pacman position based on direction and deltaTime', () => {
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman);
    if (!pacman) throw new Error('Pacman not found');
    const initialX = pacman.x;
    const initialY = pacman.y;

    // Move right (dx=1, dy=0) with 100ms deltaTime.
    state.updatePacman({ dx: 1, dy: 0 }, 100);
    expect(pacman.x).toBeCloseTo(initialX + 0.5);
    expect(pacman.y).toBe(initialY);
  });

  it('should continue in current direction if requested direction is blocked or not aligned', () => {
    const customTemplate = `
#####
#P..#
###.#
#####
    `.trim();
    const customGrid = Grid.fromString(customTemplate);
    const state = new GameState(customGrid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman);
    if (!pacman) throw new Error('Pacman not found');

    // Initially at (1,1).
    // Set initial direction to Right
    state.updatePacman({ dx: 1, dy: 0 }, 200); 
    expect(pacman.x).toBe(2);
    expect(pacman.y).toBe(1);
    expect(pacman.direction).toEqual({ dx: 1, dy: 0 });

    // Now at (2,1). Above (2,0) is wall. Right (3,1) is empty.
    // Request Up { dx: 0, dy: -1 }.
    // It should be buffered, but for now we continue Right.
    state.updatePacman({ dx: 0, dy: -1 }, 200);
    
    // Should not move Up (blocked), should continue moving in the current direction (Right).
    expect(pacman.x).toBe(3);
    expect(pacman.y).toBe(1);
    expect(pacman.direction).toEqual({ dx: 1, dy: 0 });
  });

  it('should buffer input and turn when alignment and walkability allow', () => {
    const customTemplate = `
#####
#P..#
###.#
#...#
#####
    `.trim();
    // (1,1) P -> (2,1) . -> (3,1) .
    // (3,2) is walkable.
    const customGrid = Grid.fromString(customTemplate);
    const state = new GameState(customGrid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman);
    if (!pacman) throw new Error('Pacman not found');

    // 1. Start moving Right.
    // Move small step to be misaligned: x=1.5
    state.updatePacman({ dx: 1, dy: 0 }, 100); 
    expect(pacman.x).toBeCloseTo(1.5);
    expect(pacman.direction).toEqual({ dx: 1, dy: 0 });

    // 2. Request Down EARLY.
    // We are at 1.5. Center is 2.0. We are not aligned.
    // Down (1.5, 2) is not checked yet, but we check alignment first.
    state.updatePacman({ dx: 0, dy: 1 }, 100);
    
    // Should continue Right because we haven't reached the turn (x=2) yet.
    // x becomes 2.0.
    expect(pacman.x).toBeCloseTo(2.0);
    expect(pacman.y).toBe(1);
    expect(pacman.direction).toEqual({ dx: 1, dy: 0 });

    // Request Down again (simulating holding key or just buffering persisting).
    state.updatePacman({ dx: 0, dy: 0 }, 200);

    // Should continue Right to (3,1).
    expect(pacman.x).toBe(3.0);
    expect(pacman.y).toBe(1);
    expect(pacman.direction).toEqual({ dx: 1, dy: 0 });

    // 4. Now at (3,1). Down is (3,2) which is Walkable.
    // The buffered input was "Down". It was checked at (2,1) (failed-wall).
    // It should still be buffered? Yes, until consumed or replaced.
    // Now at (3,1).
    state.updatePacman({ dx: 0, dy: 0 }, 200);

    expect(pacman.x).toBe(3);
    expect(pacman.y).toBe(2);
    expect(pacman.direction).toEqual({ dx: 0, dy: 1 });
  });

  it('should allow immediate reversal of direction', () => {
    const customTemplate = `
#####
#P..#
#####
    `.trim();
    const customGrid = Grid.fromString(customTemplate);
    const state = new GameState(customGrid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;

    // 1. Move Right to 1.5
    state.updatePacman({ dx: 1, dy: 0 }, 100);
    expect(pacman.x).toBeCloseTo(1.5);
    expect(pacman.direction).toEqual({ dx: 1, dy: 0 });

    // 2. Request Left. Should turn IMMEDIATELY even if not aligned.
    state.updatePacman({ dx: -1, dy: 0 }, 100);
    
    // Should be at 1.0 (1.5 - 0.5) and still moving left (hasn't hit wall at x=0 yet)
    expect(pacman.x).toBeCloseTo(1.0);
    expect(pacman.direction).toEqual({ dx: -1, dy: 0 });
  });

  it('should stop and clear direction when hitting a wall', () => {
    const customTemplate = `
#####
#P..#
#####
    `.trim();
    const customGrid = Grid.fromString(customTemplate);
    const state = new GameState(customGrid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman);
    if (!pacman) throw new Error('Pacman not found');

    // 1. Move Right to (2,1)
    state.updatePacman({ dx: 1, dy: 0 }, 200);
    expect(pacman.x).toBe(2);

    // 2. Move Right to (3,1) - just before wall at (4,1)
    state.updatePacman({ dx: 1, dy: 0 }, 200);
    expect(pacman.x).toBe(3);

    // 3. Move Right again. (4,1) is wall.
    state.updatePacman({ dx: 1, dy: 0 }, 200);

    // After attempting to move right from x=3, Pacman should remain at x=3 because x=4 is a wall.
    expect(pacman.x).toBe(3);
    expect(pacman.direction?.dx).toBe(0); // Should be stopped
  });
});