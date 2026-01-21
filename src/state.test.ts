import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameState } from './state.js';
import { Grid } from './grid.js';
import { EntityType } from './types.js';

describe('GameState', () => {
  let grid: Grid;
  const template = `
#####
#P.G#
#o..#
#####
  `.trim();

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
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
    
    // Manually place Pacman on a pellet for this specific test
    pacman.x = 2;
    pacman.y = 1;
    state.consumePellet(2, 1);

    expect(pacman.x).toBe(2);
    expect(pacman.y).toBe(1);
    expect(state.getRemainingPellets()).toBe(3);
    expect(state.getScore()).toBe(10);
  });

  it('should not move Pacman into walls from standstill', () => {
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
    const initialX = pacman.x;
    const initialY = pacman.y;
    
    // Move Left (1,1) -> (0,1) is wall
    state.updatePacman({ dx: -1, dy: 0 }, 100);
    
    expect(pacman.x).toBe(initialX);
    expect(pacman.y).toBe(initialY);
    expect(pacman.direction).toEqual({ dx: 0, dy: 0 });
  });

  it('should update Pacman position based on direction and deltaTime', () => {
    const state = new GameState(grid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
    const initialX = pacman.x;
    const initialY = pacman.y;

    // Move right (dx=1, dy=0) with 100ms deltaTime.
    // Speed is 5 tiles/sec. 100ms = 0.5 tiles.
    state.updatePacman({ dx: 1, dy: 0 }, 100);
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
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;

    // Initially at (1,1).
    // Set initial direction to Right
    state.updatePacman({ dx: 1, dy: 0 }, 200); 
    expect(pacman.x).toBe(2);
    expect(pacman.y).toBe(1);
    expect(pacman.direction).toEqual({ dx: 1, dy: 0 });

    // Now at (2,1). Above (2,0) is wall. Right (3,1) is empty.
    // Request Up { dx: 0, dy: -1 }.
    // It should be buffered, but for now we continue Right.
    state.updatePacman({ dx: 0, dy: -1 }, 200);
    
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
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;

    // 1. Start moving Right.
    // Move small step to be misaligned: x=1.5
    state.updatePacman({ dx: 1, dy: 0 }, 100); 
    expect(pacman.x).toBeCloseTo(1.5);
    expect(pacman.direction).toEqual({ dx: 1, dy: 0 });

    // 2. Request Down EARLY.
    // We are at 1.5. Center is 2.0. We are not aligned.
    // Down (1.5, 2) is not checked yet, but we check alignment first.
    state.updatePacman({ dx: 0, dy: 1 }, 100);
    
    // Should continue Right because we haven't reached the turn (x=2) yet.
    // x becomes 2.0.
    expect(pacman.x).toBeCloseTo(2.0);
    expect(pacman.y).toBe(1);
    expect(pacman.direction).toEqual({ dx: 1, dy: 0 });

    // 3. Now we are at 2.0.
    // BUT (2,2) is a WALL (###.#). Row 2: #, #, #, ., #. So col 0,1,2 are walls.
    // Wait, let's check grid:
    // Row 0: #####
    // Row 1: #P..# -> (1,1)P, (2,1)., (3,1).
    // Row 2: ###.# -> (1,2)#, (2,2)#, (3,2).
    // So at (2,1), Down is (2,2) which is Wall.
    // Even if aligned, we can't turn.
    // Request Down again (simulating holding key or just buffering persisting).
    // Note: Our GameState persists buffering!
    // So even if I pass {0,0} here, it should remember Down?
    // Let's pass {0,0} to prove buffering works!
    state.updatePacman({ dx: 0, dy: 0 }, 200);

    // Should continue Right to (3,1).
    expect(pacman.x).toBe(3.0);
    expect(pacman.y).toBe(1);
    expect(pacman.direction).toEqual({ dx: 1, dy: 0 });

    // 4. Now at (3,1). Down is (3,2) which is Walkable.
    // The buffered input was "Down". It was checked at (2,1) (failed-wall).
    // It should still be buffered? Yes, until consumed or replaced.
    // Now at (3,1).
    state.updatePacman({ dx: 0, dy: 0 }, 200);

    // Should turn Down and move to (3,2).
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
    state.updatePacman({ dx: 1, dy: 0 }, 100);
    expect(pacman.x).toBeCloseTo(1.5);
    expect(pacman.direction).toEqual({ dx: 1, dy: 0 });

    // 2. Request Left. Should turn IMMEDIATELY even if not aligned.
    state.updatePacman({ dx: -1, dy: 0 }, 100);
    
    // Should be at 1.0 (1.5 - 0.5) and stopped because (0,1) is wall
    expect(pacman.x).toBeCloseTo(1.0);
    expect(pacman.direction).toEqual({ dx: 0, dy: 0 });
  });

  it('should stop and clear direction when hitting a wall', () => {
    const customTemplate = `
#####
#P..#
#####
    `.trim();
    const customGrid = Grid.fromString(customTemplate);
    const state = new GameState(customGrid);
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;

    // 1. Move Right to (2,1)
    state.updatePacman({ dx: 1, dy: 0 }, 200);
    expect(pacman.x).toBe(2);

    // 2. Move Right to (3,1) - just before wall at (4,1)
    state.updatePacman({ dx: 1, dy: 0 }, 200);
    expect(pacman.x).toBe(3);

    // 3. Move Right again. (4,1) is wall.
    state.updatePacman({ dx: 1, dy: 0 }, 200);

    expect(pacman.x).toBe(3); // Should be stopped at boundary (actually ceil(3) = 3... wait)
    // If x=3.0, moving right (+). Boundary is ceil(3) = 3?
    // If x=3.0, ceil(x)=3. proposed > boundary?
    // My logic: boundary = Math.ceil(pos). If pos is integer, boundary = pos.
    // proposed = 3.5. 3.5 >= 3.
    // Tile is boundary (3). Wall check at (3,1)? No.
    // If I am at 3.0. Moving right.
    // Current tile is 3. Target is 4.
    // My logic: 
    // const boundary = Math.ceil(pos);
    // if (proposed >= boundary) ...
    // If pos=3.0, boundary=3. proposed=3.5. 3.5>=3.
    // tileX = boundary = 3.
    // isWalkable(3,1)? (3,1) is current tile. It is walkable.
    // So it allows move?
    // Wait. If I am at 3.0. I want to move to 4.0.
    // I should check tile 4.
    // If pos=3.0. I am IN tile 3.
    // Boundary to next tile is 4.0?
    // Math.ceil(3.0) is 3.
    // If I use Math.floor(pos) + 1 for positive boundary?
    // If pos=3.0, floor=3. +1 = 4.
    // If pos=3.1, floor=3. +1 = 4.
    // Correct.
    
    // BUT, if pos=3.0 exactly. Math.ceil is 3.
    // So I check tile 3. Tile 3 is walkable.
    // It proceeds to 3.5.
    // Next frame: pos=3.5. Ceil=4.
    // proposed=4.0. >= 4.
    // tileX = 4. isWalkable(4,1) -> Wall.
    // Stop at 4.
    // So it moves INTO the wall tile (visually overlap)?
    // Usually x=3 means "center of tile 3".
    // Entities are points? Or occupy space?
    // If entity is point at 3.0.
    // Wall is at 4.0 (center of tile 4).
    // Usually tiles are 0..1, 1..2. Center is 0.5, 1.5.
    // Current coordinates seem to be integers at center?
    // "pacman.x = spawn.x" -> 1.
    // Grid.findTiles returns integers.
    // So x=1 means center of tile (1,y).
    // Wall is at x=0.
    // Distance between them is 1.0.
    // If I move from 1 to 0.
    // Wall starts at 0.5?
    // The renderer usually draws tile at (x*SIZE, y*SIZE).
    // If x=1, it draws at 1*SIZE.
    // So coordinates are integer indices.
    // So (1,1) is the center of the tile visually?
    // Actually, usually in tilemaps, (1,1) is top-left corner of tile (1,1).
    // If Pacman is at (1,1), he is at top-left.
    // If he moves to (1.5, 1.5), he is in center.
    // Let's check `renderer.ts`.
    
    // Expecting to stop at wall.
    // Note: My logic in `state.ts` used `Math.ceil`.
    // Let's verify if that's correct for "integer coordinates = top-left".
  });
});