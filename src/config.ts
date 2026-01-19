/**
 * Game mechanics configuration
 */
/** Points awarded for collecting a regular pellet. */
export const PELLET_SCORE = 10;
/** Points awarded for collecting a power pellet. */
export const POWER_PELLET_SCORE = 50;

/**
 * Rendering configuration
 */
export const TILE_SIZE = 16;

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
  MAX_DISTANCE: 20, // BASE_RADIUS - STICK_RADIUS
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
