import { Grid } from './grid.js';
import { Renderer, UIRenderer } from './renderer.js';
import { GameState } from './state.js';
import { InputHandler } from './input.js';
import { TILE_SIZE, LEVEL_TEMPLATE, PALETTE_URL, MAZE_RENDER_OFFSET_Y, MAZE_RENDER_MARGIN_BOTTOM } from './config.js';
import { AssetLoader } from './assets.js';
import { AudioManager } from './audio-manager.js';

export async function init(container: HTMLElement): Promise<void> {
  container.classList.add('game-container-responsive');
  const assetLoader = new AssetLoader();
  const audioManager = new AudioManager(assetLoader);
  let palette: HTMLImageElement | undefined;

  try {
    palette = await assetLoader.loadImage(PALETTE_URL);
  } catch (error) {
    console.error('Failed to load palette, falling back to basic rendering:', error);
  }

  try {
    await audioManager.initialize();
  } catch (error) {
    console.warn('Audio initialization failed, continuing without sound:', error);
  }

  const grid = Grid.fromString(LEVEL_TEMPLATE);
  const state = new GameState(grid, audioManager, false);
  const inputHandler = InputHandler.getInstance();

  // Resume audio context on first interaction
  let gameStarted = false;
  const resumeAudio = async () => {
    await audioManager.resumeIfNeeded();

    if (!gameStarted) {
      gameStarted = true;
      audioManager.playIntroMusic();
      state.startReady(audioManager.getIntroDuration());

      // Remove events that are only needed to start the game
      window.removeEventListener('keydown', resumeAudio);
      window.removeEventListener('mousedown', resumeAudio);
      window.removeEventListener('touchstart', resumeAudio);
    }

    // If audio is successfully running, we can stop listening for unlock events
    if (audioManager.getState() === 'running') {
      window.removeEventListener('click', resumeAudio);
      window.removeEventListener('touchend', resumeAudio);
      window.removeEventListener('keydown', resumeAudio);
      window.removeEventListener('mousedown', resumeAudio);
      window.removeEventListener('touchstart', resumeAudio);
    }
  };

  window.addEventListener('keydown', resumeAudio);
  window.addEventListener('mousedown', resumeAudio);
  window.addEventListener('touchstart', resumeAudio);
  window.addEventListener('click', resumeAudio);
  window.addEventListener('touchend', resumeAudio);

  const canvas = document.createElement('canvas');
  canvas.width = grid.getWidth() * TILE_SIZE;
  canvas.height = grid.getHeight() * TILE_SIZE + MAZE_RENDER_OFFSET_Y + MAZE_RENDER_MARGIN_BOTTOM;
  canvas.classList.add('game-canvas', 'border-2', 'border-gray-600');
  container.appendChild(canvas);

  inputHandler.setTargetElement(canvas);

  const ctx = canvas.getContext('2d');
  const renderer = ctx ? new Renderer(ctx, palette) : null;
  const uiRenderer = ctx ? new UIRenderer(ctx) : null;

  let lastTime = performance.now();

  const loop = (time: number) => {
    const deltaTime = time - lastTime;
    lastTime = time;

    state.updatePacman(inputHandler.getDirection(), deltaTime);
    state.updateGhosts(deltaTime);

    if (renderer && uiRenderer) {
      renderer.render(grid, state, time);
      uiRenderer.render(inputHandler.getJoystickState());
    }
    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
}

  