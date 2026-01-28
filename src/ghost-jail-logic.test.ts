import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameState } from './state.js';
import { Grid } from './grid.js';
import { EntityType } from './types.js';

vi.mock('./config.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('./config.js')>();
  return {
    ...mod,
    READY_DURATION: 0,
  };
});

describe('Ghost Jail Logic', () => {
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

  it('ghosts in jail should target the jail door to get out', () => {
    // G = GhostSpawn, - = JailDoor, # = Wall, . = Dot, P = Pacman
    const template = `
#######
#  P  #
#  -  #
#  G  #
#######
`;
    const grid = Grid.fromString(template);
    const state = new GameState(grid);
    
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;
    
    // Initial position: Ghost at (3, 3), JailDoor at (3, 2), Pacman at (3, 1)
    expect(ghost.x).toBe(3);
    expect(ghost.y).toBe(3);
    
    // Ghost should want to move UP towards the JailDoor (3, 2)
    // even though it's NOT dead yet.
    state.updateGhosts(100);
    
    // Currently, it might not move because JailDoor is not walkable for alive ghosts
    // or it might pick another direction if available.
    // In this template, UP is the only way towards the door.
    
    // We expect the ghost to have moved UP or at least picked UP as its direction.
    expect(ghost.direction).toEqual({ dx: 0, dy: -1 });
  });

  it('ghosts should be able to pass through the JailDoor when leaving the jail', () => {
    const template = `
#######
#  P  #
#  -  #
#  G  #
#######
`;
    const grid = Grid.fromString(template);
    const state = new GameState(grid);
    
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;
    
    // Move ghost to be just below the door
    ghost.x = 3;
    ghost.y = 2.9;
    ghost.direction = { dx: 0, dy: -1 };
    
    // Update ghosts. It should be able to move to y=2.8, etc.
    state.updateGhosts(100);
    
    expect(ghost.y).toBeLessThan(2.9);
  });
});
