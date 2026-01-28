import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from './state.js';
import { TileType, EntityType, FruitType } from './types.js';
import { Grid } from './grid.js';
import { LEVEL_TEMPLATE, FRUIT_SPAWN_THRESHOLDS, FRUIT_DURATION } from './config.js';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    clear: () => { store = {}; }
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('GameState Fruit Logic', () => {
  let grid: Grid;
  let state: GameState;

  beforeEach(() => {
    grid = Grid.fromString(LEVEL_TEMPLATE);
    state = new GameState(grid, undefined, true);
  });

  it('should not have a fruit initially', () => {
    expect(state.getFruit()).toBeNull();
  });

  it('should spawn a fruit after 70 pellets are eaten', () => {
    const pellets = grid.findTiles(TileType.Pellet);
    
    // Eat 69 pellets
    for (let i = 0; i < FRUIT_SPAWN_THRESHOLDS[0]! - 1; i++) {
      state.consumePellet(pellets[i]!.x, pellets[i]!.y);
    }
    expect(state.getFruit()).toBeNull();

    // Eat the 70th pellet
    state.consumePellet(pellets[FRUIT_SPAWN_THRESHOLDS[0]! - 1]!.x, pellets[FRUIT_SPAWN_THRESHOLDS[0]! - 1]!.y);
    
    const fruit = state.getFruit();
    expect(fruit).not.toBeNull();
    expect(fruit?.type).toBe(EntityType.Fruit);
    expect(fruit?.fruitType).toBe(FruitType.Cherry); // Level 1 is Cherry
  });

  it('should spawn a fruit after 170 pellets are eaten', () => {
    const pellets = grid.findTiles(TileType.Pellet);
    
    // Eat 170 pellets
    for (let i = 0; i < FRUIT_SPAWN_THRESHOLDS[1]!; i++) {
      state.consumePellet(pellets[i]!.x, pellets[i]!.y);
    }
    
    const fruit = state.getFruit();
    expect(fruit).not.toBeNull();
    expect(fruit?.type).toBe(EntityType.Fruit);
  });

  it('should despawn fruit after FRUIT_DURATION', () => {
    const pellets = grid.findTiles(TileType.Pellet);
    
    // Spawn fruit
    for (let i = 0; i < FRUIT_SPAWN_THRESHOLDS[0]!; i++) {
      state.consumePellet(pellets[i]!.x, pellets[i]!.y);
    }
    expect(state.getFruit()).not.toBeNull();

    // Skip ready timer
    state.updatePacman({ dx: 0, dy: 0 }, 2001);
    expect(state.isReady()).toBe(false);

    // Update with time less than FRUIT_DURATION
    state.updateGhosts(FRUIT_DURATION - 100);
    expect(state.getFruit()).not.toBeNull();

    // Update to exceed FRUIT_DURATION
    state.updateGhosts(200);
    expect(state.getFruit()).toBeNull();
  });

  it('should give correct points and despawn when eaten by Pacman', () => {
    const pellets = grid.findTiles(TileType.Pellet);
    
    // Spawn fruit (Cherry = 100 points)
    for (let i = 0; i < FRUIT_SPAWN_THRESHOLDS[0]!; i++) {
      state.consumePellet(pellets[i]!.x, pellets[i]!.y);
    }
    
    const initialScore = state.getScore();

    // Skip ready timer
    state.updatePacman({ dx: 0, dy: 0 }, 2001);

    // Move Pacman to fruit position
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
    pacman.x = 13.5;
    pacman.y = 17;
    
    state.updatePacman({ dx: 0, dy: 0 }, 16);
    
    expect(state.getFruit()).toBeNull();
    expect(state.getScore()).toBe(initialScore + 100);
  });
});
