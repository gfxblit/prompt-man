import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameState } from '../systems/state.js';
import { Grid } from '../utils/grid.js';
import { EntityType } from '../core/types.js';

describe('Issue 60 Reproduction: Ghost-Ghost Collision', () => {
  let grid: Grid;
  // Create a grid with Pacman far away and two ghosts
  const template = `
#######
#P... #
# ... #
# G G #
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

  it('should not trigger eaten logic when ghosts overlap', () => {
    const state = new GameState(grid);
    const entities = state.getEntities();
    const ghosts = entities.filter(e => e.type === EntityType.Ghost);
    
    expect(ghosts).toHaveLength(2);
    const ghost1 = ghosts[0];
    const ghost2 = ghosts[1];

    if (!ghost1 || !ghost2) {
      throw new Error('Ghosts not found');
    }

    // Set ghost1 to scared
    ghost1.isScared = true;
    ghost2.isScared = false;

    // Force them to overlap
    ghost1.x = 3;
    ghost1.y = 3;
    ghost2.x = 3;
    ghost2.y = 3;

    // Directly call checkCollisions with a ghost to simulate the vulnerability/bug
    // The bug is that checkCollisions doesn't verify the input entity is Pacman.
    // If it is called with a ghost (e.g. by mistake or future refactor), it causes issues.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (state as any).checkCollisions(ghost2);

    // Verify ghost1 is NOT eaten (dead)
    expect(ghost1.isDead).toBeFalsy();
    
    // Verify score is 0
    expect(state.getScore()).toBe(0);
  });
});
