import { describe, it, expect } from 'vitest';
import { GameState } from './game-state.js';
import { Grid } from './grid.js';
import { EntityType, TileType } from './types.js';

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

    // Initial counts based on template
    // . at (3,1) and (3,3)
    // o at (1,3)
    expect(gameState.getPelletCount()).toBe(2);
    expect(gameState.getPowerPelletCount()).toBe(1);
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
    expect(gameState.getScore()).toBe(10); // Assume 10 points for pellet
  });

  it('should consume power pellets and update score', () => {
    const grid = Grid.fromString(template);
    const gameState = new GameState(grid);

    // Template has power pellet at (1,3)
    gameState.movePacman(1, 3);
    expect(gameState.getPowerPelletCount()).toBe(0);
    expect(gameState.getScore()).toBe(50); // Assume 50 points for power pellet
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

  it('should delegate grid checks to the underlying grid', () => {
    const grid = Grid.fromString(template);
    const gameState = new GameState(grid);

    expect(gameState.getWidth()).toBe(grid.getWidth());
    expect(gameState.getHeight()).toBe(grid.getHeight());
    expect(gameState.isOutOfBounds(-1, 0)).toBe(true);
    expect(gameState.isWalkable(0, 0)).toBe(false); // Wall
    expect(gameState.isWalkable(1, 1)).toBe(true); // Empty
  });
});
