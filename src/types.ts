export enum TileType {
  Empty = 'Empty',
  Wall = 'Wall',
  Pellet = 'Pellet',
  PowerPellet = 'PowerPellet',
  PacmanSpawn = 'PacmanSpawn',
  GhostSpawn = 'GhostSpawn',
}

export enum EntityType {
  Pacman = 'Pacman',
  Ghost = 'Ghost',
}

export interface Entity {
  type: EntityType;
  x: number;
  y: number;
  color?: string;
}
