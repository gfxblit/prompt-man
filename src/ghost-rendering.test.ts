import { describe, it, expect } from 'vitest';
import { getGhostSpriteSource } from './sprites';

describe('Ghost Rendering Logic', () => {
  it('calculates correct source coordinates for Red Ghost moving East', () => {
    // Red offset: 558, 277. East frame: col 0 (0px offset)
    // X: 558 + 0 + 1 (padding) = 559
    // Y: 277 + 0 + 1 (padding) = 278
    const coords = getGhostSpriteSource('red', 'EAST', false, 0);
    expect(coords).toEqual({ x: 559, y: 278, width: 16, height: 16, flipX: false, flipY: false });
  });

  it('calculates correct source coordinates for Pink Ghost moving West', () => {
    // Pink offset: 558, 294 (277 + 17). West frame: col 1 (17px offset)
    // X: 558 + 17 + 1 = 576
    // Y: 294 + 0 + 1 = 295
    const coords = getGhostSpriteSource('pink', 'WEST', false, 0);
    expect(coords).toEqual({ x: 576, y: 295, width: 16, height: 16, flipX: false, flipY: false });
  });

  it('calculates correct source coordinates for Scared Ghost', () => {
     // Scared row is index 4 -> 277 + 4*17 = 345.
     // North frame is col 2 -> 2*17 = 34 offset.
     // X: 558 + 34 + 1 = 593
     // Y: 345 + 0 + 1 = 346
     // Note: passing 'blue' as color but isScared=true overrides it to 'scared' logic inside
     const coords = getGhostSpriteSource('blue', 'NORTH', true, 0);
     expect(coords).toEqual({ x: 593, y: 346, width: 16, height: 16, flipX: false, flipY: false });
  });
});
