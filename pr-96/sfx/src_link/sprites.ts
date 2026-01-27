import { MASK } from './autotile.js';
import {
  COLORS,
  GHOST_OFFSETS,
  SOURCE_GHOST_SIZE,
  PALETTE_PADDING_X,
  PALETTE_PADDING_Y
} from './config.js';
import type { SpriteOffset } from './config.js';

/**
 * (row, col) coordinates in the sprite sheet for a 4x4 quadrant.
 */
export type SpriteCoord = [number, number];

/**
 * A set of 4 quadrants (top-left, top-right, bottom-left, bottom-right)
 * that compose an 8x8 tile.
 */
export type QuadrantSet = [
  [SpriteCoord, SpriteCoord],
  [SpriteCoord, SpriteCoord]
];

/**
 * Mapping from bitmask (0-255) to a set of 4 quadrants.
 * Configure your sprite sheet (row, col) coordinates here.
 */
export const TILE_MAP: Record<number, QuadrantSet> = {
  // Example for mask 0 (no neighbors)
  0: [
    [[0, 0], [0, 0]], // top-left, top-right
    [[0, 0], [0, 0]], // bottom-left, bottom-right
  ],
  // bottom left corner
  [MASK.N | MASK.NE | MASK.E]: [
    [[1, 16], [1, 17]],
    [[2, 16], [2, 17]],
  ],
  // top left outer corner
  [MASK.E | MASK.SE | MASK.S]: [
    [[0, 16], [0, 17]],
    [[1, 16], [1, 17]],
  ],
  // top right outer corner
  [MASK.W | MASK.SW | MASK.S]: [
    [[0, 17], [0, 18]],
    [[1, 17], [1, 18]],
  ],
  // bottom right corner
  [MASK.N | MASK.NW | MASK.W]: [
    [[1, 17], [1, 18]],
    [[2, 17], [2, 18]],
  ],
  // left wall
  // .##
  // .##
  // .##
  [MASK.N | MASK.NE | MASK.E | MASK.SE | MASK.S]: [
    [[1, 16], [1, 17]],
    [[1, 16], [1, 17]],
  ],
  // right wall
  // ##.
  // ##.
  // ##.
  [MASK.N | MASK.NW | MASK.W | MASK.SW | MASK.S]: [
    [[1, 17], [1, 18]],
    [[1, 17], [1, 18]],
  ],
  // ###
  // ###
  // ...
  [MASK.NW | MASK.N | MASK.NE | MASK.E | MASK.W]: [
    [[1, 17], [1, 17]],
    [[2, 17], [2, 17]],
  ],
  // ... 
  // ###
  // ###
  [MASK.W | MASK.SW | MASK.S | MASK.SE | MASK.E]: [
    [[0, 17], [0, 17]],
    [[1, 17], [1, 17]],
  ],
  // ###
  // ###
  // ###
  [MASK.N | MASK.NW | MASK.W | MASK.SW | MASK.S | MASK.SE | MASK.E | MASK.NE]: [
    [[1, 17], [1, 17]],
    [[1, 17], [1, 17]],
  ],
  // ... 
  // ###
  // ...
  [MASK.E | MASK.W]: [
    [[0, 17], [0, 17]],
    [[2, 17], [2, 17]],
  ],
  // ..# 
  // ###
  // ...
  [MASK.E | MASK.W | MASK.NE]: [
    [[0, 17], [0, 17]],
    [[2, 17], [2, 17]],
  ],
  // .#. 
  // ##.
  // ...
  [MASK.N | MASK.W]: [
    [[4, 17], [1, 18]],
    [[2, 17], [2, 18]],
  ],
  // .#. 
  // .##
  // ...
  [MASK.N | MASK.E]: [
    [[1, 16], [4, 18]],
    [[2, 16], [2, 17]],
  ],

  // .#. 
  // .#.
  // ##.
  [MASK.N | MASK.S | MASK.SW]: [
    [[1, 16], [1, 18]],
    [[1, 16], [1, 18]],
  ],

  // .#. 
  // .#.
  // .#.
  [MASK.N | MASK.S]: [
    [[1, 16], [1, 18]],
    [[1, 16], [1, 18]],
  ],


  // ### 
  // ##.
  // ##.
  [MASK.NE | MASK.N | MASK.NW | MASK.W | MASK.SW | MASK.S]: [
    [[1, 17], [1, 18]],
    [[1, 17], [1, 18]],
  ],


  // ### 
  // ###
  // ##.
  [MASK.E | MASK.NE | MASK.N | MASK.NW | MASK.W | MASK.SW | MASK.S]: [
    [[1, 17], [1, 17]],
    [[1, 17], [5, 18]],
  ],

  // ### 
  // ###
  // #..
  [MASK.E | MASK.NE | MASK.N | MASK.NW | MASK.W | MASK.SW]: [
    [[1, 17], [1, 17]],
    [[2, 17], [2, 17]],
  ],
  // .#. 
  // .#.
  // .##
  [MASK.N | MASK.S | MASK.SE]: [
    [[1, 16], [1, 18]],
    [[1, 16], [1, 18]],
  ],

  // #.. 
  // ###
  // ...
  [MASK.NW | MASK.W | MASK.E]: [
    [[0, 17], [0, 17]],
    [[2, 17], [2, 17]],
  ],


  // ... 
  // ###
  // ..#
  [MASK.W | MASK.E | MASK.SE]: [
    [[0, 17], [0, 17]],
    [[2, 17], [2, 17]],
  ],

  // ... 
  // ##.
  // .#.
  [MASK.W | MASK.S]: [
    [[0, 17], [0, 18]],
    [[5, 17], [1, 18]],
  ],

  // ##. 
  // .#.
  // .#.
  [MASK.NW | MASK.N | MASK.S]: [
    [[1, 16], [1, 18]],
    [[1, 16], [1, 18]],
  ],

  // ... 
  // .##
  // .#.
  [MASK.E | MASK.S]: [
    [[0, 16], [0, 17]],
    [[1, 16], [0, 16]],
  ],


  // ... 
  // ###
  // #..
  [MASK.W | MASK.SW | MASK.E]: [
    [[0, 17], [0, 17]],
    [[2, 17], [2, 17]],
  ],


  // .## 
  // .#.
  // .#.
  [MASK.N | MASK.NE | MASK.S]: [
    [[1, 16], [1, 18]],
    [[1, 16], [1, 18]],
  ],

  // ### 
  // ###
  // ..#
  [MASK.W | MASK.NW | MASK.N | MASK.NE | MASK.E | MASK.SE]: [
    [[1, 17], [1, 17]],
    [[2, 17], [2, 17]],
  ],

  // ### 
  // ###
  // .##
  [MASK.W | MASK.NW | MASK.N | MASK.NE | MASK.E | MASK.SE | MASK.S]: [
    [[1, 17], [1, 17]],
    [[5, 17], [1, 17]],
  ],

  // ### 
  // .##
  // .##
  [MASK.NW | MASK.N | MASK.NE | MASK.E | MASK.SE | MASK.S]: [
    [[1, 16], [1, 17]],
    [[1, 16], [1, 17]],
  ],


  // #.. 
  // ###
  // ###
  [MASK.NW | MASK.W | MASK.SW | MASK.S | MASK.SE | MASK.E]: [
    [[0, 17], [0, 17]],
    [[1, 17], [1, 17]],
  ],
  // .#. 
  // .##
  // .##
  [MASK.N | MASK.E | MASK.SE | MASK.S]: [
    [[1, 16], [4, 18]],
    [[1, 16], [1, 17]],
  ],


  // .## 
  // .##
  // .#.
  [MASK.N | MASK.NE | MASK.E | MASK.S]: [
    [[1, 16], [1, 17]],
    [[1, 16], [5, 18]],
  ],


  // .## 
  // .##
  // ###
  [MASK.N | MASK.NE | MASK.E | MASK.SE | MASK.S | MASK.SW]: [
    [[1, 16], [1, 17]],
    [[1, 16], [1, 17]],
  ],

  // .## 
  // ###
  // ###
  [MASK.N | MASK.NE | MASK.E | MASK.SE | MASK.S | MASK.SW | MASK.W]: [
    [[4, 17], [1, 17]],
    [[1, 17], [1, 17]],
  ],


  // ..# 
  // ###
  // ###
  [MASK.NE | MASK.E | MASK.SE | MASK.S | MASK.SW | MASK.W]: [
    [[0, 17], [0, 17]],
    [[1, 17], [1, 17]],
  ],

  // ##. 
  // ##.
  // ###
  [MASK.N | MASK.NW | MASK.W | MASK.SW | MASK.S | MASK.SE]: [
    [[1, 17], [1, 18]],
    [[1, 17], [1, 18]],
  ],

  // ##. 
  // ###
  // ###
  [MASK.N | MASK.NW | MASK.W | MASK.SW | MASK.S | MASK.SE | MASK.E]: [
    [[1, 17], [4, 18]],
    [[1, 17], [1, 17]],
  ],


  // .#. 
  // ##.
  // ##.
  [MASK.N | MASK.W | MASK.SW | MASK.S]: [
    [[4, 17], [1, 18]],
    [[1, 17], [1, 18]],
  ],


  // ##. 
  // ##.
  // .#.
  [MASK.N | MASK.NW | MASK.W | MASK.S]: [
    [[1, 17], [1, 18]],
    [[5, 17], [1, 18]],
  ],

  // ... 
  // ###
  // .##
  [MASK.W | MASK.E | MASK.SE | MASK.S]: [
    [[0, 17], [0, 17]],
    [[5, 17], [1, 17]],
  ],

  // ... 
  // ###
  // ##.
  [MASK.E | MASK.W | MASK.SW | MASK.S]: [
    [[0, 17], [0, 17]],
    [[1, 17], [5, 18]],
  ],

  // ... 
  // .##
  // ...
  [MASK.E]: [
    [[0, 17], [0, 17]],
    [[2, 17], [2, 17]],
  ],

  // ... 
  // #..
  // ...
  [MASK.W]: [
    [[0, 17], [0, 17]],
    [[2, 17], [2, 17]],
  ],
};

