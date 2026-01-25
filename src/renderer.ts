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
  POWER_PELLET_BLINK_RATE,
  PACMAN_PALETTE_OFFSET_X,
  PACMAN_PALETTE_OFFSET_Y,
  PACMAN_DEATH_PALETTE_OFFSET_X,
  PACMAN_DEATH_PALETTE_OFFSET_Y,
  PACMAN_DEATH_ANIMATION_FRAMES
} from './config.js';
import { getTileMask } from './autotile.js';
import {
  TILE_MAP,
  SOURCE_QUADRANT_SIZE,
  STATIC_SPRITE_MAP,
  SOURCE_TILE_SIZE,
  SOURCE_PACMAN_SIZE,
  PACMAN_DEATH_ANIMATION_MAP,
  getGhostSpriteSource,
  GHOST_ANIMATION_MAP,
  PACMAN_ANIMATION_MAP
} from './sprites.js';

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

    this.renderEntities(state);
    this.renderLives(grid, state.getLives());

    if (state.isGameOver()) {
      this.renderGameOver(grid);
    } else if (state.isReady()) {
      this.renderReady(grid);
    }
  }

  private renderReady(grid: IGrid): void {
    const width = grid.getWidth() * TILE_SIZE;
    const height = grid.getHeight() * TILE_SIZE;

    this.ctx.fillStyle = COLORS.PACMAN; // Yellow
    this.ctx.font = 'bold 24px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // Position comfortably below the ghost house.
    this.ctx.fillText('READY!', width / 2, height / 2 + TILE_SIZE * 2);
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

  private renderPacmanDeath(entity: Entity, screenX: number, screenY: number): void {
    const frameIndex = entity.animationFrame ?? 0;

    if (this.spritesheet) {
      const frameData = PACMAN_DEATH_ANIMATION_MAP[frameIndex] ?? PACMAN_DEATH_ANIMATION_MAP[0]!;
      const [sRow, sCol] = frameData;
      const sourceX = PACMAN_DEATH_PALETTE_OFFSET_X + (sCol * SOURCE_PACMAN_SIZE);
      const sourceY = PACMAN_DEATH_PALETTE_OFFSET_Y + (sRow * SOURCE_PACMAN_SIZE);

      this.ctx.drawImage(
        this.spritesheet,
        sourceX + PALETTE_PADDING_X,
        sourceY + PALETTE_PADDING_Y,
        SOURCE_PACMAN_SIZE - PALETTE_PADDING_X,
        SOURCE_PACMAN_SIZE - PALETTE_PADDING_Y,
        screenX - TILE_SIZE / 2,
        screenY - TILE_SIZE / 2,
        TILE_SIZE,
        TILE_SIZE
      );
    } else {
      // Fallback: shrinking circle
      const maxRadius = TILE_SIZE / 2 - 1;
      const progress = frameIndex / (PACMAN_DEATH_ANIMATION_FRAMES - 1);
      const radius = Math.max(0, maxRadius * (1 - progress));

      if (radius > 0) {
        this.ctx.fillStyle = COLORS.PACMAN;
        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  /**
   * Renders a ghost sprite with black pixels made transparent.
   * Used for rendering dead ghost eyes without the black background.
   */
  private renderGhostWithTransparentBlack(
    sourceX: number,
    sourceY: number,
    sourceWidth: number,
    sourceHeight: number,
    destX: number,
    destY: number,
    destWidth: number,
    destHeight: number
  ): void {
    if (!this.spritesheet) return;

    // Create a temporary canvas to extract and modify the sprite
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = sourceWidth;
    tempCanvas.height = sourceHeight;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Draw the sprite to the temporary canvas
    tempCtx.drawImage(
      this.spritesheet,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      sourceWidth,
      sourceHeight
    );

    // Get the image data and make black pixels transparent
    const imageData = tempCtx.getImageData(0, 0, sourceWidth, sourceHeight);
    const data = imageData.data;

    // Iterate through each pixel
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]!;
      const g = data[i + 1]!;
      const b = data[i + 2]!;

      // If the pixel is black or very close to black, make it transparent
      if (r < 10 && g < 10 && b < 10) {
        data[i + 3] = 0; // Set alpha to 0 (transparent)
      }
    }

    // Put the modified image data back
    tempCtx.putImageData(imageData, 0, 0);

    // Draw the modified sprite to the main canvas
    this.ctx.drawImage(
      tempCanvas,
      0,
      0,
      sourceWidth,
      sourceHeight,
      destX,
      destY,
      destWidth,
      destHeight
    );
  }

  private renderEntities(state: IGameState): void {
    for (const entity of state.getEntities()) {
      this.renderEntity(entity, state);
    }
  }

  private renderEntity(entity: Entity, state: IGameState): void {
    const screenX = entity.x * TILE_SIZE + TILE_SIZE / 2;
    const screenY = entity.y * TILE_SIZE + TILE_SIZE / 2;

    switch (entity.type) {
      case EntityType.Pacman: {
        if (state.isDying()) {
          this.renderPacmanDeath(entity, screenX, screenY);
          return;
        }

        if (this.spritesheet) {
          const rotation = entity.rotation ?? 0;
          let dirKey: keyof typeof PACMAN_ANIMATION_MAP = 'EAST';

          const angle = (rotation * (180 / Math.PI) + 360) % 360;
          if (angle >= 45 && angle < 135) dirKey = 'SOUTH';
          else if (angle >= 135 && angle < 225) dirKey = 'WEST';
          else if (angle >= 225 && angle < 315) dirKey = 'NORTH';
          else dirKey = 'EAST';

          const frameIndex = entity.animationFrame ?? 0;
          const [sRow, sCol, flipX, flipY] = PACMAN_ANIMATION_MAP[dirKey]?.[(frameIndex as 0 | 1 | 2)] || PACMAN_ANIMATION_MAP.EAST[0];

          const sourceX = PACMAN_PALETTE_OFFSET_X + (sCol * SOURCE_PACMAN_SIZE);
          const sourceY = PACMAN_PALETTE_OFFSET_Y + (sRow * SOURCE_PACMAN_SIZE);

          this.ctx.save();
          this.ctx.translate(screenX, screenY);

          const scaleX = flipX ? -1 : 1;
          const scaleY = flipY ? -1 : 1;
          this.ctx.scale(scaleX, scaleY);

          this.ctx.drawImage(
            this.spritesheet,
            sourceX + PALETTE_PADDING_X,
            sourceY + PALETTE_PADDING_Y,
            SOURCE_PACMAN_SIZE - PALETTE_PADDING_X,
            SOURCE_PACMAN_SIZE - PALETTE_PADDING_Y,
            -TILE_SIZE / 2,
            -TILE_SIZE / 2,
            TILE_SIZE,
            TILE_SIZE
          );

          this.ctx.restore();
        } else {
          this.ctx.fillStyle = COLORS.PACMAN;
          this.ctx.beginPath();

          const rotation = entity.rotation ?? 0;
          const frameIndex = entity.animationFrame ?? 0;

          // Frame 0: closed (full circle)
          // Frame 1: half-open
          // Frame 2: wide open
          let mouthSize = 0;
          if (frameIndex === 1) mouthSize = 0.1;
          else if (frameIndex === 2) mouthSize = 0.2;

          const startAngle = mouthSize * Math.PI + rotation;
          const endAngle = (2 - mouthSize) * Math.PI + rotation;

          if (mouthSize > 0) {
            this.ctx.arc(screenX, screenY, TILE_SIZE / 2 - 1, startAngle, endAngle);
            this.ctx.lineTo(screenX, screenY);
          } else {
            this.ctx.arc(screenX, screenY, TILE_SIZE / 2 - 1, 0, Math.PI * 2);
          }

          this.ctx.closePath();
          this.ctx.fill();
        }
        break;
      }

      case EntityType.Ghost:
        if (state.isDying()) return;

        if (this.spritesheet) {
          let dirKey: keyof typeof GHOST_ANIMATION_MAP = 'EAST';
          if (entity.direction) {
            if (entity.direction.dx > 0) dirKey = 'EAST';
            else if (entity.direction.dx < 0) dirKey = 'WEST';
            else if (entity.direction.dy > 0) dirKey = 'SOUTH';
            else if (entity.direction.dy < 0) dirKey = 'NORTH';
          }

          const spriteSource = getGhostSpriteSource(
            entity.color || COLORS.GHOST_DEFAULT,
            dirKey,
            !!entity.isScared,
            entity.animationFrame || 0,
            !!entity.isDead
          );

          this.ctx.save();
          this.ctx.translate(screenX, screenY);

          const scaleX = spriteSource.flipX ? -1 : 1;
          const scaleY = spriteSource.flipY ? -1 : 1;
          this.ctx.scale(scaleX, scaleY);

          // For dead ghosts (eyes), make black pixels transparent
          if (entity.isDead) {
            this.renderGhostWithTransparentBlack(
              spriteSource.x,
              spriteSource.y,
              spriteSource.width,
              spriteSource.height,
              -TILE_SIZE / 2,
              -TILE_SIZE / 2,
              TILE_SIZE,
              TILE_SIZE
            );
          } else {
            this.ctx.drawImage(
              this.spritesheet,
              spriteSource.x,
              spriteSource.y,
              spriteSource.width,
              spriteSource.height,
              -TILE_SIZE / 2,
              -TILE_SIZE / 2,
              TILE_SIZE,
              TILE_SIZE
            );
          }

          this.ctx.restore();
        } else if (entity.isDead) {
          // Render eyes only
          this.ctx.fillStyle = 'white';
          this.ctx.beginPath();
          // Left eye
          this.ctx.arc(screenX - TILE_SIZE / 6, screenY - TILE_SIZE / 8, TILE_SIZE / 8, 0, Math.PI * 2);
          // Right eye
          this.ctx.arc(screenX + TILE_SIZE / 6, screenY - TILE_SIZE / 8, TILE_SIZE / 8, 0, Math.PI * 2);
          this.ctx.fill();

          this.ctx.fillStyle = 'blue';
          this.ctx.beginPath();
          // Left pupil
          this.ctx.arc(screenX - TILE_SIZE / 6, screenY - TILE_SIZE / 8, TILE_SIZE / 16, 0, Math.PI * 2);
          // Right pupil
          this.ctx.arc(screenX + TILE_SIZE / 6, screenY - TILE_SIZE / 8, TILE_SIZE / 16, 0, Math.PI * 2);
          this.ctx.fill();
        } else {
          this.ctx.fillStyle = entity.isScared ? COLORS.SCARED_GHOST : (entity.color || COLORS.GHOST_DEFAULT);
          this.ctx.beginPath();
          this.ctx.arc(screenX, screenY, TILE_SIZE / 2 - 1, Math.PI, 0);
          this.ctx.lineTo(screenX + TILE_SIZE / 2 - 1, screenY + TILE_SIZE / 2 - 1);
          this.ctx.lineTo(screenX - TILE_SIZE / 2 + 1, screenY + TILE_SIZE / 2 - 1);
          this.ctx.closePath();
          this.ctx.fill();
        }
        break;
    }
  }
}

export class UIRenderer implements IUIRenderer {
  constructor(private ctx: CanvasRenderingContext2D) { }

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