
import { describe, it, expect } from 'vitest';
import { FRUIT_OFFSETS } from './config.js';
import { FruitType } from './types.js';

describe('Fruit Offsets', () => {
  it('should define FRUIT_OFFSETS', () => {
    expect(FRUIT_OFFSETS).toBeDefined();
  });

  it('should have offsets for all fruit types', () => {
    for (const type of Object.values(FruitType)) {
      expect(FRUIT_OFFSETS).toHaveProperty(type);
      const offset = FRUIT_OFFSETS[type as keyof typeof FRUIT_OFFSETS];
      expect(offset).toHaveProperty('x');
      expect(offset).toHaveProperty('y');
      expect(typeof offset.x).toBe('number');
      expect(typeof offset.y).toBe('number');
    }
  });
});
