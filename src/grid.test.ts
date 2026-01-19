import { describe, it, expect } from 'vitest';
import { Grid } from './grid.js';
import { TileType } from './types.js';

describe('Grid', () => {
  it('should initialize with default tiles', () => {
    const grid = new Grid(10, 5, TileType.Wall);
    expect(grid.getWidth()).toBe(10);
    expect(grid.getHeight()).toBe(5);
    expect(grid.getTile(0, 0)).toBe(TileType.Wall);
    expect(grid.getTile(9, 4)).toBe(TileType.Wall);
  });

  it('should parse from string template', () => {
    const template = `
###
#P#
#.#
###
    `.trim();
    const grid = Grid.fromString(template);
    expect(grid.getWidth()).toBe(3);
    expect(grid.getHeight()).toBe(4);
    expect(grid.getTile(0, 0)).toBe(TileType.Wall);
    expect(grid.getTile(1, 1)).toBe(TileType.PacmanSpawn);
    expect(grid.getTile(1, 2)).toBe(TileType.Pellet);
    expect(grid.getTile(2, 3)).toBe(TileType.Wall);
  });

  it('should handle out of bounds', () => {
    const grid = new Grid(5, 5);
    expect(grid.getTile(-1, 0)).toBeUndefined();
    expect(grid.getTile(5, 0)).toBeUndefined();
    expect(grid.isOutOfBounds(2, 2)).toBe(false);
    expect(grid.isOutOfBounds(5, 5)).toBe(true);
  });

  it('should update tiles', () => {
    const grid = new Grid(5, 5, TileType.Pellet);
    grid.setTile(2, 2, TileType.Empty);
    expect(grid.getTile(2, 2)).toBe(TileType.Empty);
  });

  it('should check walkability', () => {
    const template = `
###
# #
###
    `.trim();
    const grid = Grid.fromString(template);
    expect(grid.isWalkable(0, 0)).toBe(false); // Wall
    expect(grid.isWalkable(1, 1)).toBe(true);  // Empty
    expect(grid.isWalkable(1, 0)).toBe(false); // Wall
    expect(grid.isWalkable(5, 5)).toBe(false); // Out of bounds
  });
});
