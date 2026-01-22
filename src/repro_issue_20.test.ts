import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameState } from './state.js';
import { Grid } from './grid.js';
import { EntityType } from './types.js';

describe('Issue #20 - Reaching edge with no wall', () => {
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

  it('should not skip walkability check when wrapping', () => {
    // 5x1 grid.
    // Tile 0: Wall
    // Tile 1: Empty
    // Tile 2: Empty
    // Tile 3: Empty
    // Tile 4: Empty (where Pacman starts)
    const template = `
#...P
    `.trim();
    const grid = Grid.fromString(template);
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
    
    // Pacman starts at x=4.
    expect(pacman.x).toBe(4);
    
    // Move Right. Should wrap to 0. But 0 is a Wall!
    // Pacman should stop at 4.0.
    
    // We need to move in small increments to hit the edge case.
    // PACMAN_SPEED is 5/1000 = 0.005 tiles/ms.
    // At x=4.4, Math.round(x) = 4.
    // At x=4.5, Math.round(x) = 5.
    
    pacman.x = 4.45;
    pacman.direction = { dx: 1, dy: 0 };
    
    // Move 0.1 tiles. Proposed x = 4.55.
    // currentTile = Math.floor(4.45 + 0.5) = 4.
    // proposed (4.55) -> proposedTile = Math.floor(4.55 + 0.5) = 5.
    // 5 > 4 is True.
    // wrappedNextTile = 0.
    // grid.isWalkable(0, 0) is False.
    // Should stop at currentTile = 4.
    state.updatePacman({ dx: 1, dy: 0 }, 20); // 20ms * 0.005 = 0.1 tiles
    
    expect(pacman.x).toBe(4);
    expect(pacman.direction).toEqual({ dx: 0, dy: 0 });
  });

  it('should not be blocked at the bottom edge due to rounding', () => {
    // 5x5 grid
    const template = `
.....
.....
.....
.....
..P..
    `.trim();
    const grid = Grid.fromString(template);
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
    
    // Position Pacman at y=4.6 (which rounds to 5, out of bounds)
    // He's effectively at y=0.6 after wrapping, but we'll test the rounding issue.
    pacman.x = 2;
    pacman.y = 4.6;
    pacman.direction = { dx: 1, dy: 0 };

    // Attempt to move right. 
    // currentCenter for x will be 2. proposed = 2.1.
    // crossPos will be Math.round(4.6) = 5.
    // grid.isWalkable(3, 5) will be false because 5 is out of bounds.
    state.updatePacman({ dx: 1, dy: 0 }, 20); // 0.1 tiles.

    expect(pacman.x).toBeGreaterThan(2);
    expect(pacman.direction).not.toEqual({ dx: 0, dy: 0 });
  });
});
