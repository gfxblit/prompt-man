import { describe, it, expect } from 'vitest';
import { GameState } from './state.js';
import { Grid } from './grid.js';
import { EntityType } from './types.js';

describe('Movement - Wrapping', () => {
  it('should wrap around from right edge to left edge', () => {
    // 5 wide (0-4). Row 1 is empty.
    const template = `
#####
 P.. 
#####
    `.trim();
    // P is at (1,1).
    // Width is 5.
    
    const grid = Grid.fromString(template);
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
    
    // Move Pacman to the right edge (4,1)
    state.movePacman(4, 1);
    expect(pacman.x).toBe(4);
    
    // Now move Right again. Should wrap to (0,1).
    state.updatePacman({ dx: 1, dy: 0 });
    
    expect(pacman.x).toBe(0);
    expect(pacman.y).toBe(1);
  });

  it('should wrap around from left edge to right edge', () => {
     // 5 wide (0-4).
    const template = `
#####
 P.. 
#####
    `.trim();
    const grid = Grid.fromString(template);
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
    
    // Move Pacman to the left edge (0,1)
    state.movePacman(0, 1);
    expect(pacman.x).toBe(0);
    
    // Now move Left again. Should wrap to (4,1).
    state.updatePacman({ dx: -1, dy: 0 });
    
    expect(pacman.x).toBe(4);
    expect(pacman.y).toBe(1);
  });

  it('should wrap around from bottom edge to top edge', () => {
    // 5 high (0-4). Column 1 is empty.
    const template = `
#P#
#.#
#.#
#.#
#.#
    `.trim();
    // P is at (1,0), so we move it to the bottom first. Height is 5.
    
    const grid = Grid.fromString(template);
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
    
    // Move Pacman to the bottom edge (1,4)
    state.movePacman(1, 4);
    expect(pacman.y).toBe(4);
    
    // Now move Down again. Should wrap to (1,0).
    state.updatePacman({ dx: 0, dy: 1 });
    
    expect(pacman.x).toBe(1);
    expect(pacman.y).toBe(0);
  });

  it('should wrap around from top edge to bottom edge', () => {
    // 5 high (0-4). Column 1 is empty.
    const template = `
#P#
#.#
#.#
#.#
#.#
    `.trim();
    // P starts at (1,0). Height is 5.
    
    const grid = Grid.fromString(template);
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
    
    // P starts at (1,0)
    expect(pacman.y).toBe(0);
    
    // Now move Up. Should wrap to (1,4).
    state.updatePacman({ dx: 0, dy: -1 });
    
    expect(pacman.x).toBe(1);
    expect(pacman.y).toBe(4);
  });
});
