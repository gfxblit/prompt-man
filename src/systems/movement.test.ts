import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameState } from './state.js';
import { Grid } from '../utils/grid.js';
import { EntityType } from '../core/types.js';
import { PACMAN_SPEED } from '../constants/config.js';

// Mock configuration to disable the "Ready" state delay for these tests. This allows tests to focus on core logic without waiting for the initial pause.
vi.mock('../constants/config.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../constants/config.js')>();
  return {
    ...mod,
    READY_DURATION: 0,
  };
});

describe('Movement - Wrapping', () => {
  const horizontalTemplate = `
#####
 P.. 
#####
  `.trim();

  const verticalTemplate = `
#P#
#.#
#.#
#.#
#.#
  `.trim();

  const deltaTimeForOneTile = 1 / PACMAN_SPEED;

  const setup = (template: string) => {
    const grid = Grid.fromString(template);
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman);
    if (!pacman) {
      throw new Error('Pacman entity not found in test template');
    }
    return { state, pacman };
  };

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

  it('should wrap around from right edge to left edge', () => {
    const { state, pacman } = setup(horizontalTemplate);
    
    // Move Pacman to the right edge (4,1)
    pacman.x = 4;
    pacman.y = 1;
    expect(pacman.x).toBe(4);
    
    // Now move Right again. Should wrap to (0,1).
    state.updatePacman({ dx: 1, dy: 0 }, deltaTimeForOneTile);
    
    expect(pacman.x).toBe(0);
    expect(pacman.y).toBe(1);
  });

  it('should wrap around from left edge to right edge', () => {
    const { state, pacman } = setup(horizontalTemplate);
    
    // Move Pacman to the left edge (0,1)
    pacman.x = 0;
    pacman.y = 1;
    expect(pacman.x).toBe(0);
    
    // Now move Left again. Should wrap to (4,1).
    state.updatePacman({ dx: -1, dy: 0 }, deltaTimeForOneTile);
    
    expect(pacman.x).toBe(4);
    expect(pacman.y).toBe(1);
  });

  it('should wrap around from bottom edge to top edge', () => {
    const { state, pacman } = setup(verticalTemplate);
    
    // Move Pacman to the bottom edge (1,4)
    pacman.x = 1;
    pacman.y = 4;
    expect(pacman.y).toBe(4);
    
    // Now move Down again. Should wrap to (1,0).
    state.updatePacman({ dx: 0, dy: 1 }, deltaTimeForOneTile);
    
    expect(pacman.x).toBe(1);
    expect(pacman.y).toBe(0);
  });

  it('should wrap around from top edge to bottom edge', () => {
    const { state, pacman } = setup(verticalTemplate);
    
    // P starts at (1,0)
    expect(pacman.y).toBe(0);
    
    // Now move Up. Should wrap to (1,4).
    state.updatePacman({ dx: 0, dy: -1 }, deltaTimeForOneTile);
    
    expect(pacman.x).toBe(1);
    expect(pacman.y).toBe(4);
  });

  it('should not wrap around if the destination is a wall', () => {
    // Case 1: Wrap Left from 0 to 4, where 4 is a wall.
    const blockedLeftTemplate = `
.P..#
#####
#####
    `.trim();
    const { state: stateL, pacman: pacmanL } = setup(blockedLeftTemplate);
    pacmanL.x = 0;
    stateL.updatePacman({ dx: -1, dy: 0 }, deltaTimeForOneTile);
    expect(pacmanL.x).toBe(0);
    
    // Case 2: Wrap Right from 4 to 0, where 0 is a wall.
    const blockedRightTemplate = `
#..P.
#####
#####
    `.trim();
    const { state: stateR, pacman: pacmanR } = setup(blockedRightTemplate);
    pacmanR.x = 4;
    stateR.updatePacman({ dx: 1, dy: 0 }, deltaTimeForOneTile);
    expect(pacmanR.x).toBe(4);
  });
});