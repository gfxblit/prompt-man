/**
 * Represents the type of tile in the game grid.
 */
export enum TileType {
  /** An empty space that entities can move through. */
  Empty = 'Empty',
  /** A wall that blocks movement. */
  Wall = 'Wall',
  /** A regular pellet that provides points. */
  Pellet = 'Pellet',
  /** A power pellet that enables ghost eating. */
  PowerPellet = 'PowerPellet',
  /** The starting position for Pacman. */
  PacmanSpawn = 'PacmanSpawn',
  /** The starting position for Ghosts. */
  GhostSpawn = 'GhostSpawn',
}

/**
 * Represents the type of entity in the game.
 */
export enum EntityType {
  /** The player-controlled Pacman entity. */
  Pacman = 'Pacman',
  /** An AI-controlled Ghost entity. */
  Ghost = 'Ghost',
}

/**
 * Represents a game entity with a position and type.
 */
export interface Entity {
  /** The type of entity. */
  type: EntityType;
  /** Horizontal position in grid coordinates. */
  x: number;
  /** Vertical position in grid coordinates. */
  y: number;
  /** Optional movement direction. */
  direction?: Direction | undefined;
  /** Optional rotation in radians for rendering. */
  rotation?: number | undefined;
  /** Optional CSS color string for rendering. */
  color?: string | undefined;
  /** Optional animation frame index (0-2 for Pacman). */
  animationFrame?: number | undefined;
  /** Optional animationTimer for tracking animation progress in milliseconds. */
  animationTimer?: number | undefined;
  /** Optional flag indicating if the entity (e.g., ghost) is scared. */
  isScared?: boolean;
  /** Optional flag indicating if the entity (e.g., ghost) is dead and returning to jail. */
  isDead?: boolean;
  /** Optional timer for tracking death animation progress in milliseconds. */
  deathTimer?: number | undefined;
  /** Optional flag indicating if the entity (e.g., ghost) is in a brief non-collidable state after respawning. */
  isRespawning?: boolean;
  /** Optional timer for tracking how long the isRespawning state should last. */
  respawnTimer?: number;
}

/**
 * Represents a movement direction vector.
 */
export interface Direction {
  /** Horizontal movement component (-1, 0, or 1). */
  dx: number;
  /** Vertical movement component (-1, 0, or 1). */
  dy: number;
}

/**
 * Core grid interface defining the spatial structure of a level.
 */
export interface IGrid {
  /** Returns the total number of tiles horizontally. */
  getWidth(): number;
  /** Returns the total number of tiles vertically. */
  getHeight(): number;
  /** Returns the TileType at the specified coordinates, or undefined if out of bounds. */
  getTile(x: number, y: number): TileType | undefined;
  /** Checks if the specified coordinates are within grid boundaries. */
  isOutOfBounds(x: number, y: number): boolean;
  /** Checks if the tile at the specified coordinates can be entered by entities. */
  isWalkable(x: number, y: number): boolean;
  /** Finds all coordinates of a specific tile type. */
  findTiles(type: TileType): { x: number; y: number }[];
}

/**
 * Core game state interface for managing dynamic elements.
 */
export interface IGameState {
  /** Returns all active entities in the game. */
  getEntities(): Entity[];
  /** Returns the current player score. */
  getScore(): number;
  /** Returns the number of lives remaining. */
  getLives(): number;
  /** Returns the high score. */
  getHighScore(): number;
  /** Returns the total number of pellets remaining in the grid. */
  getRemainingPellets(): number;
  /** Returns the spawn position for a given entity. */
  getSpawnPosition(entity: Entity): { x: number; y: number } | undefined;
  /** Consumes a pellet at the specified coordinates and updates state. */
  consumePellet(x: number, y: number): void;
  /** Checks if a pellet at the specified coordinates has already been eaten. */
  isPelletEaten(x: number, y: number): boolean;
  /** Updates Pacman's position based on a direction and elapsed time. */
  updatePacman(direction: Direction, deltaTime: number): void;
  /** Updates all Ghost entities' positions and AI. */
  updateGhosts(deltaTime: number): void;
  /** Returns true if the game is over. */
  isGameOver(): boolean;
  /** Returns true if Pacman is currently in the death animation. */
  isDying(): boolean;
  /** Returns true if the game is in the "Ready" state (frozen before start). */
  isReady(): boolean;
  /** Returns the current power-up timer in milliseconds. */
  getPowerUpTimer(): number;
  /** Callback fired when a pellet is consumed. */
  onPelletConsumed?: (tileType: TileType) => void;
}

/**
 * Represents the state of the virtual joystick for touch controls.
 */
export interface JoystickState {
  /** Whether the joystick is currently being touched. */
  active: boolean;
  /** The x-coordinate where the touch started. */
  originX: number;
  /** The y-coordinate where the touch started. */
  originY: number;
  /** The current x-coordinate of the touch. */
  currentX: number;
  /** The current y-coordinate of the touch. */
  currentY: number;
}

/**
 * Core renderer interface for drawing the game state.
 */
export interface IRenderer {
  /**
   * Renders the current state of the grid and game state to the output medium.
   * @param grid The game grid to render.
   * @param state The current game state including entities and eaten pellets.
   * @param time Optional current game time in milliseconds for animations (e.g. blinking).
   */
  render(grid: IGrid, state: IGameState, time?: number): void;
}

/**
 * Interface for rendering UI overlays like touch controls.
 */
export interface IUIRenderer {
  /**
   * Renders UI elements over the game world.
   * @param joystick The current state of the joystick.
   * @param time Optional current game time in milliseconds.
   */
  render(joystick: JoystickState, time?: number): void;
}
