import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Renderer } from './renderer.js';
import { Grid } from './grid.js';
import { EntityType } from './types.js';
import type { IGameState, Entity } from './types.js';

import { createMockContext, createMockState, type MockContext } from './test-utils.js';

describe('Renderer Ghost Transparency (Issue #108)', () => {
  let mockContext: MockContext;
  let mockState: IGameState;
  let renderer: Renderer;

  beforeEach(() => {
    mockContext = createMockContext(0, 0); // Use grid-based fallback
    mockState = createMockState();

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
    vi.mocked(mockState.getLevel).mockReturnValue(0);

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
