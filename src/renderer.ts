import { Grid } from './grid.js';
import { TileType, Entity, EntityType } from './types.js';

export const TILE_SIZE = 8;

export class Renderer {
  constructor(private ctx: CanvasRenderingContext2D) {}

  render(grid: Grid, entities: Entity[] = []): void {
    const width = grid.getWidth();
    const height = grid.getHeight();

    // Clear canvas
    this.ctx.clearRect(0, 0, width * TILE_SIZE, height * TILE_SIZE);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = grid.getTile(x, y);
        if (!tile) continue;

        this.renderTile(x, y, tile);
      }
    }

    this.renderEntities(entities);
  }

  private renderTile(x: number, y: number, tile: TileType): void {
    const screenX = x * TILE_SIZE;
    const screenY = y * TILE_SIZE;

    switch (tile) {
      case TileType.Wall:
        this.ctx.fillStyle = 'blue';
        this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        break;

      case TileType.Pellet:
        this.ctx.fillStyle = 'peachpuff';
        this.ctx.fillRect(
          screenX + TILE_SIZE / 2 - 1,
          screenY + TILE_SIZE / 2 - 1,
          2,
          2
        );
        break;

      case TileType.PowerPellet:
        this.ctx.fillStyle = 'peachpuff';
        this.ctx.beginPath();
        this.ctx.arc(
          screenX + TILE_SIZE / 2,
          screenY + TILE_SIZE / 2,
          3,
          0,
          Math.PI * 2
        );
        this.ctx.fill();
        break;

      case TileType.Empty:
      case TileType.PacmanSpawn:
      case TileType.GhostSpawn:
      default:
        // Do nothing for these tiles
        break;
    }
  }

  private renderEntities(entities: Entity[]): void {
    for (const entity of entities) {
      this.renderEntity(entity);
    }
  }

  private renderEntity(entity: Entity): void {
    const screenX = entity.x * TILE_SIZE + TILE_SIZE / 2;
    const screenY = entity.y * TILE_SIZE + TILE_SIZE / 2;

    switch (entity.type) {
      case EntityType.Pacman:
        this.ctx.fillStyle = 'yellow';
        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY, TILE_SIZE / 2 - 1, 0.2 * Math.PI, 1.8 * Math.PI);
        this.ctx.lineTo(screenX, screenY);
        this.ctx.closePath();
        this.ctx.fill();
        break;

      case EntityType.Ghost:
        this.ctx.fillStyle = entity.color || 'red';
        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY, TILE_SIZE / 2 - 1, Math.PI, 0);
        this.ctx.lineTo(screenX + TILE_SIZE / 2 - 1, screenY + TILE_SIZE / 2 - 1);
        this.ctx.lineTo(screenX - TILE_SIZE / 2 + 1, screenY + TILE_SIZE / 2 - 1);
        this.ctx.closePath();
        this.ctx.fill();
        break;
    }
  }
}
