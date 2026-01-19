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
  /** Optional CSS color string for rendering. */
  color?: string;
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
  /** Returns the total number of pellets remaining in the grid. */
  getRemainingPellets(): number;
  /** Consumes a pellet at the specified coordinates and updates state. */
  consumePellet(x: number, y: number): void;
  /** Checks if a pellet at the specified coordinates has already been eaten. */
  isPelletEaten(x: number, y: number): boolean;
}

/**
 * Core renderer interface for drawing the game state.
 */
export interface IRenderer {
  /**
   * Renders the current state of the grid and game state to the output medium.
   * @param grid The game grid to render.
   * @param state The current game state including entities and eaten pellets.
   */
  render(grid: IGrid, state: IGameState): void;
}