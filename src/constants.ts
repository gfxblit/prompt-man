import { TileType } from './types.js';

/**
 * Mapping of characters in level templates to TileTypes
 */
export const CHAR_MAP: Record<string, TileType> = {
  '#': TileType.Wall,
  '.': TileType.Pellet,
  'o': TileType.PowerPellet,
  ' ': TileType.Empty,
  'P': TileType.PacmanSpawn,
  'G': TileType.GhostSpawn,
} as const;
