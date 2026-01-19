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

  it('should handle malformed templates', () => {
    const template = `
###

#P
    `.trim();
    const grid = Grid.fromString(template);
    // Line 2 is empty, Line 3 is shorter than Line 1.
    expect(grid.getWidth()).toBe(3);
    expect(grid.getHeight()).toBe(3);
    expect(grid.getTile(0, 2)).toBe(TileType.Wall);
    expect(grid.getTile(2, 2)).toBe(TileType.Empty); // Out of range of line[2] but in grid
  });

  it('should update tiles', () => {
    const grid = new Grid(5, 5, TileType.Pellet);
    grid.setTile(2, 2, TileType.Empty);
    expect(grid.getTile(2, 2)).toBe(TileType.Empty);
  });

  it('should not throw when setting out of bounds tile', () => {
    const grid = new Grid(5, 5);
    grid.setTile(-1, 0, TileType.Wall);
    grid.setTile(5, 0, TileType.Wall);
    // Should not change anything or throw
    expect(grid.getTile(0, 0)).toBe(TileType.Empty);
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

  it('should find tiles of a specific type', () => {
    const template = `
#P#
#G#
#G#
    `.trim();
    const grid = Grid.fromString(template);
    const ghostSpawns = grid.findTiles(TileType.GhostSpawn);
    expect(ghostSpawns).toHaveLength(2);
    expect(ghostSpawns).toContainEqual({ x: 1, y: 1 });
    expect(ghostSpawns).toContainEqual({ x: 1, y: 2 });

    const pacmanSpawns = grid.findTiles(TileType.PacmanSpawn);
    expect(pacmanSpawns).toEqual([{ x: 1, y: 0 }]);

    const pellets = grid.findTiles(TileType.Pellet);
    expect(pellets).toHaveLength(0);
  });

  it('should handle empty string in fromString', () => {
    const grid = Grid.fromString('');
    expect(grid.getWidth()).toBe(0);
    expect(grid.getHeight()).toBe(0);
  });

  it('should handle non-rectangular strings in fromString', () => {
    const template = `
#
###
`;
    const grid = Grid.fromString(template);
    expect(grid.getWidth()).toBe(3);
    expect(grid.getHeight()).toBe(2);
    expect(grid.getTile(0, 1)).toBe(TileType.Wall);
    expect(grid.getTile(2, 1)).toBe(TileType.Wall);
    expect(grid.getTile(1, 0)).toBe(TileType.Empty); // line[0][1] is undefined
  });

  it('should handle out of bounds in setTile', () => {
    const grid = new Grid(2, 2);
    grid.setTile(-1, 0, TileType.Wall);
    grid.setTile(0, -1, TileType.Wall);
    grid.setTile(2, 0, TileType.Wall);
    grid.setTile(0, 2, TileType.Wall);
    // No errors should occur
    expect(grid.getTile(0, 0)).toBe(TileType.Empty);
  });
  });
});
