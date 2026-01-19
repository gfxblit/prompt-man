import { EntityType, TileType } from './types.js';
import type { Entity, IGrid } from './types.js';
import { PELLET_SCORE, POWER_PELLET_SCORE } from './config.js';

export class GameState implements IGrid {
  private grid: IGrid;
  private pacman: Entity;
  private ghosts: Entity[] = [];
  private pellets: Set<number> = new Set();
  private powerPellets: Set<number> = new Set();
  private score: number = 0;

  constructor(grid: IGrid) {
    this.grid = grid;
    this.pacman = { type: EntityType.Pacman, x: 0, y: 0 };
    this.initialize();
  }

  private initialize(): void {
    const width = this.grid.getWidth();

    // Use abstracted findTiles to decouple from grid traversal
    const pacmanSpawns = this.grid.findTiles(TileType.PacmanSpawn);
    if (pacmanSpawns.length > 0) {
      this.pacman = { type: EntityType.Pacman, x: pacmanSpawns[0].x, y: pacmanSpawns[0].y };
    }

    this.grid.findTiles(TileType.GhostSpawn).forEach(({ x, y }) => {
      this.ghosts.push({ type: EntityType.Ghost, x, y });
    });

    this.grid.findTiles(TileType.Pellet).forEach(({ x, y }) => {
      this.pellets.add(y * width + x);
    });

    this.grid.findTiles(TileType.PowerPellet).forEach(({ x, y }) => {
      this.powerPellets.add(y * width + x);
    });
  }

  getWidth(): number {
    return this.grid.getWidth();
  }

  getHeight(): number {
    return this.grid.getHeight();
  }

  isOutOfBounds(x: number, y: number): boolean {
    return this.grid.isOutOfBounds(x, y);
  }

  isWalkable(x: number, y: number): boolean {
    return this.grid.isWalkable(x, y);
  }

  findTiles(type: TileType): { x: number; y: number }[] {
    // Return current tiles, considering consumed pellets
    if (type === TileType.Pellet) {
      const width = this.getWidth();
      return Array.from(this.pellets).map(pos => ({
        x: pos % width,
        y: Math.floor(pos / width),
      }));
    }
    if (type === TileType.PowerPellet) {
      const width = this.getWidth();
      return Array.from(this.powerPellets).map(pos => ({
        x: pos % width,
        y: Math.floor(pos / width),
      }));
    }
    // For other types, they don't change in GameState (for now)
    return this.grid.findTiles(type);
  }

  getPacman(): Entity {
    return this.pacman;
  }

  getGhosts(): Entity[] {
    return [...this.ghosts];
  }

  getScore(): number {
    return this.score;
  }

  getPelletCount(): number {
    return this.pellets.size;
  }

  getPowerPelletCount(): number {
    return this.powerPellets.size;
  }

  getTile(x: number, y: number): TileType | undefined {
    const tile = this.grid.getTile(x, y);
    if (tile === undefined) return undefined;

    const pos = y * this.getWidth() + x;
    if (tile === TileType.Pellet && !this.pellets.has(pos)) {
      return TileType.Empty;
    }
    if (tile === TileType.PowerPellet && !this.powerPellets.has(pos)) {
      return TileType.Empty;
    }
    return tile;
  }

  movePacman(x: number, y: number): void {
    this.pacman.x = x;
    this.pacman.y = y;

    const pos = y * this.getWidth() + x;
    if (this.pellets.has(pos)) {
      this.pellets.delete(pos);
      this.score += PELLET_SCORE;
    } else if (this.powerPellets.has(pos)) {
      this.powerPellets.delete(pos);
      this.score += POWER_PELLET_SCORE;
    }
  }

  moveGhost(index: number, x: number, y: number): void {
    const ghost = this.ghosts[index];
    if (ghost) {
      ghost.x = x;
      ghost.y = y;
    }
  }
}