/**
 * Static sprite coordinates (row, col) for non-autotiled tiles.
 * These are for the full 8x8 tile (2x2 quadrants).
 */
export const STATIC_SPRITE_MAP = {
  PELLET: [1, 15] as SpriteCoord,
  POWER_PELLET: [3, 15] as SpriteCoord,
} as const;

/**
 * Pixel size of a single quadrant in the sprite sheet.
 */
export const SOURCE_QUADRANT_SIZE = 9;
/**
 * Pixel size of a full tile in the sprite sheet.
 */
export const SOURCE_TILE_SIZE = 9;

/**
 * Pixel size of the Pacman sprite in the source palette.
 */
export const SOURCE_PACMAN_SIZE = 17;
/**
 * Death animation frames for Pacman.
 * Array of 12 [row, col] coordinates in 17px units.
 */
export const PACMAN_DEATH_ANIMATION_MAP: [number, number][] = [
  [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5],
  [1, 0], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5],
];

/**
 * Mapping of ghost colors to their palette offset.
 */
export const GHOST_PALETTE_OFFSETS: Record<string, SpriteOffset> = {
  red: GHOST_OFFSETS.RED!,
  pink: GHOST_OFFSETS.PINK!,
  cyan: GHOST_OFFSETS.CYAN!,
  orange: GHOST_OFFSETS.ORANGE!,
  scared: GHOST_OFFSETS.SCARED!,
  scared_flash: GHOST_OFFSETS.SCARED_FLASH!,
  eyes: GHOST_OFFSETS.EYES!,
};

