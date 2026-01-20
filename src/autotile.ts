import { TileType, type IGrid } from './types.js';

/**
 * Neighbor bitmask values for Orthogonal and Diagonal neighbors
 */
export const MASK = {
  N: 1,
  E: 2,
  S: 4,
  W: 8,
  NE: 16,
  SE: 32,
  SW: 64,
  NW: 128,
} as const;

/**
 * Calculates an 8-neighbor bitmask for a wall tile.
 * 
 * @param grid The game grid
 * @param x Tile X coordinate
 * @param y Tile Y coordinate
 * @returns A bitmask value from 0 to 255
 */
export function getTileMask(grid: IGrid, x: number, y: number): number {
  let mask = 0;
  const isWall = (tx: number, ty: number) => grid.getTile(tx, ty) === TileType.Wall;

  if (isWall(x, y - 1)) mask |= MASK.N;
  if (isWall(x + 1, y)) mask |= MASK.E;
  if (isWall(x, y + 1)) mask |= MASK.S;
  if (isWall(x - 1, y)) mask |= MASK.W;

  if (isWall(x + 1, y - 1)) mask |= MASK.NE;
  if (isWall(x + 1, y + 1)) mask |= MASK.SE;
  if (isWall(x - 1, y + 1)) mask |= MASK.SW;
  if (isWall(x - 1, y - 1)) mask |= MASK.NW;

  return mask;
}