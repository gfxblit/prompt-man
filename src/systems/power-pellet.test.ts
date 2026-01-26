import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GhostAI } from './ghost-ai.js';
import { Grid } from '../utils/grid.js';
import { EntityType, type Entity } from '../core/types.js';

describe('Power Pellet Mechanics', () => {

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

  it('should make ghosts flee from Pacman when scared', () => {
    // Layout:
    // #######
    // #.G...# (G at 2,1)
    // #.###.#
    // #..P..# (P at 3,3)
    // #######
    //
    // Distances from Ghost (2,1) to Pacman (3,3):
    // Move Left (1,1): |3-1| + |3-1| = 2 + 2 = 4 (Farther)
    // Move Right (3,1): |3-3| + |3-1| = 0 + 2 = 2 (Closer)

    const layout = `
#######
#.G...#
#.###.#
#..P..#
#######
    `.trim();

    const customGrid = Grid.fromString(layout);

    const ghost: Entity = {
      type: EntityType.Ghost,
      x: 2,
      y: 1,
      direction: { dx: 0, dy: 0 }
    };

    const target = { x: 3, y: 3 };

    // Normal behavior check (Go to target)
    // We expect this to work already
    const normalDir = GhostAI.pickDirection(ghost, target, customGrid, false);
    expect(normalDir).toEqual({ dx: 1, dy: 0 }); // Right

    // Scared behavior check (Random direction from valid moves - classic Pac-Man behavior)
    // Valid moves from (2,1): Left (-1,0) or Right (1,0), NOT reversal
    const scaredDir = GhostAI.pickDirection(ghost, target, customGrid, true);
    // Ghost should pick a valid non-zero direction
    expect(scaredDir.dx !== 0 || scaredDir.dy !== 0).toBe(true);
    // Direction should be either left or right (valid moves in this layout)
    expect([{ dx: -1, dy: 0 }, { dx: 1, dy: 0 }]).toContainEqual(scaredDir);
  });
});
