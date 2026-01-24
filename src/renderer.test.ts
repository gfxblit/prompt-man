import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Renderer, UIRenderer } from './renderer.js';
import { Grid } from './grid.js';
import { TileType, EntityType } from './types.js';
import type { IGameState } from './types.js';
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
    drawImage: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    restore: ReturnType<typeof vi.fn>;
    translate: ReturnType<typeof vi.fn>;
    scale: ReturnType<typeof vi.fn>;
    fillStyle: string;
    fillText: ReturnType<typeof vi.fn>;
    font: string;
    textAlign: string;
    textBaseline: string;
  };
  let mockState: IGameState;
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
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      fillStyle: '',
      fillText: vi.fn(),
      font: '',
      textAlign: '',
      textBaseline: '',
    };
    mockState = {
      getEntities: vi.fn().mockReturnValue([]),
      getScore: vi.fn().mockReturnValue(0),
      getHighScore: vi.fn().mockReturnValue(0),
      getLives: vi.fn().mockReturnValue(0),
      getRemainingPellets: vi.fn().mockReturnValue(0),
      consumePellet: vi.fn(),
      isPelletEaten: vi.fn().mockReturnValue(false),
      updatePacman: vi.fn(),
      updateGhosts: vi.fn(),
      isGameOver: vi.fn().mockReturnValue(false),
    };
  });

  it('should be initialized with a context', () => {
    renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D);
    expect(renderer).toBeDefined();
  });

  it('should render Wall using autotiling when spritesheet is provided', () => {
    const mockSpritesheet = {} as HTMLImageElement;
    renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D, mockSpritesheet);

    const grid = Grid.fromString('#');
    renderer.render(grid, mockState);

    // Should call drawImage 4 times for the 4 quadrants of the wall
    expect(mockContext.drawImage).toHaveBeenCalledTimes(4);
  });

  it('should render a Wall as a blue block when no spritesheet is provided', () => {
    renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D);
    const grid = new Grid(1, 1);
    grid.setTile(0, 0, TileType.Wall);

    renderer.render(grid, mockState);

    expect(mockContext.fillStyle).toBe(COLORS.WALL);
    expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, TILE_SIZE, TILE_SIZE);
  });

  it('should render a Pellet as a small peach dot', () => {
    renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D);
    const grid = new Grid(1, 1);
    grid.setTile(0, 0, TileType.Pellet);

    renderer.render(grid, mockState);

    expect(mockContext.fillStyle).toBe(COLORS.PELLET);
    expect(mockContext.fillRect).toHaveBeenCalledWith(
      TILE_SIZE / 2 - 1,
      TILE_SIZE / 2 - 1,
      2,
      2
    );
  });

  it('should NOT render a Pellet if it is eaten', () => {
    vi.mocked(mockState.isPelletEaten).mockReturnValue(true);
    renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D);

    const grid = new Grid(1, 1);
    grid.setTile(0, 0, TileType.Pellet);

    renderer.render(grid, mockState);

    expect(mockContext.fillRect).not.toHaveBeenCalledWith(
      TILE_SIZE / 2 - 1,
      TILE_SIZE / 2 - 1,
      2,
      2
    );
  });

  it('should render a PowerPellet as a large peach circle', () => {
    renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D);
    const grid = new Grid(1, 1);
    grid.setTile(0, 0, TileType.PowerPellet);

    renderer.render(grid, mockState, 0);

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

  it('should NOT render a PowerPellet when blinking (time-based)', () => {
    renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D);
    const grid = new Grid(1, 1);
    grid.setTile(0, 0, TileType.PowerPellet);

    // If we assume a 500ms cycle, 250ms should be "off"
    renderer.render(grid, mockState, 250);

    expect(mockContext.arc).not.toHaveBeenCalled();
    expect(mockContext.fill).not.toHaveBeenCalled();
  });

  it('should ALWAYS render a regular Pellet regardless of time', () => {
    renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D);
    const grid = new Grid(1, 1);
    grid.setTile(0, 0, TileType.Pellet);

    // Even at 250ms, regular pellet should be visible
    renderer.render(grid, mockState, 250);

    expect(mockContext.fillRect).toHaveBeenCalledWith(
      TILE_SIZE / 2 - 1,
      TILE_SIZE / 2 - 1,
      2,
      2
    );
  });

  it('should clear the canvas before rendering', () => {
    renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D);
    const grid = new Grid(2, 2);
    renderer.render(grid, mockState);

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
    vi.mocked(mockState.getEntities).mockReturnValue(entities);
    renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D);

    renderer.render(grid, mockState);

    expect(mockContext.fillStyle).toBe(COLORS.PACMAN);
    expect(mockContext.beginPath).toHaveBeenCalled();
    expect(mockContext.arc).toHaveBeenCalledWith(
      TILE_SIZE / 2,
      TILE_SIZE / 2,
      TILE_SIZE / 2 - 1,
      0,
      2 * Math.PI
    );
    expect(mockContext.fill).toHaveBeenCalled();
  });

  it.each([
    { direction: 'East', rotation: 0, frame: 0, expectedFlipX: false, expectedFlipY: false },
    { direction: 'East', rotation: 0, frame: 1, expectedFlipX: false, expectedFlipY: false },
    { direction: 'South', rotation: Math.PI / 2, frame: 0, expectedFlipX: false, expectedFlipY: false },
    { direction: 'South', rotation: Math.PI / 2, frame: 1, expectedFlipX: false, expectedFlipY: false },
    { direction: 'West', rotation: Math.PI, frame: 0, expectedFlipX: true, expectedFlipY: false },
    { direction: 'West', rotation: Math.PI, frame: 1, expectedFlipX: true, expectedFlipY: false },
    { direction: 'North', rotation: -Math.PI / 2, frame: 0, expectedFlipX: false, expectedFlipY: true },
    { direction: 'North', rotation: -Math.PI / 2, frame: 1, expectedFlipX: false, expectedFlipY: true },
  ])('should render Pacman using spritesheet for $direction (frame $frame)', ({ rotation, frame, expectedFlipX, expectedFlipY }) => {
    const mockSpritesheet = {} as HTMLImageElement;
    renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D, mockSpritesheet);
    const grid = new Grid(1, 1);

    const entities = [{
      type: EntityType.Pacman,
      x: 0,
      y: 0,
      rotation: rotation,
      animationFrame: frame
    }];
    vi.mocked(mockState.getEntities).mockReturnValue(entities);

    renderer.render(grid, mockState);

    expect(mockContext.save).toHaveBeenCalled();
    expect(mockContext.translate).toHaveBeenCalledWith(TILE_SIZE / 2, TILE_SIZE / 2);

    const scaleX = expectedFlipX ? -1 : 1;
    const scaleY = expectedFlipY ? -1 : 1;
    expect(mockContext.scale).toHaveBeenCalledWith(scaleX, scaleY);

    expect(mockContext.drawImage).toHaveBeenCalledWith(
      mockSpritesheet,
      expect.any(Number), // sourceX
      expect.any(Number), // sourceY
      expect.any(Number), // sourceWidth
      expect.any(Number), // sourceHeight
      -TILE_SIZE / 2,     // destX (centered)
      -TILE_SIZE / 2,     // destY (centered)
      TILE_SIZE,
      TILE_SIZE
    );

    expect(mockContext.restore).toHaveBeenCalled();
  });

  it('should rotate Pacman based on rotation property', () => {
    const grid = new Grid(1, 1);
    // Facing down (rotation for PI/2)
    const rotation = Math.PI / 2;
    const entities = [{
      type: EntityType.Pacman,
      x: 0,
      y: 0,
      rotation: rotation,
      animationFrame: 2
    }];
    vi.mocked(mockState.getEntities).mockReturnValue(entities);
    renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D);

    renderer.render(grid, mockState);

    const startAngle = 0.2 * Math.PI + rotation;
    const endAngle = 1.8 * Math.PI + rotation;

    const lastArcCall = vi.mocked(mockContext.arc).mock.calls.find(call => call[2] === TILE_SIZE / 2 - 1);
    expect(lastArcCall).toBeDefined();
    expect(lastArcCall![3]).toBeCloseTo(startAngle);
    expect(lastArcCall![4]).toBeCloseTo(endAngle);
  });

  it('should render a Ghost correctly', () => {
    const grid = new Grid(1, 1);
    const entities = [{ type: EntityType.Ghost, x: 0, y: 0, color: 'pink' }];
    vi.mocked(mockState.getEntities).mockReturnValue(entities);
    renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D);

    renderer.render(grid, mockState);

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
    vi.mocked(mockState.getEntities).mockReturnValue(entities);
    renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D);

    renderer.render(grid, mockState);

    expect(mockContext.fillStyle).toBe(COLORS.GHOST_DEFAULT);
  });

  it('should render a Scared Ghost as blue', () => {
    const grid = new Grid(1, 1);
    const entities = [{ type: EntityType.Ghost, x: 0, y: 0, isScared: true, color: 'pink' }];
    vi.mocked(mockState.getEntities).mockReturnValue(entities);
    renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D);

    renderer.render(grid, mockState);

    expect(mockContext.fillStyle).toBe(COLORS.SCARED_GHOST);
  });

  it('should render a Dead Ghost as eyes', () => {
    const grid = new Grid(1, 1);
    const entities = [{ type: EntityType.Ghost, x: 0, y: 0, isDead: true, color: 'pink' }];
    vi.mocked(mockState.getEntities).mockReturnValue(entities);
    renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D);

    renderer.render(grid, mockState);

    // Expect white for the eye whites and blue for the pupils
    expect(mockContext.fillStyle).toMatch(/(white|blue)/);
    const arcCalls = vi.mocked(mockContext.arc).mock.calls;
    expect(arcCalls.length).toBeGreaterThanOrEqual(4);
  });

  it('should render multiple tiles correctly', () => {
    renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D);
    const grid = Grid.fromString('#.\no ');
    // # at (0,0)
    // . at (1,0)
    // o at (0,1)
    //   at (1,1)

    renderer.render(grid, mockState);

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

  it('should render GAME OVER when game is over', () => {
    vi.mocked(mockState.isGameOver).mockReturnValue(true);
    
    renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D);
    const grid = new Grid(10, 10);
    
    renderer.render(grid, mockState);

    expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 10 * TILE_SIZE, 10 * TILE_SIZE);
    expect(mockContext.fillStyle).toBe('#ff0000');
    expect(mockContext.fillText).toHaveBeenCalledWith('GAME OVER', (10 * TILE_SIZE) / 2, (10 * TILE_SIZE) / 2);
  });

  it('should render lives as Pacman icons', () => {
    vi.mocked(mockState.getLives).mockReturnValue(2);
    renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D);
    const grid = new Grid(10, 10);

    renderer.render(grid, mockState);

    // 2 lives means 2 calls to beginPath, arc, fill (specifically for the lives)
    // Since getEntities returns [], no other entities are drawn
    expect(mockContext.beginPath).toHaveBeenCalledTimes(2);
    expect(mockContext.arc).toHaveBeenCalledTimes(2);
    expect(mockContext.fill).toHaveBeenCalledTimes(2);
  });
});

