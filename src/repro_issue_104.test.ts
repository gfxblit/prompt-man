import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameState } from './state.js';
import { Grid } from './grid.js';
import { EntityType, TileType } from './types.js';

vi.mock('./config.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('./config.js')>();
  return {
    ...mod,
    READY_DURATION: 0,
  };
});

describe('Reproduction: Issue #104 - Ghost random movement in jail', () => {
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

  it('ghosts in jail should consistently move towards the jail door', () => {
    // A wider jail where the ghost has choices
    // Exit at (4, 0)
    // Door is at (4, 1)
    // Ghost is at (3, 2)
    const template = `
#### ####
#   -   #
#  GGGG #
#########
`;
    const grid = Grid.fromString(template);
    const state = new GameState(grid);
    
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;
    
    // Position check
    expect(ghost.isLeavingJail).toBe(true);
    
    // Let's place the ghost at (2,2) which is an empty tile in our room
    // but outside the bounding box of G and -.
    ghost.x = 2;
    ghost.y = 2;
    
    // update state
    state.updateGhosts(1);
    
    // It should still be in leaving jail mode even if it's on an empty tile
    // but still inside the jail room.
    expect(ghost.isLeavingJail).toBe(true);
    
    // Check direction - should want to move towards (4, 1)
    // From (2, 2):
    // Up: (2, 1), dist to (4, 1) = |2-4| + |1-1| = 2
    // Right: (3, 2), dist to (4, 1) = |3-4| + |2-1| = 1 + 1 = 2
    // Left: (1, 2), dist = 3 + 1 = 4
    // Down: (2, 3), wall
    
    const dir = ghost.direction!;
    const isOptimal = (dir.dx === 1 && dir.dy === 0) || (dir.dx === 0 && dir.dy === -1);
    expect(isOptimal).toBe(true);
    
    // If it chose Right (3, 2), next update should definitely prefer Up (3, 1) or Right (4, 2)
    // From (3, 2):
    // Up: (3, 1), dist = |3-4| + |1-1| = 1
    // Right: (4, 2), dist = |4-4| + |2-1| = 1
    // Down: (3, 3), dist = |3-4| + |3-1| = 1 + 2 = 3
    // Left: (2, 2) - reversed, not allowed unless dead end
    
    // Let's run multiple steps and ensure it reaches the door and eventually leaves jail
    let reachedDoor = false;
    let leftJail = false;
    for (let i = 0; i < 100; i++) {
        state.updateGhosts(100);
        const x = Math.round(ghost.x);
        const y = Math.round(ghost.y);
        const tile = grid.getTile(x, y);
        
        if (tile === TileType.JailDoor) {
            reachedDoor = true;
        }
        if (reachedDoor && !ghost.isLeavingJail) {
            leftJail = true;
            break;
        }
    }
    
    expect(reachedDoor).toBe(true);
    expect(leftJail).toBe(true);
    expect(ghost.isLeavingJail).toBe(false);
  });

  it('ghosts should not move randomly even if scared while in jail', () => {
    const template = `
#### ####
#   -   #
#  GGGG #
#########
`;
    const grid = Grid.fromString(template);
    const state = new GameState(grid);
    
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;
    ghost.isScared = true; // Force scared state
    
    // Even if scared, if isLeavingJail is true, it should target the door.
    state.updateGhosts(100);
    
    // If it was random, it might pick Left or Down which have dist 4.
    // Up and Right have dist 2.
    const dir = ghost.direction!;
    const isOptimal = (dir.dx === 1 && dir.dy === 0) || (dir.dx === 0 && dir.dy === -1);
    expect(isOptimal).toBe(true);
  });

  it('scared ghost should turn towards the door even if it can continue straight', () => {
    // Door is at (4, 1)
    // Intersection at (4, 2)
    // Ghost starts at (4, 2) moving Right.
    const template = `
#### ####
#   -   #
#  GGGGG#
#########
`;
    const grid = Grid.fromString(template);
    const state = new GameState(grid);
    
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;
    ghost.isScared = true;
    ghost.x = 4; // Exactly at intersection
    ghost.y = 2;
    ghost.direction = { dx: 1, dy: 0 }; // Moving Right
    
    // It should choose UP to the door
    state.updateGhosts(1);
    
    expect(ghost.direction).toEqual({ dx: 0, dy: -1 }); // Should be UP
  });
});
