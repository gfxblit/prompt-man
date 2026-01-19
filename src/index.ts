import { Grid } from './grid.js';
import { Renderer, TILE_SIZE } from './renderer.js';

export function init(container: HTMLElement): void {
  const levelTemplate = `
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
     #.##    G     ##.#     
     #.## ######## ##.#     
######.## #      # ##.######
      .   #      #   .      
######.## #      # ##.######
     #.## ######## ##.#     
     #.##          ##.#     
     #.## ######## ##.#     
######.## ######## ##.######
#............##............#
#.####.#####.##.#####.####.#
#.####.#####.##.#####.####.#
#o..##................##..o#
###.##.##.########.##.##.###
###.##.##.########.##.##.###
#......##....##....##......#
#.##########.##.##########.#
#.##########.##.##########.#
#..........................#
############################
`.trim();

  const grid = Grid.fromString(levelTemplate);

  console.log(`Grid loaded: ${grid.getWidth()}x${grid.getHeight()}`);

  // Renderer demonstration
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
