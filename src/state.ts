import { TileType, EntityType } from './types.js';
import type { Entity, IGrid, IGameState, Direction } from './types.js';
import {
  PELLET_SCORE,
  POWER_PELLET_SCORE,
  PACMAN_SPEED,
  GHOST_SPEED,
  POWER_UP_DURATION,
  SCARED_GHOST_SPEED_MULTIPLIER,
  GHOST_EATEN_SCORE,
  ALIGNMENT_TOLERANCE,
  COLLISION_THRESHOLD,
  COLORS,
  PACMAN_ANIMATION_SPEED
} from './config.js';
import { GhostAI } from './ghost-ai.js';

export class GameState implements IGameState {
  private entities: Entity[] = [];
  private score: number = 0;
  private highScore: number = 0;
  private lives: number = 2;
  private gameOver: boolean = false;
  private remainingPellets: number = 0;
  private eatenPellets: Set<string> = new Set();
  private powerUpTimer: number = 0; // New: Timer for power-up duration
  private readonly HIGH_SCORE_KEY = 'prompt-man-high-score';
  private nextDirection: Direction | null = null;
  private readonly width: number;
  private readonly height: number;
  private initialPositions: Map<Entity, { x: number, y: number }> = new Map();

  constructor(private grid: IGrid) {
    this.width = grid.getWidth();
    this.height = grid.getHeight();
    this.initialize();
  }

  private initialize(): void {
    // Load high score
    const savedHighScore = localStorage.getItem(this.HIGH_SCORE_KEY);
    if (savedHighScore) {
      this.highScore = parseInt(savedHighScore, 10) || 0;
    }

    // Find Pacman spawn
    const pacmanSpawns = this.grid.findTiles(TileType.PacmanSpawn);
    for (const spawn of pacmanSpawns) {
      const pacman: Entity = {
        type: EntityType.Pacman,
        x: spawn.x,
        y: spawn.y,
        animationFrame: 0,
        animationTimer: 0,
      };
      this.entities.push(pacman);
      this.initialPositions.set(pacman, { x: spawn.x, y: spawn.y });
    }

    // Find Ghost spawns
    const ghostSpawns = this.grid.findTiles(TileType.GhostSpawn);
    const ghostColors = COLORS.GHOST_COLORS;
    for (let i = 0; i < ghostSpawns.length; i++) {
      const spawn = ghostSpawns[i]!;
      const ghost: Entity = {
        type: EntityType.Ghost,
        x: spawn.x,
        y: spawn.y,
        color: ghostColors[i % ghostColors.length]!,
      };
      this.entities.push(ghost);
      this.initialPositions.set(ghost, { x: spawn.x, y: spawn.y });
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

  getLives(): number {
    return this.lives;
  }

  getHighScore(): number {
    return this.highScore;
  }

  getRemainingPellets(): number {
    return this.remainingPellets;
  }

  isGameOver(): boolean {
    return this.gameOver;
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
      this.score += tile === TileType.Pellet ? PELLET_SCORE : POWER_PELLET_SCORE;

      if (tile === TileType.PowerPellet) {
        this.powerUpTimer = POWER_UP_DURATION;
        this.entities.filter(e => e.type === EntityType.Ghost).forEach(ghost => {
          ghost.isScared = true;
        });
      }

      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem(this.HIGH_SCORE_KEY, this.highScore.toString());
      }
    }
  }

  private getWrappedCoordinate(val: number, max: number): number {
    if (max <= 0) {
      return val;
    }
    return (val % max + max) % max;
  }

