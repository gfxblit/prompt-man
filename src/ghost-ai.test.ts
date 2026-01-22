import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameState } from './state.js';
import { Grid } from './grid.js';
import { EntityType } from './types.js';

describe('Ghost AI', () => {
  let grid: Grid;
  const template = `
#######
#P...G#
#######
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

  it('should initialize ghosts with different colors', () => {
    const multiGhostTemplate = `
#######
#P.G.G#
#..G.G#
#######
    `.trim();
    const customGrid = Grid.fromString(multiGhostTemplate);
    const state = new GameState(customGrid);
    const ghosts = state.getEntities().filter(e => e.type === EntityType.Ghost);
    
    expect(ghosts).toHaveLength(4);
    const colors = ghosts.map(g => g.color);
    // Should have distinct colors from the predefined set and cycle through them
    expect(new Set(colors).size).toBe(4);
    expect(colors).toEqual(expect.arrayContaining(['red', 'pink', 'cyan', 'orange']));
  });

  it('should move ghosts in updateGhosts', () => {
    const state = new GameState(grid);
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;
    const initialX = ghost.x;
    
    // Set an initial direction for the ghost
    ghost.direction = { dx: -1, dy: 0 };
    
    state.updateGhosts(100);
    
    expect(ghost.x).toBeLessThan(initialX);
  });

  it('should change ghost direction when hitting a wall', () => {
    const wallTemplate = `
#####
#G..#
#####
    `.trim();
    const customGrid = Grid.fromString(wallTemplate);
    const state = new GameState(customGrid);
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;
    
    // Move left towards wall
    ghost.x = 1;
    ghost.direction = { dx: -1, dy: 0 };
    
    state.updateGhosts(100);
    
    // Should have changed direction because left is blocked
    expect(ghost.direction).not.toEqual({ dx: -1, dy: 0 });
    expect(ghost.direction!.dx !== 0 || ghost.direction!.dy !== 0).toBe(true);
  });

  it('should not reverse direction at intersections unless it is a dead end', () => {
    const intersectionTemplate = `
#####
#G..#
#.#.#
#...#
#####
    `.trim();
    // At (2,1), ghost moving Right can go Right (3,1), or Down (2,2)
    // It should NOT go Left (1,1)
    const customGrid = Grid.fromString(intersectionTemplate);
    const state = new GameState(customGrid);
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;
    
    ghost.x = 2;
    ghost.y = 1;
    ghost.direction = { dx: 1, dy: 0 };
    
    // Mock random to always choose the last option (if it were allowed to reverse, 
    // it would be one of the options)
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    state.updateGhosts(0);
    expect(ghost.direction).not.toEqual({ dx: -1, dy: 0 });

    // Reset and try another mock value
    ghost.direction = { dx: 1, dy: 0 };
    vi.spyOn(Math, 'random').mockReturnValue(0.01);
    state.updateGhosts(0);
    expect(ghost.direction).not.toEqual({ dx: -1, dy: 0 });

    vi.restoreAllMocks();
  });

  it('should move ghosts towards Pacman using Manhattan distance', () => {
    const chaseTemplate = `
#######
#G....#
#.....#
#....P#
#######
    `.trim();
    // G is at (1,1), P is at (5,3)
    const customGrid = Grid.fromString(chaseTemplate);
    const state = new GameState(customGrid);
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;
    
    // Starting at (1,1), possible moves are:
    // Right (2,1) -> Manhattan to (5,3): |5-2| + |3-1| = 3 + 2 = 5
    // Down (1,2) -> Manhattan to (5,3): |5-1| + |3-2| = 4 + 1 = 5
    // Both are equal, let's say it picks the first one in list (Up, Left, Down, Right)
    // Wait, the list is [Up, Left, Down, Right].
    // At (1,1):
    // Up (1,0) - Wall
    // Left (0,1) - Wall
    // Down (1,2) - Walkable
    // Right (2,1) - Walkable
    
    state.updateGhosts(0); // Trigger direction picking
    
    // It should pick either Down or Right. 
    // In our implementation, we pick the first one that has the minimum distance.
    // Down (1,2) has distance 5.
    // Right (2,1) has distance 5.
    // Since Down comes before Right in the list, it should pick Down.
    
    expect(ghost.direction).toEqual({ dx: 0, dy: 1 });
  });
});
