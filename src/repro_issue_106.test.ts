import { describe, it, expect } from 'vitest';
import { GameState } from './state.js';
import { Grid } from './grid.js';
import { EntityType, TileType, FruitType } from './types.js';
import { FRUIT_DURATION } from './config.js';

describe('Issue 106: Fruit bonus score persistence', () => {
  it('should remove fruit score after a duration', () => {
    // 1. Setup minimal grid with Pacman and empty space for fruit
    const grid = new Grid(5, 5);
    // Set Pacman spawn at 1,1
    // We will manually spawn fruit at 2,1
    // Grid defaults to Wall, set some empty
    grid.setTile(1, 1, TileType.PacmanSpawn);
    grid.setTile(2, 1, TileType.Empty);
    grid.setTile(3, 1, TileType.Empty);

    const state = new GameState(grid);
    state.startReady(0); // Skip ready state

    // Force spawn fruit at 2,1
    state['fruit'] = {
      type: EntityType.Fruit,
      x: 2,
      y: 1,
      fruitType: FruitType.Cherry,
    };
    state['fruitTimer'] = FRUIT_DURATION;

    // Get Pacman
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman);
    expect(pacman).toBeDefined();
    
    // Move Pacman towards fruit (Right)
    // 2,1 is to the right of 1,1
    pacman!.direction = { dx: 1, dy: 0 };
    
    // Update to move Pacman to eat fruit
    // Distance needed = 1.0. Speed is defined in config.
    // Let's just simulate enough time or set position directly for testing logic
    // But updatePacman handles collision detection.
    
    // Let's nudge Pacman close to Fruit to ensure collision in one frame
    pacman!.x = 1.9; 
    pacman!.y = 1;

    // Update state to trigger collision
    state.updatePacman({ dx: 1, dy: 0 }, 100);

    // Verify Fruit is eaten
    expect(state.getFruit()).toBeNull();

    // Verify PointEffect exists
    expect(state.getPointEffects().length).toBe(1);
    const effect = state.getPointEffects()[0];
    expect(effect.points).toBeGreaterThan(0);

    // Advance time significantly (e.g. 5 seconds)
    // We need to call updatePacman (or whatever updates effects) multiple times or with large delta
    // Since we don't know where the update logic will be, we assume it's in the main update loop (updatePacman/updateGhosts)
    
    // Currently, if the bug exists, this will NOT remove the effect
    state.updatePacman({ dx: 1, dy: 0 }, 5000); 

    // Expectation: PointEffect should be gone
    expect(state.getPointEffects().length).toBe(0);
  });
});
