import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Renderer } from './renderer.js';
import { Grid } from './grid.js';
import { TileType, EntityType } from './types.js';
import { TILE_SIZE, COLORS } from './config.js';

describe('Renderer', () => {
  let mockContext: {
    fillRect: ReturnType<typeof vi.fn>;
    beginPath: ReturnType<typeof vi.fn>;
    arc: ReturnType<typeof vi.fn>;
    fill: ReturnType<typeof vi.fn>;
    clearRect: ReturnType<typeof vi.fn>;
    lineTo: ReturnType<typeof vi.fn>;
    closePath: ReturnType<typeof vi.fn>;
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
      lineTo: vi.fn(),
      closePath: vi.fn(),
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

    expect(mockContext.fillStyle).toBe(COLORS.WALL);
    expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, TILE_SIZE, TILE_SIZE);
  });

  it('should render a Pellet as a small peach dot', () => {
    const grid = new Grid(1, 1);
    grid.setTile(0, 0, TileType.Pellet);

    renderer.render(grid);

    expect(mockContext.fillStyle).toBe(COLORS.PELLET);
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

    expect(mockContext.fillStyle).toBe(COLORS.PELLET);
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

  it('should render Pacman correctly', () => {
    const grid = new Grid(1, 1);
    const entities = [{ type: EntityType.Pacman, x: 0, y: 0 }];

    renderer.render(grid, entities);

    expect(mockContext.fillStyle).toBe(COLORS.PACMAN);
    expect(mockContext.beginPath).toHaveBeenCalled();
    expect(mockContext.arc).toHaveBeenCalledWith(
      TILE_SIZE / 2,
      TILE_SIZE / 2,
      TILE_SIZE / 2 - 1,
      0.2 * Math.PI,
      1.8 * Math.PI
    );
    expect(mockContext.fill).toHaveBeenCalled();
  });

  it('should render a Ghost correctly', () => {
    const grid = new Grid(1, 1);
    const entities = [{ type: EntityType.Ghost, x: 0, y: 0, color: 'pink' }];

    renderer.render(grid, entities);

    expect(mockContext.fillStyle).toBe('pink');
    expect(mockContext.beginPath).toHaveBeenCalled();
    expect(mockContext.arc).toHaveBeenCalledWith(
      TILE_SIZE / 2,
      TILE_SIZE / 2,
      TILE_SIZE / 2 - 1,
      Math.PI,
      0
    );
    expect(mockContext.fill).toHaveBeenCalled();
  });

  it('should render a Ghost with default color if not specified', () => {
    const grid = new Grid(1, 1);
    const entities = [{ type: EntityType.Ghost, x: 0, y: 0 }];

    renderer.render(grid, entities);

    expect(mockContext.fillStyle).toBe(COLORS.GHOST_DEFAULT);
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
