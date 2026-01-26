import { describe, it, expect } from 'vitest';
import { GhostAI } from './ghost-ai.js';
import { Grid } from '../utils/grid.js';
import { EntityType, type Direction } from '../core/types.js';

describe('GhostAI', () => {
  const grid = Grid.fromString(`
#######
#.....#
#.###.#
#.....#
#######
  `.trim());

  it('should pick the direction that minimizes Manhattan distance to target', () => {
    const ghost = {
      type: EntityType.Ghost,
      x: 1,
      y: 1,
      direction: { dx: 1, dy: 0 } as Direction,
    };
    const target = { x: 1, y: 3 }; // Target is below

    // At (1,1), possible moves are Right(2,1) or Down(1,2) - if we ignore reversal of Left
    // Current dir is Right, so it can go Right or Down.
    // Manhattan to (1,3):
    // Right (2,1) -> |2-1| + |1-3| = 1 + 2 = 3
    // Down (1,2) -> |1-1| + |2-3| = 0 + 1 = 1
    // Down is better.
    
    const direction = GhostAI.pickDirection(ghost, target, grid);
    expect(direction).toEqual({ dx: 0, dy: 1 });
  });

  it('should not reverse direction', () => {
    const ghost = {
      type: EntityType.Ghost,
      x: 3,
      y: 1,
      direction: { dx: 1, dy: 0 } as Direction,
    };
    const target = { x: 1, y: 1 }; // Target is behind
    
    // Moving Right at (3,1). Target is Left at (1,1).
    // Possible moves: Right(4,1), Left(2,1) is reversal.
    // Even though Left is closer to target, it should not reverse.
    
    const direction = GhostAI.pickDirection(ghost, target, grid);
    expect(direction).not.toEqual({ dx: -1, dy: 0 });
  });

  it('should reverse direction if it is the only option (dead end)', () => {
    const deadEndGrid = Grid.fromString(`
#####
#G..#
#####
    `.trim());
    const ghost = {
      type: EntityType.Ghost,
      x: 1,
      y: 1,
      direction: { dx: -1, dy: 0 } as Direction, // Moving into the wall
    };
    const target = { x: 4, y: 1 };
    
    // At (1,1) moving Left. Left is wall. Up/Down are walls.
    // Only option is Right (reversal).
    
    const direction = GhostAI.pickDirection(ghost, target, deadEndGrid);
    expect(direction).toEqual({ dx: 1, dy: 0 });
  });
});
