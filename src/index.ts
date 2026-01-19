import { Grid } from './grid.js';
import { Renderer } from './renderer.js';
import { TILE_SIZE, LEVEL_TEMPLATE } from './config.js';

export function init(container: HTMLElement): void {
  const grid = Grid.fromString(LEVEL_TEMPLATE);

  const canvas = document.createElement('canvas');
  canvas.width = grid.getWidth() * TILE_SIZE;
  canvas.height = grid.getHeight() * TILE_SIZE;
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (ctx) {
    const renderer = new Renderer(ctx);
    renderer.render(grid);
    console.log('Grid rendered to canvas');
  }
}

if (typeof document !== 'undefined') {
  const output = document.getElementById('output');
  if (output) {
    init(output);
  }
}