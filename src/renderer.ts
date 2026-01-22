import { TileType, EntityType } from './types.js';
import type { Entity, IGrid, IRenderer, IGameState, IUIRenderer, JoystickState } from './types.js';
import { TILE_SIZE, COLORS, PALETTE_ORIGIN_X, PALETTE_ORIGIN_Y, PALETTE_PADDING_X, PALETTE_PADDING_Y, JOYSTICK, PELLET_BLINK_RATE, UI } from './config.js';
import { getTileMask } from './autotile.js';
import { TILE_MAP, SOURCE_QUADRANT_SIZE, STATIC_SPRITE_MAP, SOURCE_TILE_SIZE } from './sprites.js';

export class Renderer implements IRenderer {
  constructor(
    private ctx: CanvasRenderingContext2D,
    private spritesheet?: HTMLImageElement
  ) { }

  render(grid: IGrid, state: IGameState, time: number): void {
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

    this.ctx.fillStyle = UI.GAME_OVER_OVERLAY;
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.fillStyle = UI.GAME_OVER_COLOR;
    this.ctx.font = UI.GAME_OVER_FONT;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('GAME OVER', width / 2, height / 2);
  }

  private renderLives(grid: IGrid, lives: number): void {
    const height = grid.getHeight();
    const startX = TILE_SIZE * 2; // Start a bit offset from the left edge
    const startY = (height - 1) * TILE_SIZE; // Bottom row
    const gap = TILE_SIZE * UI.LIVES_GAP_FACTOR;

    for (let i = 0; i < lives; i++) {
      const x = startX + i * gap + TILE_SIZE / 2;
      const y = startY + TILE_SIZE / 2;

      // Draw Pacman icon (facing right)
      this.ctx.fillStyle = COLORS.PACMAN;
      this.ctx.beginPath();
      
      const radius = TILE_SIZE / 2 - 2;
      const startAngle = UI.PACMAN_ARC_START;
      const endAngle = UI.PACMAN_ARC_END;
      
      this.ctx.arc(x, y, radius, startAngle, endAngle);
      this.ctx.lineTo(x, y);
      this.ctx.closePath();
      this.ctx.fill();
    }
  }

  private renderTile(grid: IGrid, x: number, y: number, tile: TileType, time: number): void {
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
        this.renderPellet(x, y, false, time);
        break;

      case TileType.PowerPellet:
        this.renderPellet(x, y, true, time);
        break;

      case TileType.Empty:
      case TileType.PacmanSpawn:
      case TileType.GhostSpawn:
      default:
        // Do nothing for these tiles
        break;
    }
  }

  private renderPellet(x: number, y: number, isPower: boolean, time: number): void {
    if (isPower) {
      const isVisible = Math.floor(time / PELLET_BLINK_RATE) % 2 === 0;
      if (!isVisible) return;
    }

    const screenX = x * TILE_SIZE;
    const screenY = y * TILE_SIZE;

    if (this.spritesheet) {
      const sprite = isPower ? STATIC_SPRITE_MAP.POWER_PELLET : STATIC_SPRITE_MAP.PELLET;
      this.drawImageFromSpritesheet(
        sprite[0],
        sprite[1],
        SOURCE_TILE_SIZE,
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
        isPower ? 3 : 1,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
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

        this.drawImageFromSpritesheet(
          sRow,
          sCol,
          SOURCE_QUADRANT_SIZE,
          screenX + col * renderQuadrantSize,
          screenY + row * renderQuadrantSize,
          renderQuadrantSize,
          renderQuadrantSize
        );
      }
    }
  }

  /**
   * Draws an image from the spritesheet, accounting for padding and origin.
   * @param sSize The effective size of the sprite content (e.g. 8px).
   */
  private drawImageFromSpritesheet(
    sRow: number,
    sCol: number,
    sSize: number,
    dX: number,
    dY: number,
    dWidth: number,
    dHeight: number
  ): void {
    if (!this.spritesheet) return;
    this.ctx.drawImage(
      this.spritesheet,
      PALETTE_ORIGIN_X + sCol * SOURCE_TILE_SIZE + PALETTE_PADDING_X,
      PALETTE_ORIGIN_Y + sRow * SOURCE_TILE_SIZE + PALETTE_PADDING_Y,
      sSize,
      sSize,
      dX,
      dY,
      dWidth,
      dHeight
    );
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
        
        const startAngle = UI.PACMAN_ARC_START + rotation;
        const endAngle = UI.PACMAN_ARC_END + rotation;
        
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