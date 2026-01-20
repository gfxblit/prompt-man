import { describe, it, expect } from 'vitest';
import { Grid } from './grid.js';
import { QuadrantType } from './types.js';
import { getQuadrantType } from './autotile.js';

describe('Autotiling', () => {
  describe('getQuadrantType', () => {
    it('identifies Outer Corner when both adjacent neighbors are not walls', () => {
      const grid = Grid.fromString(`
...
.#.
...
      `.trim());
      // Middle is wall at (1,1). 
      // Top-left quadrant (TL) at (1,1) looks at:
      // V: (1,0) - Pellet
      // H: (0,1) - Pellet
      // D: (0,0) - Pellet
      expect(getQuadrantType(grid, 1, 1, -1, -1)).toBe(QuadrantType.OuterCorner);
    });

    it('identifies Vertical Edge when vertical neighbor is wall but horizontal is not', () => {
      const grid = Grid.fromString(`
.#.
.#.
...
      `.trim());
      // (1,1) TL quadrant:
      // V: (1,0) - Wall
      // H: (0,1) - Pellet
      expect(getQuadrantType(grid, 1, 1, -1, -1)).toBe(QuadrantType.VerticalEdge);
    });

    it('identifies Horizontal Edge when horizontal neighbor is wall but vertical is not', () => {
      const grid = Grid.fromString(`
...
###
...
      `.trim());
      // (1,1) TL quadrant:
      // V: (1,0) - Pellet
      // H: (0,1) - Wall
      expect(getQuadrantType(grid, 1, 1, -1, -1)).toBe(QuadrantType.HorizontalEdge);
    });

    it('identifies Inner Corner when both adjacent neighbors are walls but diagonal is not', () => {
      const grid = Grid.fromString(`
.##
###
...
      `.trim());
      // (1,1) TL quadrant:
      // V: (1,0) - Wall
      // H: (0,1) - Wall
      // D: (0,0) - Pellet
      expect(getQuadrantType(grid, 1, 1, -1, -1)).toBe(QuadrantType.InnerCorner);
    });

    it('identifies Fill when all neighbors are walls', () => {
      const grid = Grid.fromString(`
###
###
###
      `.trim());
      // (1,1) TL quadrant:
      // V: (1,0) - Wall
      // H: (0,1) - Wall
      // D: (0,0) - Wall
      expect(getQuadrantType(grid, 1, 1, -1, -1)).toBe(QuadrantType.Fill);
    });
  });
});
