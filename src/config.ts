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
/** Alignment tolerance for turning (in tiles). */
export const ALIGNMENT_TOLERANCE = 0.05;

/**
 * Assets configuration
 */
export const PALETTE_URL = 'art/palettes.png';
/** Global X offset (pixels) for the start of the tilemap in the palette sheet. */
export const PALETTE_ORIGIN_X = 600;
/** Global Y offset (pixels) for the start of the tilemap in the palette sheet. */
export const PALETTE_ORIGIN_Y = 186;
/** Padding (pixels) on the left of each sprite in the palette (e.g., pink boundary). */
export const PALETTE_PADDING_X = 1;
/** Padding (pixels) on the top of each sprite in the palette (e.g., pink boundary). */
export const PALETTE_PADDING_Y = 1;

/**
 * Rendering configuration
 */
export const TILE_SIZE = 18;
export const PELLET_BLINK_RATE = 250; // ms

/**
 * Game color palette
 */
export const COLORS = {
  WALL: 'blue',
  PELLET: 'peachpuff',
  PACMAN: 'yellow',
  GHOST_COLORS: ['red', 'pink', 'cyan', 'orange'],
  GHOST_DEFAULT: 'red',
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
     #.##    P     ##.#     
     #.## ######## ##.#     
######.## ######## ##.######
#............##............#
#.####.#####.##.#####.####.#
#.####.#####.##.#####.####.#
#o..##................##..o#
###.##.##.########.##.##.###
###.##.##.########.##.##.###
#......##....##....##......#
#.##########.##.##########.#
#.##########.##.##########.#
#..........................#
############################
`.trim();