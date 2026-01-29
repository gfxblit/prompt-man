import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameState } from './state.js';
import { TileType, EntityType } from './types.js';
import { Grid } from './grid.js';
import { LEVEL_TEMPLATE, FRUIT_SPAWN_THRESHOLDS } from './config.js';

describe('Fruit Eating Logic', () => {
  let grid: Grid;
  let state: GameState;

  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
      removeItem: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    vi.stubGlobal('localStorage', localStorageMock);

    grid = Grid.fromString(LEVEL_TEMPLATE);
    state = new GameState(grid, undefined, true);
  });

  it('should not allow a ghost to eat a fruit', () => {
    const pellets = grid.findTiles(TileType.Pellet);
    
    // Spawn fruit
    for (let i = 0; i < FRUIT_SPAWN_THRESHOLDS[0]!; i++) {
      state.consumePellet(pellets[i]!.x, pellets[i]!.y);
    }
    
    expect(state.getFruit()).not.toBeNull();
    const fruitPos = { x: state.getFruit()!.x, y: state.getFruit()!.y };

    // Find a ghost and move it to the fruit position
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;
    ghost.x = fruitPos.x;
    ghost.y = fruitPos.y;

    // Skip ready timer
    state.updatePacman({ dx: 0, dy: 0 }, 2001);

    // Update ghosts
    state.updateGhosts(16);
    
    // Fruit should STILL be there
    expect(state.getFruit()).not.toBeNull();
  });
});
