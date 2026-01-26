import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameState } from './state.js';
import { Grid } from '../utils/grid.js';
import { TileType } from '../core/types.js';
import { AudioManager } from '../utils/audio-manager.js';
import { AssetLoader } from '../utils/assets.js';

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
    vi.spyOn(audioManager, 'playPowerPelletSound');
    vi.spyOn(audioManager, 'startFrightSound');
    vi.spyOn(audioManager, 'stopFrightSound');
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
});
