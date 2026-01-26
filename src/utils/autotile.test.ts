import { describe, it, expect } from 'vitest';
import { getTileMask, MASK } from './autotile.js';
import { Grid } from './grid.js';
import { TileType } from '../core/types.js';

describe('Autotiling', () => {
  describe('getTileMask', () => {
    it('returns 0 when there are no wall neighbors', () => {
      const grid = new Grid(3, 3);
      grid.setTile(1, 1, TileType.Wall);
      // All other tiles are Empty by default
      expect(getTileMask(grid, 1, 1)).toBe(0);
    });

    it('identifies orthogonal neighbors', () => {
      const grid = new Grid(3, 3);
      grid.setTile(1, 1, TileType.Wall);
      grid.setTile(1, 0, TileType.Wall); // North
      grid.setTile(2, 1, TileType.Wall); // East
      grid.setTile(1, 2, TileType.Wall); // South
      grid.setTile(0, 1, TileType.Wall); // West

      expect(getTileMask(grid, 1, 1)).toBe(MASK.N | MASK.E | MASK.S | MASK.W);
    });

    it('identifies diagonal neighbors', () => {
      const grid = new Grid(3, 3);
      grid.setTile(1, 1, TileType.Wall);
      grid.setTile(2, 0, TileType.Wall); // NE
      grid.setTile(2, 2, TileType.Wall); // SE
      grid.setTile(0, 2, TileType.Wall); // SW
      grid.setTile(0, 0, TileType.Wall); // NW

      expect(getTileMask(grid, 1, 1)).toBe(MASK.NE | MASK.SE | MASK.SW | MASK.NW);
    });

    it('identifies a mix of neighbors', () => {
      const grid = new Grid(3, 3);
      grid.setTile(1, 1, TileType.Wall);
      grid.setTile(1, 0, TileType.Wall); // N
      grid.setTile(2, 0, TileType.Wall); // NE
      grid.setTile(0, 1, TileType.Wall); // W

      expect(getTileMask(grid, 1, 1)).toBe(MASK.N | MASK.NE | MASK.W);
    });
  });
});