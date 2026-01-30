import { TileType, EntityType, FruitType } from './types.js';
import type { Entity, IGrid, IGameState, Direction, PointEffect } from './types.js';
import {
  PELLET_SCORE,
  POWER_PELLET_SCORE,
  PACMAN_SPEED,
  GHOST_SPEED,
  POWER_UP_DURATION,
  SCARED_GHOST_SPEED_MULTIPLIER,
  DEAD_GHOST_SPEED_MULTIPLIER,
  GHOST_EATEN_SCORE,
  GHOST_EATEN_PAUSE_DURATION,
  ALIGNMENT_TOLERANCE,
  COLLISION_THRESHOLD,
  GHOST_RESPAWN_THRESHOLD,
  RESPAWN_INVULNERABILITY_DURATION,
  COLORS,
  PACMAN_ANIMATION_SPEED,
  PACMAN_DEATH_ANIMATION_SPEED,
  PACMAN_DEATH_ANIMATION_FRAMES,
  GHOST_ANIMATION_SPEED,
  READY_DURATION,
  WIN_DELAY,
  GHOST_SPEED_LEVEL_MULTIPLIER,
  SIREN_THRESHOLDS,
  FRUIT_SPAWN_THRESHOLDS,
  FRUIT_DURATION,
  FRUIT_SCORE_DURATION,
  FRUIT_SPAWN_POS,
  FRUIT_DATA
} from './config.js';
import { PACMAN_ANIMATION_SEQUENCE, GHOST_ANIMATION_SEQUENCE } from './sprites.js';
import { GhostAI } from './ghost-ai.js';
import { AudioManager } from './audio-manager.js';

export class GameState implements IGameState {
  private entities: Entity[] = [];
  private score: number = 0;
  private highScore: number = 0;
  private lives: number = 2;
  private gameOver: boolean = false;
  private dying: boolean = false;
  private win: boolean = false;
  private level: number = 1;
  private winTimer: number = 0;
  private remainingPellets: number = 0;
  private initialPelletCount: number = 0;
  private eatenPellets: Set<string> = new Set();
  private powerUpTimer: number = 0; // New: Timer for power-up duration
  private ready: boolean = READY_DURATION > 0;
  private started: boolean = false;
  private readyTimer: number = READY_DURATION;
  private readonly HIGH_SCORE_KEY = 'prompt-man-high-score';
  private nextDirection: Direction | null = null;
  private pointEffects: PointEffect[] = [];
  private pauseTimer: number = 0;
  private ghostsEatenCount: number = 0;
  private readonly width: number;
  private readonly height: number;
  private initialPositions: Map<Entity, { x: number, y: number }> = new Map();
  private dotsEatenInLevel: number = 0;
  private fruit: Entity | null = null;
  private fruitTimer: number = 0;
  private jailTiles: Set<string> = new Set();
  /** Callback fired when a pellet is consumed. */
  public onPelletConsumed?: (tileType: TileType) => void;

  constructor(private grid: IGrid, private audioManager?: AudioManager, startImmediately: boolean = true) {
    this.width = grid.getWidth();
    this.height = grid.getHeight();
    this.started = startImmediately;
    this.initialize();
    this.calculateJailTiles();
  }

  private calculateJailTiles(): void {
    const spawns = this.grid.findTiles(TileType.GhostSpawn);
    const doors = this.grid.findTiles(TileType.JailDoor);
    
    if (spawns.length === 0 && doors.length === 0) return;

    this.jailTiles.clear();
    const queue: {x: number, y: number}[] = [...spawns];
    spawns.forEach(s => this.jailTiles.add(`${s.x},${s.y}`));

    // Flood fill from spawns to find all connected non-wall tiles,
    // but don't cross through jail doors.
    let head = 0;
    while (head < queue.length) {
      const {x, y} = queue[head++]!;
      const neighbors = [
        {x: x + 1, y}, {x: x - 1, y}, {x, y: y + 1}, {x, y: y - 1}
      ];

      for (const n of neighbors) {
        // Use wrapping for consistency, though jail shouldn't typically wrap
        const nx = (n.x % this.width + this.width) % this.width;
        const ny = (n.y % this.height + this.height) % this.height;
        const key = `${nx},${ny}`;
        
        if (this.jailTiles.has(key)) continue;

        const tile = this.grid.getTile(nx, ny);
        if (tile !== undefined && tile !== TileType.Wall && tile !== TileType.JailDoor) {
          this.jailTiles.add(key);
          queue.push({x: nx, y: ny});
        }
      }
    }

    // Finally add doors themselves to the jail tiles set
    doors.forEach(d => this.jailTiles.add(`${d.x},${d.y}`));
  }

