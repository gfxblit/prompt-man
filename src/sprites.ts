import { MASK } from './autotile.js';
import {
  COLORS,
  GHOST_PALETTE_OFFSET_X,
  GHOST_PALETTE_OFFSET_Y,
  SOURCE_GHOST_SIZE,
  PALETTE_PADDING_X,
  PALETTE_PADDING_Y
} from './config.js';

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
 * Mapping of ghost colors to their [x, y] palette offset.
 */
export const GHOST_PALETTE_OFFSETS: Record<string, [number, number]> = {
  [COLORS.GHOST_COLORS[0]]: [GHOST_PALETTE_OFFSET_X, GHOST_PALETTE_OFFSET_Y], // red
  [COLORS.GHOST_COLORS[1]]: [GHOST_PALETTE_OFFSET_X, GHOST_PALETTE_OFFSET_Y + SOURCE_GHOST_SIZE], // pink
  [COLORS.GHOST_COLORS[2]]: [GHOST_PALETTE_OFFSET_X, GHOST_PALETTE_OFFSET_Y + SOURCE_GHOST_SIZE * 2], // cyan
  [COLORS.GHOST_COLORS[3]]: [GHOST_PALETTE_OFFSET_X, GHOST_PALETTE_OFFSET_Y + SOURCE_GHOST_SIZE * 3], // orange
  'scared': [GHOST_PALETTE_OFFSET_X, GHOST_PALETTE_OFFSET_Y + SOURCE_GHOST_SIZE * 4],
};

/**
 * Maps direction names to frames.
 * Each direction maps to a column index in the sprite sheet.
 * Row is determined by the ghost color (or scared state).
 * All frames are 17px wide and non-flipped.
 */
export const GHOST_ANIMATION_MAP = {
  EAST: 0,
  WEST: 1,
  NORTH: 2,
  SOUTH: 3,
} as const;

/**
 * Calculates the source sprite coordinates for a ghost.
 */
export function getGhostSpriteSource(color: string, direction: string, isScared: boolean) {
  const colorKey = isScared ? 'scared' : (color || COLORS.GHOST_DEFAULT);
  
  const defaultOffset = isScared ? GHOST_PALETTE_OFFSETS['scared'] : GHOST_PALETTE_OFFSETS[COLORS.GHOST_DEFAULT];
  const paletteOffset = GHOST_PALETTE_OFFSETS[colorKey] ?? defaultOffset;
  
  if (!paletteOffset) {
    // Should not happen if 'scared' and default colors are defined in offsets
    throw new Error(`Ghost palette offset not found for color: ${colorKey}`);
  }

  let dirKey = direction as keyof typeof GHOST_ANIMATION_MAP;
  if (!(dirKey in GHOST_ANIMATION_MAP)) {
    dirKey = 'EAST';
  }

  const col = GHOST_ANIMATION_MAP[dirKey];
  // Row is implicitly 0 relative to the color's starting Y offset
  
  const [offsetX, offsetY] = paletteOffset;

  const sourceX = offsetX + (col * SOURCE_GHOST_SIZE) + PALETTE_PADDING_X;
  const sourceY = offsetY + PALETTE_PADDING_Y;

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
