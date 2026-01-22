import { MASK } from './autotile.js';

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
  [MASK.W| MASK.SW | MASK.E]: [
    [[0, 17], [0, 17]],
    [[2, 17], [2, 17]],
  ],


  // .## 
  // .#.
  // .#.
  [MASK.N| MASK.NE | MASK.S]: [
    [[1, 16], [1, 18]],
    [[1, 16], [1, 18]],
  ],

  // ### 
  // ###
  // ..#
  [MASK.W| MASK.NW | MASK.N | MASK.NE | MASK.E | MASK.SE]: [
    [[1, 17], [1, 17]],
    [[2, 17], [2, 17]],
  ],

  // ### 
  // ###
  // .##
  [MASK.W| MASK.NW | MASK.N | MASK.NE | MASK.E | MASK.SE | MASK.S]: [
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
  [MASK.N | MASK.NW | MASK.W| MASK.S]: [
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
export const SOURCE_QUADRANT_SIZE = 8;
/**
 * Pixel size of a full tile in the sprite sheet.
 */
export const SOURCE_TILE_SIZE = 8;
