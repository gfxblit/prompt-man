import { Grid } from './grid.js';
import { Renderer, TILE_SIZE } from './renderer.js';

export const levelTemplate = `
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

export function init(outputElement: HTMLElement | null) {
  const grid = Grid.fromString(levelTemplate);

  if (outputElement) {
    outputElement.textContent = levelTemplate;
  }

  console.log(`Grid loaded: ${grid.getWidth()}x${grid.getHeight()}`);

  // Renderer demonstration
  const canvas = document.createElement('canvas');
  canvas.width = grid.getWidth() * TILE_SIZE;
  canvas.height = grid.getHeight() * TILE_SIZE;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (ctx) {
    const renderer = new Renderer(ctx);
    renderer.render(grid);
    console.log('Grid rendered to canvas');
  }

  return grid;
}

if (typeof document !== 'undefined') {
  const output = document.getElementById('output');
  if (output) {
    init(output);
  }
}
