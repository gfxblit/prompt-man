/**
 * Reproduction test for Issue #116: Ghost eyes bouncing back and forth
 * 
 * The problem: When ghost eyes (dead ghosts) try to return to jail,
 * they sometimes bounce back and forth near the jail door instead
 * of entering through it.
 * 
 * This test uses a level template similar to the one from the issue,
 * with proper ghost spawn markers (G) added.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameState } from './state.js';
import { Grid } from './grid.js';
import { EntityType, TileType } from './types.js';
import { GhostAI } from './ghost-ai.js';

vi.mock('./config.js', async (importOriginal) => {
	const mod = await importOriginal<typeof import('./config.js')>();
	return {
		...mod,
		READY_DURATION: 0,
	};
});

describe('Issue 116: Ghost Eyes Bouncing', () => {
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

	// Level template with ghost spawns (G) added to make it valid
	// The issue shows eyes bouncing at positions marked E near the jail door:
	// "     #.##E        E##.#" - row 11 in the original issue diagram
	const ISSUE_LEVEL_TEMPLATE = `
############################
#............##............#
#.####.#####.##.#####.####.#
#o####.#####.##.#####.####o#
#.####.#####.##.#####.####.#
#..........................#
#.####.##.########.##.####.#
#.####.##.########.##.####.#
#......##....##....##......#
######.##### ## #####.######
     #.##### ## #####.#     
     #.##          ##.#     
     #.## ###--### ##.#     
######.## # G  G # ##.######
      .   #      #   .      
######.## # G  G # ##.######
     #.## ######## ##.#     
     #.##          ##.#     
     #.## ######## ##.#     
######.## ######## ##.######
#............##............#
#.####.#####.##.#####.####.#
#.####.#####.##.#####.####.#
#o..##.......P........##..o#
###.##.##.########.##.##.###
###.##.##.########.##.##.###
#......##....##....##......#
#.##########.##.##########.#
#.##########.##.##########.#
#..........................#
############################
`.trim();

	it('should reproduce: dead ghost eyes should find path to jail through the door', () => {
		const grid = Grid.fromString(ISSUE_LEVEL_TEMPLATE);

		// The jail door is marked as '--' which becomes two JailDoor tiles
		const doors = grid.findTiles(TileType.JailDoor);
		console.log('Jail doors found at:', doors);

		// Find ghost spawn positions
		const spawns = grid.findTiles(TileType.GhostSpawn);
		console.log('Ghost spawns found at:', spawns);

		// Create a dead ghost entity at position (5, 11) - left side of corridor
		// This is where the "E" is shown in the issue diagram (bouncing position)
		const ghost = {
			type: EntityType.Ghost,
			x: 5,
			y: 11,
			direction: { dx: 1, dy: 0 }, // Initially moving right
			isDead: true,
			isLeavingJail: false
		};

		// The target is the ghost's spawn position (inside the jail)
		const target = spawns[0] || { x: 13, y: 13 }; // Default to center of jail

		console.log('Ghost at:', { x: ghost.x, y: ghost.y });
		console.log('Target (spawn):', target);

		// Get the BFS direction
		const dir = GhostAI.findBFSDirection(ghost, target, grid, true, false);
		console.log('BFS direction:', dir);

		// The ghost should move towards the jail door
		// From (5, 11), the path to the jail should go right towards the door
		expect(dir.dx !== 0 || dir.dy !== 0).toBe(true);
	});

	it('should track ghost movement over multiple updates to detect bouncing', () => {
		const grid = Grid.fromString(ISSUE_LEVEL_TEMPLATE);
		const state = new GameState(grid);

		// Find a ghost and make it dead
		const ghost = state.getEntities().find(e => e.type === EntityType.Ghost);
		if (!ghost) {
			throw new Error('No ghost found in level');
		}

		console.log('Initial ghost position:', { x: ghost.x, y: ghost.y });
		const initialPos = state.getSpawnPosition(ghost);
		console.log('Ghost spawn position:', initialPos);

		// Move ghost to a position outside the jail (in the corridor area)
		// Row 11: "     #.##          ##.#"  - open corridor above jail
		ghost.x = 5;
		ghost.y = 11;
		ghost.isDead = true;
		ghost.isLeavingJail = false;
		ghost.direction = { dx: 0, dy: 0 };

		// Track positions over multiple updates
		const positions: { x: number, y: number, dx: number, dy: number }[] = [];

		for (let i = 0; i < 100; i++) {
			positions.push({
				x: Math.round(ghost.x * 10) / 10,
				y: Math.round(ghost.y * 10) / 10,
				dx: ghost.direction?.dx || 0,
				dy: ghost.direction?.dy || 0
			});
			state.updateGhosts(100); // 100ms updates

			// Stop early if ghost respawned
			if (!ghost.isDead) {
				console.log(`Ghost respawned at iteration ${i}`);
				break;
			}
		}

		console.log('Position history (first 30):', positions.slice(0, 30));

		// Check for bouncing pattern: alternating directions on same axis
		let bounceCount = 0;
		for (let i = 2; i < positions.length; i++) {
			const prev2 = positions[i - 2]!;
			const prev = positions[i - 1]!;
			const curr = positions[i]!;

			// Detect horizontal bouncing
			if ((prev2.dx === 1 && prev.dx === -1) || (prev2.dx === -1 && prev.dx === 1)) {
				if (Math.abs(curr.x - prev2.x) < 1) { // Back to similar X position
					bounceCount++;
				}
			}
		}

		console.log('Detected bounce patterns:', bounceCount);
		console.log('Final position:', { x: ghost.x, y: ghost.y });
		console.log('Ghost still dead?:', ghost.isDead);

		// The ghost should not be bouncing (bounceCount should be low)
		// If bounceCount is high, the ghost is stuck bouncing
		expect(bounceCount).toBeLessThan(5);
	});

	it('should verify BFS finds path through jail door for dead ghost', () => {
		const grid = Grid.fromString(ISSUE_LEVEL_TEMPLATE);

		const doors = grid.findTiles(TileType.JailDoor);
		const spawns = grid.findTiles(TileType.GhostSpawn);

		console.log('Doors:', doors);
		console.log('Spawns:', spawns);

		expect(doors.length).toBeGreaterThan(0);
		expect(spawns.length).toBeGreaterThan(0);

		const door = doors[0]!;
		const spawn = spawns[0]!;

		// Place ghost above the door (outside jail)
		const ghost = {
			type: EntityType.Ghost,
			x: door.x,
			y: door.y - 1, // One tile above door
			direction: { dx: 0, dy: 0 },
			isDead: true,
			isLeavingJail: false
		};

		console.log('Ghost at:', { x: ghost.x, y: ghost.y });
		console.log('Door at:', door);
		console.log('Target spawn:', spawn);

		// Verify the door tile is walkable for dead ghosts
		const doorWalkable = grid.isWalkable(door.x, door.y, EntityType.Ghost, true, false);
		console.log('Door walkable for dead ghost:', doorWalkable);
		expect(doorWalkable).toBe(true);

		// Get BFS direction - should point towards the door
		const dir = GhostAI.findBFSDirection(ghost, spawn, grid, true, false);
		console.log('BFS direction:', dir);

		// Should move down towards the door
		expect(dir.dy).toBe(1);
		expect(dir.dx).toBe(0);
	});

	it('should test ghost at exact bouncing position from issue (left side)', () => {
		const grid = Grid.fromString(ISSUE_LEVEL_TEMPLATE);
		const spawns = grid.findTiles(TileType.GhostSpawn);

		// Place ghost at position (9, 11) - just left of jail area in corridor
		// This is where the left "E" would be in the issue diagram
		const ghost = {
			type: EntityType.Ghost,
			x: 9,
			y: 11,
			direction: { dx: 1, dy: 0 }, // Moving right
			isDead: true,
			isLeavingJail: false
		};

		const target = spawns[0]!;
		console.log('Ghost at:', { x: ghost.x, y: ghost.y });
		console.log('Target spawn:', target);

		// Simulate multiple direction choices to see if bouncing occurs
		const directions: { dx: number, dy: number }[] = [];
		for (let i = 0; i < 10; i++) {
			const dir = GhostAI.findBFSDirection(ghost, target, grid, true, false);
			directions.push({ dx: dir.dx, dy: dir.dy });

			// Simulate movement
			ghost.x += dir.dx * 0.4;
			ghost.y += dir.dy * 0.4;
			ghost.direction = dir;

			console.log(`Step ${i}: pos=(${ghost.x.toFixed(2)}, ${ghost.y.toFixed(2)}), dir=(${dir.dx}, ${dir.dy})`);
		}

		// Ghost should be making progress towards the jail (moving down)
		// Check if mostly consistent directions (not bouncing)
		const dirChanges = directions.filter((d, i) => {
			if (i === 0) return false;
			const prev = directions[i - 1]!;
			return d.dx !== prev.dx || d.dy !== prev.dy;
		}).length;

		console.log('Direction changes:', dirChanges);

		// Should not have too many direction changes (indicates bouncing)
		expect(dirChanges).toBeLessThan(5);
	});
});
