import { TileType, EntityType } from './types.js';
import type { Entity, IGrid, IGameState, Direction } from './types.js';

export class GameState implements IGameState {
  private entities: Entity[] = [];
  private score: number = 0;
  private remainingPellets: number = 0;
  private eatenPellets: Set<string> = new Set();

  constructor(private grid: IGrid) {
    this.initialize();
  }

  private initialize(): void {
    // Find Pacman spawn
    const pacmanSpawns = this.grid.findTiles(TileType.PacmanSpawn);
    for (const spawn of pacmanSpawns) {
      this.entities.push({
        type: EntityType.Pacman,
        x: spawn.x,
        y: spawn.y,
      });
    }

    // Find Ghost spawns
    const ghostSpawns = this.grid.findTiles(TileType.GhostSpawn);
    for (const spawn of ghostSpawns) {
      this.entities.push({
        type: EntityType.Ghost,
        x: spawn.x,
        y: spawn.y,
      });
    }

    // Count pellets
    const pellets = this.grid.findTiles(TileType.Pellet);
    const powerPellets = this.grid.findTiles(TileType.PowerPellet);
    this.remainingPellets = pellets.length + powerPellets.length;
  }

  getEntities(): Entity[] {
    return this.entities;
  }

  getScore(): number {
    return this.score;
  }

  getRemainingPellets(): number {
    return this.remainingPellets;
  }

  isPelletEaten(x: number, y: number): boolean {
    return this.eatenPellets.has(`${x},${y}`);
  }

  consumePellet(x: number, y: number): void {
    if (this.isPelletEaten(x, y)) {
      return;
    }

    const tile = this.grid.getTile(x, y);
    if (tile === TileType.Pellet || tile === TileType.PowerPellet) {
      this.eatenPellets.add(`${x},${y}`);
      this.remainingPellets--;
      this.score += tile === TileType.Pellet ? 10 : 50;
    }
  }

  movePacman(x: number, y: number): void {
    const pacman = this.entities.find(e => e.type === EntityType.Pacman);
    if (pacman && (pacman.x !== x || pacman.y !== y) && this.grid.isWalkable(x, y) && !this.grid.isOutOfBounds(x, y)) {
      pacman.x = x;
      pacman.y = y;
      this.consumePellet(x, y);
    }
  }

  updatePacman(direction: Direction): void {
    const pacman = this.entities.find(e => e.type === EntityType.Pacman);
    if (pacman) {
      this.movePacman(pacman.x + direction.dx, pacman.y + direction.dy);
    }
  }
}
