import { TileType } from './types.js';

export class Grid {
  private tiles: TileType[][];
  private width: number;
  private height: number;

  constructor(width: number, height: number, defaultTile: TileType = TileType.Empty) {
    this.width = width;
    this.height = height;
    this.tiles = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => defaultTile)
    );
  }

  static fromString(template: string): Grid {
    const lines = template.trim().split('\n');
    const height = lines.length;
    const width = lines[0]?.length ?? 0;
    const grid = new Grid(width, height);

    const charMap: Record<string, TileType> = {
      '#': TileType.Wall,
      '.': TileType.Pellet,
      'o': TileType.PowerPellet,
      ' ': TileType.Empty,
      'P': TileType.PacmanSpawn,
      'G': TileType.GhostSpawn,
    };

    for (let y = 0; y < height; y++) {
      const line = lines[y];
      if (!line) continue;
      for (let x = 0; x < width; x++) {
        const char = line[x];
        if (char === undefined) continue;
        const tileType = charMap[char] || TileType.Empty;
        grid.setTile(x, y, tileType);
      }
    }

    return grid;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  getTile(x: number, y: number): TileType | undefined {
    if (this.isOutOfBounds(x, y)) {
      return undefined;
    }
    return this.tiles[y]?.[x];
  }

  setTile(x: number, y: number, type: TileType): void {
    if (this.isOutOfBounds(x, y)) {
      return;
    }
    const row = this.tiles[y];
    if (row) {
      row[x] = type;
    }
  }

  isOutOfBounds(x: number, y: number): boolean {
    return x < 0 || x >= this.width || y < 0 || y >= this.height;
  }

  isWalkable(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    return tile !== undefined && tile !== TileType.Wall;
  }
}
