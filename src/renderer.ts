import { TileType, EntityType } from './types.js';
import type { Entity, IGrid, IRenderer, IGameState, IUIRenderer, JoystickState } from './types.js';
import { TILE_SIZE, COLORS } from './config.js';

export class Renderer implements IRenderer {
  constructor(private ctx: CanvasRenderingContext2D) { }

  render(grid: IGrid, state: IGameState): void {
    const width = grid.getWidth();
    const height = grid.getHeight();

    // Clear canvas
    this.ctx.clearRect(0, 0, width * TILE_SIZE, height * TILE_SIZE);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = grid.getTile(x, y);
        if (!tile) continue;

        // Skip eaten pellets
        if ((tile === TileType.Pellet || tile === TileType.PowerPellet) && 
            state.isPelletEaten(x, y)) {
          continue;
        }

        this.renderTile(x, y, tile);
      }
    }

    this.renderEntities(state.getEntities());
  }

  private renderTile(x: number, y: number, tile: TileType): void {
    const screenX = x * TILE_SIZE;
    const screenY = y * TILE_SIZE;

    switch (tile) {
      case TileType.Wall:
        this.ctx.fillStyle = COLORS.WALL;
        this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        break;

      case TileType.Pellet:
        this.ctx.fillStyle = COLORS.PELLET;
        this.ctx.fillRect(
          screenX + TILE_SIZE / 2 - 1,
          screenY + TILE_SIZE / 2 - 1,
          2,
          2
        );
        break;

      case TileType.PowerPellet:
        this.ctx.fillStyle = COLORS.PELLET;
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
      case EntityType.Pacman: {
        this.ctx.fillStyle = COLORS.PACMAN;
        this.ctx.beginPath();
        
        const rotation = entity.direction 
          ? Math.atan2(entity.direction.dy, entity.direction.dx) 
          : 0;
        
        const startAngle = 0.2 * Math.PI + rotation;
        const endAngle = 1.8 * Math.PI + rotation;
        
        this.ctx.arc(screenX, screenY, TILE_SIZE / 2 - 1, startAngle, endAngle);
        this.ctx.lineTo(screenX, screenY);
        this.ctx.closePath();
        this.ctx.fill();
        break;
      }

      case EntityType.Ghost:
        this.ctx.fillStyle = entity.color || COLORS.GHOST_DEFAULT;
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

export class UIRenderer implements IUIRenderer {
  constructor(private ctx: CanvasRenderingContext2D) {}

  render(joystick: JoystickState): void {
    if (!joystick.active) return;

    this.ctx.save();
    
    // Draw outer circle (base)
    this.ctx.beginPath();
    this.ctx.arc(joystick.originX, joystick.originY, 40, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Draw inner circle (stick)
    this.ctx.beginPath();
    this.ctx.arc(joystick.currentX, joystick.currentY, 20, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.fill();
    
    this.ctx.restore();
  }
}