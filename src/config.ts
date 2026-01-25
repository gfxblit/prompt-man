/**
 * Game mechanics configuration
 */
/** Points awarded for collecting a regular pellet. */
export const PELLET_SCORE = 10;
/** Points awarded for collecting a power pellet. */
export const POWER_PELLET_SCORE = 50;
/** Pacman speed in tiles per millisecond. */
export const PACMAN_SPEED = 5 / 1000;
/** Ghost speed in tiles per millisecond. */
export const GHOST_SPEED = 4 / 1000;
/** Duration in milliseconds for how long power-up lasts. */
export const POWER_UP_DURATION = 10000; // 10 seconds
/** Speed of scared ghosts, as a fraction of their normal speed. */
export const SCARED_GHOST_SPEED_MULTIPLIER = 0.5;
/** Speed of dead ghosts returning to jail, as a fraction of their base speed. */
export const DEAD_GHOST_SPEED_MULTIPLIER = 1.5; // Multiplier for GHOST_SPEED.
/** Duration in milliseconds that a ghost remains non-collidable after respawning. */
export const RESPAWN_INVULNERABILITY_DURATION = 1000;
/** Threshold distance to trigger ghost respawn when returning to spawn point. */
export const GHOST_RESPAWN_THRESHOLD = 0.5;
/** Score awarded for eating a scared ghost. */
export const GHOST_EATEN_SCORE = 200;
/** A small tolerance to check for grid alignment. */
export const ALIGNMENT_TOLERANCE = 0.05;
/** Collision threshold: roughly overlapping (less than 1 tile usually). */
export const COLLISION_THRESHOLD = 0.5;
/**
 * Duration in milliseconds for the "READY\!" state at start and after death.
 * 2000ms matches the typical delay in original arcade Pac-Man.
 */
export const READY_DURATION = 2000;

/**
 * Assets configuration
 */
export const PALETTE_URL = 'art/palettes.png';
/** Global X offset (pixels) for the start of the tilemap in the palette sheet. */
export const PALETTE_ORIGIN_X = 600;
/** Global Y offset (pixels) for the start of the tilemap in the palette sheet. */
export const PALETTE_ORIGIN_Y = 186;
/** X offset (pixels) for Pacman sprites in the palette image. */
export const PACMAN_PALETTE_OFFSET_X = 502;
/** Y offset (pixels) for Pacman sprites in the palette image. */
export const PACMAN_PALETTE_OFFSET_Y = 319;
/** X offset (pixels) for Ghost sprites in the palette image. */
export const GHOST_PALETTE_OFFSET_X = 558;
/** Y offset (pixels) for Ghost sprites in the palette image. */
export const GHOST_PALETTE_OFFSET_Y = 277;

/** Pixel size of the Ghost sprite in the source palette. */
export const SOURCE_GHOST_SIZE = 17;

export type SpriteOffset = { x: number; y: number };

export const GHOST_OFFSETS: Record<string, SpriteOffset> = {
  RED: { x: 0, y: 82 },
  PINK: { x: 200, y: 82 },
  CYAN: { x: 400, y: 82 },
  ORANGE: { x: 600, y: 82 },
  SCARED: { x: 200, y: 167 },
  EYES: { x: 200, y: 268 },
};

/** Animation speed in milliseconds per frame. */
export const PACMAN_ANIMATION_SPEED = 100;
/** Pacman death animation configuration. */
/** Pacman death animation speed in milliseconds per frame. */
export const PACMAN_DEATH_ANIMATION_SPEED = 150;
export const PACMAN_DEATH_ANIMATION_FRAMES = 12;
export const PACMAN_DEATH_PALETTE_OFFSET_X = 400;
export const PACMAN_DEATH_PALETTE_OFFSET_Y = 319;
/** Ghost animation speed in milliseconds per frame. */
export const GHOST_ANIMATION_SPEED = 100;
/** Padding (pixels) on the left of each sprite in the palette (e.g., pink boundary). */
export const PALETTE_PADDING_X = 1;
/** Padding (pixels) on the top of each sprite in the palette (e.g., pink boundary). */
export const PALETTE_PADDING_Y = 1;

/**
 * Rendering configuration
 */
export const TILE_SIZE = 18;
/** Time in milliseconds for each blink state (on/off). */
export const POWER_PELLET_BLINK_RATE = 250;

/**
 * Game color palette
 */
export const COLORS = {
  WALL: 'blue',
  PELLET: 'peachpuff',
  PACMAN: 'yellow',
  GHOST_COLORS: ['red', 'pink', 'cyan', 'orange'],
  GHOST_DEFAULT: 'red',
  SCARED_GHOST: 'blue',
} as const;

/**
 * Joystick configuration
 */
export const JOYSTICK = {
  BASE_RADIUS: 40,
  STICK_RADIUS: 20,
  // MAX_DISTANCE is calculated as BASE_RADIUS - STICK_RADIUS
  DEADZONE: 10,
} as const;

/**
 * Default level layout template
 */
export const LEVEL_TEMPLATE = `
############################
#............##............#
#.####.#####.##.#####.####.#
#o####.#####.##.#####.####o#
#.####.#####.##.#####.####.#
#..........................#
#.####.##.########.##.####.#
#.####.##.########.##.####.#
#......##....##....##......#
######.##### ## #####.######
     #.##### ## #####.#     
     #.##  G G G G ##.#     
     #.## ######## ##.#     
######.## #      # ##.######
      .   #      #   .      
######.## #      # ##.######
     #.## ######## ##.#     
     #.##          ##.#     
     #.## ######## ##.#     
######.## ######## ##.######
#............##............#
#.####.#####.##.#####.####.#
#.####.#####.##.#####.####.#
#o..##.......P........##..o#
###.##.##.########.##.##.###
###.##.##.########.##.##.###
#......##....##....##......#
#.##########.##.##########.#
#.##########.##.##########.#
#..........................#
############################
`.trim();
