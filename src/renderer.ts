import { TileType, EntityType } from './types.js';
import type { Entity, IGrid, IRenderer, IGameState, IUIRenderer, JoystickState } from './types.js';
import {
  TILE_SIZE,
  COLORS,
  PALETTE_ORIGIN_X,
  PALETTE_ORIGIN_Y,
  PALETTE_PADDING_X,
  PALETTE_PADDING_Y,
  JOYSTICK,
  POWER_PELLET_BLINK_RATE
} from './config.js';
import { getTileMask } from './autotile.js';
import { TILE_MAP, SOURCE_QUADRANT_SIZE, STATIC_SPRITE_MAP, SOURCE_TILE_SIZE } from './sprites.js';

export class Renderer implements IRenderer {
  constructor(
    private ctx: CanvasRenderingContext2D,
    private spritesheet?: HTMLImageElement
  ) { }

  render(grid: IGrid, state: IGameState, time: number = 0): void {
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

        this.renderTile(grid, x, y, tile, time);
      }
    }

    this.renderEntities(state.getEntities());
    this.renderLives(grid, state.getLives());

    if (state.isGameOver()) {
      this.renderGameOver(grid);
    }
  }

  private renderGameOver(grid: IGrid): void {
    const width = grid.getWidth() * TILE_SIZE;
    const height = grid.getHeight() * TILE_SIZE;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.fillStyle = '#ff0000';
    this.ctx.font = 'bold 32px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('GAME OVER', width / 2, height / 2);
  }

  private renderLives(grid: IGrid, lives: number): void {
    const height = grid.getHeight();
    const startX = TILE_SIZE * 2; // Start a bit offset from the left edge
    const startY = (height - 1) * TILE_SIZE; // Bottom row
    const gap = TILE_SIZE * 1.2;

    for (let i = 0; i < lives; i++) {
      const x = startX + i * gap + TILE_SIZE / 2;
      const y = startY + TILE_SIZE / 2;

      // Draw Pacman icon (facing right)
      this.ctx.fillStyle = COLORS.PACMAN;
      this.ctx.beginPath();
      
      const radius = TILE_SIZE / 2 - 2;
      const startAngle = 0.2 * Math.PI;
      const endAngle = 1.8 * Math.PI;
      
      this.ctx.arc(x, y, radius, startAngle, endAngle);
      this.ctx.lineTo(x, y);
      this.ctx.closePath();
      this.ctx.fill();
    }
  }

  private renderTile(grid: IGrid, x: number, y: number, tile: TileType, time: number = 0): void {
    const screenX = x * TILE_SIZE;
    const screenY = y * TILE_SIZE;

    switch (tile) {
      case TileType.Wall:
        if (this.spritesheet) {
          this.renderWallAutotiled(grid, x, y);
        } else {
          this.ctx.fillStyle = COLORS.WALL;
          this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        }
        break;

      case TileType.Pellet:
        if (this.spritesheet) {
          const [row, col] = STATIC_SPRITE_MAP.PELLET;
          this.ctx.drawImage(
            this.spritesheet,
            PALETTE_ORIGIN_X + (col * SOURCE_TILE_SIZE) + PALETTE_PADDING_X,
            PALETTE_ORIGIN_Y + (row * SOURCE_TILE_SIZE) + PALETTE_PADDING_Y,
            SOURCE_TILE_SIZE - PALETTE_PADDING_X,
            SOURCE_TILE_SIZE - PALETTE_PADDING_Y,
            screenX,
            screenY,
            TILE_SIZE,
            TILE_SIZE
          );
        } else {
          this.ctx.fillStyle = COLORS.PELLET;
          this.ctx.fillRect(
            screenX + TILE_SIZE / 2 - 1,
            screenY + TILE_SIZE / 2 - 1,
            2,
            2
          );
        }
        break;

      case TileType.PowerPellet:
        // Blink power pellets
        if (Math.floor(time / POWER_PELLET_BLINK_RATE) % 2 === 0) {
          if (this.spritesheet) {
            const [row, col] = STATIC_SPRITE_MAP.POWER_PELLET;
            this.ctx.drawImage(
              this.spritesheet,
              PALETTE_ORIGIN_X + (col * SOURCE_TILE_SIZE) + PALETTE_PADDING_X,
              PALETTE_ORIGIN_Y + (row * SOURCE_TILE_SIZE) + PALETTE_PADDING_Y,
              SOURCE_TILE_SIZE - PALETTE_PADDING_X,
              SOURCE_TILE_SIZE - PALETTE_PADDING_Y,
              screenX,
              screenY,
              TILE_SIZE,
              TILE_SIZE
            );
          } else {
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
          }
        }
        break;

      case TileType.Empty:
      case TileType.PacmanSpawn:
      case TileType.GhostSpawn:
      default:
        // Do nothing for these tiles
        break;
    }
  }

  private renderWallAutotiled(grid: IGrid, x: number, y: number): void {
    if (!this.spritesheet) return;
    const mask = getTileMask(grid, x, y);
    const quadrantSet = TILE_MAP[mask] || TILE_MAP[0]!;
    const screenX = x * TILE_SIZE;
    const screenY = y * TILE_SIZE;

    const renderQuadrantSize = TILE_SIZE / 2;

    for (let row = 0; row < 2; row++) {
      const quadrantRow = quadrantSet[row as 0 | 1];
      for (let col = 0; col < 2; col++) {
        const coord = quadrantRow[col as 0 | 1];
        const [sRow, sCol] = coord;

        this.ctx.drawImage(
          this.spritesheet,
          PALETTE_ORIGIN_X + (sCol * SOURCE_QUADRANT_SIZE) + PALETTE_PADDING_X,
          PALETTE_ORIGIN_Y + (sRow * SOURCE_QUADRANT_SIZE) + PALETTE_PADDING_Y,
          SOURCE_QUADRANT_SIZE - PALETTE_PADDING_X,
          SOURCE_QUADRANT_SIZE - PALETTE_PADDING_Y,
          screenX + col * renderQuadrantSize,
          screenY + row * renderQuadrantSize,
          renderQuadrantSize,
          renderQuadrantSize
        );
      }
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
        
        const rotation = entity.rotation ?? 0;
        
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
    this.ctx.arc(joystick.originX, joystick.originY, JOYSTICK.BASE_RADIUS, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Draw inner circle (stick)
    this.ctx.beginPath();
    this.ctx.arc(joystick.currentX, joystick.currentY, JOYSTICK.STICK_RADIUS, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.fill();
    
    this.ctx.restore();
  }
}