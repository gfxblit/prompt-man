import { EntityType, TileType } from './types.js';
import type { Entity, IGrid } from './types.js';
import { PELLET_SCORE, POWER_PELLET_SCORE } from './config.js';
import { Grid } from './grid.js';

export class GameState implements IGrid {
  private grid: Grid;
  private pacman: Entity;
  private ghosts: Entity[] = [];
  private score: number = 0;
  private pelletCount: number = 0;
  private powerPelletCount: number = 0;

  constructor(initialGrid: IGrid) {
    // Create an internal mutable grid to be the source of truth
    this.grid = new Grid(initialGrid.getWidth(), initialGrid.getHeight());
    this.pacman = { type: EntityType.Pacman, x: 0, y: 0 };
    this.initialize(initialGrid);
  }

  private initialize(initialGrid: IGrid): void {
    const width = initialGrid.getWidth();
    const height = initialGrid.getHeight();

    // Copy tiles from initialGrid and count pellets
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = initialGrid.getTile(x, y);
        if (tile) {
          this.grid.setTile(x, y, tile);
          if (tile === TileType.Pellet) this.pelletCount++;
          if (tile === TileType.PowerPellet) this.powerPelletCount++;
        }
      }
    }

    // Initialize entities from the grid
    const pacmanSpawns = this.grid.findTiles(TileType.PacmanSpawn);
    if (pacmanSpawns.length > 0) {
      const spawn = pacmanSpawns[0];
      if (spawn) {
        this.pacman = { type: EntityType.Pacman, x: spawn.x, y: spawn.y };
      }
    }

    this.grid.findTiles(TileType.GhostSpawn).forEach(({ x, y }) => {
      this.ghosts.push({ type: EntityType.Ghost, x, y });
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
    // Now perfectly consistent because we update the underlying grid
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
    return this.pelletCount;
  }

  getPowerPelletCount(): number {
    return this.powerPelletCount;
  }

  getTile(x: number, y: number): TileType | undefined {
    return this.grid.getTile(x, y);
  }

  movePacman(x: number, y: number): void {
    this.pacman.x = x;
    this.pacman.y = y;

    const tile = this.grid.getTile(x, y);
    if (tile === TileType.Pellet) {
      this.grid.setTile(x, y, TileType.Empty);
      this.pelletCount--;
      this.score += PELLET_SCORE;
    } else if (tile === TileType.PowerPellet) {
      this.grid.setTile(x, y, TileType.Empty);
      this.powerPelletCount--;
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
