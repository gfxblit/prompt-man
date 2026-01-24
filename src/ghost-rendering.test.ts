import { describe, it, expect } from 'vitest';
import { getGhostSpriteSource } from './sprites.js';

describe('Ghost Rendering Logic', () => {
  it('calculates correct source coordinates for Red Ghost moving East', () => {
    // Red offset: 558, 277. East frame: col 0 (0px offset)
    // X: 558 + 0 + 1 (padding) = 559
    // Y: 277 + 0 + 1 (padding) = 278
    const coords = getGhostSpriteSource('red', 'EAST', false);
    expect(coords).toEqual({ x: 559, y: 278, width: 16, height: 16, flipX: false, flipY: false });
  });

  it('calculates correct source coordinates for Pink Ghost moving West', () => {
    // Pink offset: 558, 294 (277 + SOURCE_GHOST_SIZE). West frame: col 2 (SOURCE_GHOST_SIZE * 2 = 34px offset)
    // X: 558 + 34 + 1 = 593
    // Y: 294 + 0 + 1 = 295
    const coords = getGhostSpriteSource('pink', 'WEST', false);
    expect(coords).toEqual({ x: 593, y: 295, width: 16, height: 16, flipX: false, flipY: false });
  });

  it('calculates correct source coordinates for Scared Ghost', () => {
     // Scared row is index 4 -> 277 + 4 * SOURCE_GHOST_SIZE = 345.
     // North frame is col 4 -> 4 * SOURCE_GHOST_SIZE = 68 offset.
     // X: 558 + 68 + 1 = 627
     // Y: 345 + 0 + 1 = 346
     // Note: passing 'blue' as color but isScared=true overrides it to 'scared' logic inside
     const coords = getGhostSpriteSource('blue', 'NORTH', true);
     expect(coords).toEqual({ x: 627, y: 346, width: 16, height: 16, flipX: false, flipY: false });
  });

  it('falls back to default ghost color when invalid color is provided', () => {
    // Default color is 'red'. Red offset: 558, 277.
    // Invalid color -> fallback to 'red'.
    // Direction 'EAST' -> col 0 -> 0px offset.
    // X: 558 + 0 + 1 = 559
    // Y: 277 + 0 + 1 = 278
    const coords = getGhostSpriteSource('invalid-color', 'EAST', false);
    expect(coords).toEqual({ x: 559, y: 278, width: 16, height: 16, flipX: false, flipY: false });
  });

  it('calculates correct source coordinates for Dead Ghost eyes', () => {
    // Eyes row is index 5 -> 277 + 5 * SOURCE_GHOST_SIZE = 362.
    // South frame is col 6 -> 6 * SOURCE_GHOST_SIZE = 102 offset.
    // X: 558 + 102 + 1 = 661
    // Y: 362 + 0 + 1 = 363
    const coords = getGhostSpriteSource('red', 'SOUTH', false, 0, true);
    expect(coords).toEqual({ x: 661, y: 363, width: 16, height: 16, flipX: false, flipY: false });
  });
});
