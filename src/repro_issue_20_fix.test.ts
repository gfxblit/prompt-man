import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameState } from './state.js';
import { Grid } from './grid.js';

describe('GameState getWrappedCoordinate', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should handle max <= 0 gracefully', () => {
    const grid = Grid.fromString('');
    const state = new GameState(grid) as any;
    
    // Test with max = 0
    expect(state.getWrappedCoordinate(10, 0)).toBe(10);
    
    // Test with max = -1
    expect(state.getWrappedCoordinate(10, -1)).toBe(10);
    
    // Test with normal values to ensure it still works
    expect(state.getWrappedCoordinate(5, 3)).toBe(2);
    expect(state.getWrappedCoordinate(-1, 3)).toBe(2);
  });
});
