import { TileType, EntityType } from './types.js';
import type { Entity, IGrid, IGameState, Direction } from './types.js';
import { PELLET_SCORE, POWER_PELLET_SCORE, PACMAN_SPEED } from './config.js';

export class GameState implements IGameState {
  private entities: Entity[] = [];
  private score: number = 0;
  private highScore: number = 0;
  private remainingPellets: number = 0;
  private eatenPellets: Set<string> = new Set();
  private readonly HIGH_SCORE_KEY = 'prompt-man-high-score';

  constructor(private grid: IGrid) {
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

  getHighScore(): number {
    return this.highScore;
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
      this.score += tile === TileType.Pellet ? PELLET_SCORE : POWER_PELLET_SCORE;

      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem(this.HIGH_SCORE_KEY, this.highScore.toString());
      }
    }
  }

  movePacman(x: number, y: number): void {
    const pacman = this.entities.find(e => e.type === EntityType.Pacman);
    if (pacman && (pacman.x !== x || pacman.y !== y) && this.grid.isWalkable(Math.round(x), Math.round(y)) && !this.grid.isOutOfBounds(Math.round(x), Math.round(y))) {
      pacman.x = x;
      pacman.y = y;
      this.consumePellet(Math.round(x), Math.round(y));
    }
  }

  updatePacman(direction: Direction, deltaTime: number = 0): void {
    const pacman = this.entities.find(e => e.type === EntityType.Pacman);
    if (!pacman) return;

    const inputDirection = direction;
    let currentMovementDirection = pacman.direction || { dx: 0, dy: 0 }; // Default to stopped if no direction

    // 1. Handle direction change requests (buffering)
    if ((inputDirection.dx !== 0 || inputDirection.dy !== 0)) {
        // Allow changing direction only if Pacman is roughly centered in a tile (to prevent cutting corners)
        // Or if Pacman is currently stopped (allowing immediate direction change from standstill)
        const isAlignedX = Math.abs(pacman.x - Math.round(pacman.x)) < 0.1;
        const isAlignedY = Math.abs(pacman.y - Math.round(pacman.y)) < 0.1;
        
        // Determine the target tile if Pacman were to instantly turn in the input direction
        const targetTurnTileX = Math.round(pacman.x) + inputDirection.dx;
        const targetTurnTileY = Math.round(pacman.y) + inputDirection.dy;
        
        if (this.grid.isWalkable(targetTurnTileX, targetTurnTileY)) {
            if ((isAlignedX && isAlignedY) || (currentMovementDirection.dx === 0 && currentMovementDirection.dy === 0)) {
                currentMovementDirection = inputDirection;
                pacman.direction = currentMovementDirection;
                
                // Snap to center of lane when turning
                if (currentMovementDirection.dx !== 0) pacman.y = Math.round(pacman.y);
                if (currentMovementDirection.dy !== 0) pacman.x = Math.round(pacman.x);
            }
        }
    }
    
    // If no effective movement direction, return.
    if (currentMovementDirection.dx === 0 && currentMovementDirection.dy === 0) {
        return;
    }

    const distance = PACMAN_SPEED * deltaTime;
    let newX = pacman.x;
    let newY = pacman.y;
    let stoppedByCollision = false;

    // --- Horizontal movement ---
    if (currentMovementDirection.dx !== 0) {
        const proposedNextX = pacman.x + currentMovementDirection.dx * distance;
        
        if (currentMovementDirection.dx > 0) {
            // Moving Right
            const nextTileX = Math.floor(proposedNextX);
            if (!this.grid.isWalkable(nextTileX, Math.round(pacman.y))) {
                newX = nextTileX; // Stop at left edge of wall
                stoppedByCollision = true;
            } else {
                newX = proposedNextX;
            }
        } else {
            // Moving Left
            const nextTileX = Math.floor(proposedNextX); // The tile we are entering
            if (!this.grid.isWalkable(nextTileX, Math.round(pacman.y))) {
                newX = nextTileX + 1; // Stop at right edge of wall
                stoppedByCollision = true;
            } else {
                newX = proposedNextX;
            }
        }
    }

    // --- Vertical movement ---
    if (currentMovementDirection.dy !== 0) {
        const proposedNextY = pacman.y + currentMovementDirection.dy * distance;

        if (currentMovementDirection.dy > 0) {
             // Moving Down
            const nextTileY = Math.floor(proposedNextY);
            if (!this.grid.isWalkable(Math.round(pacman.x), nextTileY)) {
                newY = nextTileY; // Stop at top edge of wall
                stoppedByCollision = true;
            } else {
                newY = proposedNextY;
            }
        } else {
            // Moving Up
            const nextTileY = Math.floor(proposedNextY);
            if (!this.grid.isWalkable(Math.round(pacman.x), nextTileY)) {
                newY = nextTileY + 1; // Stop at bottom edge of wall
                stoppedByCollision = true;
            } else {
                newY = proposedNextY;
            }
        }
    }
    
    // Apply the calculated new positions
    pacman.x = newX;
    pacman.y = newY;

    // If movement was stopped due to collision, clear Pacman's direction
    if (stoppedByCollision) {
        pacman.direction = { dx: 0, dy: 0 }; 
    } else {
        // Update Pacman's rotation to face the current movement direction
        pacman.rotation = Math.atan2(currentMovementDirection.dy, currentMovementDirection.dx);
    }

    // Consume pellet at the rounded integer coordinates where Pacman's center is.
    this.consumePellet(Math.round(pacman.x), Math.round(pacman.y));
  }
}
