import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Renderer } from './renderer.js';
import { Grid } from './grid.js';
import { EntityType } from './types.js';
import type { IGameState } from './types.js';
import {
  TILE_SIZE,
  MAZE_RENDER_OFFSET_X,
  MAZE_RENDER_OFFSET_Y,
  MAZE_RENDER_MARGIN_BOTTOM
} from './config.js';

import { createMockContext, createMockState, type MockContext } from './test-utils.js';

describe('Renderer Point Effects', () => {
  let mockContext: MockContext;
  let mockState: IGameState;
  let renderer: Renderer;

  beforeEach(() => {
    mockContext = createMockContext(
      10 * TILE_SIZE + MAZE_RENDER_OFFSET_X * 2,
      10 * TILE_SIZE + MAZE_RENDER_OFFSET_Y + MAZE_RENDER_MARGIN_BOTTOM
    );
    mockState = createMockState();
  });

  it('should render point effects', () => {
    vi.mocked(mockState.getPointEffects).mockReturnValue([
      { x: 5, y: 5, points: 200 }
    ]);
    renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D);
    const grid = new Grid(10, 10);

    renderer.render(grid, mockState);

    expect(mockContext.fillText).toHaveBeenCalledWith(
      '200',
      5 * TILE_SIZE + TILE_SIZE / 2 + MAZE_RENDER_OFFSET_X,
      5 * TILE_SIZE + TILE_SIZE / 2 + MAZE_RENDER_OFFSET_Y
    );
  });

  it('should skip rendering a ghost if a point effect is at its position', () => {
    const ghost = { type: EntityType.Ghost, x: 5, y: 5, color: 'red' };
    vi.mocked(mockState.getEntities).mockReturnValue([ghost]);
    vi.mocked(mockState.getPointEffects).mockReturnValue([
      { x: 5, y: 5, points: 200 }
    ]);
    renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D);
    const grid = new Grid(10, 10);

    const fillStyleSetter = vi.spyOn(mockContext, 'fillStyle', 'set');
    renderer.render(grid, mockState);

    // Should NOT call fillStyle with 'red' for the ghost
    expect(fillStyleSetter).not.toHaveBeenCalledWith('red');

    // Should still draw the point effect
    expect(mockContext.fillText).toHaveBeenCalledWith(
      '200',
      5 * TILE_SIZE + TILE_SIZE / 2 + MAZE_RENDER_OFFSET_X,
      5 * TILE_SIZE + TILE_SIZE / 2 + MAZE_RENDER_OFFSET_Y
    );
  });
});
