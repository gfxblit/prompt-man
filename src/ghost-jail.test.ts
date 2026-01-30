import { describe, it, expect } from 'vitest';
import { Grid } from './grid.js';
import { TileType, EntityType } from './types.js';
import { CHAR_MAP } from './constants.js';

describe('Ghost Jail Feature', () => {
  it('should have JailDoor in TileType', () => {
    // This is a bit meta, but ensures the enum is updated
    expect(TileType.JailDoor).toBeDefined();
    expect(TileType.JailDoor).toBe('JailDoor');
  });

  it('should map "-" to JailDoor in CHAR_MAP', () => {
    expect(CHAR_MAP['-']).toBe('JailDoor');
  });

  it('should parse "-" as JailDoor in Grid.fromString', () => {
    const template = `
#####
# - #
#####
`;
    const grid = Grid.fromString(template);
    // Assuming the middle tile (2, 1) is the jail door
    // 01234
    // 1 - 
    expect(grid.getTile(2, 1)).toBe('JailDoor');
  });

  describe('Grid.isWalkable with EntityType', () => {
    // Use # for boundary to prevent trimming issues
    // # - #
    // 01234
    const grid = Grid.fromString('# - #'); 

    it('should NOT allow alive Ghost to walk on JailDoor', () => {
      expect(grid.isWalkable(2, 0, EntityType.Ghost, false)).toBe(false);
    });

    it('should allow dead Ghost (eyes) to walk on JailDoor', () => {
      expect(grid.isWalkable(2, 0, EntityType.Ghost, true)).toBe(true);
    });

    it('should NOT allow Pacman to walk on JailDoor', () => {
      expect(grid.isWalkable(2, 0, EntityType.Pacman)).toBe(false);
      expect(grid.isWalkable(2, 0, EntityType.Pacman, true)).toBe(false);
    });

    it('should allow undefined entity (backward compat) to act like Pacman (blocked)', () => {
      // Default behavior if entity is missing should probably be strict, 
      // but for now let's assume it blocks if it's a special door.
      expect(grid.isWalkable(2, 0)).toBe(false);
    });

    it('should still allow walking on Empty tiles', () => {
      // The spaces around '-' are Empty? No, in '# - #', index 1 is space
      expect(grid.getTile(1, 0)).toBe(TileType.Empty);
      expect(grid.isWalkable(1, 0)).toBe(true);
      expect(grid.isWalkable(1, 0, EntityType.Pacman)).toBe(true);
      expect(grid.isWalkable(1, 0, EntityType.Ghost)).toBe(true);
    });
    
    it('should still block Walls', () => {
        const wallGrid = Grid.fromString('#');
        expect(wallGrid.isWalkable(0, 0)).toBe(false);
        expect(wallGrid.isWalkable(0, 0, EntityType.Pacman)).toBe(false);
        expect(wallGrid.isWalkable(0, 0, EntityType.Ghost)).toBe(false);
    })
  });
});
