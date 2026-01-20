import { QuadrantType } from './types.js';

/**
 * Game mechanics configuration
 */
/** Points awarded for collecting a regular pellet. */
export const PELLET_SCORE = 10;
/** Points awarded for collecting a power pellet. */
export const POWER_PELLET_SCORE = 50;

/**
 * Assets configuration
 */
export const PALETTE_URL = 'art/palettes.png';

/**
 * Rendering configuration
 */
export const TILE_SIZE = 16;
export const QUADRANT_SIZE = 4;

/**
 * Wall autotiling sprite coordinates in the palette image.
 * These are the top-left coordinates of the 4x4 quadrant sprite.
 */
export const WALL_SPRITE_COORDS: Record<QuadrantType, { x: number; y: number }> = {
  [QuadrantType.OuterCorner]: { x: 0, y: 0 },
  [QuadrantType.VerticalEdge]: { x: 4, y: 0 },
  [QuadrantType.HorizontalEdge]: { x: 0, y: 4 },
  [QuadrantType.InnerCorner]: { x: 4, y: 4 },
  [QuadrantType.Fill]: { x: 8, y: 0 },
};

/**
 * Game color palette
 */
export const COLORS = {
  WALL: 'blue',
  PELLET: 'peachpuff',
  PACMAN: 'yellow',
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
     #.##    G     ##.#     
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