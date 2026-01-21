import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameState } from './state.js';
import { Grid } from './grid.js';
import { PELLET_SCORE } from './config.js';

describe('GameState - High Score', () => {
  let grid: Grid;
  const template = `
#####
#P.G#
#o..#
#####
  `.trim();

  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      clear: () => {
        store = {};
      },
      removeItem: (key: string) => {
        delete store[key];
      }
    };
  })();

  beforeEach(() => {
    grid = Grid.fromString(template);
    vi.stubGlobal('localStorage', localStorageMock);
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should initialize high score to 0 if not present in localStorage', () => {
    const state = new GameState(grid);
    expect(state.getHighScore()).toBe(0);
  });

  it('should load high score from localStorage', () => {
    localStorage.setItem('prompt-man-high-score', '1000');
    const state = new GameState(grid);
    expect(state.getHighScore()).toBe(1000);
  });

  it('should update high score when current score exceeds it', () => {
    const state = new GameState(grid);
    
    // Initial high score is 0.
    // Eating a pellet gives 10 points (PELLET_SCORE).
    state.consumePellet(2, 1);
    
    expect(state.getHighScore()).toBe(PELLET_SCORE);
  });

  it('should save high score to localStorage when updated', () => {
    const state = new GameState(grid);
    const setItemSpy = vi.spyOn(localStorage, 'setItem');
    
    state.consumePellet(2, 1);
    
    expect(setItemSpy).toHaveBeenCalledWith('prompt-man-high-score', String(PELLET_SCORE));
    expect(localStorage.getItem('prompt-man-high-score')).toBe(String(PELLET_SCORE));
  });

  it('should not update high score if current score is lower', () => {
    localStorage.setItem('prompt-man-high-score', '1000');
    const state = new GameState(grid);
    
    state.consumePellet(2, 1); // Score becomes 10
    
    expect(state.getHighScore()).toBe(1000);
    expect(localStorage.getItem('prompt-man-high-score')).toBe('1000');
  });

  it('should default to 0 if high score in localStorage is invalid', () => {
    localStorage.setItem('prompt-man-high-score', 'invalid');
    const state = new GameState(grid);
    expect(state.getHighScore()).toBe(0);
  });
});
