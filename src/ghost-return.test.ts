import { describe, it, expect } from 'vitest';
import { Grid } from './grid.js';
import { GhostAI } from './ghost-ai.js';
import { EntityType } from './types.js';

describe('Ghost Return Logic (BFS)', () => {
  it('should calculate a path using BFS that solves local minima where Greedy fails', () => {
    // A spiral/trap map that forces movement AWAY from the target initially.
    // G at (2, 3). Target T at (1, 1).
    //
    // Map Layout:
    // 0 1 2 3 4
    // . . . . .  0
    // . # T . .  1  (T at 1,1)
    // . # # # .  2  (Wall blocks direct path Up)
    // . # G . .  3  (G at 2,3)
    // . # # # .  4  (Wall blocks direct path Down)
    
    // Grid:
    // 01234
    // 1 #T..#  (Wall at 1,1? No T is there. So T is at 1,1. Walls must surround it?)
    
    // Let's use the exact successful trap from the reproduction:
    // #####
    // #T..#  (T at 1,1)
    // ###.#  (Wall 0,2 to 2,2. Gap at 3,2)
    // #.G.#  (G at 2,3)
    // #####
    
    // Greedy Analysis:
    // G (2,3) -> T (1,1).
    // Left (1,3) is OPEN. Dist |1-1| + |3-1| = 0 + 2 = 2.
    // Right (3,3) is OPEN. Dist |3-1| + |3-1| = 2 + 2 = 4.
    // Greedy picks Left (1,3).
    // BUT (1,3) is a dead end (surrounded by walls at 0,3; 1,2; 1,4).
    // So Greedy goes Left, hits wall, reverses to (2,3), and loops.
    
    // BFS Analysis:
    // Should see that Left leads nowhere.
    // Should pick Right (3,3) -> Up (3,2) -> Left (2,1)? No 2,1 is Empty? 
    // Wait, Row 1 is #T..# -> (0,1)# (1,1)T (2,1). (3,1). (4,1)#.
    // So path: (2,3) -> Right (3,3) -> Up (3,2) -> Up (3,1) -> Left (2,1) -> Left (1,1).
    
    const map = [
        '#####',
        '#T..#', // T at 1,1. 2,1 and 3,1 are empty.
        '###.#', // Wall 0,2-2,2. Gap at 3,2.
        '#.G.#', // G at 2,3. Left 1,3 empty. Wall 1,2 is #.
        '#####'
    ].join('\n');
    
    const grid = Grid.fromString(map);
    const ghost = {
      type: EntityType.Ghost,
      x: 2,
      y: 3,
      direction: { dx: 0, dy: 0 },
      isDead: true,
      isLeavingJail: false
    };
    const target = { x: 1, y: 1 };
    
    // Verify BFS finds the correct first step (Right)
    const bfsDir = GhostAI.findBFSDirection(ghost, target, grid, true, false);
    
    expect(bfsDir.dx).toBe(1); // Right
    expect(bfsDir.dy).toBe(0);
    
    // Verify Greedy would pick the wrong direction (Left)
    // This confirms that our scenario effectively tests the difference
    const greedyDir = GhostAI.pickDirection(ghost, target, grid, false, true, false);
    expect(greedyDir.dx).toBe(-1); // Left
    expect(greedyDir.dy).toBe(0);
  });

  it('should navigate via grid wrapping if it is the shortest path', () => {
    // Map where direct path is blocked, but wrapping is open.
    // G at (1, 1). Target at (3, 1). Width 5.
    // # G # T #
    // But direct path G->T is blocked by wall at (2, 1).
    // Must go Left (0, 1) -> Wrap -> (4, 1) -> (3, 1).
    
    const map = [
      '.G#T.' 
    ].join('\n');
    // Grid 5x1.
    // (0,0) .
    // (1,0) G
    // (2,0) #
    // (3,0) T
    // (4,0) .
    
    const grid = Grid.fromString(map);
    const ghost = {
      type: EntityType.Ghost,
      x: 1,
      y: 0,
      direction: { dx: 0, dy: 0 },
      isDead: true,
      isLeavingJail: false
    };
    const target = { x: 3, y: 0 };
    
    const bfsDir = GhostAI.findBFSDirection(ghost, target, grid, true, false);
    
    // Expect Left (-1, 0) to wrap around
    expect(bfsDir.dx).toBe(-1);
    expect(bfsDir.dy).toBe(0);
  });

  it('should prevent immediate reversal for living ghosts using BFS', () => {
    // Grid 5x1
    // T G . . .
    // G at (1, 0). Moving Right (+1, 0).
    // Target T at (0, 0).
    // Direct path is Left (-1, 0) - this is REVERSE.
    // If reverse forbidden, must go Right and wrap around.
    
    const map = '.....'; // All empty (using dots for clarity)
    const grid = Grid.fromString(map);
    const ghost = {
      type: EntityType.Ghost,
      x: 1,
      y: 0,
      direction: { dx: 1, dy: 0 }, // Moving Right
      isDead: false, // Living ghost
      isLeavingJail: false
    };
    const target = { x: 0, y: 0 };
    
    const bfsDir = GhostAI.findBFSDirection(ghost, target, grid, false, false);
    
    // Should NOT be Left (-1, 0)
    expect(bfsDir.dx).not.toBe(-1);
    
    // Should be Right (1, 0) to wrap around
    expect(bfsDir.dx).toBe(1);
    expect(bfsDir.dy).toBe(0);
  });
});
