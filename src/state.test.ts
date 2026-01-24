import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameState } from './state.js';
import { Grid } from './grid.js';
import { EntityType } from './types.js';
import { PACMAN_SPEED, POWER_UP_DURATION, GHOST_EATEN_SCORE, POWER_PELLET_SCORE, COLLISION_THRESHOLD } from './config.js';

// New template for power pellet tests
const powerPelletTemplate = `
#######
#P   G#
#o    #
#######
  `.trim();

describe('GameState', () => {
  let grid: Grid;
  const template = `
#####
#P.G#
#o..#
#####
  `.trim();

  const deltaTimeForOneTile = 1 / PACMAN_SPEED;
  const deltaTimeForHalfTile = 0.5 / PACMAN_SPEED;

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

  it('should initialize entities from grid spawns', () => {
    const state = new GameState(grid);
    const entities = state.getEntities();

    expect(entities).toHaveLength(2);

    const pacman = entities.find(e => e.type === EntityType.Pacman);
    expect(pacman).toBeDefined();
    expect(pacman?.x).toBe(1);
    expect(pacman?.y).toBe(1);

    const ghost = entities.find(e => e.type === EntityType.Ghost);
    expect(ghost).toBeDefined();
    expect(ghost?.x).toBe(3);
    expect(ghost?.y).toBe(1);
  });

  it('should count initial pellets correctly', () => {
    const state = new GameState(grid);
    // 1 pellet at (2,1), 2 pellets at (2,2) and (3,2). Total 3 pellets.
    // Plus 1 power pellet at (1,2). Total 4.
    expect(state.getRemainingPellets()).toBe(4);
  });

  it('should initialize score to 0', () => {
    const state = new GameState(grid);
    expect(state.getScore()).toBe(0);
  });

  it('should update score and pellet count when consuming a pellet', () => {
    const state = new GameState(grid);

    state.consumePellet(2, 1);
    expect(state.getRemainingPellets()).toBe(3);
    expect(state.getScore()).toBe(10);

    // Consuming empty space should do nothing
    state.consumePellet(1, 1);
    expect(state.getRemainingPellets()).toBe(3);
    expect(state.getScore()).toBe(10);
  });

  it('should update score and pellet count when consuming a power pellet', () => {
    const state = new GameState(grid);

    state.consumePellet(1, 2);
    expect(state.getRemainingPellets()).toBe(3);
    expect(state.getScore()).toBe(50);
  });

  it('should consume pellets when Pacman moves over them', () => {
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman);
    if (!pacman) throw new Error('Pacman not found');

    // Move Pacman to (2,1) which has a pellet
    state.updatePacman({ dx: 1, dy: 0 }, deltaTimeForOneTile);

    expect(pacman.x).toBe(2);
    expect(pacman.y).toBe(1);
    expect(state.getRemainingPellets()).toBe(3);
    expect(state.getScore()).toBe(10);
  });

  it('should not move Pacman into walls from standstill', () => {
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman);
    if (!pacman) throw new Error('Pacman not found');
    const initialX = pacman.x;
    const initialY = pacman.y;
    pacman.direction = undefined; // Ensure starting from standstill

    // Move Left (1,1) -> (0,1) is wall
    state.updatePacman({ dx: -1, dy: 0 }, deltaTimeForHalfTile);

    expect(pacman.x).toBe(initialX);
    expect(pacman.y).toBe(initialY);
    expect(pacman.direction).toEqual({ dx: 0, dy: 0 });
  });

  it('should update Pacman position based on direction and deltaTime', () => {
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman);
    if (!pacman) throw new Error('Pacman not found');
    const initialX = pacman.x;
    const initialY = pacman.y;

    // Move right (dx=1, dy=0) with deltaTimeForHalfTile.
    state.updatePacman({ dx: 1, dy: 0 }, deltaTimeForHalfTile);
    expect(pacman.x).toBeCloseTo(initialX + 0.5);
    expect(pacman.y).toBe(initialY);
  });

  it('should continue in current direction if requested direction is blocked or not aligned', () => {
    const customTemplate = `
#####
#P..#
###.#
#####
    `.trim();
    const customGrid = Grid.fromString(customTemplate);
    const state = new GameState(customGrid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman);
    if (!pacman) throw new Error('Pacman not found');

    // Initially at (1,1).
    // Set initial direction to Right
    state.updatePacman({ dx: 1, dy: 0 }, deltaTimeForOneTile);
    expect(pacman.x).toBe(2);
    expect(pacman.y).toBe(1);
    expect(pacman.direction).toEqual({ dx: 1, dy: 0 });

    // Now at (2,1). Above (2,0) is wall. Right (3,1) is empty.
    // Request Up { dx: 0, dy: -1 }.
    // It should be buffered, but for now we continue Right.
    state.updatePacman({ dx: 0, dy: -1 }, deltaTimeForOneTile);

    // Should not move Up (blocked), should continue moving in the current direction (Right).
    expect(pacman.x).toBe(3);
    expect(pacman.y).toBe(1);
    expect(pacman.direction).toEqual({ dx: 1, dy: 0 });
  });

  it('should buffer input and turn when alignment and walkability allow', () => {
    const customTemplate = `
#####
#P..#
###.#
#...#
#####
    `.trim();
    // (1,1) P -> (2,1) . -> (3,1) .
    // (3,2) is walkable.
    const customGrid = Grid.fromString(customTemplate);
    const state = new GameState(customGrid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman);
    if (!pacman) throw new Error('Pacman not found');

    // 1. Start moving Right.
    // Move small step to be misaligned: x=1.5
    state.updatePacman({ dx: 1, dy: 0 }, deltaTimeForHalfTile);
    expect(pacman.x).toBeCloseTo(1.5);
    expect(pacman.direction).toEqual({ dx: 1, dy: 0 });

    // 2. Request Down EARLY.
    // We are at 1.5. Center is 2.0. We are not aligned.
    // Down (1.5, 2) is not checked yet, but we check alignment first.
    state.updatePacman({ dx: 0, dy: 1 }, deltaTimeForHalfTile);

    // Should continue Right because we haven't reached the turn (x=2) yet.
    // x becomes 2.0.
    expect(pacman.x).toBeCloseTo(2.0);
    expect(pacman.y).toBe(1);
    expect(pacman.direction).toEqual({ dx: 1, dy: 0 });

    // Request Down again (simulating holding key or just buffering persisting).
    state.updatePacman({ dx: 0, dy: 0 }, deltaTimeForOneTile);

    // Should continue Right to (3,1).
    expect(pacman.x).toBe(3.0);
    expect(pacman.y).toBe(1);
    expect(pacman.direction).toEqual({ dx: 1, dy: 0 });

    // 4. Now at (3,1). Down is (3,2) which is Walkable.
    // The buffered input was "Down". It was checked at (2,1) (failed-wall).
    // It should still be buffered? Yes, until consumed or replaced.
    // Now at (3,1).
    state.updatePacman({ dx: 0, dy: 0 }, deltaTimeForOneTile);

    expect(pacman.x).toBe(3);
    expect(pacman.y).toBe(2);
    expect(pacman.direction).toEqual({ dx: 0, dy: 1 });
  });

  it('should allow immediate reversal of direction', () => {
    const customTemplate = `
#####
#P..#
#####
    `.trim();
    const customGrid = Grid.fromString(customTemplate);
    const state = new GameState(customGrid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;

    // 1. Move Right to 1.5
    state.updatePacman({ dx: 1, dy: 0 }, deltaTimeForHalfTile);
    expect(pacman.x).toBeCloseTo(1.5);
    expect(pacman.direction).toEqual({ dx: 1, dy: 0 });

    // 2. Request Left. Should turn IMMEDIATELY even if not aligned.
    state.updatePacman({ dx: -1, dy: 0 }, deltaTimeForHalfTile);

    // Should be at 1.0 (1.5 - 0.5) and still moving left (hasn't hit wall at x=0 yet)
    expect(pacman.x).toBeCloseTo(1.0);
    expect(pacman.direction).toEqual({ dx: -1, dy: 0 });
  });

  it('should stop and clear direction when hitting a wall', () => {
    const customTemplate = `
#####
#P..#
#####
    `.trim();
    const customGrid = Grid.fromString(customTemplate);
    const state = new GameState(customGrid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman);
    if (!pacman) throw new Error('Pacman not found');

    // 1. Move Right to (2,1)
    state.updatePacman({ dx: 1, dy: 0 }, deltaTimeForOneTile);
    expect(pacman.x).toBe(2);

    // 2. Move Right to (3,1) - just before wall at (4,1)
    state.updatePacman({ dx: 1, dy: 0 }, deltaTimeForOneTile);
    expect(pacman.x).toBe(3);

    // 3. Move Right again. (4,1) is wall.
    state.updatePacman({ dx: 1, dy: 0 }, deltaTimeForOneTile);

    // After attempting to move right from x=3, Pacman should remain at x=3 because x=4 is a wall.
    expect(pacman.x).toBe(3);
    expect(pacman.direction?.dx).toBe(0); // Should be stopped
  });

  it('should not bounce when hitting a wall with small incremental movements (Issue #48)', () => {
    // This test verifies the fix for issue #48: when Pacman hits a wall,
    // it should stop at the center of the grid tile, not go beyond and bounce back
    const customTemplate = `
#####
#P..#
#####
    `.trim();
    const customGrid = Grid.fromString(customTemplate);
    const state = new GameState(customGrid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman);
    if (!pacman) throw new Error('Pacman not found');

    // Move Pacman to (3,1) - the last valid tile before wall at (4,1)
    state.updatePacman({ dx: 1, dy: 0 }, deltaTimeForOneTile);
    state.updatePacman({ dx: 1, dy: 0 }, deltaTimeForOneTile);
    expect(pacman.x).toBe(3);

    // Now try to move with small increments towards the wall
    // Pacman should never go beyond 3.0 (the tile center)
    for (let i = 0; i < 10; i++) {
      state.updatePacman({ dx: 1, dy: 0 }, deltaTimeForHalfTile);
      // Pacman should be stopped at exactly 3, never going past
      expect(pacman.x).toBe(3);
    }

    // Verify direction is cleared (stopped)
    expect(pacman.direction?.dx).toBe(0);
    expect(pacman.direction?.dy).toBe(0);
  });

  describe('Power-up mechanics', () => {
    let powerGrid: Grid;
    const powerPelletX = 1;
    const powerPelletY = 2; // 'o' in the powerPelletTemplate

    beforeEach(() => {
      powerGrid = Grid.fromString(powerPelletTemplate);
      vi.stubGlobal('localStorage', {
        getItem: vi.fn(),
        setItem: vi.fn(),
        clear: vi.fn(),
      });
    });

    it('should make ghosts scared when Pacman consumes a power pellet', () => {
      const state = new GameState(powerGrid);
      const pacman = state.getEntities().find(e => e.type === EntityType.Pacman);
      const ghost = state.getEntities().find(e => e.type === EntityType.Ghost);

      expect(pacman).toBeDefined();
      expect(ghost).toBeDefined();
      expect(ghost?.isScared).toBeFalsy(); // Ghost should not be scared initially

      // Move Pacman to consume the power pellet
      // Pacman starts at (1,1). Power pellet is at (1,2)
      // We need to move Pacman down to (1,2)
      state.updatePacman({ dx: 0, dy: 1 }, deltaTimeForOneTile);

      expect(pacman?.x).toBe(powerPelletX);
      expect(pacman?.y).toBe(powerPelletY);
      expect(state.isPelletEaten(powerPelletX, powerPelletY)).toBe(true);
      expect(state.getScore()).toBe(50); // Power pellet score

      // Expect ghost to be scared
      expect(ghost?.isScared).toBe(true);
    });

    it('should have a power-up timer that decrements and eventually unscares ghosts', () => {
      const state = new GameState(powerGrid);
      const ghost = state.getEntities().find(e => e.type === EntityType.Ghost);

      // Consume power pellet to activate scared state
      state.updatePacman({ dx: 0, dy: 1 }, deltaTimeForOneTile);
      expect(ghost?.isScared).toBe(true);

      // Advance time by less than POWER_UP_DURATION
      state.updateGhosts(POWER_UP_DURATION / 2);
      expect(ghost?.isScared).toBe(true);

      // Advance time by remaining duration to exceed POWER_UP_DURATION
      state.updateGhosts(POWER_UP_DURATION / 2 + 1); // +1 to ensure it goes past
      expect(ghost?.isScared).toBeFalsy(); // Ghost should no longer be scared
    });

    it('should set ghost to dead state and award points when eaten, without losing a life', () => {
      const state = new GameState(powerGrid);
      const pacman = state.getEntities().find(e => e.type === EntityType.Pacman);
      const ghost = state.getEntities().find(e => e.type === EntityType.Ghost);

      if (!pacman || !ghost) throw new Error('Entities not found');

      const initialLives = state.getLives();

      // 1. Move Pacman to consume power pellet (making ghost scared)
      state.updatePacman({ dx: 0, dy: 1 }, deltaTimeForOneTile);
      expect(ghost.isScared).toBe(true);

      // 2. Position Pacman and ghost for collision
      // Manually set positions for collision for test clarity
      pacman.x = 2;
      pacman.y = 1;
      ghost.x = 2.1;
      ghost.y = 1;

      // Update Pacman to trigger collision check. Use a minimal delta time.
      state.updatePacman({ dx: 0, dy: 0 }, 1); 
 
      // Expect ghost to NOT be reset to initial position immediately
      expect(ghost.x).toBeCloseTo(2.1);
      // Expect ghost to be dead
      expect(ghost.isDead).toBe(true);
      // Expect ghost to no longer be scared
      expect(ghost.isScared).toBeFalsy();
      // Expect score to increase by GHOST_EATEN_SCORE (plus power pellet score)
      expect(state.getScore()).toBe(POWER_PELLET_SCORE + GHOST_EATEN_SCORE);
            // Expect lives to remain unchanged
            expect(state.getLives()).toBe(initialLives);
          });
      
    it('should move dead ghost towards its spawn and respawn when it reaches it', () => {
      const state = new GameState(powerGrid);
      const ghost = state.getEntities().find(e => e.type === EntityType.Ghost);
      if (!ghost) throw new Error('Ghost not found');

      const initialGhostX = ghost.x;
      const initialGhostY = ghost.y;

      // 1. Kill the ghost
      ghost.isDead = true;
      ghost.isScared = false;
      // Put it somewhere else
      ghost.x = 2;
      ghost.y = 1;

      // 2. Update ghosts. It should move towards (initialGhostX, initialGhostY)
      // Since it's dead, it should move faster (GHOST_SPEED * 1.5)
      // G is at (5, 1). P is at (1, 1). o is at (1, 2).
      
      // Dynamically retrieve initial position to avoid brittleness with map changes
      const actualInitialPos = (state as unknown as { initialPositions: Map<Entity, { x: number, y: number }> }).initialPositions.get(ghost);
      if (!actualInitialPos) throw new Error('Initial position not found');
      expect(initialGhostX).toBe(actualInitialPos.x);
      expect(initialGhostY).toBe(actualInitialPos.y);

      // Move from (2, 1) towards (initialGhostX, initialGhostY). dx should be 1.
      state.updateGhosts(100); // delta time in ms
      
      expect(ghost.direction?.dx).toBeGreaterThan(0);
      expect(ghost.x).toBeGreaterThan(2);
      expect(ghost.isDead).toBe(true);

      // 3. Teleport ghost near spawn and move it to spawn
      // Using a small offset from initial position to be within COLLISION_THRESHOLD
      ghost.x = initialGhostX - COLLISION_THRESHOLD / 2;
      ghost.y = initialGhostY;
      ghost.direction = { dx: 1, dy: 0 };
      
      // Update with enough time to reach/pass the initial position
      state.updateGhosts(100);

      // It should be at the initial position or very close and NOT dead anymore
      expect(ghost.x).toBeCloseTo(initialGhostX);
      expect(ghost.isDead).toBeFalsy();
    });
        });
      });
      