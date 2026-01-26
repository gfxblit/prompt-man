import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameState } from './state.js';
import { Grid } from '../utils/grid.js';
import { EntityType } from '../core/types.js';
import { PACMAN_SPEED } from '../constants/config.js';

describe('GameState - Intro Sequence', () => {
  let grid: Grid;
  const template = `
#####
#P.G#
#o..#
#####
  `.trim();
  const deltaTimeForOneTile = 1 / PACMAN_SPEED;

  beforeEach(() => {
    grid = Grid.fromString(template);
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should not be started initially', () => {
    const state = new GameState(grid, undefined, false);
    // @ts-expect-error - accessing private property for testing
    expect(state.started).toBe(false);
  });

  it('should not decrement readyTimer when not started', () => {
    const state = new GameState(grid, undefined, false);
    const stateInternal = state as unknown as { readyTimer: number };
    const initialTimer = stateInternal.readyTimer;
    
    state.updatePacman({ dx: 0, dy: 0 }, 1000);
    
    expect(stateInternal.readyTimer).toBe(initialTimer);
    expect(state.isReady()).toBe(true);
  });

  it('should block all movement when not started', () => {
    const state = new GameState(grid, undefined, false);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;
    
    const initialPX = pacman.x;
    const initialGX = ghost.x;
    
    state.updatePacman({ dx: 1, dy: 0 }, deltaTimeForOneTile);
    state.updateGhosts(deltaTimeForOneTile);
    
    expect(pacman.x).toBe(initialPX);
    expect(ghost.x).toBe(initialGX);
  });

  it('should start and set custom ready duration when startReady is called', () => {
    const state = new GameState(grid, undefined, false);
    const customDuration = 5000;
    
    state.startReady(customDuration);
    
    // @ts-expect-error - accessing private started property for testing
    expect(state.started).toBe(true);
    expect(state.isReady()).toBe(true);
    expect((state as unknown as { readyTimer: number }).readyTimer).toBe(customDuration);
  });

  it('should allow readyTimer to count down after started', () => {
    const state = new GameState(grid, undefined, false);
    const customDuration = 5000;
    
    state.startReady(customDuration);
    state.updatePacman({ dx: 0, dy: 0 }, 1000);
    
    expect((state as unknown as { readyTimer: number }).readyTimer).toBe(4000);
    expect(state.isReady()).toBe(true);
    
    state.updatePacman({ dx: 0, dy: 0 }, 4000);
    expect(state.isReady()).toBe(false);
  });
});
