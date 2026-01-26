import { describe, it, expect } from 'vitest';
import { getGhostSpriteSource, GHOST_ANIMATION_MAP } from './sprites.js';
import {
  GHOST_OFFSETS,
  SOURCE_GHOST_SIZE,
  PALETTE_PADDING_X,
  PALETTE_PADDING_Y
} from '../constants/config.js';

describe('Ghost Rendering Logic', () => {
  it('calculates correct source coordinates for Red Ghost moving East', () => {
    // Red offset: { x: 0, y: 82 }. East frame: col 0 (0px offset)
    // X: 0 + 0 + 1 (padding) = 1
    // Y: 82 + 0 + 1 (padding) = 83
    const coords = getGhostSpriteSource('red', 'EAST', false);
    expect(coords).toEqual({ x: 1, y: 83, width: 16, height: 16, flipX: false, flipY: false });
  });

  it('calculates correct source coordinates for Pink Ghost moving West', () => {
    // Pink offset: { x: 200, y: 82 }. West frame: col 4 (SOURCE_GHOST_SIZE * 4 = 68px offset)
    // X: 200 + 68 + 1 = 269
    // Y: 82 + 0 + 1 = 83
    const coords = getGhostSpriteSource('pink', 'WEST', false);
    expect(coords).toEqual({ x: 269, y: 83, width: 16, height: 16, flipX: false, flipY: false });
  });

  it('calculates correct source coordinates for Scared Ghost', () => {
    // Scared offset: { x: 200, y: 167 }. North frame: col 0 (0px offset)
    // X: 200 + 0 + 1 = 201
    // Y: 167 + 0 + 1 = 168
    // Note: passing 'blue' as color but isScared=true overrides it to 'scared' logic inside
    const coords = getGhostSpriteSource('blue', 'NORTH', true);
    expect(coords).toEqual({ x: 201, y: 168, width: 16, height: 16, flipX: false, flipY: false });
  });

  it('falls back to default ghost color when invalid color is provided', () => {
    // Default color is 'red'. Red offset: { x: 0, y: 82 }.
    // Invalid color -> fallback to 'red'.
    // Direction 'EAST' -> col 0 -> 0px offset.
    // X: 0 + 0 + 1 = 1
    // Y: 82 + 0 + 1 = 83
    const coords = getGhostSpriteSource('invalid-color', 'EAST', false);
    expect(coords).toEqual({ x: 1, y: 83, width: 16, height: 16, flipX: false, flipY: false });
  });

  it('calculates correct source coordinates for Dead Ghost eyes', () => {
    // Eyes offset: { x: 200, y: 268 }.
    // The col is derived from GHOST_ANIMATION_MAP['SOUTH'][0], which is 2.
    // X: 200 + (2 * SOURCE_GHOST_SIZE) + PALETTE_PADDING_X = 200 + 34 + 1 = 235
    // Y: 268 + PALETTE_PADDING_Y = 268 + 1 = 269
    const expectedX = GHOST_OFFSETS.EYES!.x + (GHOST_ANIMATION_MAP['SOUTH'][0] * SOURCE_GHOST_SIZE) + PALETTE_PADDING_X;
    const expectedY = GHOST_OFFSETS.EYES!.y + PALETTE_PADDING_Y;
    const coords = getGhostSpriteSource('red', 'SOUTH', false, 0, true);
    expect(coords).toEqual({ x: expectedX, y: expectedY, width: 16, height: 16, flipX: false, flipY: false });
  });
});