/**
 * Maps direction names to their column indices in the sprite sheet.
 * Ghosts have 2 animation frames per direction.
 */
export const GHOST_ANIMATION_MAP = {
  EAST: [0, 1],
  WEST: [4, 5],
  NORTH: [6, 7],
  SOUTH: [2, 3],
  SCARED: [0, 1],
  SCARED_FLASH: [0, 1],
} as const;

/** The sequence of animation frames for Ghosts. */
export const GHOST_ANIMATION_SEQUENCE = [0, 1] as const;

/**
 * Calculates the source sprite coordinates for a ghost.
 */
export function getGhostSpriteSource(
  color: string,
  direction: string,
  isScared: boolean,
  frameIndex: number = 0,
  isDead: boolean = false,
  isFlashing: boolean = false
) {
  let resolvedColor = color;
  if (isDead) {
    resolvedColor = 'eyes';
  } else if (isScared) {
    resolvedColor = isFlashing ? 'scared_flash' : 'scared';
  } else if (!GHOST_PALETTE_OFFSETS[color]) {
    resolvedColor = COLORS.GHOST_DEFAULT;
  }

  const offset = GHOST_PALETTE_OFFSETS[resolvedColor] || GHOST_OFFSETS.RED!;

  let dirKey = direction as keyof typeof GHOST_ANIMATION_MAP;
  if (!(dirKey in GHOST_ANIMATION_MAP)) {
    dirKey = 'EAST';
  }

  if (isScared) {
    dirKey = isFlashing ? 'SCARED_FLASH' : 'SCARED';
  }

  const frames = GHOST_ANIMATION_MAP[dirKey];
  // Dead ghosts (eyes) typically don't animate the same way, but they might have different eye directions.
  // Standard sprite sheets have eyes facing East, West, North, South.
  const col = isDead ? (frames[0] ?? 0) : (frames[frameIndex % frames.length] ?? 0);

  const sourceX = offset!.x + (col * SOURCE_GHOST_SIZE) + PALETTE_PADDING_X;
  const sourceY = offset!.y + PALETTE_PADDING_Y;

  return {
    x: sourceX,
    y: sourceY,
    width: SOURCE_GHOST_SIZE - PALETTE_PADDING_X,
    height: SOURCE_GHOST_SIZE - PALETTE_PADDING_Y,
    flipX: false,
    flipY: false
  };
}

/**
 * Animation frames for Pacman in each direction.
 * Each direction has 3 frames: [row, col, flipX, flipY]
 * row and col are in 17px units relative to the absolute PACMAN_PALETTE_OFFSET position in the image.
 */
export const PACMAN_ANIMATION_MAP = {
  NORTH: [
    [0, 1, false, true],
    [1, 1, false, true],
    [2, 0, false, true],
  ],
  SOUTH: [
    [0, 1, false, false],
    [1, 1, false, false],
    [2, 0, false, false],
  ],
  WEST: [
    [0, 0, true, false],
    [1, 0, true, false],
    [2, 0, true, false],
  ],
  EAST: [
    [0, 0, false, false],
    [1, 0, false, false],
    [2, 0, false, false],
  ],
} as const;

/** The sequence of animation frames for Pacman. */
export const PACMAN_ANIMATION_SEQUENCE = [0, 1, 2, 1] as const;
