import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameState } from './state.js';
import { Grid } from './grid.js';
import { EntityType } from './types.js';

describe('Movement - Wrapping', () => {
  const horizontalTemplate = `
#####
 P.. 
#####
  `.trim();

  const verticalTemplate = `
#P#
#.#
#.#
#.#
#.#
  `.trim();

  const setup = (template: string) => {
    const grid = Grid.fromString(template);
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman);
    if (!pacman) {
      throw new Error('Pacman entity not found in test template');
    }
    return { state, pacman };
  };

  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should wrap around from right edge to left edge', () => {
    const { state, pacman } = setup(horizontalTemplate);
    
    // Move Pacman to the right edge (4,1)
    pacman.x = 4;
    pacman.y = 1;
    expect(pacman.x).toBe(4);
    
    // Now move Right again. Should wrap to (0,1).
    // deltaTime = 200ms with speed 5/1000 = 1 tile
    state.updatePacman({ dx: 1, dy: 0 }, 200);
    
    expect(pacman.x).toBe(0);
    expect(pacman.y).toBe(1);
  });

  it('should wrap around from left edge to right edge', () => {
    const { state, pacman } = setup(horizontalTemplate);
    
    // Move Pacman to the left edge (0,1)
    pacman.x = 0;
    pacman.y = 1;
    expect(pacman.x).toBe(0);
    
    // Now move Left again. Should wrap to (4,1).
    state.updatePacman({ dx: -1, dy: 0 }, 200);
    
    expect(pacman.x).toBe(4);
    expect(pacman.y).toBe(1);
  });

  it('should wrap around from bottom edge to top edge', () => {
    const { state, pacman } = setup(verticalTemplate);
    
    // Move Pacman to the bottom edge (1,4)
    pacman.x = 1;
    pacman.y = 4;
    expect(pacman.y).toBe(4);
    
    // Now move Down again. Should wrap to (1,0).
    state.updatePacman({ dx: 0, dy: 1 }, 200);
    
    expect(pacman.x).toBe(1);
    expect(pacman.y).toBe(0);
  });

  it('should wrap around from top edge to bottom edge', () => {
    const { state, pacman } = setup(verticalTemplate);
    
    // P starts at (1,0)
    expect(pacman.y).toBe(0);
    
    // Now move Up. Should wrap to (1,4).
    state.updatePacman({ dx: 0, dy: -1 }, 200);
    
    expect(pacman.x).toBe(1);
    expect(pacman.y).toBe(4);
  });

  it('should not wrap around if the destination is a wall', () => {
    const blockedTemplate = `
#####
#P..#
#####
    `.trim();
    const { state, pacman } = setup(blockedTemplate);
    
    // Move to (1,1) - already there.
    // Try to move Left. (0,1) is a wall. Wrapped destination (4,1) is a wall.
    state.updatePacman({ dx: -1, dy: 0 }, 200);
    
    expect(pacman.x).toBe(1);
    expect(pacman.y).toBe(1);
    
    // Move to (3,1)
    pacman.x = 3;
    pacman.y = 1;
    expect(pacman.x).toBe(3);
    
    // Try to move Right. (4,1) is a wall. Wrapped destination (0,1) is a wall.
    state.updatePacman({ dx: 1, dy: 0 }, 200);
    expect(pacman.x).toBe(3);
  });
});