describe('UIRenderer', () => {
  let mockContext: {
    beginPath: ReturnType<typeof vi.fn>;
    arc: ReturnType<typeof vi.fn>;
    fill: ReturnType<typeof vi.fn>;
    stroke: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    restore: ReturnType<typeof vi.fn>;
    fillStyle: string;
    strokeStyle: string;
    lineWidth: number;
  };
  let uiRenderer: UIRenderer;

  beforeEach(() => {
    mockContext = {
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
    };
    uiRenderer = new UIRenderer(mockContext as unknown as CanvasRenderingContext2D);
  });

  it('should be initialized with a context', () => {
    expect(uiRenderer).toBeDefined();
  });

  it('should not render if joystick is inactive', () => {
    const joystick = { active: false, originX: 0, originY: 0, currentX: 0, currentY: 0 };
    uiRenderer.render(joystick);
    expect(mockContext.beginPath).not.toHaveBeenCalled();
  });

  it('should render joystick circles if active', () => {
    const joystick = { active: true, originX: 100, originY: 100, currentX: 120, currentY: 100 };
    uiRenderer.render(joystick);

    // Should draw circles
    expect(mockContext.beginPath).toHaveBeenCalled();
    // Outer circle
    expect(mockContext.arc).toHaveBeenCalledWith(100, 100, 40, 0, Math.PI * 2);
    // Inner circle
    expect(mockContext.arc).toHaveBeenCalledWith(120, 100, 20, 0, Math.PI * 2);
    expect(mockContext.fill).toHaveBeenCalled();
  });
});