  updatePacman(direction: Direction, deltaTime: number = 0): void {
    const pacman = this.entities.find(e => e.type === EntityType.Pacman);
    if (!pacman || this.gameOver) return;

    // Check collisions
    this.checkCollisions(pacman);

    // Update intended direction if input is provided
    if (direction.dx !== 0 || direction.dy !== 0) {
      this.nextDirection = direction;
    }

    // Default to current direction or stopped
    let moveDir = pacman.direction || { dx: 0, dy: 0 };



    const distance = PACMAN_SPEED * deltaTime;

    // Try to apply nextDirection
    if (this.nextDirection && (this.nextDirection.dx !== 0 || this.nextDirection.dy !== 0)) {
      const nextDir = this.nextDirection;

      // 1. Check for Reversal (Opposite direction)
      // Allow immediate reversal without alignment check
      if (moveDir.dx === -nextDir.dx && moveDir.dy === -nextDir.dy) {
        moveDir = nextDir;
        this.nextDirection = null; // Consumed
      }
      // 2. Check for Turn (Requires alignment and walkability)
      else {
        // We need to be aligned on the axis perpendicular to the NEW direction.
        // E.g. to turn Up (dy=-1), we must be aligned on X.
        const alignedX = Math.abs(pacman.x - Math.round(pacman.x)) < ALIGNMENT_TOLERANCE;
        const alignedY = Math.abs(pacman.y - Math.round(pacman.y)) < ALIGNMENT_TOLERANCE;

        const canTurn = (nextDir.dx !== 0 && alignedY) || (nextDir.dy !== 0 && alignedX);

        if (canTurn) {
          let targetX = Math.round(pacman.x) + nextDir.dx;
          let targetY = Math.round(pacman.y) + nextDir.dy;

          // Wrap target coordinates for walkability check
          targetX = this.getWrappedCoordinate(targetX, this.width);
          targetY = this.getWrappedCoordinate(targetY, this.height);

          if (this.grid.isWalkable(targetX, targetY)) {
            moveDir = nextDir;
            this.nextDirection = null; // Consumed

            // Snap to center of the lane we are leaving
            if (moveDir.dx !== 0) pacman.y = this.getWrappedCoordinate(Math.round(pacman.y), this.height);
            if (moveDir.dy !== 0) pacman.x = this.getWrappedCoordinate(Math.round(pacman.x), this.width);
          }
        }
      }
    }

    // Set the direction on entity
    pacman.direction = moveDir;

    // Update animation based on movement
    this.updatePacmanAnimation(pacman, moveDir, deltaTime);

    // Stop if no direction
    if (moveDir.dx === 0 && moveDir.dy === 0) return;

    // Update rotation
    pacman.rotation = Math.atan2(moveDir.dy, moveDir.dx);

    // Perform movement
    this.moveEntity(pacman, distance);

    // Consume pellet at the center
    const consumeX = this.getWrappedCoordinate(Math.round(pacman.x), this.width);
    const consumeY = this.getWrappedCoordinate(Math.round(pacman.y), this.height);
    this.consumePellet(consumeX, consumeY);
  }

  private updatePacmanAnimation(pacman: Entity, moveDir: Direction, deltaTime: number): void {
    const isMoving = moveDir.dx !== 0 || moveDir.dy !== 0;
    if (isMoving) {
      const currentTimer = (pacman.animationTimer || 0) + deltaTime;
      pacman.animationTimer = currentTimer;
      const frames = [0, 1, 2, 1] as const;
      const frameIndex = Math.floor(currentTimer / PACMAN_ANIMATION_SPEED) % 4;
      pacman.animationFrame = frames[frameIndex as 0 | 1 | 2 | 3];
    } else {
      // When static, show the first frame (closed mouth) of the last direction
      pacman.animationFrame = 0;
    }
  }

  private checkCollisions(pacman: Entity): void {
    const ghosts = this.entities.filter(e => e.type === EntityType.Ghost);
    for (const ghost of ghosts) {
      const dist = Math.sqrt(
        Math.pow(pacman.x - ghost.x, 2) + Math.pow(pacman.y - ghost.y, 2)
      );

      // Collision threshold: roughly overlapping (less than 1 tile usually)
      if (dist < COLLISION_THRESHOLD) {
        if (ghost.isScared) {
          // Ghost is eaten
          this.score += GHOST_EATEN_SCORE;
          const initialPos = this.initialPositions.get(ghost);
          if (initialPos) {
            ghost.x = initialPos.x;
            ghost.y = initialPos.y;
            ghost.direction = { dx: 0, dy: 0 };
          }
          ghost.isScared = false; // Un-scare the ghost
          // No life lost for Pacman
        } else {
          // Pacman hit a normal ghost, lose a life
          this.handleCollision();
        }
        break;
      }
    }
  }

  private handleCollision(): void {
    if (this.gameOver) return;

    this.lives--;
    if (this.lives <= 0) {
      this.lives = 0;
      this.gameOver = true;
    } else {
      this.resetPositions();
    }
  }

  private resetPositions(): void {
    for (const entity of this.entities) {
      const initialPos = this.initialPositions.get(entity);
      if (initialPos) {
        entity.x = initialPos.x;
        entity.y = initialPos.y;
        entity.direction = { dx: 0, dy: 0 };
        // Reset rotation if needed, but direction reset might be enough
      }
    }
    this.nextDirection = null;
  }

