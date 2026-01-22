import { Direction, Entity, IGrid } from './types.js';

export class GhostAI {
  /**
   * Calculates the Manhattan distance between two points.
   */
  private static getManhattanDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  /**
   * Picks the next direction for a ghost to move towards a target.
   * At each intersection, it chooses the move that minimizes the Manhattan distance to the target.
   * Ghosts cannot reverse their current direction unless they encounter a dead end.
   */
  public static pickDirection(
    ghost: Entity,
    target: { x: number; y: number },
    grid: IGrid
  ): Direction {
    const x = Math.round(ghost.x);
    const y = Math.round(ghost.y);
    
    const possibleDirs: Direction[] = [
      { dx: 0, dy: -1 }, // Up
      { dx: -1, dy: 0 }, // Left
      { dx: 0, dy: 1 },  // Down
      { dx: 1, dy: 0 },  // Right
    ];

    const currentDir = ghost.direction;
    const validMoves = possibleDirs.filter(dir => {
      // 1. Check if the tile is walkable
      if (!grid.isWalkable(x + dir.dx, y + dir.dy)) {
        return false;
      }

      // 2. Prevent reversal unless it's the only option
      if (currentDir && dir.dx === -currentDir.dx && dir.dy === -currentDir.dy) {
        return false;
      }

      return true;
    });

    // If no valid moves (dead end), the only choice is to reverse
    if (validMoves.length === 0) {
      if (currentDir) {
        return { dx: -currentDir.dx || 0, dy: -currentDir.dy || 0 };
      }
      // If no current direction and no valid moves, just stay put (shouldn't happen in a valid maze)
      return { dx: 0, dy: 0 };
    }

    // If there's only one valid move, take it
    if (validMoves.length === 1) {
      return validMoves[0]!;
    }

    // Otherwise, pick the move that minimizes Manhattan distance to target
    let bestDir = validMoves[0]!;
    let minDistance = Infinity;

    for (const dir of validMoves) {
      const distance = this.getManhattanDistance(x + dir.dx, y + dir.dy, target.x, target.y);
      if (distance < minDistance) {
        minDistance = distance;
        bestDir = dir;
      }
    }

    return bestDir;
  }
}
