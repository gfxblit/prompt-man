import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameState } from './state.js';
import { Grid } from './grid.js';
import { GhostAI } from './ghost-ai.js';
import { EntityType, type Direction, type Entity } from './types.js';

describe('Issue #55: Ghosts should never stop', () => {
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

	describe('Ghost direction reversal on power pellet', () => {
		it('should reverse ghost direction when power pellet is eaten', () => {
			const template = `
#######
#P..oG#
#######
      `.trim();
			const grid = Grid.fromString(template);
			const state = new GameState(grid);

			const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;
			// Set ghost moving left
			ghost.direction = { dx: -1, dy: 0 };

			const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
			// Move pacman to the power pellet position (4, 1)
			pacman.x = 4;
			pacman.y = 1;

			// Simulate consuming the power pellet (o is at position 4,1)
			state.consumePellet(4, 1);

			// Ghost should now be scared and reversed
			expect(ghost.isScared).toBe(true);
			expect(ghost.direction).toEqual({ dx: 1, dy: 0 }); // Reversed from left to right
		});

		it('should handle zero velocity ghost reversal gracefully', () => {
			const template = `
#######
#P..oG#
#######
      `.trim();
			const grid = Grid.fromString(template);
			const state = new GameState(grid);

			const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;
			// Ghost with no direction
			ghost.direction = { dx: 0, dy: 0 };

			state.consumePellet(4, 1);

			// Ghost should be scared but direction remains { dx: 0, dy: 0 }
			expect(ghost.isScared).toBe(true);
			expect(ghost.direction).toEqual({ dx: 0, dy: 0 });
		});
	});

	describe('Scared ghost random movement', () => {
		it('should pick random direction when scared', () => {
			const template = `
#####
#G..#
#...#
#...#
#####
      `.trim();
			const grid = Grid.fromString(template);

			const ghost: Entity = {
				type: EntityType.Ghost,
				x: 2,
				y: 2,
				direction: { dx: 1, dy: 0 }, // Moving right
				isScared: true,
			};

			// Mock Math.random to return specific values
			const originalRandom = Math.random;

			// Count how many different directions are returned with different random values
			const directions: Direction[] = [];

			// Test with Math.random returning 0
			Math.random = () => 0;
			directions.push(GhostAI.pickDirection(ghost, { x: 1, y: 1 }, grid, true));

			// Test with Math.random returning 0.5
			Math.random = () => 0.5;
			directions.push(GhostAI.pickDirection(ghost, { x: 1, y: 1 }, grid, true));

			// Test with Math.random returning 0.99
			Math.random = () => 0.99;
			directions.push(GhostAI.pickDirection(ghost, { x: 1, y: 1 }, grid, true));

			Math.random = originalRandom;

			// All directions should be valid (non-zero) 
			for (const dir of directions) {
				expect(dir.dx !== 0 || dir.dy !== 0).toBe(true);
			}

			// With different random values, we should get at least 2 different directions
			const uniqueDirs = new Set(directions.map(d => `${d.dx},${d.dy}`));
			expect(uniqueDirs.size).toBeGreaterThanOrEqual(2);
		});
	});

	describe('Grid wrapping for tunnels', () => {
		it('should detect wrapped tiles as walkable', () => {
			// Create a grid with a tunnel (exits on both sides)
			const template = `
######
.P..G.
######
      `.trim();
			const grid = Grid.fromString(template);

			const ghost: Entity = {
				type: EntityType.Ghost,
				x: 4,
				y: 1,
				direction: { dx: 1, dy: 0 }, // Moving right towards edge
			};

			// At position (4, 1), moving right (dx: 1) should detect (5, 1) which wraps to (0, 1)
			// Position (0, 1) is walkable (empty)
			const direction = GhostAI.pickDirection(ghost, { x: 1, y: 1 }, grid, false);

			// The ghost should be able to continue right (towards tunnel exit)
			// It shouldn't get stuck because the wrapped position is walkable
			expect(direction.dx !== 0 || direction.dy !== 0).toBe(true);
		});

		it('should allow ghost to enter tunnel from the right edge', () => {
			const template = `
######
.....G
######
      `.trim();
			const grid = Grid.fromString(template);

			const ghost: Entity = {
				type: EntityType.Ghost,
				x: 5,
				y: 1,
				direction: { dx: 1, dy: 0 }, // Moving right (into tunnel)
			};

			// Ghost is at right edge, moving right should detect wrapped position as valid
			const direction = GhostAI.pickDirection(ghost, { x: 3, y: 1 }, grid, false);

			// Should be able to continue (going left is also valid but tunnel should work)
			expect(direction.dx !== 0 || direction.dy !== 0).toBe(true);
		});
	});

	describe('Ghosts never stop while scared', () => {
		it('should always have non-zero direction when scared with valid moves', () => {
			const template = `
#######
#..G..#
#.....#
#.....#
#.....#
#######
      `.trim();
			const grid = Grid.fromString(template);
			const state = new GameState(grid);

			const ghost = state.getEntities().find(e => e.type === EntityType.Ghost)!;
			ghost.isScared = true;

			// Update ghosts multiple times
			for (let i = 0; i < 10; i++) {
				state.updateGhosts(100); // Large delta to move significantly

				// Ghost should always have a non-zero direction unless completely trapped
				if (ghost.direction) {
					expect(ghost.direction.dx !== 0 || ghost.direction.dy !== 0).toBe(true);
				}
			}
		});
	});
});
