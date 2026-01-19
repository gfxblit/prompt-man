import { describe, it, expect, beforeEach } from 'vitest';
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
});
