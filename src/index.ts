import { Grid } from './grid.js';
import { Renderer, UIRenderer } from './renderer.js';
import { GameState } from './state.js';
import { InputHandler } from './input.js';
import { TILE_SIZE, LEVEL_TEMPLATE, PALETTE_URL } from './config.js';
import { AssetLoader } from './assets.js';

export async function init(container: HTMLElement): Promise<void> {
  const assetLoader = new AssetLoader();
  let palette: HTMLImageElement | undefined;

  try {
    palette = await assetLoader.loadImage(PALETTE_URL);
  } catch (error) {
    console.error('Failed to load assets, falling back to basic rendering:', error);
  }

  const grid = Grid.fromString(LEVEL_TEMPLATE);
  const state = new GameState(grid);
  const inputHandler = InputHandler.getInstance();

  // Create score bar
  const scoreContainer = document.createElement('div');
  scoreContainer.classList.add('flex', 'justify-between', 'w-full', 'mb-2', 'text-white', 'font-bold', 'font-mono', 'text-xl');
  
  const scoreEl = document.createElement('div');
  scoreEl.id = 'score';
  const highScoreEl = document.createElement('div');
  highScoreEl.id = 'highscore';
  
  scoreContainer.appendChild(scoreEl);
  scoreContainer.appendChild(highScoreEl);
  container.appendChild(scoreContainer);

  const updateScoreDisplay = () => {
    scoreEl.innerText = `Score: ${state.getScore()}`;
    highScoreEl.innerText = `High Score: ${state.getHighScore()}`;
  };

  // Initial UI update
  updateScoreDisplay();

  const canvas = document.createElement('canvas');
  canvas.width = grid.getWidth() * TILE_SIZE;
  canvas.height = grid.getHeight() * TILE_SIZE;
  canvas.classList.add('border-2', 'border-gray-600');
  container.appendChild(canvas);

  inputHandler.setTargetElement(canvas);

  const ctx = canvas.getContext('2d');
  const renderer = ctx ? new Renderer(ctx, palette) : null;
  const uiRenderer = ctx ? new UIRenderer(ctx) : null;

  let lastTime = performance.now();
  let lastScore = state.getScore();
  let lastHighScore = state.getHighScore();

  const loop = (time: number) => {
    const deltaTime = time - lastTime;
    lastTime = time;

    state.updatePacman(inputHandler.getDirection(), deltaTime);
    state.updateGhosts(deltaTime);

    // Update score display only if changed
    const currentScore = state.getScore();
    if (currentScore !== lastScore || state.getHighScore() !== lastHighScore) {
      updateScoreDisplay();
      lastScore = currentScore;
      lastHighScore = state.getHighScore();
    }

    if (renderer && uiRenderer) {
      renderer.render(grid, state, time);
      uiRenderer.render(inputHandler.getJoystickState());
    }
    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
}
