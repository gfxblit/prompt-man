import { TileType } from './types.js';
import type { IGrid } from './types.js';
import { CHAR_MAP } from './constants.js';

export class Grid implements IGrid {
  private tiles: TileType[][];
  private width: number;
  private height: number;
  private tileCache: Map<TileType, { x: number; y: number }[]> = new Map();

  constructor(width: number, height: number, defaultTile: TileType = TileType.Empty) {
    this.width = width;
    this.height = height;
    this.tiles = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => defaultTile)
    );

    if (width > 0 && height > 0) {
      this.rebuildCache();
    }
  }

  static fromString(template: string): Grid {
    const trimmed = template.trim();
    if (!trimmed) {
      return new Grid(0, 0);
    }
    const lines = trimmed.split('\n');
    const height = lines.length;
    const width = lines.length > 0 ? Math.max(...lines.map(line => line.length)) : 0;
    const grid = new Grid(width, height, TileType.Empty);

    for (let y = 0; y < height; y++) {
      const line = lines[y];
      if (!line) continue;

      for (let x = 0; x < width; x++) {
        const char = line[x];
        if (char === undefined) continue;
        const tileType = CHAR_MAP[char] || TileType.Empty;
        if (tileType !== TileType.Empty) {
          grid.setTile(x, y, tileType);
        }
      }
    }

    return grid;
  }

  private rebuildCache(): void {
    this.tileCache.clear();
    for (let y = 0; y < this.height; y++) {
      const row = this.tiles[y];
      if (!row) continue;
      for (let x = 0; x < this.width; x++) {
        const type = row[x];
        if (type === undefined) continue;
        if (!this.tileCache.has(type)) {
          this.tileCache.set(type, []);
        }
        this.tileCache.get(type)!.push({ x, y });
      }
    }
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
      const oldType = row[x];
      if (oldType === type) return;

      row[x] = type;

      // Incrementally update cache
      if (oldType !== undefined) {
        const oldList = this.tileCache.get(oldType);
        if (oldList) {
          const index = oldList.findIndex(p => p.x === x && p.y === y);
          if (index !== -1) {
            oldList.splice(index, 1);
          }
        }
      }

      if (!this.tileCache.has(type)) {
        this.tileCache.set(type, []);
      }
      this.tileCache.get(type)!.push({ x, y });
    }
  }

  isOutOfBounds(x: number, y: number): boolean {
    return x < 0 || x >= this.width || y < 0 || y >= this.height;
  }

  isWalkable(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    return tile !== undefined && tile !== TileType.Wall;
  }

  findTiles(type: TileType): { x: number; y: number }[] {
    return [...(this.tileCache.get(type) || [])];
  }
}