  private isTileInJail(x: number, y: number): boolean {
    // Handle wrapping
    const wx = (Math.round(x) % this.width + this.width) % this.width;
    const wy = (Math.round(y) % this.height + this.height) % this.height;
    return this.jailTiles.has(`${wx},${wy}`);
  }

  private updateHighScore(): void {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
          localStorage.setItem(this.HIGH_SCORE_KEY, this.highScore.toString());
        }
      } catch {
        // Silently fail if localStorage is not accessible
      }
    }
  }

  private initialize(): void {
    // Load high score
    try {
      if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
        const savedHighScore = localStorage.getItem(this.HIGH_SCORE_KEY);
        if (savedHighScore) {
          this.highScore = parseInt(savedHighScore, 10) || 0;
        }
      }
    } catch {
      // Silently fail if localStorage is not accessible
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

    // Initialize ready state
    this.ready = READY_DURATION > 0;
    this.readyTimer = READY_DURATION;

    // Find Ghost spawns
    const ghostSpawns = this.grid.findTiles(TileType.GhostSpawn);
    const ghostColors = COLORS.GHOST_COLORS;
    for (let i = 0; i < Math.min(ghostSpawns.length, 4); i++) {
      const spawn = ghostSpawns[i]!;
      const ghost: Entity = {
        type: EntityType.Ghost,
        x: spawn.x,
        y: spawn.y,
        color: ghostColors[i % ghostColors.length]!,
        animationFrame: 0,
        animationTimer: 0,
        isLeavingJail: true,
      };
      this.entities.push(ghost);
      this.initialPositions.set(ghost, { x: spawn.x, y: spawn.y });
    }

    // Count pellets
    const pellets = this.grid.findTiles(TileType.Pellet);
    const powerPellets = this.grid.findTiles(TileType.PowerPellet);
    this.remainingPellets = pellets.length + powerPellets.length;
    this.initialPelletCount = this.remainingPellets;

  }

  getEntities(): Entity[] {
    const allEntities = [...this.entities];
    if (this.fruit) {
      allEntities.push(this.fruit);
    }
    return allEntities;
  }

  getFruit(): Entity | null {
    return this.fruit;
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

  getPointEffects(): PointEffect[] {
    return this.pointEffects;
  }

  getSpawnPosition(entity: Entity): { x: number, y: number } | undefined {
    return this.initialPositions.get(entity);
  }

  isGameOver(): boolean {
    return this.gameOver;
  }

  isWin(): boolean {
    return this.win;
  }

  getLevel(): number {
    return this.level;
  }

  isDying(): boolean {
    return this.dying;
  }

  isReady(): boolean {
    return this.ready;
  }

  /**
   * Starts the game with a READY state of the given duration.
   */
  startReady(duration: number): void {
    this.started = true;
    this.ready = duration > 0;
    this.readyTimer = duration;
    this.audioManager?.stopSiren();
    this.audioManager?.stopFrightSound();
    this.audioManager?.stopEyesSound();
  }

  getPowerUpTimer(): number {
    return this.powerUpTimer;
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
      this.dotsEatenInLevel++;
      this.score += tile === TileType.Pellet ? PELLET_SCORE : POWER_PELLET_SCORE;

      // Check for fruit spawn
      if ((FRUIT_SPAWN_THRESHOLDS as readonly number[]).includes(this.dotsEatenInLevel)) {
        this.spawnFruit();
      }

      // Play sound effect
      if (tile === TileType.Pellet) {
        this.audioManager?.playPelletSound();
      } else {
        this.audioManager?.playPowerPelletSound();
      }

      if (this.onPelletConsumed) {
        this.onPelletConsumed(tile);
      }

      if (tile === TileType.PowerPellet) {
        this.powerUpTimer = POWER_UP_DURATION;
        this.entities.filter(e => e.type === EntityType.Ghost).forEach(ghost => {
          ghost.isScared = true;
          // Immediately reverse direction (classic Pac-Man behavior)
          if (ghost.direction) {
            ghost.direction = {
              dx: -ghost.direction.dx || 0,
              dy: -ghost.direction.dy || 0
            };
          }
        });

        // Start fright sound
        this.audioManager?.startFrightSound();
      }


      this.updateHighScore();

      // Update background sound based on progress
      this.updateBackgroundSound();

      if (this.remainingPellets === 0) {
        this.win = true;
        this.winTimer = WIN_DELAY;
        // Stop all movement immediately on win
        this.entities.forEach(e => {
          e.direction = { dx: 0, dy: 0 };
        });
        this.audioManager?.stopSiren();
      }
    }
  }

  private spawnFruit(): void {
    const levelData = this.getFruitDataForLevel();
    this.fruit = {
      type: EntityType.Fruit,
      x: FRUIT_SPAWN_POS.x,
      y: FRUIT_SPAWN_POS.y,
      fruitType: levelData.type,
    };
    this.fruitTimer = FRUIT_DURATION;
  }

  private getFruitDataForLevel(): { type: FruitType, score: number } {
    return FRUIT_DATA[this.level] || FRUIT_DATA[13]!;
  }

  private getWrappedCoordinate(val: number, max: number): number {
    if (max <= 0) {
      return val;
    }
    return (val % max + max) % max;
  }

  updatePacman(direction: Direction, deltaTime: number = 0): void {
    const pacman = this.entities.find(e => e.type === EntityType.Pacman);
    if (!pacman || this.gameOver || this.win) return;

    if (this.pauseTimer > 0) {
      this.pauseTimer -= deltaTime;
      if (this.pauseTimer <= 0) {
        this.pauseTimer = 0;
        this.pointEffects = [];
        this.updateBackgroundSound();
      }
      return;
    }

    // Update point effect timers
    this.pointEffects = this.pointEffects.filter(effect => {
      if (effect.timer !== undefined) {
        effect.timer -= deltaTime;
        return effect.timer > 0;
      }
      return true;
    });

    if (this.ready) {
      if (this.started) {
        this.readyTimer -= deltaTime;
        if (this.readyTimer <= 0) {
          this.ready = false;
          this.readyTimer = 0;
          this.updateBackgroundSound();
        } else {
          return; // Block movement while ready
        }
      } else {
        return; // Block movement if not started
      }
    }

    if (this.dying) {
      const currentDeathTimer = (pacman.deathTimer || 0) + deltaTime;
      pacman.deathTimer = currentDeathTimer;

      const frameIndex = Math.floor(currentDeathTimer / PACMAN_DEATH_ANIMATION_SPEED);
      if (frameIndex >= PACMAN_DEATH_ANIMATION_FRAMES) {
        this.finishDying();
      } else {
        pacman.animationFrame = Math.min(frameIndex, PACMAN_DEATH_ANIMATION_FRAMES - 1);
      }
      return;
    }

    // Check collisions
    this.checkCollisions(pacman);
    this.checkFruitCollision(pacman);
    if (this.dying) {
      // If dying, reset velocity immediately to prevent further movement during animation
      pacman.direction = { dx: 0, dy: 0 };
      return;
    }

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

          if (this.grid.isWalkable(targetX, targetY, EntityType.Pacman)) {
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
      const currentTimer = (pacman.animationTimer ?? 0) + deltaTime;
      const frames = PACMAN_ANIMATION_SEQUENCE;
      const frameIndex = Math.floor(currentTimer / PACMAN_ANIMATION_SPEED) % frames.length;
      pacman.animationFrame = frames[frameIndex];
      pacman.animationTimer = currentTimer % (PACMAN_ANIMATION_SPEED * frames.length);
    } else {
      // When static, show the first frame (closed mouth) of the last direction
      pacman.animationFrame = 0;
    }
  }

  private checkCollisions(pacman: Entity): void {
    if (pacman.type !== EntityType.Pacman) {
      return;
    }

    // Dead ghosts do not collide with Pacman as they return to spawn
    const ghosts = this.entities.filter(e => e.type === EntityType.Ghost && !e.isDead && !e.isRespawning);
    for (const ghost of ghosts) {
      const dist = Math.sqrt(
        Math.pow(pacman.x - ghost.x, 2) + Math.pow(pacman.y - ghost.y, 2)
      );

      // Collision threshold: roughly overlapping (less than 1 tile usually)
      if (dist < COLLISION_THRESHOLD) {
        if (ghost.isScared) {
          // Ghost is eaten
          this.audioManager?.stopSiren();
          this.audioManager?.stopFrightSound();
          this.audioManager?.stopEyesSound();
          this.audioManager?.playEatGhostSound();
          const points = GHOST_EATEN_SCORE * Math.pow(2, this.ghostsEatenCount);
          this.score += points;
          this.pointEffects.push({ x: ghost.x, y: ghost.y, points });
          this.pauseTimer = GHOST_EATEN_PAUSE_DURATION;
          this.ghostsEatenCount++;

          ghost.isDead = true;
          ghost.isScared = false; // Un-scare the ghost
          this.chooseGhostDirection(ghost);

          // No life lost for Pacman
          this.updateBackgroundSound();
        } else {
          // Pacman hit a normal ghost, lose a life
          this.handleCollision();
        }
        this.updateHighScore();
        break;
      }
    }
  }

  private checkFruitCollision(pacman: Entity): void {
    if (!this.fruit) return;

    const dist = Math.sqrt(
      Math.pow(pacman.x - this.fruit.x, 2) + Math.pow(pacman.y - this.fruit.y, 2)
    );

    if (dist < COLLISION_THRESHOLD) {
      const levelData = this.getFruitDataForLevel();
      const points = levelData.score;
      this.score += points;
      this.pointEffects.push({ x: this.fruit.x, y: this.fruit.y, points, timer: FRUIT_SCORE_DURATION });
      this.audioManager?.playPowerPelletSound();
      this.fruit = null;
      this.fruitTimer = 0;
      this.updateHighScore();
      // Original game doesn't pause for fruit, but plays a sound.
      // We'll skip sound for now or add it later if requested.
    }
  }

  private handleCollision(): void {
    if (this.gameOver || this.dying) return;

    this.dying = true;

    const pacman = this.entities.find(e => e.type === EntityType.Pacman);
    if (pacman) {
      pacman.deathTimer = 0;
      pacman.animationFrame = 0;
      pacman.direction = { dx: 0, dy: 0 };
    }
    
    this.audioManager?.stopAll();
    this.audioManager?.playDeathSequence();
  }

  private finishDying(): void {
    this.dying = false;
    this.lives--;
    this.audioManager?.stopSiren();

    const pacman = this.entities.find(e => e.type === EntityType.Pacman);
    if (pacman) {
      pacman.deathTimer = undefined;
      pacman.animationFrame = 0;
    }

    if (this.lives < 0) {
      this.lives = 0;
      this.gameOver = true;
    } else {
      this.resetPositions();
      this.ready = READY_DURATION > 0;
      this.readyTimer = READY_DURATION;
    }

    // Stop background sounds on life loss/reset
    this.audioManager?.stopFrightSound();
    this.audioManager?.stopEyesSound();
    this.audioManager?.stopSiren();
  }

  private respawnGhost(ghost: Entity): void {
    const initialPos = this.initialPositions.get(ghost);
    if (initialPos) {
      ghost.isDead = false;
      ghost.isScared = false;
      ghost.isRespawning = true;
      ghost.isLeavingJail = true;
      ghost.respawnTimer = RESPAWN_INVULNERABILITY_DURATION;
      ghost.x = initialPos.x;
      ghost.y = initialPos.y;
      ghost.direction = { dx: 0, dy: 0 };
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
      if (entity.type === EntityType.Ghost) {
        if (this.powerUpTimer === 0) {
          entity.isScared = false;
        }
        entity.isDead = false;
      }
    }
    this.fruit = null;
    this.fruitTimer = 0;
    this.nextDirection = null;
  }

  private resetLevel(): void {
    this.win = false;
    this.winTimer = 0;
    this.level++;
    this.eatenPellets.clear();
    const pellets = this.grid.findTiles(TileType.Pellet);
    const powerPellets = this.grid.findTiles(TileType.PowerPellet);
    this.remainingPellets = pellets.length + powerPellets.length;
    this.dotsEatenInLevel = 0;
    this.fruit = null;
    this.fruitTimer = 0;
    this.resetPositions();
    this.ready = READY_DURATION > 0;
    this.readyTimer = READY_DURATION;
    // Stop background sounds on level reset
    this.audioManager?.stopFrightSound();
    this.audioManager?.stopEyesSound();
    this.audioManager?.stopSiren();
    this.updateBackgroundSound(); // Restart siren for next level
  }

  updateGhosts(deltaTime: number): void {

    if (this.win) {
      this.winTimer -= deltaTime;
      if (this.winTimer <= 0) {
        this.resetLevel();
      }
      return;
    }

    if (this.gameOver || this.dying || this.ready || this.pauseTimer > 0) return;

    if (this.fruitTimer > 0) {
      this.fruitTimer -= deltaTime;
      if (this.fruitTimer <= 0) {
        this.fruitTimer = 0;
        this.fruit = null;
      }
    }

    if (this.powerUpTimer > 0) {
      this.powerUpTimer -= deltaTime;
      if (this.powerUpTimer <= 0) {
        this.powerUpTimer = 0;
        this.ghostsEatenCount = 0;
        this.ghostsEatenCount = 0;
        this.entities.filter(e => e.type === EntityType.Ghost).forEach(ghost => {
          ghost.isScared = false;
        });

        // Stop fright sound when time expires
        this.audioManager?.stopFrightSound();
        this.updateBackgroundSound();
      }
    }

    const ghosts = this.entities.filter(e => e.type === EntityType.Ghost);

    for (const ghost of ghosts) {
      // Handle respawning state
      if (ghost.isRespawning) {
        ghost.respawnTimer = (ghost.respawnTimer ?? 0) - deltaTime;
        if (ghost.respawnTimer <= 0) {
          ghost.isRespawning = false;
          ghost.respawnTimer = 0;
        }
      }

      if (ghost.isDead) {
        const initialPos = this.initialPositions.get(ghost);
        if (initialPos) {
          const distToSpawn = Math.sqrt(Math.pow(ghost.x - initialPos.x, 2) + Math.pow(ghost.y - initialPos.y, 2));
          if (distToSpawn < GHOST_RESPAWN_THRESHOLD) {
            this.respawnGhost(ghost);
            this.updateBackgroundSound();
            continue;
          }
        }
      }

      // Check if ghost has left the jail
      if (ghost.isLeavingJail) {
        const x = Math.round(ghost.x);
        const y = Math.round(ghost.y);
        const currentTileType = this.grid.getTile(x, y);
        
        const inJail = this.isTileInJail(x, y);

        // A ghost has left jail if it's on a tile that is neither GhostSpawn nor JailDoor
        // AND it's not within the jail room anymore.
        if (!inJail && currentTileType !== TileType.GhostSpawn && currentTileType !== TileType.JailDoor) {
          ghost.isLeavingJail = false;
        }
      }

      const levelMultiplier = Math.pow(GHOST_SPEED_LEVEL_MULTIPLIER, this.level - 1);
      const baseSpeed = GHOST_SPEED * levelMultiplier;

      let speed = ghost.isScared ? baseSpeed * SCARED_GHOST_SPEED_MULTIPLIER : baseSpeed;
      if (ghost.isDead) {
        speed = baseSpeed * DEAD_GHOST_SPEED_MULTIPLIER;
      }
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

          // Check if continuing in the current direction is possible (with grid wrapping)
          const nextX = this.getWrappedCoordinate(x + ghost.direction.dx, this.width);
          const nextY = this.getWrappedCoordinate(y + ghost.direction.dy, this.height);
          const canContinueStraight = this.grid.isWalkable(nextX, nextY, EntityType.Ghost, !!ghost.isDead, !!ghost.isLeavingJail);

          // Scared ghosts only change direction when they hit a wall (not at every intersection)
          // This prevents jiggling from random re-picks while still in alignment tolerance
          // Normal/dead ghosts re-evaluate at intersections to chase Pac-Man
          // Ghosts leaving jail should ALWAYS re-evaluate to find the exit efficiently.
          const isScaredAndCanContinue = ghost.isScared && !ghost.isDead && !ghost.isLeavingJail && canContinueStraight;

          if (!isScaredAndCanContinue) {
            const allPossibleDirs = this.getPossibleDirections(x, y, ghost as Entity); // Pass the whole ghost entity with correct typing
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
      }

      // 3. Move the ghost
      const isMoving = ghost.direction && (ghost.direction.dx !== 0 || ghost.direction.dy !== 0);
      if (isMoving) {
        this.moveEntity(ghost, distance);
      }

      // 4. Update animation
      // Ghosts always animate as long as the game is not over or Pacman is not dying.
      // Their animation does not depend on their movement.
      const frames = GHOST_ANIMATION_SEQUENCE;
      const currentTimer = (ghost.animationTimer ?? 0) + deltaTime;
      const frameIndex = Math.floor(currentTimer / GHOST_ANIMATION_SPEED) % frames.length;
      ghost.animationFrame = frames[frameIndex];
      ghost.animationTimer = currentTimer % (GHOST_ANIMATION_SPEED * frames.length);
    }
  }

  private getPossibleDirections(x: number, y: number, entity: Entity): Direction[] {
    const dirs: Direction[] = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
    ];

    const currentDir = entity.direction;

    return dirs.filter(dir => {
      // Don't allow immediate reversal (only if ghost is actually moving)
      if (currentDir && (currentDir.dx !== 0 || currentDir.dy !== 0)) {
        if (dir.dx === -currentDir.dx && dir.dy === -currentDir.dy) {
          return false;
        }
      }
      // Use grid wrapping for tunnel support
      const targetX = this.getWrappedCoordinate(x + dir.dx, this.width);
      const targetY = this.getWrappedCoordinate(y + dir.dy, this.height);
      return this.grid.isWalkable(targetX, targetY, entity.type, !!entity.isDead, !!entity.isLeavingJail);
    });
  }

  private chooseGhostDirection(ghost: Entity): void {
    const isDead = !!ghost.isDead;
    const isLeavingJail = !!ghost.isLeavingJail;
    const isScared = !!ghost.isScared && !isDead && !isLeavingJail;
    const pacman = this.entities.find(e => e.type === EntityType.Pacman);

    let target = pacman
      ? { x: Math.round(pacman.x), y: Math.round(pacman.y) }
      : { x: Math.round(ghost.x), y: Math.round(ghost.y) };

    if (isDead) {
      const initialPos = this.initialPositions.get(ghost);
      if (initialPos) {
        target = { x: initialPos.x, y: initialPos.y };
      }
    } else if (isLeavingJail) {
      // Find the nearest jail door
      const doors = this.grid.findTiles(TileType.JailDoor);
      if (doors.length > 0) {
        // Find the nearest door
        let nearestDoor = doors[0]!;
        let minDist = Math.pow(ghost.x - nearestDoor.x, 2) + Math.pow(ghost.y - nearestDoor.y, 2);
        for (let i = 1; i < doors.length; i++) {
          const door = doors[i]!;
          const dist = Math.pow(ghost.x - door.x, 2) + Math.pow(ghost.y - door.y, 2);
          if (dist < minDist) {
            minDist = dist;
            nearestDoor = door;
          }
        }
        
        // Target the jail door tile itself
        target = { x: nearestDoor.x, y: nearestDoor.y };

        // If we are already at the door, or very close, target a point BEYOND the door
        // to avoid random movement when reaching the target.
        const distToDoor = Math.abs(ghost.x - nearestDoor.x) + Math.abs(ghost.y - nearestDoor.y);
        if (distToDoor < 0.2) {
            // Find a neighbor of the door that is NOT in jail and NOT a wall
            const neighbors = [
                {x: nearestDoor.x, y: nearestDoor.y - 1}, // Prefer Up
                {x: nearestDoor.x, y: nearestDoor.y + 1}, // Then Down
                {x: nearestDoor.x + 1, y: nearestDoor.y},
                {x: nearestDoor.x - 1, y: nearestDoor.y},
            ];
            for (const n of neighbors) {
                const tile = this.grid.getTile(n.x, n.y);
                const inJail = this.isTileInJail(n.x, n.y);
                if (tile !== undefined && tile !== TileType.Wall && tile !== TileType.GhostSpawn && tile !== TileType.JailDoor && !inJail) {
                    target = { x: n.x, y: n.y };
                    break;
                }
            }
        }
      }
    }

    // Pathfinding priority:
    // 1. Dead ghosts: Pathfind to spawn position (Use BFS to avoid local minima)
    // 2. Ghosts in jail: Pathfind to jail door (Use BFS for guaranteed exit)
    // 3. Scared ghosts (only if not in jail): Pathfind AWAY from Pacman (handled in GhostAI.pickDirection)
    // 4. Normal ghosts: Pathfind towards Pacman (Use BFS for smarter pathfinding)
    let newDir: Direction;
    if (isScared) {
      newDir = GhostAI.pickDirection(ghost, target, this.grid, isScared, isDead, isLeavingJail);
    } else {
      newDir = GhostAI.findBFSDirection(ghost, target, this.grid, isDead, isLeavingJail);
    }
    ghost.direction = newDir;
    ghost.rotation = Math.atan2(newDir.dy, newDir.dx);
  }

  private moveEntity(entity: Entity, distance: number): void {
    if (!entity.direction) return;
    const { dx, dy } = entity.direction;

    let result = { pos: 0, stopped: false };

    if (dx !== 0) {
      result = this.attemptMove(entity.x, dx, distance, Math.round(entity.y), true, entity.type, entity.isDead, entity.isLeavingJail);
      entity.x = result.pos;
      entity.y = this.getWrappedCoordinate(entity.y, this.height);
    } else if (dy !== 0) {
      result = this.attemptMove(entity.y, dy, distance, Math.round(entity.x), false, entity.type, entity.isDead, entity.isLeavingJail);
      entity.y = result.pos;
      entity.x = this.getWrappedCoordinate(entity.x, this.width);
    }

    if (result.stopped) {
      entity.direction = { dx: 0, dy: 0 };
    }
  }

  private attemptMove(pos: number, dir: number, dist: number, crossPos: number, isHorizontal: boolean, entityType: EntityType, isDead: boolean = false, isLeavingJail: boolean = false): { pos: number, stopped: boolean } {
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

      if (!this.grid.isWalkable(tileX, tileY, entityType, isDead, isLeavingJail)) {
        // Stop at the center of the current tile
        return { pos: currentTile, stopped: true };
      }
    }

    return { pos: this.getWrappedCoordinate(proposed, max), stopped: false };
  }

  private updateBackgroundSound(): void {
    if (this.gameOver || this.win || this.dying || this.ready || this.pauseTimer > 0) {
      return;
    }

    const ghosts = this.entities.filter(e => e.type === EntityType.Ghost);
    const anyGhostDead = ghosts.some(g => g.isDead);

    if (anyGhostDead) {
      this.audioManager?.stopSiren();
      this.audioManager?.stopFrightSound();
      this.audioManager?.startEyesSound();
      return;
    }

    if (this.powerUpTimer > 0) {
      this.audioManager?.stopSiren();
      this.audioManager?.stopEyesSound();
      this.audioManager?.startFrightSound();
      return;
    }

    // Default: Siren
    this.audioManager?.stopEyesSound();
    this.audioManager?.stopFrightSound();

    if (this.initialPelletCount === 0) return;

    const eatenCount = this.initialPelletCount - this.remainingPellets;
    const ratio = eatenCount / this.initialPelletCount;

    // Find the highest threshold we've crossed
    let sirenIndex = 0;
    for (let i = SIREN_THRESHOLDS.length - 1; i >= 0; i--) {
      if (ratio >= SIREN_THRESHOLDS[i]!) {
        sirenIndex = i;
        break;
      }
    }

    this.audioManager?.playSiren(sirenIndex);
  }
}
