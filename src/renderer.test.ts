import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Renderer, TILE_SIZE } from './renderer.js';
import { Grid } from './grid.js';
import { TileType } from './types.js';

describe('Renderer', () => {
  let mockContext: {
    fillRect: ReturnType<typeof vi.fn>;
    beginPath: ReturnType<typeof vi.fn>;
    arc: ReturnType<typeof vi.fn>;
    fill: ReturnType<typeof vi.fn>;
    clearRect: ReturnType<typeof vi.fn>;
    fillStyle: string;
  };
  let renderer: Renderer;

  beforeEach(() => {
    mockContext = {
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      clearRect: vi.fn(),
      fillStyle: '',
    };
    renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D);
  });

  it('should be initialized with a context', () => {
    expect(renderer).toBeDefined();
  });

  it('should render a Wall as a blue block', () => {
    const grid = new Grid(1, 1);
    grid.setTile(0, 0, TileType.Wall);

    renderer.render(grid);

    expect(mockContext.fillStyle).toBe('blue');
    expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, TILE_SIZE, TILE_SIZE);
  });

  it('should render a Pellet as a small peach dot', () => {
    const grid = new Grid(1, 1);
    grid.setTile(0, 0, TileType.Pellet);

    renderer.render(grid);

    expect(mockContext.fillStyle).toBe('peachpuff'); // Assuming peachpuff for "peach"
    expect(mockContext.fillRect).toHaveBeenCalledWith(
      TILE_SIZE / 2 - 1,
      TILE_SIZE / 2 - 1,
      2,
      2
    );
  });

  it('should render a PowerPellet as a large peach circle', () => {
    const grid = new Grid(1, 1);
    grid.setTile(0, 0, TileType.PowerPellet);

    renderer.render(grid);

    expect(mockContext.fillStyle).toBe('peachpuff');
    expect(mockContext.beginPath).toHaveBeenCalled();
    expect(mockContext.arc).toHaveBeenCalledWith(
      TILE_SIZE / 2,
      TILE_SIZE / 2,
      3,
      0,
      Math.PI * 2
    );
    expect(mockContext.fill).toHaveBeenCalled();
  });

  it('should clear the canvas before rendering', () => {
    const grid = new Grid(2, 2);
    renderer.render(grid);

    expect(mockContext.clearRect).toHaveBeenCalledWith(
      0,
      0,
      grid.getWidth() * TILE_SIZE,
      grid.getHeight() * TILE_SIZE
    );
  });

  it('should render multiple tiles correctly', () => {
    const grid = Grid.fromString('#.\no ');
    // # at (0,0)
    // . at (1,0)
    // o at (0,1)
    //   at (1,1)

    renderer.render(grid);

    // Wall at (0,0)
    expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, TILE_SIZE, TILE_SIZE);

    // Pellet at (1,0)
    expect(mockContext.fillRect).toHaveBeenCalledWith(
      TILE_SIZE + TILE_SIZE / 2 - 1,
      TILE_SIZE / 2 - 1,
      2,
      2
    );

    // PowerPellet at (0,1)
    expect(mockContext.arc).toHaveBeenCalledWith(
      TILE_SIZE / 2,
      TILE_SIZE + TILE_SIZE / 2,
      3,
      0,
      Math.PI * 2
    );
  });
});
