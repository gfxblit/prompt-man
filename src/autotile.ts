import { TileType, IGrid, QuadrantType } from './types.js';

/**
 * Determines the quadrant type for a specific corner of a tile.
 * 
 * @param grid The game grid
 * @param x Tile X coordinate
 * @param y Tile Y coordinate
 * @param dx Horizontal direction of the quadrant (-1 for left, 1 for right)
 * @param dy Vertical direction of the quadrant (-1 for top, 1 for bottom)
 */
export function getQuadrantType(
  grid: IGrid,
  x: number,
  y: number,
  dx: -1 | 1,
  dy: -1 | 1
): QuadrantType {
  const isWall = (tx: number, ty: number) => grid.getTile(tx, ty) === TileType.Wall;

  const v = isWall(x, y + dy);
  const h = isWall(x + dx, y);
  const d = isWall(x + dx, y + dy);

  if (!v && !h) {
    return QuadrantType.OuterCorner;
  }
  if (v && !h) {
    return QuadrantType.VerticalEdge;
  }
  if (!v && h) {
    return QuadrantType.HorizontalEdge;
  }
  // v && h
  if (!d) {
    return QuadrantType.InnerCorner;
  }
  return QuadrantType.Fill;
}
