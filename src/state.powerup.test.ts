import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GameState } from './state.js';
import { Grid } from './grid.js';
import { EntityType } from './types.js';
import { POWER_UP_DURATION, GHOST_EATEN_SCORE, GHOST_SPEED, SCARED_GHOST_SPEED_MULTIPLIER } from './config.js';

describe('GameState Power Up Mechanics', () => {
  let gameState: GameState;
  let grid: Grid;

  beforeEach(() => {
     vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
    });

    // Simple map:
    // P = Pacman, G = Ghost, o = PowerPellet
    // #######
    // #P G o#
    // #######
    const layout = `
#######
#P G o#
#######
`.trim();
    grid = Grid.fromString(layout);
    gameState = new GameState(grid);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('eating a power pellet puts ghosts in scared state', () => {
    const ghosts = gameState.getEntities().filter(e => e.type === EntityType.Ghost);
    expect(ghosts.length).toBeGreaterThan(0);
    expect(ghosts[0]!.isScared).toBeFalsy();

    // Consume power pellet at (5, 1)
    gameState.consumePellet(5, 1);

    expect(ghosts[0]!.isScared).toBe(true);
  });

  it('scared ghosts revert to normal after timer expires', () => {
    gameState.consumePellet(5, 1);
    const ghosts = gameState.getEntities().filter(e => e.type === EntityType.Ghost);
    expect(ghosts[0]!.isScared).toBe(true);

    // Update with time less than duration
    gameState.updateGhosts(POWER_UP_DURATION - 100);
    expect(ghosts[0]!.isScared).toBe(true);

    // Update with remaining time
    gameState.updateGhosts(200);
    expect(ghosts[0]!.isScared).toBe(false);
  });

  it('eating a scared ghost awards points and resets ghost', () => {
    gameState.consumePellet(5, 1);
    const ghosts = gameState.getEntities().filter(e => e.type === EntityType.Ghost);
    const pacman = gameState.getEntities().find(e => e.type === EntityType.Pacman)!;
    const ghost = ghosts[0]!;
    
    // Check initial score
    const initialScore = gameState.getScore();
    
    // Move Pacman to Ghost's position (collision)
    // Pacman is at (1,1), Ghost is at (3,1)
    pacman.x = ghost.x;
    pacman.y = ghost.y;
    
    // Force update to trigger collision check
    gameState.updatePacman({ dx: 1, dy: 0 }, 10);
    
    // Score should increase by GHOST_EATEN_SCORE
    expect(gameState.getScore()).toBe(initialScore + GHOST_EATEN_SCORE);
    
    // Ghost should be reset (no longer scared)
    expect(ghost.isScared).toBe(false);
    
    // Ghost should be back at spawn (3,1)
    expect(ghost.x).toBe(3);
    expect(ghost.y).toBe(1);

    // Lives should NOT be lost
    expect(gameState.getLives()).toBe(2);
  });

  it('collision with non-scared ghost loses life', () => {
    const pacman = gameState.getEntities().find(e => e.type === EntityType.Pacman)!;
    const ghost = gameState.getEntities().find(e => e.type === EntityType.Ghost)!;
    
    // Ensure ghost is not scared
    expect(ghost.isScared).toBeFalsy();
    
    pacman.x = ghost.x;
    pacman.y = ghost.y;
    
    const initialLives = gameState.getLives();
    
    gameState.updatePacman({ dx: 1, dy: 0 }, 10);
    
    // Now it should be dying
    expect(gameState.isDying()).toBe(true);
    expect(gameState.getLives()).toBe(initialLives); // Life not lost yet

    // Advance time to finish animation (100ms * 12 frames = 1200ms)
    gameState.updatePacman({ dx: 0, dy: 0 }, 1200);
    
    expect(gameState.getLives()).toBe(initialLives - 1);
    expect(gameState.isDying()).toBe(false);
  });
  
  it('scared ghosts move slower', () => {
     // This is a bit tricky to test via GameState because updateGhosts does the movement internally
     // We can mock the moveEntity or check position change
     
     // Let's create a scenario where ghost moves in a straight line
     const layout = `
#######
# G...#
#######
`.trim();
    grid = Grid.fromString(layout);
    gameState = new GameState(grid);
    const ghost = gameState.getEntities().find(e => e.type === EntityType.Ghost)!;
    
    // Set direction manually
    ghost.direction = { dx: 1, dy: 0 };
    const startX = ghost.x;
    
    // 1. Normal speed
    const dt = 100; // Small enough to not hit wall (0.4 tiles)
    gameState.updateGhosts(dt);
    const movedDistNormal = ghost.x - startX;
    
    expect(movedDistNormal).toBeCloseTo(GHOST_SPEED * dt);
    
    // Reset
    ghost.x = startX;
    ghost.isScared = true;
    
    // 2. Scared speed
    gameState.updateGhosts(dt);
    const movedDistScared = ghost.x - startX;
    
    expect(movedDistScared).toBeCloseTo(GHOST_SPEED * SCARED_GHOST_SPEED_MULTIPLIER * dt);
  });
});
