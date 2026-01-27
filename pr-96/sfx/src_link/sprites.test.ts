import { describe, it, expect } from 'vitest';
import { getGhostSpriteSource } from './sprites.js';
import { GHOST_OFFSETS, SOURCE_GHOST_SIZE, PALETTE_PADDING_X } from './config.js';

describe('getGhostSpriteSource', () => {
  it('returns normal ghost sprite coordinates', () => {
    const source = getGhostSpriteSource('red', 'EAST', false, 0);
    const expectedX = GHOST_OFFSETS.RED!.x + (0 * SOURCE_GHOST_SIZE) + PALETTE_PADDING_X;
    expect(source.x).toBe(expectedX);
  });

  it('returns scared ghost sprite coordinates', () => {
    const source = getGhostSpriteSource('red', 'EAST', true, 0);
    const expectedX = GHOST_OFFSETS.SCARED!.x + (0 * SOURCE_GHOST_SIZE) + PALETTE_PADDING_X;
    expect(source.x).toBe(expectedX);
  });

  it('returns scared flashing ghost sprite coordinates', () => {
    const source = getGhostSpriteSource('red', 'EAST', true, 0, false, true);
    const expectedX = GHOST_OFFSETS.SCARED_FLASH!.x + (0 * SOURCE_GHOST_SIZE) + PALETTE_PADDING_X;
    expect(source.x).toBe(expectedX);
  });
});
