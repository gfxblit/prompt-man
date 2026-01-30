
import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from './state.js';
import { Grid } from './grid.js';
import { EntityType } from './types.js';
import { LEVEL_TEMPLATE, WIN_DELAY } from './config.js';

describe('Ghost Jail Reset Bug', () => {
  let grid: Grid;
  let state: GameState;

  beforeEach(() => {
    grid = Grid.fromString(LEVEL_TEMPLATE);
    state = new GameState(grid);
  });

  it('should reset isLeavingJail to true for ghosts when level resets', () => {
    // 1. Get a ghost
    const ghosts = state.getEntities().filter(e => e.type === EntityType.Ghost);
    const ghost = ghosts[0];
    expect(ghost).toBeDefined();

    // 2. Simulate ghost having left the jail
    ghost!.isLeavingJail = false;
    // Move it somewhere outside just to be sure, though resetPositions moves it back
    ghost!.x = 1; 
    ghost!.y = 1;

    // 3. Trigger level win
    // We can force the win state directly if we want to avoid eating all pellets manually
    // But since 'resetLevel' is private, we have to trigger it via updateGhosts or similar
    // The cleanest way is to consume all pellets or mock the win condition.
    
    // Let's hack the win condition for the test to avoid complex setup
    // Accessing private property 'win' is not easy in TS without casting
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (state as any).win = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (state as any).winTimer = WIN_DELAY;

    // 4. Update state to trigger resetLevel
    // passing a deltaTime slightly larger than WIN_DELAY
    state.updateGhosts(WIN_DELAY + 100);

    // 5. Verify level increased
    expect(state.getLevel()).toBe(2);

    // 6. Verify ghost is back at spawn (resetPositions works)
    // Note: The first ghost might not be at the first spawn index, but it should be at A spawn.
    // Actually resetPositions uses initialPositions map.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const initialPos = (state as any).initialPositions.get(ghost);
    expect(ghost!.x).toBe(initialPos.x);
    expect(ghost!.y).toBe(initialPos.y);

    // 7. CRITICAL: Verify isLeavingJail is reset to true
    expect(ghost!.isLeavingJail).toBe(true);
  });
});
