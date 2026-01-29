import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Renderer } from './renderer.js';
import { Grid } from './grid.js';
import { EntityType } from './types.js';
import type { IGameState, Entity } from './types.js';

describe('Renderer Ghost Transparency (Issue #108)', () => {
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
      getSpawnPosition: vi.fn(),
      consumePellet: vi.fn(),
      isPelletEaten: vi.fn().mockReturnValue(false),
      updatePacman: vi.fn(),
      updateGhosts: vi.fn(),
      isGameOver: vi.fn().mockReturnValue(false),
      isWin: vi.fn().mockReturnValue(false),
      getLevel: vi.fn().mockReturnValue(1),
      isDying: vi.fn().mockReturnValue(false),
      isReady: vi.fn().mockReturnValue(false),
      getPowerUpTimer: vi.fn().mockReturnValue(0),
      getPointEffects: vi.fn().mockReturnValue([]),
      getFruit: vi.fn().mockReturnValue(null),
      startReady: vi.fn(),
    };

    // Mock document.createElement for canvas
    const mockCanvas = {
      getContext: vi.fn().mockReturnValue({
        drawImage: vi.fn(),
        getImageData: vi.fn().mockReturnValue({
          data: new Uint8ClampedArray(16 * 16 * 4)
        }),
        putImageData: vi.fn()
      }),
      width: 0,
      height: 0
    };
    vi.stubGlobal('document', {
      createElement: vi.fn().mockReturnValue(mockCanvas)
    });
  });

  it('should use renderGhostWithTransparentBlack for ALL ghost states when spritesheet is provided', () => {
    const mockSpritesheet = { complete: true } as unknown as HTMLImageElement;
    renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D, mockSpritesheet);
    const grid = new Grid(1, 1);

    // Normal ghost
    const entities: Partial<Entity>[] = [{ type: EntityType.Ghost, x: 0, y: 0, color: 'red', animationFrame: 0 }];
    vi.mocked(mockState.getEntities).mockReturnValue(entities as Entity[]);

    renderer.render(grid, mockState);

    // In current implementation, normal ghost calls drawImage with the spritesheet directly
    // We WANT it to call drawImage with a canvas (the result of transparency processing)
    // For now, let's just check that it DOES NOT use the spritesheet directly FOR GHOSTS
    const drawImageCalls = vi.mocked(mockContext.drawImage).mock.calls;
    
    // Check if any call uses the spritesheet AND has ghost coordinates (sy < 400)
    // Fruit rendering (HUD) uses spritesheet directly but has sy > 400
    const spritesheetUsedForGhost = drawImageCalls.some(call => 
      call[0] === mockSpritesheet && (call[2] as number) < 400
    );
    
    // This should PASS if implemented correctly because it should use a canvas instead
    expect(spritesheetUsedForGhost).toBe(false);
  });

  it('should cache processed ghost sprites', () => {
    const mockSpritesheet = { complete: true } as unknown as HTMLImageElement;
    renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D, mockSpritesheet);
    const grid = new Grid(1, 1);

    // Normal ghost
    const entities: Partial<Entity>[] = [{ type: EntityType.Ghost, x: 0, y: 0, color: 'red', animationFrame: 0 }];
    vi.mocked(mockState.getEntities).mockReturnValue(entities as Entity[]);

    // First render
    renderer.render(grid, mockState);
    const firstCallCount = vi.mocked(document.createElement).mock.calls.length;
    expect(firstCallCount).toBe(1);

    // Second render (same sprite)
    renderer.render(grid, mockState);
    const secondCallCount = vi.mocked(document.createElement).mock.calls.length;
    
    // Should NOT have called createElement again
    expect(secondCallCount).toBe(1);
  });
});