  updateGhosts(deltaTime: number): void {
    if (this.gameOver) return;

    if (this.powerUpTimer > 0) {
      this.powerUpTimer -= deltaTime;
      if (this.powerUpTimer <= 0) {
        this.powerUpTimer = 0;
        this.entities.filter(e => e.type === EntityType.Ghost).forEach(ghost => {
          ghost.isScared = false;
        });
      }
    }

    const ghosts = this.entities.filter(e => e.type === EntityType.Ghost);
    
    for (const ghost of ghosts) {
      const speed = ghost.isScared ? GHOST_SPEED * SCARED_GHOST_SPEED_MULTIPLIER : GHOST_SPEED;
      const distance = speed * deltaTime;

      // 1. If stopped or no direction, choose one
      if (!ghost.direction || (ghost.direction.dx === 0 && ghost.direction.dy === 0)) {
        this.chooseGhostDirection(ghost);
      } else {
        // 2. If at an intersection (aligned with grid), maybe change direction
        const isAlignedX = Math.abs(ghost.x - Math.round(ghost.x)) < ALIGNMENT_TOLERANCE;
        const isAlignedY = Math.abs(ghost.y - Math.round(ghost.y)) < ALIGNMENT_TOLERANCE;

        if (isAlignedX && isAlignedY) {
          const x = Math.round(ghost.x);
          const y = Math.round(ghost.y);

          // Check if continuing in the current direction is possible
          const canContinueStraight = this.grid.isWalkable(x + ghost.direction.dx, y + ghost.direction.dy);
          const allPossibleDirs = this.getPossibleDirections(x, y); // Get all directions, including reverse for dead-end check
          const nonReversePossibleDirs = allPossibleDirs.filter(
            dir => !(dir.dx === -ghost.direction!.dx && dir.dy === -ghost.direction!.dy)
          );

          // Change direction if we hit a wall or at an intersection (more than 1 choice besides going back)
          if (!canContinueStraight || nonReversePossibleDirs.length > 1) {
            // Only change if we are actually close to the center to avoid "jitter"
            ghost.x = x;
            ghost.y = y;
            this.chooseGhostDirection(ghost);
          }
        }
      }

      // 3. Move the ghost
      if (ghost.direction && (ghost.direction.dx !== 0 || ghost.direction.dy !== 0)) {
        this.moveEntity(ghost, distance);
      }
    }
  }

  private getPossibleDirections(x: number, y: number, currentDir?: Direction): Direction[] {
    const dirs: Direction[] = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
    ];

    return dirs.filter(dir => {
      // Don't allow immediate reversal
      if (currentDir && dir.dx === -currentDir.dx && dir.dy === -currentDir.dy) {
        return false;
      }
      return this.grid.isWalkable(x + dir.dx, y + dir.dy);
    });
  }

  private chooseGhostDirection(ghost: Entity): void {
    const isScared = !!ghost.isScared;
    const pacman = this.entities.find(e => e.type === EntityType.Pacman);
    const target = pacman
      ? { x: Math.round(pacman.x), y: Math.round(pacman.y) }
      : { x: Math.round(ghost.x), y: Math.round(ghost.y) };

    const newDir = GhostAI.pickDirection(ghost, target, this.grid, isScared);
    ghost.direction = newDir;
    ghost.rotation = Math.atan2(newDir.dy, newDir.dx);
  }

  private moveEntity(entity: Entity, distance: number): void {
    if (!entity.direction) return;
    const { dx, dy } = entity.direction;

    let result = { pos: 0, stopped: false };

    if (dx !== 0) {
      result = this.attemptMove(entity.x, dx, distance, Math.round(entity.y), true);
      entity.x = result.pos;
      entity.y = this.getWrappedCoordinate(entity.y, this.height);
    } else if (dy !== 0) {
      result = this.attemptMove(entity.y, dy, distance, Math.round(entity.x), false);
      entity.y = result.pos;
      entity.x = this.getWrappedCoordinate(entity.x, this.width);
    }

    if (result.stopped) {
      entity.direction = { dx: 0, dy: 0 };
    }
  }

  private attemptMove(pos: number, dir: number, dist: number, crossPos: number, isHorizontal: boolean): { pos: number, stopped: boolean } {
    const max = isHorizontal ? this.width : this.height;
    if (max === 0) return { pos: 0, stopped: true };

    const crossMax = isHorizontal ? this.height : this.width;
    const wrappedCrossPos = this.getWrappedCoordinate(crossPos, crossMax);

    const proposed = pos + dir * dist;
    const currentTile = Math.floor(pos + 0.5);
    
    // Calculate the next tile in the direction of movement
    const nextTile = currentTile + dir;

    // Check if we would cross into the next tile's area (beyond the current tile center)
    // For moving right (dir > 0): we're entering next tile area when proposed > currentTile
    // For moving left (dir < 0): we're entering next tile area when proposed < currentTile
    const wouldEnterNextTile = dir > 0 ? proposed > currentTile : proposed < currentTile;

    if (wouldEnterNextTile) {
      const wrappedNextTile = this.getWrappedCoordinate(nextTile, max);
      const tileX = isHorizontal ? wrappedNextTile : wrappedCrossPos;
      const tileY = isHorizontal ? wrappedCrossPos : wrappedNextTile;

      if (!this.grid.isWalkable(tileX, tileY)) {
        // Stop at the center of the current tile
        return { pos: currentTile, stopped: true };
      }
    }

    return { pos: this.getWrappedCoordinate(proposed, max), stopped: false };
  }
}
