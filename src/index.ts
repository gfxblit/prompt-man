import { Grid } from './grid.js';

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
  console.log(`Tile at (1, 1): ${grid.getTile(1, 1)}`);
  console.log(`Is (1, 1) walkable? ${grid.isWalkable(1, 1)}`);
  console.log(`Is (0, 0) walkable? ${grid.isWalkable(0, 0)}`);
  
  return grid;
}

if (typeof document !== 'undefined') {
  const output = document.getElementById('output');
  if (output) {
    init(output);
  }
}