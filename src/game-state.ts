import { EntityType, TileType } from './types.js';
import type { Entity, IGrid } from './types.js';
import { PELLET_SCORE, POWER_PELLET_SCORE } from './config.js';

export class GameState implements IGrid {
  private grid: IGrid;
  private pacman: Entity;
  private ghosts: Entity[] = [];
  private pellets: Set<string> = new Set();
  private powerPellets: Set<string> = new Set();
  private score: number = 0;

  constructor(grid: IGrid) {
    this.grid = grid;
    this.pacman = { type: EntityType.Pacman, x: 0, y: 0 };
    this.initialize();
  }

  private initialize(): void {
    for (let y = 0; y < this.grid.getHeight(); y++) {
      for (let x = 0; x < this.grid.getWidth(); x++) {
        const tile = this.grid.getTile(x, y);
        switch (tile) {
          case TileType.PacmanSpawn:
            this.pacman = { type: EntityType.Pacman, x, y };
            break;
          case TileType.GhostSpawn:
            this.ghosts.push({ type: EntityType.Ghost, x, y });
            break;
          case TileType.Pellet:
            this.pellets.add(`${x},${y}`);
            break;
          case TileType.PowerPellet:
            this.powerPellets.add(`${x},${y}`);
            break;
        }
      }
    }
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

    const pos = `${x},${y}`;
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

    const pos = `${x},${y}`;
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
