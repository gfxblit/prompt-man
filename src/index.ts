import { Grid } from './grid.js';
import { Renderer, UIRenderer } from './renderer.js';
import { GameState } from './state.js';
import { InputHandler } from './input.js';
import { TILE_SIZE, LEVEL_TEMPLATE } from './config.js';

export function init(container: HTMLElement): void {
  const grid = Grid.fromString(LEVEL_TEMPLATE);
  const state = new GameState(grid);
  const inputHandler = InputHandler.getInstance();

  const canvas = document.createElement('canvas');
  canvas.width = grid.getWidth() * TILE_SIZE;
  canvas.height = grid.getHeight() * TILE_SIZE;
  canvas.classList.add('game-canvas');
  container.appendChild(canvas);

  inputHandler.setTargetElement(canvas);

  const ctx = canvas.getContext('2d');
  if (ctx) {
    const renderer = new Renderer(ctx);
    const uiRenderer = new UIRenderer(ctx);
    
    let lastTime = 0;
    const TICK_RATE = 200; // Move every 200ms

    const loop = (time: number) => {
      if (time - lastTime > TICK_RATE) {
        state.updatePacman(inputHandler.getDirection());
        lastTime = time;
      }
      
      renderer.render(grid, state);
      uiRenderer.render(inputHandler.getJoystickState());
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}