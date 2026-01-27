import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameState } from './state.js';
import { Grid } from './grid.js';
import { TileType, EntityType } from './types.js';
import { AudioManager } from './audio-manager.js';
import { AssetLoader } from './assets.js';

describe('GameState Sound Events', () => {
  let grid: Grid;
  let audioManager: AudioManager;
  const template = `
#####
#P.o#
#####
  `.trim();

  beforeEach(() => {
    grid = Grid.fromString(template);
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
    });

    const assetLoader = new AssetLoader();
    audioManager = new AudioManager(assetLoader);
    vi.spyOn(audioManager, 'playPelletSound');
    vi.spyOn(audioManager, 'playPelletSound');
    vi.spyOn(audioManager, 'playPowerPelletSound');
    vi.spyOn(audioManager, 'playSiren');
    vi.spyOn(audioManager, 'stopSiren');
    vi.spyOn(audioManager, 'startFrightSound');
    vi.spyOn(audioManager, 'stopFrightSound');
    vi.spyOn(audioManager, 'playEatGhostSound');
  });

  it('should call audioManager.playEatGhostSound when a scared ghost is eaten', () => {
    // Template:
    // #####
    // #P.G.o#
    // #####
    // P is Pacman at (1,1)
    
    // We need a ghost that is scared.
    // GameState initialization adds ghosts if there are GhostSpawn tiles.
    // Our template doesn't have them. Let's use a different template or inject a ghost.
    
    const templateWithGhost = `
#######
#P.G.o#
#######
    `.trim();
    const gridWithGhost = Grid.fromString(templateWithGhost);
    const state = new GameState(gridWithGhost, audioManager);
    
    // Scare the ghost by eating the power pellet
    state.consumePellet(5, 1);
    
    const ghost = state.getEntities().find(e => e.type === EntityType.Ghost);
    expect(ghost).toBeDefined();
    expect(ghost?.isScared).toBe(true);
    
    // Move Pacman to collide with the ghost
    // Pacman is at (1,1), Ghost is at (3,1)
    // We can just manually set their positions for the test
    const pacman = state.getEntities().find(e => e.type === EntityType.Pacman)!;
    pacman.x = 3;
    pacman.y = 1;
    ghost!.x = 3;
    ghost!.y = 1;
    
    // Trigger collision check
    // state.updatePacman calls checkCollisions
    // We need to advance more than READY_DURATION (2000ms)
    state.updatePacman({ dx: 0, dy: 0 }, 2100);
    
    expect(audioManager.playEatGhostSound).toHaveBeenCalled();
  });

  it('should call audioManager.playPelletSound when a regular pellet is eaten', () => {
    const state = new GameState(grid, audioManager);
    state.consumePellet(2, 1); // Regular pellet at (2,1)
    expect(audioManager.playPelletSound).toHaveBeenCalled();
  });

  it('should call audioManager.playPowerPelletSound when a power pellet is eaten', () => {
    const state = new GameState(grid, audioManager);
    state.consumePellet(3, 1); // Power pellet at (3,1)
    expect(audioManager.playPowerPelletSound).toHaveBeenCalled();
  });

  it('should NOT call audioManager.playPelletSound when an already eaten pellet is "eaten" again', () => {
    const state = new GameState(grid, audioManager);
    state.consumePellet(2, 1);
    expect(audioManager.playPelletSound).toHaveBeenCalledTimes(1);

    state.consumePellet(2, 1);
    expect(audioManager.playPelletSound).toHaveBeenCalledTimes(1);
  });

  it('should call onPelletConsumed when a regular pellet is eaten', () => {
    const state = new GameState(grid, audioManager);
    const onPelletConsumed = vi.fn();
    state.onPelletConsumed = onPelletConsumed;

    state.consumePellet(2, 1); // Regular pellet at (2,1)
    expect(onPelletConsumed).toHaveBeenCalledWith(TileType.Pellet);
  });

  it('should call audioManager.startFrightSound when a power pellet is eaten', () => {
    const state = new GameState(grid, audioManager);
    state.consumePellet(3, 1); // Power pellet at (3,1)
    expect(audioManager.startFrightSound).toHaveBeenCalled();
  });

  it('should call audioManager.stopFrightSound when power up timer expires', () => {
    const state = new GameState(grid, audioManager);

    // Clear ready state first
    state.updatePacman({ dx: 0, dy: 0 }, 2001); // READY_DURATION + 1

    state.consumePellet(3, 1); // Power pellet

    // Simulate time passing until timer expires
    // POWER_UP_DURATION is 10000.
    // updateGhosts checks timer.
    state.updateGhosts(10001);

    expect(audioManager.stopFrightSound).toHaveBeenCalled();
  });

  it('should call audioManager.playSiren when Ready state ends', () => {
    // Should NOT be called initially (during Ready state)
    expect(audioManager.playSiren).not.toHaveBeenCalled();
  });

    // Advance Ready timer to start game and trigger initial siren
  it('should call audioManager.playSiren when Ready state ends', () => {
    const state = new GameState(grid, audioManager);
    // Should NOT be called initially (during Ready state)
    expect(audioManager.playSiren).not.toHaveBeenCalled();

    // Determine READY_DURATION. Usually imported, but let's assume it's > 0.
    // We simulate enough time passing.
    state.updatePacman({ dx: 0, dy: 0 }, 5000);

    expect(audioManager.playSiren).toHaveBeenCalledWith(0);
  });

  it('should call audioManager.playSiren with higher index when pellets are consumed', () => {
    // Create a grid with known number of pellets (2 in template: P at (1,1) and o at (3,1))
    // Actually template is:
    // #####
    // #P.o#
    // #####
    // 
    // P is PacmanSpawn (not pellet)
    // . is Pellet
    // o is PowerPellet
    // So distinct pellets: 1 dot, 1 power pellet. Total 2.
    // Thresholds: 0, 0.25, 0.50, 0.75
    // 0 eaten: ratio 0 -> index 0 (Already tested in start)
    // 1 eaten: ratio 0.5 -> index 2

    const state = new GameState(grid, audioManager);
    expect(audioManager.playSiren).not.toHaveBeenCalled();

    // Advance Ready timer to start game and trigger initial siren
    state.updatePacman({ dx: 0, dy: 0 }, 5000);
    expect(audioManager.playSiren).toHaveBeenLastCalledWith(0);

    state.consumePellet(2, 1); // Eat dot
    // Remaining: 1, Eaten: 1. Ratio: 1/2 = 0.5.
    // Thresholds: [0, 0.25, 0.50, 0.75]
    // 0.5 >= 0.50 -> index 2
    expect(audioManager.playSiren).toHaveBeenLastCalledWith(2);
  });

  it('should call audioManager.stopSiren on game over (dying)', () => {
    const state = new GameState(grid, audioManager);
    state.consumePellet(2, 1);
    state.consumePellet(3, 1); // All eaten -> Win

    expect(audioManager.stopSiren).toHaveBeenCalled();
  });

  it('should call audioManager.stopSiren when startReady is called', () => {
    const state = new GameState(grid, audioManager);
    
    // Clear previous calls
    vi.clearAllMocks();
    
    state.startReady(4000);
    
    expect(audioManager.stopSiren).toHaveBeenCalled();
  });
});
