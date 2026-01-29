import { describe, it, expect } from 'vitest';
import { getHudFruits } from './hud-fruits.js';
import { FruitType } from './types.js';

describe('getHudFruits', () => {
  it('returns Cherry for Level 1', () => {
    expect(getHudFruits(1)).toEqual([FruitType.Cherry]);
  });

  it('returns Cherry, Strawberry for Level 2', () => {
    expect(getHudFruits(2)).toEqual([FruitType.Cherry, FruitType.Strawberry]);
  });

  it('returns Cherry, Strawberry, Peach for Level 3', () => {
    expect(getHudFruits(3)).toEqual([FruitType.Cherry, FruitType.Strawberry, FruitType.Peach]);
  });

  it('returns 7 fruits for Level 7', () => {
    expect(getHudFruits(7)).toEqual([
      FruitType.Cherry,
      FruitType.Strawberry,
      FruitType.Peach,
      FruitType.Peach,
      FruitType.Apple,
      FruitType.Apple,
      FruitType.Grapes
    ]);
  });

  it('returns most recent 7 fruits for Level 8 (shifts out Cherry)', () => {
    expect(getHudFruits(8)).toEqual([
      FruitType.Strawberry,
      FruitType.Peach,
      FruitType.Peach,
      FruitType.Apple,
      FruitType.Apple,
      FruitType.Grapes,
      FruitType.Grapes
    ]);
  });

  it('returns correct fruits for Level 13 (Key)', () => {
     // Level sequence:
     // 1: Cherry
     // 2: Strawberry
     // 3: Peach
     // 4: Peach
     // 5: Apple
     // 6: Apple
     // 7: Grapes
     // 8: Grapes
     // 9: Galaxian
     // 10: Galaxian
     // 11: Bell
     // 12: Bell
     // 13: Key
     
     // Expected for Level 13 (last 7):
     // 7: Grapes
     // 8: Grapes
     // 9: Galaxian
     // 10: Galaxian
     // 11: Bell
     // 12: Bell
     // 13: Key
    expect(getHudFruits(13)).toEqual([
      FruitType.Grapes,
      FruitType.Grapes,
      FruitType.Galaxian,
      FruitType.Galaxian,
      FruitType.Bell,
      FruitType.Bell,
      FruitType.Key
    ]);
  });
  
  it('handles high levels correctly (all Keys eventually)', () => {
      // At level 20, it should be mostly keys?
      // 13+: Key
      // So 14: Key, 15: Key...
      // Level 19 (7 levels back -> 13..19) -> All Keys
      expect(getHudFruits(19)).toEqual([
          FruitType.Key,
          FruitType.Key,
          FruitType.Key,
          FruitType.Key,
          FruitType.Key,
          FruitType.Key,
          FruitType.Key
      ]);
  });
});
