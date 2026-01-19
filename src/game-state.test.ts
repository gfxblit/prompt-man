import { describe, it, expect } from 'vitest';
import { GameState } from './game-state.js';
import { Grid } from './grid.js';
import { TileType } from './types.js';
import { PELLET_SCORE, POWER_PELLET_SCORE } from './config.js';

describe('GameState', () => {
  const template = `
#####
#P .#
# G #
#o .#
#####
  `.trim();

  it('should initialize from a grid template', () => {
    const grid = Grid.fromString(template);
    const gameState = new GameState(grid);

    expect(gameState.getPacman().x).toBe(1);
    expect(gameState.getPacman().y).toBe(1);
    expect(gameState.getGhosts()).toHaveLength(1);
    expect(gameState.getGhosts()[0].x).toBe(2);
    expect(gameState.getGhosts()[0].y).toBe(2);
    expect(gameState.getScore()).toBe(0);
  });

  it('should track pellets and power pellets', () => {
    const grid = Grid.fromString(template);
    const gameState = new GameState(grid);

    const expectedPellets = grid.findTiles(TileType.Pellet).length;
    const expectedPowerPellets = grid.findTiles(TileType.PowerPellet).length;

    expect(gameState.getPelletCount()).toBe(expectedPellets);
    expect(gameState.getPowerPelletCount()).toBe(expectedPowerPellets);
  });

  it('should update Pacman position', () => {
    const grid = Grid.fromString(template);
    const gameState = new GameState(grid);

    gameState.movePacman(2, 1);
    expect(gameState.getPacman().x).toBe(2);
    expect(gameState.getPacman().y).toBe(1);
  });

  it('should consume pellets and update score', () => {
    const grid = Grid.fromString(template);
    const gameState = new GameState(grid);

    // Template has pellet at (3,1)
    gameState.movePacman(3, 1);
    expect(gameState.getPelletCount()).toBe(1);
    expect(gameState.getScore()).toBe(PELLET_SCORE);
  });

  it('should consume power pellets and update score', () => {
    const grid = Grid.fromString(template);
    const gameState = new GameState(grid);

    // Template has power pellet at (1,3)
    gameState.movePacman(1, 3);
    expect(gameState.getPowerPelletCount()).toBe(0);
    expect(gameState.getScore()).toBe(POWER_PELLET_SCORE);
  });

  it('should return the correct tile type, reflecting consumed pellets', () => {
    const grid = Grid.fromString(template);
    const gameState = new GameState(grid);

    // Initial state
    expect(gameState.getTile(3, 1)).toBe(TileType.Pellet);
    expect(gameState.getTile(1, 3)).toBe(TileType.PowerPellet);
    expect(gameState.getTile(1, 1)).toBe(TileType.PacmanSpawn);

    // Consume pellet
    gameState.movePacman(3, 1);
    expect(gameState.getTile(3, 1)).toBe(TileType.Empty);

    // Consume power pellet
    gameState.movePacman(1, 3);
    expect(gameState.getTile(1, 3)).toBe(TileType.Empty);
  });

  it('should move ghosts', () => {
    const grid = Grid.fromString(template);
    const gameState = new GameState(grid);

    gameState.moveGhost(0, 3, 2);
    expect(gameState.getGhosts()[0].x).toBe(3);
    expect(gameState.getGhosts()[0].y).toBe(2);
  });

  it('should not throw when moving non-existent ghost', () => {
    const grid = Grid.fromString(template);
    const gameState = new GameState(grid);

    const initialGhost = { ...gameState.getGhosts()[0] };
    gameState.moveGhost(99, 10, 10);
    expect(gameState.getGhosts()).toHaveLength(1);
    expect(gameState.getGhosts()[0].x).toBe(initialGhost.x);
    expect(gameState.getGhosts()[0].y).toBe(initialGhost.y);
  });

  it('should return undefined for out of bounds tile', () => {
    const grid = Grid.fromString(template);
    const gameState = new GameState(grid);

    expect(gameState.getTile(-1, 0)).toBeUndefined();
    expect(gameState.getTile(99, 99)).toBeUndefined();
  });

  it('should delegate grid checks to the underlying grid', () => {
    const grid = Grid.fromString(template);
    const gameState = new GameState(grid);

    expect(gameState.getWidth()).toBe(grid.getWidth());
    expect(gameState.getHeight()).toBe(grid.getHeight());
    expect(gameState.isOutOfBounds(-1, 0)).toBe(true);
    expect(gameState.isWalkable(0, 0)).toBe(false); // Wall
    expect(gameState.isWalkable(1, 1)).toBe(true); // Empty
  });

  it('should reflect consumed pellets in findTiles(TileType.Empty)', () => {
    const grid = Grid.fromString(`
P .
    `.trim());
    const gameState = new GameState(grid);
    
    // Initially, there is one Empty tile at (1,0)
    expect(gameState.findTiles(TileType.Empty)).toEqual([{ x: 1, y: 0 }]);
    
    // Consume pellet at (2,0)
    gameState.movePacman(2, 0);
    
    const emptyTiles = gameState.findTiles(TileType.Empty);
    expect(emptyTiles).toContainEqual({ x: 1, y: 0 });
    expect(emptyTiles).toContainEqual({ x: 2, y: 0 });
    expect(emptyTiles.length).toBe(2);
  });
});
